import { useEffect, useState } from 'react';
import { Clock3, Loader2, MailCheck, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WaitlistRow={
  id:string;full_name:string;email:string;attendees:number;waitlist_position:number|null;
  waitlist_offer_status:string;waitlist_offer_expires_at:string|null;created_at:string;
};

export function ActivityWaitlistManager({activityId,organizationId}:{activityId:string;organizationId:string}){
  const [rows,setRows]=useState<WaitlistRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  const load=async()=>{
    if(!supabase)return;
    setLoading(true);
    const {data,error}=await supabase.from('activity_registrations')
      .select('id,full_name,email,attendees,waitlist_position,waitlist_offer_status,waitlist_offer_expires_at,created_at')
      .eq('activity_id',activityId).eq('status','waitlist')
      .order('waitlist_position',{ascending:true,nullsFirst:false}).order('created_at');
    if(error)setMessage(error.message);else setRows((data||[]) as WaitlistRow[]);
    setLoading(false);
  };
  useEffect(()=>{void load();},[activityId]);

  const processQueue=async()=>{
    if(!supabase)return;
    setBusy(true);setMessage('');
    try{
      const {data}=await supabase.auth.getSession();
      const token=data.session?.access_token;
      if(!token)throw new Error('Du må være innlogget.');
      const response=await fetch('/api/process-activity-waitlist',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({activityId,organizationId})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok&&response.status!==207)throw new Error(payload?.error||'Ventelisten kunne ikke behandles.');
      setMessage(payload.sent?`${payload.sent} tilbud ble sendt.${payload.failed?` ${payload.failed} sending feilet.`:''}`:'Ingen ledig plass eller ingen som kunne få tilbud nå.');
      await load();
    }catch(error){setMessage(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  };

  return <section className="mt-4 rounded-2xl border p-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Users size={16}/><div><p className="text-sm font-semibold">Automatisk venteliste</p><p className="text-[11px] opacity-55">Tilbud sendes i kø-rekkefølge når det finnes ledig kapasitet.</p></div></div>
      <button type="button" onClick={()=>void load()} className="rounded-lg border p-2" aria-label="Oppdater venteliste"><RefreshCw size={14}/></button>
    </div>
    {message&&<p className="mt-3 rounded-xl bg-black/[0.04] p-3 text-xs">{message}</p>}
    <button type="button" disabled={busy} onClick={()=>void processQueue()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold disabled:opacity-50">{busy?<Loader2 size={15} className="animate-spin"/>:<MailCheck size={15}/>}Kontroller kapasitet og send neste tilbud</button>
    <div className="mt-3 space-y-2">
      {loading?<div className="flex justify-center p-5"><Loader2 className="animate-spin"/></div>:rows.map(row=><article key={row.id} className="rounded-xl bg-black/[0.03] p-3">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{row.waitlist_position?`${row.waitlist_position}. `:''}{row.full_name}</p><p className="text-xs opacity-55">{row.email} · {row.attendees} plass(er)</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px]">{row.waitlist_offer_status==='offered'?'Tilbud sendt':'Venter'}</span></div>
        {row.waitlist_offer_expires_at&&<p className="mt-2 flex items-center gap-1 text-[11px] opacity-60"><Clock3 size={12}/>Svarfrist {new Date(row.waitlist_offer_expires_at).toLocaleString('nb-NO')}</p>}
      </article>)}
      {!loading&&!rows.length&&<p className="rounded-xl bg-black/[0.03] p-4 text-center text-xs opacity-55">Ingen står på venteliste.</p>}
    </div>
  </section>;
}
