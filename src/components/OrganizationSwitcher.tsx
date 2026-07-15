import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, ChevronDown, Loader2, X } from 'lucide-react';
import { getCurrentOrganizationId, selectOrganization } from '../lib/organization';
import { supabase } from '../lib/supabase';

type Membership = { organization_id:string; role:string; status:string };
type Organization = { id:string; name?:string; display_name?:string; logo_url?:string; status?:string };
type Choice = Membership & { organization:Organization };

export function OrganizationSwitcher() {
  const [choices,setChoices]=useState<Choice[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [signedIn,setSignedIn]=useState(false);
  const currentId=getCurrentOrganizationId();

  const load=async()=>{
    const client=supabase;
    if(!client){setLoading(false);return;}
    const {data:{session}}=await client.auth.getSession();
    setSignedIn(Boolean(session));
    if(!session){setChoices([]);setLoading(false);return;}

    setLoading(true);
    const [membershipsResult,adminResult]=await Promise.all([
      client.from('organization_user_memberships').select('organization_id,role,status').eq('user_id',session.user.id).eq('status','active'),
      client.from('organization_admins').select('organization_id,role').eq('user_id',session.user.id),
    ]);

    const membershipMap=new Map<string,Membership>();
    for(const item of membershipsResult.data||[])membershipMap.set(item.organization_id,item as Membership);
    for(const item of adminResult.data||[])membershipMap.set(item.organization_id,{organization_id:item.organization_id,role:item.role||'admin',status:'active'});
    const memberships=Array.from(membershipMap.values());
    if(memberships.length===0){setChoices([]);setLoading(false);return;}

    const {data:organizations}=await client.from('organizations').select('id,name,display_name,logo_url,status').in('id',memberships.map(item=>item.organization_id));
    const orgMap=new Map((organizations||[]).map(org=>[org.id,org as Organization]));
    const next=memberships.map(item=>({ ...item, organization:orgMap.get(item.organization_id)||{id:item.organization_id} }));
    setChoices(next);

    if(!membershipMap.has(currentId)&&next.length>0){
      selectOrganization(next[0].organization_id);
      window.location.reload();
      return;
    }
    setLoading(false);
  };

  useEffect(()=>{
    void load();
    const client=supabase;
    if(!client)return;
    const {data}=client.auth.onAuthStateChange(()=>void load());
    const refresh=()=>void load();
    window.addEventListener('yasaflow-membership-changed',refresh);
    return()=>{data.subscription.unsubscribe();window.removeEventListener('yasaflow-membership-changed',refresh);};
  },[]);

  const current=useMemo(()=>choices.find(choice=>choice.organization_id===currentId)||choices[0],[choices,currentId]);
  if(!signedIn||loading||choices.length<2)return null;

  const choose=(organizationId:string)=>{
    if(organizationId===currentId){setOpen(false);return;}
    selectOrganization(organizationId);
    const url=new URL(window.location.href);
    url.searchParams.set('org',organizationId);
    window.location.assign(url.toString());
  };

  return <>
    <button type="button" onClick={()=>setOpen(true)} className="fixed left-3 top-3 z-[75] flex max-w-[55vw] items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur" style={{backgroundColor:'color-mix(in srgb, var(--brand-card) 92%, transparent)',borderColor:'var(--brand-border)',color:'var(--brand-text)'}}>
      {current?.organization.logo_url?<img src={current.organization.logo_url} alt="" className="h-6 w-6 rounded-full object-cover"/>:<Building2 size={15}/>}<span className="truncate">{current?.organization.display_name||current?.organization.name||'Organisasjon'}</span><ChevronDown size={14}/>
    </button>

    {open&&<div className="fixed inset-0 z-[190] flex items-end justify-center bg-black/55 sm:items-center sm:p-4">
      <section className="w-full max-w-md rounded-t-3xl border bg-white p-5 shadow-2xl sm:rounded-3xl" style={{borderColor:'var(--brand-border)',color:'var(--brand-text)'}}>
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider opacity-45">Din konto</p><h2 className="font-serif text-2xl">Velg organisasjon</h2></div><button onClick={()=>setOpen(false)} className="rounded-full bg-black/5 p-2"><X size={18}/></button></div>
        <div className="mt-5 space-y-2">{loading?<div className="flex justify-center p-6"><Loader2 className="animate-spin"/></div>:choices.map(choice=>{
          const selected=choice.organization_id===currentId;
          return <button key={choice.organization_id} onClick={()=>choose(choice.organization_id)} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left" style={{borderColor:selected?'var(--brand-primary)':'var(--brand-border)',backgroundColor:selected?'var(--brand-subtle)':'var(--brand-card)'}}>
            {choice.organization.logo_url?<img src={choice.organization.logo_url} alt="" className="h-11 w-11 rounded-xl object-cover"/>:<span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{background:'var(--brand-subtle)',color:'var(--brand-primary)'}}><Building2 size={19}/></span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{choice.organization.display_name||choice.organization.name||choice.organization_id}</span><span className="mt-1 block text-xs capitalize opacity-50">{choice.role}</span></span>
            {selected&&<Check size={18} style={{color:'var(--brand-primary)'}}/>}
          </button>;
        })}</div>
      </section>
    </div>}
  </>;
}
