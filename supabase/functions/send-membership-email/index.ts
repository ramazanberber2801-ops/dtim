import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
};

type Payload={jobId?:string;requestId?:string;eventType?:'received'|'approved'|'rejected'};

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL');
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey=Deno.env.get('RESEND_API_KEY');
    const fromEmail=Deno.env.get('MEMBERSHIP_FROM_EMAIL')||'Yasaflow <noreply@yasaflow.com>';
    if(!supabaseUrl||!serviceKey||!resendKey)throw new Error('Missing required environment variables');
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});
    const body=(await req.json()) as Payload;
    let job:any=null;
    if(body.jobId){
      const {data,error}=await admin.from('membership_email_jobs').select('*').eq('id',body.jobId).single();
      if(error)throw error;job=data;
    }else if(body.requestId&&body.eventType){
      const {data,error}=await admin.from('membership_email_jobs').select('*').eq('request_id',body.requestId).eq('event_type',body.eventType).single();
      if(error)throw error;job=data;
    }else throw new Error('jobId or requestId/eventType required');
    if(job.status==='sent')return new Response(JSON.stringify({ok:true,alreadySent:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    await admin.from('membership_email_jobs').update({status:'processing',attempts:(job.attempts||0)+1,last_error:null}).eq('id',job.id);
    const {data:request,error:requestError}=await admin.from('organization_membership_requests').select('*, organization_settings!inner(display_name,short_name,membership_welcome_message,email)').eq('id',job.request_id).single();
    if(requestError)throw requestError;
    const settings=Array.isArray(request.organization_settings)?request.organization_settings[0]:request.organization_settings;
    const organizationName=settings?.display_name||settings?.short_name||'Yasaflow';
    const name=`${request.first_name} ${request.last_name}`.trim();
    const subjects={received:`Vi har mottatt medlemsforespørselen din – ${organizationName}`,approved:`Medlemskapet ditt er godkjent – ${organizationName}`,rejected:`Oppdatering om medlemsforespørselen din – ${organizationName}`};
    const intros={received:`Hei ${name},<br><br>Vi har mottatt medlemsforespørselen din. Organisasjonen behandler den og kontakter deg ved behov.`,approved:`Hei ${name},<br><br>Medlemsforespørselen din er godkjent.`,rejected:`Hei ${name},<br><br>Medlemsforespørselen din er dessverre avslått.`};
    const welcome=job.event_type==='approved'&&settings?.membership_welcome_message?`<p>${String(settings.membership_welcome_message).replace(/\n/g,'<br>')}</p>`:'';
    const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><p>${intros[job.event_type as keyof typeof intros]}</p>${welcome}<p>Vennlig hilsen<br>${organizationName}</p></div>`;
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:fromEmail,to:[request.email],reply_to:settings?.email||undefined,subject:subjects[job.event_type as keyof typeof subjects],html})});
    const result=await response.json();
    if(!response.ok)throw new Error(result?.message||'Resend request failed');
    const timestampField=job.event_type==='received'?'received_email_sent_at':'decision_email_sent_at';
    await Promise.all([
      admin.from('membership_email_jobs').update({status:'sent',processed_at:new Date().toISOString(),last_error:null}).eq('id',job.id),
      admin.from('organization_membership_requests').update({[timestampField]:new Date().toISOString()}).eq('id',job.request_id),
    ]);
    return new Response(JSON.stringify({ok:true,id:result.id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    try{
      const body=await req.clone().json() as Payload;
      const supabaseUrl=Deno.env.get('SUPABASE_URL');const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if(supabaseUrl&&serviceKey&&body.jobId){const admin=createClient(supabaseUrl,serviceKey);await admin.from('membership_email_jobs').update({status:'failed',last_error:message}).eq('id',body.jobId);}
    }catch{}
    return new Response(JSON.stringify({ok:false,error:message}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
  }
});
