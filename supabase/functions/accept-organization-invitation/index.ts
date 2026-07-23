import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = new Set(['https://yasaflow.com','https://www.yasaflow.com','https://app.yasaflow.com','https://yasaflow.vercel.app','https://yasaflow-website.vercel.app']);
const PASSWORD_REQUIREMENT_MESSAGE='Passordet må ha minst 6 tegn og inneholde stor bokstav, liten bokstav, tall og spesialtegn.';
const isValidPassword=(p:string)=>p.length>=6&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p)&&/[^A-Za-z0-9]/.test(p);
type Payload={action?:'inspect'|'accept';token?:string;organizationId?:string;password?:string};
function cors(origin:string|null){const value=origin&&allowedOrigins.has(origin)?origin:'https://yasaflow.com';return {'Access-Control-Allow-Origin':value,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin'};}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req.headers.get('origin')),'Content-Type':'application/json','X-Content-Type-Options':'nosniff'}});}
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS'){if(origin&&!allowedOrigins.has(origin))return json(req,{error:'Origin not allowed'},403);return new Response('ok',{headers:cors(origin)});}
 if(req.method!=='POST')return json(req,{error:'Metoden støttes ikke.'},405);
 if(origin&&!allowedOrigins.has(origin))return json(req,{error:'Origin not allowed'},403);
 try{
  const raw=await req.text(); if(raw.length>4096)return json(req,{error:'Forespørselen er for stor.'},413);
  let payload:Payload; try{payload=JSON.parse(raw);}catch{return json(req,{error:'Ugyldig forespørsel.'},400);}
  const action=payload.action??'inspect', token=String(payload.token??'').trim(), organizationId=String(payload.organizationId??'').trim();
  if(!['inspect','accept'].includes(action)||token.length<32||token.length>512||!organizationId||organizationId.length>120)return json(req,{error:'Invitasjonslenken er ufullstendig.'},400);
  const url=Deno.env.get('SUPABASE_URL'), service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); if(!url||!service)return json(req,{error:'Server configuration error'},500);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}), tokenHash=await sha256(token);
  const {data:invitation,error:lookupError}=await admin.from('organization_invitations').select('id,organization_id,email,display_name,role,status,expires_at').eq('organization_id',organizationId).eq('token_hash',tokenHash).maybeSingle();
  if(lookupError){console.error('invitation lookup failed',lookupError.message);return json(req,{error:'Kunne ikke kontrollere invitasjonen.'},500);} if(!invitation)return json(req,{error:'Invitasjonslenken er ugyldig.'},404);
  if(new Date(invitation.expires_at).getTime()<=Date.now()){await admin.from('organization_invitations').update({status:'expired'}).eq('id',invitation.id).in('status',['pending','sent']);return json(req,{error:'Invitasjonen har utløpt.',status:'expired'},410);}
  if(!['pending','sent'].includes(invitation.status))return json(req,{error:'Invitasjonen kan ikke brukes.',status:invitation.status},409);
  const {data:organization}=await admin.from('organizations').select('id,name,live_url').eq('id',organizationId).maybeSingle();
  if(action==='inspect')return json(req,{valid:true,email:invitation.email,displayName:invitation.display_name,role:invitation.role,expiresAt:invitation.expires_at,organization:organization??{id:organizationId,name:'organisasjonen',live_url:'/'}});
  let userId:string|null=null; const auth=req.headers.get('authorization');
  if(auth?.toLowerCase().startsWith('bearer ')){const {data:userData}=await admin.auth.getUser(auth.slice(7));if(userData.user){if((userData.user.email??'').toLowerCase()!==invitation.email.toLowerCase())return json(req,{error:'Du er logget inn med en annen e-postadresse enn invitasjonen.'},403);userId=userData.user.id;}}
  if(!userId){const password=payload.password??'';if(!isValidPassword(password))return json(req,{error:PASSWORD_REQUIREMENT_MESSAGE},400);const {data:created,error:createError}=await admin.auth.admin.createUser({email:invitation.email,password,email_confirm:true,user_metadata:{display_name:invitation.display_name,organization_id:invitation.organization_id,organization_role:invitation.role},app_metadata:{organization_id:invitation.organization_id,organization_role:invitation.role}});if(createError||!created.user){if(/already|registered|exists/i.test(createError?.message??''))return json(req,{error:'Det finnes allerede en konto med denne e-posten. Logg inn med eksisterende konto.'},409);console.error('create invited user failed',createError?.message);return json(req,{error:'Kunne ikke opprette kontoen.'},500);}userId=created.user.id;}
  const now=new Date().toISOString();
  const {data:accepted,error:acceptError}=await admin.from('organization_invitations').update({status:'accepted',accepted_at:now,accepted_by:userId,error_message:null}).eq('id',invitation.id).in('status',['pending','sent']).select('id').maybeSingle();
  if(acceptError||!accepted)return json(req,{error:'Invitasjonen er allerede brukt eller kunne ikke fullføres.'},409);
  const {error:adminError}=await admin.from('organization_admins').upsert({organization_id:invitation.organization_id,user_id:userId,display_name:invitation.display_name||invitation.email,email:invitation.email,role:invitation.role,invitation_status:'accepted',updated_at:now},{onConflict:'organization_id,email'});
  if(adminError){console.error('admin activation failed',adminError.message);await admin.from('organization_invitations').update({status:'sent',accepted_at:null,accepted_by:null,error_message:'admin activation failed'}).eq('id',invitation.id).eq('accepted_by',userId);return json(req,{error:'Kunne ikke aktivere administratortilgangen.'},500);}
  return json(req,{accepted:true,email:invitation.email,organizationId:invitation.organization_id,redirectTo:organization?.live_url||'/admin'});
 }catch(error){console.error('accept invitation failed',error instanceof Error?error.message:String(error));return json(req,{error:'En uventet feil oppstod.'},500);}
});