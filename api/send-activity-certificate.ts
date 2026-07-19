import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey=process.env.RESEND_API_KEY;
const appUrl=(process.env.PUBLIC_APP_URL||process.env.VITE_PUBLIC_APP_URL||'https://yasaflow.com').replace(/\/$/,'');
const fromEmail=process.env.ACTIVITY_FROM_EMAIL||process.env.MEMBERSHIP_FROM_EMAIL||'Yasaflow <noreply@yasaflow.com>';
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const bearer=(req:VercelRequest)=>{const value=String(req.headers.authorization||'');return value.startsWith('Bearer ')?value.slice(7).trim():'';};

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!supabaseUrl||!serviceRoleKey||!resendKey)return res.status(500).json({error:'Missing server configuration'});
  const registrationId=String(req.body?.registrationId||'').trim();
  const organizationId=String(req.body?.organizationId||'').trim();
  if(!registrationId||!organizationId)return res.status(400).json({error:'Missing certificate data'});

  const supabase=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData}=await supabase.auth.getUser(bearer(req));
  const userId=authData.user?.id;
  if(!userId)return res.status(401).json({error:'Authentication required'});
  const [{data:organizationAdmin},{data:platformAdmin}]=await Promise.all([
    supabase.from('organization_admins').select('id').eq('organization_id',organizationId).eq('user_id',userId).eq('invitation_status','accepted').maybeSingle(),
    supabase.from('admins').select('id').eq('auth_user_id',userId).in('role',['owner','super_admin','superadmin']).maybeSingle(),
  ]);
  if(!organizationAdmin&&!platformAdmin)return res.status(403).json({error:'Not authorized'});

  const {data:registration,error:registrationError}=await supabase.from('activity_registrations')
    .select('id,activity_id,organization_id,full_name,email,status,certificate_token,certificate_issued_at,activity:organization_activities(id,title,activity_date,location,certificate_title,organization_id,organization:organizations(name))')
    .eq('id',registrationId).eq('organization_id',organizationId).maybeSingle();
  if(registrationError)return res.status(500).json({error:registrationError.message});
  if(!registration)return res.status(404).json({error:'Registration not found'});
  if(registration.status!=='confirmed')return res.status(400).json({error:'Deltakeren må være bekreftet.'});
  if(!registration.email)return res.status(400).json({error:'Deltakeren mangler e-postadresse.'});

  const {data:checkin,error:checkinError}=await supabase.from('activity_checkins').select('id').eq('activity_id',registration.activity_id).eq('registration_id',registration.id).maybeSingle();
  if(checkinError)return res.status(500).json({error:checkinError.message});
  if(!checkin)return res.status(400).json({error:'Deltakeren må være sjekket inn før kursbevis kan sendes.'});

  const certificateToken=registration.certificate_token||randomUUID();
  const issuedAt=registration.certificate_issued_at||new Date().toISOString();
  const {error:updateError}=await supabase.from('activity_registrations').update({certificate_token:certificateToken,certificate_issued_at:issuedAt,updated_at:new Date().toISOString()}).eq('id',registration.id);
  if(updateError)return res.status(500).json({error:updateError.message});

  const activity=registration.activity as unknown as {title:string;activity_date:string;location?:string|null;certificate_title?:string|null;organization?:{name?:string}|null};
  const organizationName=activity.organization?.name||'Yasaflow';
  const date=new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'});
  const certificateUrl=`${appUrl}/api/activity-certificate?token=${encodeURIComponent(certificateToken)}`;
  const subject=`${activity.certificate_title||'Kursbevis'} – ${activity.title}`;
  const html=`<!doctype html><html lang="no"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px"><p style="font-size:13px;color:#666">${escapeHtml(organizationName)} · Arrangement Pro</p><h1 style="font-size:26px">${escapeHtml(activity.certificate_title||'Kursbevis')}</h1><p>Hei ${escapeHtml(registration.full_name)},</p><p>Takk for deltakelsen på <strong>${escapeHtml(activity.title)}</strong> ${escapeHtml(date)}${activity.location?` i ${escapeHtml(activity.location)}`:''}.</p><p>Kursbeviset ditt er klart og kan åpnes, skrives ut eller lagres som PDF.</p><p style="margin:28px 0"><a href="${certificateUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Åpne kursbevis</a></p><p style="font-size:12px;color:#71717a">Lenken er personlig og brukes også til digital verifisering av kursbeviset.</p><p>Vennlig hilsen<br>${escapeHtml(organizationName)}</p></div></div></body></html>`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`activity-certificate-${registration.id}-${certificateToken}`},body:JSON.stringify({from:fromEmail,to:[registration.email],subject,html})});
  if(!response.ok){const details=await response.text().catch(()=>String(response.status));return res.status(502).json({error:'Kursbeviset ble utstedt, men e-posten kunne ikke sendes.',details});}
  await supabase.from('activity_registrations').update({certificate_email_sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',registration.id);
  return res.status(200).json({ok:true,certificateToken,certificateUrl,email:registration.email});
}
