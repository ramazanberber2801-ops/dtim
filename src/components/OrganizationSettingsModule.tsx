import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Loader2, Save, Settings } from 'lucide-react';
import { notifyOrganizationModulesChanged } from '../lib/moduleEngine';
import { supabase } from '../lib/supabase';

type FormState = {
  display_name:string; short_name:string; address:string; map_url:string; phone:string; email:string;
  whatsapp_number:string; donation_number:string; donation_url:string; bank_account:string; iban:string;
  opening_hours:string; weekly_event:string; logo_url:string; app_icon_url:string;
  ramadan_enabled:boolean; ramadan_start_date:string; ramadan_end_date:string;
  kurban_enabled:boolean; kurban_start_date:string;
};

const empty:FormState={display_name:'',short_name:'',address:'',map_url:'',phone:'',email:'',whatsapp_number:'',donation_number:'',donation_url:'',bank_account:'',iban:'',opening_hours:'',weekly_event:'',logo_url:'',app_icon_url:'',ramadan_enabled:false,ramadan_start_date:'',ramadan_end_date:'',kurban_enabled:false,kurban_start_date:''};

export function OrganizationSettingsModule({organizationId}:{organizationId:string}){
  const [form,setForm]=useState<FormState>(empty);
  const [dailyInspiration,setDailyInspiration]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!supabase){setLoading(false);return;}
      setLoading(true);setError('');setMessage('');
      const [settingsResult,moduleResult]=await Promise.all([
        supabase.from('organization_settings').select('*').eq('organization_id',organizationId).maybeSingle(),
        supabase.from('organization_modules').select('enabled').eq('organization_id',organizationId).eq('module_id','daily_inspiration').maybeSingle(),
      ]);
      if(cancelled)return;
      if(settingsResult.error)setError(settingsResult.error.message);
      else setForm(settingsResult.data?{...empty,...settingsResult.data,ramadan_start_date:settingsResult.data.ramadan_start_date||'',ramadan_end_date:settingsResult.data.ramadan_end_date||'',kurban_start_date:settingsResult.data.kurban_start_date||''}:empty);
      if(moduleResult.error)setError(moduleResult.error.message);
      else setDailyInspiration(Boolean(moduleResult.data?.enabled));
      setLoading(false);
    })();
    return()=>{cancelled=true;};
  },[organizationId]);

  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!supabase)return;
    setSaving(true);setError('');setMessage('');
    const now=new Date().toISOString();
    const [settingsResult,moduleResult]=await Promise.all([
      supabase.from('organization_settings').upsert({...form,organization_id:organizationId,updated_at:now},{onConflict:'organization_id'}),
      supabase.from('organization_modules').upsert({organization_id:organizationId,module_id:'daily_inspiration',enabled:dailyInspiration,status:dailyInspiration?'Aktiv':'Av',updated_at:now},{onConflict:'organization_id,module_id'}),
    ]);
    setSaving(false);
    const saveError=settingsResult.error||moduleResult.error;
    if(saveError){setError(saveError.message);return;}
    notifyOrganizationModulesChanged(organizationId);
    window.dispatchEvent(new CustomEvent('yasaflow-organization-settings-changed',{detail:{organizationId}}));
    setMessage('Innstillingene er lagret og modulendringen er aktivert.');
  };

  const field=(key:keyof FormState,label:string,type='text')=><label className="block"><span className="text-xs font-medium">{label}</span><input type={type} className="mt-1 w-full rounded-xl border p-3 text-sm" value={String(form[key]??'')} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>;
  if(loading)return <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>;

  return <form onSubmit={save} className="space-y-4">
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Settings style={{color:'var(--brand-primary)'}}/><div><h3 className="font-serif text-2xl">Organisasjonsinnstillinger</h3><p className="text-sm opacity-55">Kontakt, profil, donasjon og valgfrie moduler.</p></div></div></section>
    <section className="grid gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-2">{field('display_name','Visningsnavn')}{field('short_name','Kort navn')}{field('phone','Telefon')}{field('email','E-post','email')}{field('whatsapp_number','WhatsApp')}{field('address','Adresse')}{field('map_url','Kartlenke','url')}{field('logo_url','Logo-URL','url')}{field('app_icon_url','Appikon-URL','url')}{field('donation_number','Donasjonsnummer')}{field('donation_url','Donasjonslenke','url')}{field('bank_account','Bankkonto')}{field('iban','IBAN')}{field('opening_hours','Åpningstider')}{field('weekly_event','Ukentlig arrangement')}</section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <h4 className="font-semibold">Valgfrie moduler</h4>
      <div className="mt-4 space-y-4">
        <label className="flex items-start justify-between gap-4 rounded-2xl border p-4">
          <div className="flex gap-3"><BookOpen size={20} style={{color:'var(--brand-primary)'}}/><div><p className="text-sm font-semibold">Dagens vers og hadith</p><p className="mt-1 text-xs leading-5 opacity-55">Vis et daglig vers og en hadith på forsiden. Passer for moskeer og islamske organisasjoner, men er valgfritt.</p></div></div>
          <input type="checkbox" className="mt-1 h-5 w-5" checked={dailyInspiration} onChange={e=>setDailyInspiration(e.target.checked)}/>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ramadan_enabled} onChange={e=>setForm({...form,ramadan_enabled:e.target.checked})}/>Aktiver Ramadan</label>
        {form.ramadan_enabled&&<div className="grid gap-3 sm:grid-cols-2">{field('ramadan_start_date','Startdato','date')}{field('ramadan_end_date','Sluttdato','date')}</div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.kurban_enabled} onChange={e=>setForm({...form,kurban_enabled:e.target.checked})}/>Aktiver Kurban</label>
        {form.kurban_enabled&&field('kurban_start_date','Startdato','date')}
      </div>
    </section>
    {error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{message}</p>}
    <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Lagre innstillinger</button>
  </form>;
}
