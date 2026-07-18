import type { IncomingMessage, ServerResponse } from 'node:http';

type PortalRequest = { organization_id?: string };
type SupabaseConfig = { url: string; serviceRoleKey: string };

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

async function readJsonBody(req: IncomingMessage): Promise<PortalRequest> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) as PortalRequest : {};
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function getAuthenticatedUser(config: SupabaseConfig, authorization: string): Promise<{ id: string } | null> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.serviceRoleKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string };
  return user.id ? { id: user.id } : null;
}

async function userCanManageOrganization(config: SupabaseConfig, userId: string, organizationId: string): Promise<boolean> {
  const query = new URLSearchParams({
    select: 'id', organization_id: `eq.${organizationId}`, user_id: `eq.${userId}`,
    invitation_status: 'eq.accepted', limit: '1',
  });
  const response = await fetch(`${config.url}/rest/v1/organization_admins?${query}`, {
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
  });
  if (!response.ok) return false;
  return ((await response.json()) as unknown[]).length > 0;
}

async function getCustomerId(config: SupabaseConfig, organizationId: string): Promise<string | null> {
  const query = new URLSearchParams({ select: 'creem_customer_id', id: `eq.${organizationId}`, limit: '1' });
  const response = await fetch(`${config.url}/rest/v1/organizations?${query}`, {
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
  });
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ creem_customer_id?: string | null }>;
  return rows[0]?.creem_customer_id ?? null;
}

export default async function handler(req: IncomingMessage & { method?: string; headers: IncomingMessage['headers'] }, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.CREEM_API_KEY;
  const config = getSupabaseConfig();
  if (!apiKey || !config) return sendJson(res, 500, { error: 'Server configuration is incomplete' });

  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  if (!authorization.startsWith('Bearer ')) return sendJson(res, 401, { error: 'Authentication required' });

  let body: PortalRequest;
  try { body = await readJsonBody(req); }
  catch { return sendJson(res, 400, { error: 'Invalid JSON body' }); }

  const organizationId = body.organization_id?.trim();
  if (!organizationId) return sendJson(res, 400, { error: 'Organization is required' });

  const user = await getAuthenticatedUser(config, authorization);
  if (!user || !(await userCanManageOrganization(config, user.id, organizationId))) {
    return sendJson(res, 403, { error: 'You cannot manage billing for this organization' });
  }

  const customerId = await getCustomerId(config, organizationId);
  if (!customerId) return sendJson(res, 404, { error: 'No billing customer is linked to this organization yet' });

  const creemBaseUrl = apiKey.startsWith('creem_test_') ? 'https://test-api.creem.io' : 'https://api.creem.io';
  const response = await fetch(`${creemBaseUrl}/v1/customers/billing`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId }),
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    console.error('Creem portal creation failed:', response.status, payload);
    return sendJson(res, 502, { error: 'Could not open billing portal' });
  }

  sendJson(res, 200, { portal_url: payload?.customer_portal_link ?? null });
}
