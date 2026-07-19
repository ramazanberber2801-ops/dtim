import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const anonKey=process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey=process.env.RESEND_API_KEY;
const fromEmail=process.env.ACTIVITY_FROM_EMAIL||process.env.MEMBERSHIP_FROM_EMAIL||'Yasaflow <noreply@yasaflow.com>';
const appUrl=(process.env.PUBLIC_APP_URL||process.env.VITE_PUBLIC_APP_URL||'https://yasaflow.vercel.app').replace(/\/$/,'');
const bearer=(req:VercelRequest)=>{const value=String(req.headers.authorization||'');return value.startsWith('Bearer ')?value.slice(7).trim():'';};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!supabaseUrl||!anonKey||!serviceRoleKey)return res.status(500).json({error:'Missing server configuration'});
  const token=bearer(req);if(!token)return res.status(401).json({error:'Authentication required'});
  const activityId=String(req.body?.activityId||'').trim();
  const organizationId=String(req.body?.organizationId||'').trim();
  if(!activityId||!organizationId)return res.status(400).json({error:'Activity and organization are required'});

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const service=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:processError}=await userClient.rpc('process_activity_waitlist',{p_activity_id:activityId});
  if(processError)return res.status(processError.message.includes('not_authorized')?403:400).json({error:processError.message});

  const {data:jobs,error:jobsError}=await service.from('activity_waitlist_notifications')
    .select('id,notification_type,registration_id,activity_id,activity_registrations(full_name,email,attendees,waitlist_offer_token,waitlist_offer_expires_at),organization_activities(title,activity_date,start_time,location,organizations(name))')
    .eq('activity_id',activityId).eq('status','pending').order('created_at').limit(20);
  if(jobsError)return res.status(500).json({error:jobsError.message});

  let sent=0;let failed=0;
  for(const job of jobs||[]){
    const registration=job.activity_registrations as unknown as {full_name?:string;email?:string;attendees?:number;waitlist_offer_token?:string;waitlist_offer_expires_at?:string}|null;
    const activity=job.organization_activities as unknown as {title?:string;activity_date?:string;start_time?:string;location?:string;organizations?:{name?:string}|null}|null;
    if(job.notification_type!=='offer'||!registration?.email||!registration.waitlist_offer_token||!activity){
      await service.from('activity_waitlist_notifications').update({status:'cancelled',processed_at:new Date().toISOString()}).eq('id',job.id);continue;
    }
    const acceptUrl=`${appUrl}/api/activity-waitlist-response?token=${encodeURIComponent(registration.waitlist_offer_token)}&decision=accept`;
    const declineUrl=`${appUrl}/api/activity-waitlist-response?token=${encodeURIComponent(registration.waitlist_offer_token)}&decision=decline`;
    const date=activity.activity_date?new Date(`${activity.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'}):'';
    const deadline=registration.waitlist_offer_expires_at?new Date(registration.waitlist_offer_expires_at).toLocaleString('nb-NO',{dateStyle:'short',timeStyle:'short'}):'';
    const orgName=activity.organizations?.name||'Yasaflow';
    const html=`<!doctype html><html lang="no"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px"><p style="font-size:13px;color:#666">${escapeHtml(orgName)} · Arrangement Pro</p><h1 style="font-size:25px">Du har fått tilbud om plass</h1><p>Hei ${escapeHtml(registration.full_name||'')},</p><p>Det har blitt ledig plass på <strong>${escapeHtml(activity.title||'arrangementet')}</strong>.</p><div style="background:#f4f4f5;border-radius:14px;padding:16px"><p><strong>Dato:</strong> ${escapeHtml(date)}</p>${activity.start_time?`<p><strong>Tid:</strong> ${escapeHtml(activity.start_time.slice(0,5))}</p>`:''}${activity.location?`<p><strong>Sted:</strong> ${escapeHtml(activity.location)}</p>`:''}<p><strong>Antall plasser:</strong> ${registration.attendees||1}</p><p><strong>Svarfrist:</strong> ${escapeHtml(deadline)}</p></div><p style="margin-top:24px"><a href="${acceptUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:13px 18px;border-radius:11px;font-weight:700;margin-right:8px">Godta plassen</a><a href="${declineUrl}" style="display:inline-block;border:1px solid #d4d4d8;color:#18181b;text-decoration:none;padding:12px 18px;border-radius:11px;font-weight:700">Takk nei</a></p></div></div></body></html>`;
    try{
      if(!resendKey)throw new Error('RESEND_API_KEY is missing');
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`waitlist-offer-${job.id}`},body:JSON.stringify({from:fromEmail,to:[registration.email],subject:`Ledig plass: ${activity.title||'Arrangement'}`,html})});
      if(!response.ok)throw new Error(await response.text());
      await service.from('activity_waitlist_notifications').update({status:'sent',attempts:1,processed_at:new Date().toISOString(),last_error:null}).eq('id',job.id);sent++;
    }catch(error){await service.from('activity_waitlist_notifications').update({status:'failed',attempts:1,last_error:error instanceof Error?error.message:String(error)}).eq('id',job.id);failed++;}
  }
  return res.status(failed?207:200).json({ok:failed===0,sent,failed,pending:(jobs||[]).length});
}
