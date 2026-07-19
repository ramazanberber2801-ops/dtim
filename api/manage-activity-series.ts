import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const anonKey=process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey=process.env.RESEND_API_KEY;
const fromEmail=process.env.ACTIVITY_FROM_EMAIL||process.env.MEMBERSHIP_FROM_EMAIL||'Yasaflow <noreply@yasaflow.com>';
const appUrl=(process.env.PUBLIC_APP_URL||process.env.VITE_PUBLIC_APP_URL||'https://yasaflow.vercel.app').replace(/\/$/,'');
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const bearer=(req:VercelRequest)=>{const value=String(req.headers.authorization||'');return value.startsWith('Bearer ')?value.slice(7).trim():'';};

type Scope='single'|'following'|'series';
type Action='update'|'cancel'|'reopen';

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!supabaseUrl||!anonKey||!serviceRoleKey)return res.status(500).json({error:'Missing server configuration'});
  const token=bearer(req);if(!token)return res.status(401).json({error:'Authentication required'});
  const activityId=String(req.body?.activityId||'').trim();
  const organizationId=String(req.body?.organizationId||'').trim();
  const scope=String(req.body?.scope||'single') as Scope;
  const action=String(req.body?.action||'update') as Action;
  if(!activityId||!organizationId||!['single','following','series'].includes(scope)||!['update','cancel','reopen'].includes(action))return res.status(400).json({error:'Invalid request'});

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const service=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:before,error:beforeError}=await service.from('organization_activities').select('id,title,activity_date,start_time,end_time,location,status,organization_id,organizations(name)').eq('id',activityId).eq('organization_id',organizationId).maybeSingle();
  if(beforeError)return res.status(500).json({error:beforeError.message});if(!before)return res.status(404).json({error:'Activity not found'});

  const params={p_activity_id:activityId,p_scope:scope,p_action:action,p_title:req.body?.title||null,p_activity_date:req.body?.activityDate||null,p_start_time:req.body?.startTime||null,p_end_time:req.body?.endTime||null,p_location:req.body?.location??null,p_capacity:req.body?.capacity?Number(req.body.capacity):null,p_cancellation_reason:req.body?.cancellationReason||null};
  const {data:affected,error}=await userClient.rpc('manage_activity_series',params);
  if(error)return res.status(error.message.includes('not_authorized')?403:400).json({error:error.message});
  const ids=(affected||[]) as string[];
  if(!ids.length)return res.status(200).json({ok:true,affected:0,sent:0,failed:0});

  const [{data:activities},{data:registrations}]=await Promise.all([
    service.from('organization_activities').select('id,title,activity_date,start_time,end_time,location,status,cancellation_reason').in('id',ids).order('activity_date'),
    service.from('activity_registrations').select('id,full_name,email,activity_id,status').in('activity_id',ids).eq('status','confirmed')
  ]);
  const organizationName=(before.organizations as unknown as {name?:string}|null)?.name||'Yasaflow';
  let sent=0;const failed:string[]=[];
  if(resendKey){for(const registration of registrations||[]){if(!registration.email)continue;const changed=(activities||[]).find(row=>row.id===registration.activity_id);if(!changed)continue;const cancelled=changed.status==='cancelled';const date=new Date(`${changed.activity_date}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'});const time=[changed.start_time?.slice(0,5),changed.end_time?.slice(0,5)].filter(Boolean).join('–');const subject=cancelled?`Avlyst: ${changed.title}`:`Oppdatert informasjon: ${changed.title}`;const reason=cancelled&&changed.cancellation_reason?`<p><strong>Årsak:</strong> ${escapeHtml(changed.cancellation_reason)}</p>`:'';const html=`<!doctype html><html lang="no"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#202020"><div style="max-width:660px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:30px"><p style="font-size:13px;color:#666">${escapeHtml(organizationName)} · Arrangement Pro</p><h1 style="font-size:25px">${cancelled?'Arrangementet er avlyst':'Arrangementet er oppdatert'}</h1><p>Hei ${escapeHtml(registration.full_name||'')},</p><p>Det har kommet en endring for <strong>${escapeHtml(changed.title)}</strong>.</p><div style="background:#f4f4f5;border-radius:14px;padding:16px"><p><strong>Dato:</strong> ${escapeHtml(date)}</p>${time?`<p><strong>Tid:</strong> ${escapeHtml(time)}</p>`:''}${changed.location?`<p><strong>Sted:</strong> ${escapeHtml(changed.location)}</p>`:''}${reason}</div><p style="margin-top:24px"><a href="${appUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:13px 18px;border-radius:11px;font-weight:700">Åpne Yasaflow</a></p></div></div></body></html>`;const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`series-${action}-${registration.id}-${changed.id}-${changed.activity_date}`},body:JSON.stringify({from:fromEmail,to:[registration.email],subject,html})});if(response.ok)sent++;else failed.push(registration.email);}}
  return res.status(failed.length?207:200).json({ok:failed.length===0,affected:ids.length,sent,failed:failed.length});
}