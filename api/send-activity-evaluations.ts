import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.ACTIVITY_FROM_EMAIL || process.env.MEMBERSHIP_FROM_EMAIL || 'Yasaflow <noreply@yasaflow.com>';
const publicBaseUrl = process.env.PUBLIC_APP_URL || 'https://yasaflow.vercel.app';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

const bearerToken = (req: VercelRequest) => {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey || !resendKey) return res.status(500).json({ error: 'Missing server configuration' });

  const activityId = String(req.body?.activityId || '').trim();
  const organizationId = String(req.body?.organizationId || '').trim();
  if (!activityId || !organizationId) return res.status(400).json({ error: 'Missing activity data' });

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
    .select('id,title,activity_date,organization_id,organizations(name)')
    .eq('id', activityId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (activityError) return res.status(500).json({ error: activityError.message });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const { error: inviteError } = await supabase.rpc('create_activity_evaluation_invites', { p_activity_id: activityId });
  if (inviteError) return res.status(500).json({ error: inviteError.message });

  const { data: evaluations, error: evaluationsError } = await supabase
    .from('activity_evaluations')
    .select('id,response_token,submitted_at,registration:activity_registrations(full_name,email,status)')
    .eq('activity_id', activityId)
    .is('submitted_at', null);
  if (evaluationsError) return res.status(500).json({ error: evaluationsError.message });

  const organizationName = (activity.organizations as unknown as { name?: string } | null)?.name || 'Yasaflow';
  const date = new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
  let sent = 0;
  const failed: string[] = [];

  for (const evaluation of evaluations || []) {
    const registration = evaluation.registration as unknown as { full_name?: string; email?: string; status?: string } | null;
    if (!registration?.email || registration.status !== 'confirmed') continue;
    const evaluationUrl = `${publicBaseUrl.replace(/\/$/, '')}/api/activity-evaluation?token=${encodeURIComponent(evaluation.response_token)}`;
    const subject = `Hvordan var ${activity.title}?`;
    const html = `<!doctype html><html lang="no"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px"><p style="font-size:13px;color:#666;margin:0 0 8px">${escapeHtml(organizationName)} · Arrangement Pro</p><h1 style="font-size:26px;margin:0 0 8px">Takk for at du deltok</h1><p style="font-size:14px;color:#666;margin:0 0 24px">${escapeHtml(activity.title)} · ${escapeHtml(date)}</p><p>Hei ${escapeHtml(registration.full_name || '')},</p><p style="font-size:16px;line-height:1.6">Vi setter pris på om du bruker et øyeblikk på å gi en kort tilbakemelding.</p><p style="margin:26px 0"><a href="${evaluationUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Gi tilbakemelding</a></p><p style="font-size:12px;color:#777">Lenken er personlig og kan brukes én gang.</p></div></div></body></html>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `activity-evaluation-${evaluation.id}` },
      body: JSON.stringify({ from: fromEmail, to: [registration.email], subject, html }),
    });
    if (response.ok) sent += 1;
    else failed.push(registration.email);
  }

  return res.status(failed.length ? 207 : 200).json({ ok: failed.length === 0, sent, failed: failed.length, total: sent + failed.length });
}
