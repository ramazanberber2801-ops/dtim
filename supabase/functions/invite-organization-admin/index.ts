import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = { organizationId?: string; email?: string; displayName?: string; redirectTo?: string };
const allowedOrigins = new Set(['https://yasaflow.com','https://www.yasaflow.com','https://app.yasaflow.com','https://yasaflow.vercel.app','https://yasaflow-website.vercel.app']);
function cors(origin:string|null){const value=origin&&allowedOrigins.has(origin)?origin:'https://yasaflow.com';return {'Access-Control-Allow-Origin':value,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin'};}
function json(req:Request, body:unknown, status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req.headers.get('origin')),'Content-Type':'application/json','X-Content-Type-Options':'nosniff'}});}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS'){if(origin&&!allowedOrigins.has(origin))return json(req,{error:'Origin not allowed'},403);return new Response('ok',{headers:cors(origin)});}
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
 if(origin&&!allowedOrigins.has(origin))return json(req,{error:'Origin not allowed'},403);
 const auth=req.headers.get('authorization')??'';
 if(!auth.toLowerCase().startsWith('bearer '))return json(req,{error:'Authentication required'},401);
 const url=Deno.env.get('SUPABASE_URL'), anon=Deno.env.get('SUPABASE_ANON_KEY'), service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!service)return json(req,{error:'Server configuration error'},500);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userData,error:userError}=await userClient.auth.getUser();
 if(userError||!userData.user)return json(req,{error:'Invalid or expired session'},401);
 let payload:InvitePayload; try{payload=await req.json();}catch{return json(req,{error:'Invalid JSON body'},400);}
 const organizationId=String(payload.organizationId??'').trim(), email=String(payload.email??'').trim().toLowerCase(), displayName=String(payload.displayName??'').trim();
 if(!organizationId||organizationId.length>120)return json(req,{error:'Invalid organizationId'},400);
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return json(req,{error:'Valid email is required'},400);
 if(displayName.length>120)return json(req,{error:'Display name is too long'},400);
 let redirectTo:string|undefined; if(payload.redirectTo){try{const parsed=new URL(String(payload.redirectTo));if(parsed.protocol!=='https:'||!(parsed.hostname==='yasaflow.com'||parsed.hostname.endsWith('.yasaflow.com')||parsed.hostname.endsWith('.vercel.app')))return json(req,{error:'Invalid redirect URL'},400);redirectTo=parsed.toString();}catch{return json(req,{error:'Invalid redirect URL'},400);}}
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:orgAdmin},{data:platformAdmin}]=await Promise.all([
  admin.from('organization_admins').select('id').eq('organization_id',organizationId).eq('user_id',userData.user.id).eq('invitation_status','accepted').in('role',['owner','admin']).maybeSingle(),
  admin.from('platform_admins').select('user_id').eq('user_id',userData.user.id).maybeSingle()
 ]);
 if(!orgAdmin&&!platformAdmin)return json(req,{error:'Forbidden'},403);
 const {data:organization}=await admin.from('organizations').select('id,name').eq('id',organizationId).maybeSingle();
 if(!organization)return json(req,{error:'Organization not found'},404);
 const {data:inviteData,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo,data:{organization_id:organizationId,organization_name:organization.name,display_name:displayName||email,role:'admin'}});
 if(inviteError){console.error('invite failed',{message:inviteError.message,organizationId,actor:userData.user.id});return json(req,{error:'Could not send invitation'},400);}
 const {error:adminError}=await admin.from('organization_admins').upsert({organization_id:organizationId,user_id:inviteData.user?.id??null,display_name:displayName||email,email,role:'admin',invitation_status:'invited',updated_at:new Date().toISOString()},{onConflict:'organization_id,email'});
 if(adminError){console.error('admin upsert failed',{message:adminError.message,organizationId});return json(req,{error:'Could not save invitation'},500);}
 await admin.from('organization_provisioning_steps').upsert({organization_id:organizationId,step_key:'admin_ready',label:'Admin klar',status:'invited',updated_at:new Date().toISOString()},{onConflict:'organization_id,step_key'});
 return json(req,{ok:true,organizationId,email,userId:inviteData.user?.id??null});
});