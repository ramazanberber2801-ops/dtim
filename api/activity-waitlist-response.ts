import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl=process.env.VITE_SUPABASE_URL;
const anonKey=process.env.VITE_SUPABASE_ANON_KEY;
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const page=(title:string,message:string,success:boolean)=>`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><main style="max-width:620px;margin:60px auto;padding:20px"><section style="background:white;border:1px solid #e4e4e7;border-radius:24px;padding:34px;text-align:center"><div style="font-size:42px">${success?'✓':'!'}</div><h1>${escapeHtml(title)}</h1><p style="line-height:1.6;color:#52525b">${escapeHtml(message)}</p></section></main></body></html>`;

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='GET')return res.status(405).send(page('Ugyldig forespørsel','Denne lenken kan bare åpnes i nettleseren.',false));
  if(!supabaseUrl||!anonKey)return res.status(500).send(page('Teknisk feil','Tjenesten er ikke konfigurert riktig.',false));
  const token=String(req.query.token||'').trim();
  const decision=String(req.query.decision||'').trim();
  if(!token||!['accept','decline'].includes(decision))return res.status(400).send(page('Ugyldig lenke','Lenken mangler nødvendig informasjon.',false));
  const client=createClient(supabaseUrl,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.rpc('respond_activity_waitlist_offer',{p_token:token,p_decision:decision});
  if(error)return res.status(400).send(page('Kunne ikke registrere svaret',error.message.includes('offer_not_found')?'Tilbudet finnes ikke eller lenken er ugyldig.':'Prøv igjen eller kontakt arrangøren.',false));
  const result=Array.isArray(data)?data[0]?.result:null;
  if(result==='accepted')return res.status(200).send(page('Plassen er bekreftet','Du er nå registrert som deltaker. Arrangøren har mottatt svaret ditt.',true));
  if(result==='declined')return res.status(200).send(page('Du har takket nei','Plassen går videre til neste person på ventelisten.',true));
  if(result==='expired')return res.status(410).send(page('Tilbudet er utløpt','Svarfristen er passert, og plassen kan ha gått videre til neste person.',false));
  if(result==='full')return res.status(409).send(page('Plassen er ikke lenger tilgjengelig','Arrangementet ble fullt før svaret ble registrert.',false));
  return res.status(200).send(page('Svaret er allerede registrert','Det er ikke nødvendig å gjøre noe mer.',true));
}
