import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.ACTIVITY_FROM_EMAIL || process.env.MEMBERSHIP_FROM_EMAIL || 'Yasaflow <noreply@yasaflow.com>';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

const bearerToken = (req: VercelRequest) => {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

type Audience = 'confirmed' | 'waitlist' | 'unpaid' | 'not_checked_in';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey || !resendKey) return res.status(500).json({ error: 'Missing server configuration' });

  const activityId = String(req.body?.activityId || '').trim();
  const organizationId = String(req.body?.organizationId || '').trim();
  const subject = String(req.body?.subject || '').trim().slice(0, 160);
  const message = String(req.body?.message || '').trim().slice(0, 8000);
  const audience = String(req.body?.audience || '') as Audience;
  if (!activityId || !organizationId || !subject || !message) return res.status(400).json({ error: 'Missing broadcast data' });
  if (!['confirmed', 'waitlist', 'unpaid', 'not_checked_in'].includes(audience)) return res.status(400).json({ error: 'Invalid audience' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = bearerToken(req);
  const { data: authData } = await supabase.auth.getUser(token);
  const userId = authData.user?.id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const [{ data: organizationAdmin }, { data: platformAdmin }] = await Promise.all([
    supabase.from('organization_admins').select('id').eq('organization_id', organizationId).eq('user_id', userId).eq('invitation_status', 'accepted').maybeSingle(),
    supabase.from('admins').select('id').eq('auth_user_id', userId).in('role', ['owner', 'super_admin', 'superadmin']).maybeSingle(),
  ]);
  if (!organizationAdmin && !platformAdmin) return res.status(403).json({ error: 'Not authorized' });

  const { data: activity, error: activityError } = await supabase
    .from('organization_activities')
    .select('id,title,activity_date,start_time,location,organization_id,organizations(name)')
    .eq('id', activityId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (activityError) return res.status(500).json({ error: activityError.message });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  let query = supabase
    .from('activity_registrations')
    .select('id,full_name,email,status,payment_confirmed,checked_in')
    .eq('activity_id', activityId)
    .not('email', 'is', null);

  if (audience === 'confirmed') query = query.eq('status', 'confirmed');
  if (audience === 'waitlist') query = query.eq('status', 'waitlist');
  if (audience === 'unpaid') query = query.eq('status', 'confirmed').eq('payment_confirmed', false);
  if (audience === 'not_checked_in') query = query.eq('status', 'confirmed').eq('checked_in', false);

  const { data: recipients, error: recipientsError } = await query;
  if (recipientsError) return res.status(500).json({ error: recipientsError.message });
  const uniqueRecipients = Array.from(new Map((recipients || []).filter(row => row.email).map(row => [String(row.email).toLowerCase(), row])).values());
  if (!uniqueRecipients.length) return res.status(400).json({ error: 'No recipients in this audience' });
  if (uniqueRecipients.length > 500) return res.status(400).json({ error: 'Audience is too large for one send' });

  const organizationName = (activity.organizations as unknown as { name?: string } | null)?.name || 'Yasaflow';
  const date = new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const details = [date, activity.start_time ? activity.start_time.slice(0, 5) : '', activity.location || ''].filter(Boolean).join(' · ');
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  let sent = 0;
  const failed: string[] = [];
  for (const recipient of uniqueRecipients) {
    const html = `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px"><p style="font-size:13px;color:#666;margin:0 0 8px">${escapeHtml(organizationName)} · Arrangement Pro</p><h1 style="font-size:26px;margin:0 0 8px">${escapeHtml(activity.title)}</h1><p style="font-size:13px;color:#666;margin:0 0 24px">${escapeHtml(details)}</p><p>Hei ${escapeHtml(recipient.full_name || '')},</p><div style="font-size:16px;line-height:1.6">${safeMessage}</div><p style="font-size:13px;color:#777;margin-top:28px">Vennlig hilsen<br>${escapeHtml(organizationName)}</p></div></div></body></html>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `activity-broadcast-${activityId}-${audience}-${recipient.id}-${subject}`.slice(0, 256) },
      body: JSON.stringify({ from: fromEmail, to: [recipient.email], subject, html }),
    });
    if (response.ok) sent += 1;
    else failed.push(recipient.email);
  }

  return res.status(failed.length ? 207 : 200).json({ ok: failed.length === 0, sent, failed: failed.length, total: uniqueRecipients.length });
}
