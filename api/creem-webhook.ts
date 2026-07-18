import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = {
  api: {
    bodyParser: false,
  },
};

type CreemEvent = {
  id?: string;
  eventType?: string;
  created_at?: number | string;
  object?: Record<string, unknown>;
  [key: string]: unknown;
};

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type CreemDetails = {
  organizationId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  orderId: string | null;
  productId: string | null;
  providerStatus: string | null;
};

const PRODUCT_IDS = {
  core: 'prod_21PIYy2aAeG6y2B3Zjul2a',
  push: 'prod_7jeTFbEys6FrrBstowAJuL',
  donation: 'prod_4DP5C2BFo9HZM8K32SqKXl',
} as const;

const MODULE_BY_PRODUCT_ID: Record<string, string> = {
  [PRODUCT_IDS.push]: 'push',
  [PRODUCT_IDS.donation]: 'donation',
};

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const receivedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nestedString(parent: Record<string, unknown>, key: string): string | null {
  const value = parent[key];
  return asString(value) ?? asString(asRecord(value)?.id);
}

function extractDetails(event: CreemEvent): CreemDetails {
  const object = asRecord(event.object) ?? {};
  const order = asRecord(object.order) ?? {};
  const subscription = asRecord(object.subscription) ??
    (event.eventType?.startsWith('subscription.') ? object : {});
  const metadata =
    asRecord(object.metadata) ??
    asRecord(subscription.metadata) ??
    asRecord(asRecord(object.checkout)?.metadata) ??
    {};

  const productId =
    nestedString(object, 'product') ??
    nestedString(order, 'product') ??
    nestedString(subscription, 'product') ??
    asString(metadata.product_id);

  return {
    organizationId:
      asString(metadata.organization_id) ??
      asString(metadata.organizationId) ??
      asString(object.request_id)?.split(':')[0] ??
      null,
    customerId:
      nestedString(object, 'customer') ??
      nestedString(order, 'customer') ??
      nestedString(subscription, 'customer'),
    subscriptionId:
      nestedString(object, 'subscription') ??
      (event.eventType?.startsWith('subscription.') ? asString(object.id) : null),
    orderId: nestedString(object, 'order') ?? asString(order.id),
    productId,
    providerStatus: asString(object.status) ?? asString(subscription.status) ?? asString(order.status),
  };
}

async function supabaseRequest(config: SupabaseConfig, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function findOrganizationId(config: SupabaseConfig, details: CreemDetails): Promise<string | null> {
  if (details.organizationId) return details.organizationId;

  const lookups: Array<[string, string | null]> = [
    ['creem_subscription_id', details.subscriptionId],
    ['creem_customer_id', details.customerId],
  ];
  for (const [column, value] of lookups) {
    if (!value) continue;
    const response = await supabaseRequest(
      config,
      `organizations?select=id&${column}=eq.${encodeURIComponent(value)}&limit=1`,
    );
    if (!response.ok) continue;
    const rows = (await response.json()) as Array<{ id?: string }>;
    if (rows[0]?.id) return rows[0].id;
  }
  return null;
}

function mapStatus(eventType: string, providerStatus: string | null): 'active' | 'cancelled' | 'past_due' | 'expired' | null {
  if (eventType === 'subscription.canceled') return 'cancelled';
  if (eventType === 'subscription.past_due') return 'past_due';
  if (eventType === 'subscription.expired') return 'expired';
  if (eventType === 'subscription.paused') return 'expired';
  if (['checkout.completed', 'subscription.active', 'subscription.paid', 'subscription.trialing'].includes(eventType)) return 'active';

  switch (providerStatus) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'expired':
    case 'paused':
      return 'expired';
    default:
      return null;
  }
}

async function getOrganizationBilling(config: SupabaseConfig, organizationId: string): Promise<{ productIds: string[]; subscriptionIds: string[] }> {
  const response = await supabaseRequest(
    config,
    `organizations?select=creem_product_ids,creem_subscription_ids&id=eq.${encodeURIComponent(organizationId)}&limit=1`,
  );
  if (!response.ok) return { productIds: [], subscriptionIds: [] };
  const rows = (await response.json()) as Array<{ creem_product_ids?: string[]; creem_subscription_ids?: string[] }>;
  return {
    productIds: rows[0]?.creem_product_ids ?? [],
    subscriptionIds: rows[0]?.creem_subscription_ids ?? [],
  };
}

async function updateOrganization(config: SupabaseConfig, organizationId: string, eventType: string, details: CreemDetails): Promise<void> {
  const current = await getOrganizationBilling(config, organizationId);
  const productIds = new Set(current.productIds);
  const subscriptionIds = new Set(current.subscriptionIds);
  const isRevoked = ['subscription.canceled', 'subscription.expired'].includes(eventType);

  if (details.productId) {
    if (isRevoked) productIds.delete(details.productId);
    else productIds.add(details.productId);
  }
  if (details.subscriptionId) {
    if (isRevoked) subscriptionIds.delete(details.subscriptionId);
    else subscriptionIds.add(details.subscriptionId);
  }

  const patch: Record<string, unknown> = {
    subscription_updated_at: new Date().toISOString(),
    creem_product_ids: [...productIds],
    creem_subscription_ids: [...subscriptionIds],
  };
  if (details.customerId) patch.creem_customer_id = details.customerId;
  if (details.subscriptionId) patch.creem_subscription_id = details.subscriptionId;
  if (details.orderId) patch.creem_order_id = details.orderId;

  if (details.productId === PRODUCT_IDS.core) {
    const mapped = mapStatus(eventType, details.providerStatus);
    if (mapped) patch.subscription_status = mapped;
    if (!isRevoked) patch.subscription_plan = 'core';
  }

  const response = await supabaseRequest(config, `organizations?id=eq.${encodeURIComponent(organizationId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Organization update failed: ${response.status} ${await response.text()}`);
  }
}

async function setModuleEnabled(config: SupabaseConfig, organizationId: string, moduleId: string, enabled: boolean): Promise<void> {
  const path = `organization_modules?organization_id=eq.${encodeURIComponent(organizationId)}&module_id=eq.${encodeURIComponent(moduleId)}`;
  const response = await supabaseRequest(config, path, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ enabled, status: enabled ? 'På' : 'Av', updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`Module update failed: ${response.status} ${await response.text()}`);
  const rows = (await response.json()) as unknown[];
  if (rows.length > 0) return;

  const createResponse = await supabaseRequest(config, 'organization_modules', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      organization_id: organizationId,
      module_id: moduleId,
      enabled,
      status: enabled ? 'På' : 'Av',
      updated_at: new Date().toISOString(),
    }),
  });
  if (!createResponse.ok) throw new Error(`Module creation failed: ${createResponse.status} ${await createResponse.text()}`);
}

async function updateModule(config: SupabaseConfig, organizationId: string, eventType: string, details: CreemDetails): Promise<void> {
  if (!details.productId) return;
  const moduleId = MODULE_BY_PRODUCT_ID[details.productId];
  if (!moduleId) return;

  const enabled = ![
    'subscription.canceled',
    'subscription.expired',
    'subscription.past_due',
    'subscription.paused',
  ].includes(eventType);
  await setModuleEnabled(config, organizationId, moduleId, enabled);
}

async function storeEvent(config: SupabaseConfig, event: CreemEvent, organizationId: string | null): Promise<void> {
  const occurredAt = typeof event.created_at === 'number'
    ? new Date(event.created_at).toISOString()
    : asString(event.created_at);
  const response = await supabaseRequest(config, 'creem_webhook_events', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      event_id: event.id ?? `unknown-${Date.now()}`,
      event_type: event.eventType ?? 'unknown',
      occurred_at: occurredAt,
      organization_id: organizationId,
      payload: event,
    }),
  });
  if (!response.ok) console.warn('Creem event persistence failed:', response.status, await response.text());
}

async function processEvent(event: CreemEvent): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase server configuration is missing');
  const eventType = event.eventType ?? 'unknown';
  const details = extractDetails(event);
  const organizationId = await findOrganizationId(config, details);
  await storeEvent(config, event, organizationId);

  if (!organizationId) {
    console.warn('Verified Creem event could not be linked to an organization:', eventType, event.id);
    return;
  }

  await updateOrganization(config, organizationId, eventType, details);
  await updateModule(config, organizationId, eventType, details);
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage & { method?: string; headers: IncomingMessage['headers'] }, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    sendJson(res, 500, { error: 'Webhook secret is not configured' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = typeof req.headers['creem-signature'] === 'string'
    ? req.headers['creem-signature']
    : '';
  if (!signature || !verifySignature(rawBody, signature, secret)) {
    sendJson(res, 401, { error: 'Invalid signature' });
    return;
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as CreemEvent;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  try {
    await processEvent(event);
    console.info('Processed Creem webhook:', event.eventType, event.id);
    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error('Creem webhook processing failed:', error);
    sendJson(res, 500, { error: 'Webhook processing failed' });
  }
}
