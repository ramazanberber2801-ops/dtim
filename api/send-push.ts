import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const defaultOrganizationId = process.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseServiceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const { title, body, url, organizationId } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Missing title or body' });

  const targetOrganizationId = String(organizationId || defaultOrganizationId).trim();
  if (!targetOrganizationId) return res.status(400).json({ error: 'Missing organizationId' });

  webpush.setVapidDetails('mailto:admin@yasaflow.com', vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const cleanTitle = String(title).trim();
  const cleanBody = String(body).trim();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: savedMessage, error: messageError } = await supabase
    .from('push_messages')
    .insert({ organization_id: targetOrganizationId, title: cleanTitle, body: cleanBody, expires_at: expiresAt })
    .select('id')
    .single();

  if (messageError || !savedMessage) {
    return res.status(500).json({ error: messageError?.message || 'Push message could not be saved' });
  }

  const messageId = savedMessage.id;
  const notificationUrl = url || `/?push_message=${messageId}`;
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('organization_id', targetOrganizationId);

  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({ title: cleanTitle, body: cleanBody, url: notificationUrl, message_id: messageId, organization_id: targetOrganizationId });
  let sent = 0;
  let failed = 0;

  await Promise.all((data || []).map(async (row: any) => {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent += 1;
    } catch {
      failed += 1;
    }
  }));

  return res.status(200).json({ ok: true, sent, failed, message_id: messageId, organization_id: targetOrganizationId });
}
