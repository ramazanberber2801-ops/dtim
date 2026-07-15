import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, AlertCircle, BellRing, CalendarDays, Edit3, Loader2, MapPin, Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../lib/pushNotifications';

type ActivityStatus = 'draft' | 'published' | 'cancelled';
type ContactPerson = { id:string; name:string; position:string; image_url:string };
type ActivityItem = {
  id:string; title:string; description:string; activityDate:string; startTime:string; endTime:string;
  location:string; capacity:string; status:ActivityStatus; publishedAt:string; contactPersonId:string;
};
type ActivityForm = Omit<ActivityItem,'id'|'publishedAt'>;

const emptyForm:ActivityForm={title:'',description:'',activityDate:'',startTime:'',endTime:'',location:'',capacity:'',status:'draft',contactPersonId:''};
const brand={primary:'var(--brand-primary)',text:'var(--brand-text)',card:'var(--brand-card)'};
const mix=(color:string,amount:number,fallback='transparent')=>`color-mix(in srgb, ${color} ${amount}%, ${fallback})`;
const statusLabel=(status:ActivityStatus)=>status==='published'?'Publisert':status==='cancelled'?'Avlyst':'Utkast';
const statusClass=(status:ActivityStatus)=>status==='published'?'bg-green-100 text-green-700':status==='cancelled'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700';
const activityPushBody=(item:Pick<ActivityItem,'description'|'activityDate'|'startTime'|'location'>)=>{const details=[item.activityDate,item.startTime,item.location].filter(Boolean).join(' · ');return item.description.trim()||details||'En ny aktivitet er publisert i appen.';};

export function ActivitiesModule({organizationId}:{organizationId:string}){
  const [items,setItems]=useState<ActivityItem[]>([]);
  const [contacts,setContacts]=useState<ContactPerson[]>([]);
  const [query,setQuery]=useState('');
  const [contactQuery,setContactQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState<'all'|ActivityStatus>('all');
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState('');
  const [editorOpen,setEditorOpen]=useState(false);
  const [editingItem,setEditingItem]=useState<ActivityItem|null>(null);
  const [form,setForm]=useState<ActivityForm>(emptyForm);
  const [sendPush,setSendPush]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [actionId,setActionId]=useState('');

  const loadItems=async()=>{
    const client=supabase;if(!client){setLoadError('Supabase er ikke konfigurert.');setLoading(false);return;}
    setLoading(true);setLoadError('');
    const [activityResult,contactResult]=await Promise.all([
      client.from('organization_activities').select('id,title,description,activity_date,start_time,end_time,location,capacity,status,published_at,contact_person_id').eq('organization_id',organizationId).order('activity_date',{ascending:true}).order('start_time',{ascending:true}),
      client.from('organization_staff').select('id,name,position,image_url').eq('organization_id',organizationId).eq('active',true).eq('public_visible',true).order('sort_order'),
    ]);
    if(activityResult.error){setItems([]);setLoadError(activityResult.error.message.includes('organization_activities')?'Aktivitetstabellen er ikke klar i Supabase ennå.':activityResult.error.message);}else{
      setItems((activityResult.data||[]).map(row=>({id:row.id,title:row.title||'',description:row.description||'',activityDate:row.activity_date||'',startTime:row.start_time?.slice(0,5)||'',endTime:row.end_time?.slice(0,5)||'',location:row.location||'',capacity:row.capacity==null?'':String(row.capacity),status:row.status==='published'||row.status==='cancelled'?row.status:'draft',publishedAt:row.published_at||'',contactPersonId:row.contact_person_id||''})));
    }
    if(contactResult.error)setLoadError(current=>current||contactResult.error.message);else setContacts((contactResult.data||[]) as ContactPerson[]);
    setLoading(false);
  };

  useEffect(()=>{void loadItems();},[organizationId]);
  const filteredItems=useMemo(()=>{const needle=query.trim().toLowerCase();return items.filter(item=>{if(statusFilter!=='all'&&item.status!==statusFilter)return false;return !needle||[item.title,item.description,item.location].join(' ').toLowerCase().includes(needle);});},[items,query,statusFilter]);
  const filteredContacts=useMemo(()=>{const needle=contactQuery.trim().toLowerCase();return contacts.filter(contact=>!needle||[contact.name,contact.position].join(' ').toLowerCase().includes(needle));},[contacts,contactQuery]);
  const contactName=(id:string)=>contacts.find(contact=>contact.id===id)?.name||'';

  const openCreate=()=>{setEditingItem(null);setForm({...emptyForm,activityDate:new Date().toISOString().slice(0,10)});setSendPush(true);setContactQuery('');setSaveError('');setEditorOpen(true);};
  const openEdit=(item:ActivityItem)=>{setEditingItem(item);setForm({title:item.title,description:item.description,activityDate:item.activityDate,startTime:item.startTime,endTime:item.endTime,location:item.location,capacity:item.capacity,status:item.status,contactPersonId:item.contactPersonId});setSendPush(false);setContactQuery('');setSaveError('');setEditorOpen(true);};
  const closeEditor=()=>{if(saving)return;setEditorOpen(false);setEditingItem(null);setForm(emptyForm);setSendPush(false);setSaveError('');};
  const sendItemPush=async(item:Pick<ActivityItem,'title'|'description'|'activityDate'|'startTime'|'location'>)=>{await sendPushNotification({title:`Aktivitet: ${item.title}`,body:activityPushBody(item),organizationId});};

  const saveItem=async(event:FormEvent)=>{
    event.preventDefault();const client=supabase;if(!client)return;
    if(!form.title.trim())return setSaveError('Tittel er obligatorisk.');
    if(!form.activityDate)return setSaveError('Dato er obligatorisk.');
    const capacity=form.capacity.trim()===''?null:Number(form.capacity);
    if(capacity!==null&&(!Number.isInteger(capacity)||capacity<0))return setSaveError('Kapasitet må være 0 eller et positivt heltall.');
    setSaving(true);setSaveError('');
    const publishedAt=form.status==='published'?(editingItem?.publishedAt||new Date().toISOString()):'';
    const payload={organization_id:organizationId,title:form.title.trim(),description:form.description.trim()||null,activity_date:form.activityDate,start_time:form.startTime||null,end_time:form.endTime||null,location:form.location.trim()||null,capacity,status:form.status,published_at:publishedAt||null,contact_person_id:form.contactPersonId||null,updated_at:new Date().toISOString()};
    try{
      const result=editingItem?await client.from('organization_activities').update(payload).eq('id',editingItem.id).eq('organization_id',organizationId):await client.from('organization_activities').insert(payload);
      if(result.error)throw result.error;
      if(sendPush)await sendItemPush({title:form.title,description:form.description,activityDate:form.activityDate,startTime:form.startTime,location:form.location});
      closeEditor();await loadItems();
    }catch(error){setSaveError(error instanceof Error?error.message:'Aktiviteten kunne ikke lagres.');}finally{setSaving(false);}
  };

  const deleteItem=async(item:ActivityItem)=>{const client=supabase;if(!client||!window.confirm(`Slette aktiviteten «${item.title}»?`))return;setActionId(item.id);const {error}=await client.from('organization_activities').delete().eq('id',item.id).eq('organization_id',organizationId);setActionId('');if(error)return alert('Aktiviteten kunne ikke slettes: '+error.message);await loadItems();};
  const resendPush=async(item:ActivityItem)=>{setActionId(item.id);try{await sendItemPush(item);alert('Push-varselet ble sendt på nytt.');}catch(error){alert(error instanceof Error?error.message:'Push-varselet kunne ikke sendes.');}finally{setActionId('');}};

  return <div className="space-y-4">
    <section className="rounded-3xl border p-5 shadow-sm" style={{backgroundColor:brand.card,borderColor:mix(brand.primary,16),color:brand.text}}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Kjernemodul</p><h3 className="font-serif text-2xl">Aktiviteter</h3><p className="mt-1 text-sm opacity-60">{items.length} aktiviteter i organisasjonen.</p></div><button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{backgroundColor:brand.primary,color:'var(--brand-primary-text)'}}><Plus size={17}/>Ny aktivitet</button></div><div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]"><label className="flex items-center gap-2 rounded-xl border bg-white px-3" style={{borderColor:mix(brand.primary,18)}}><Search size={16} className="opacity-45"/><input className="w-full bg-transparent py-3 text-sm outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søk aktivitet eller sted"/></label><select className="rounded-xl border bg-white px-3 py-3 text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as 'all'|ActivityStatus)}><option value="all">Alle statuser</option><option value="published">Publisert</option><option value="draft">Utkast</option><option value="cancelled">Avlyst</option></select></div></section>
    {loading?<div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-sm opacity-60"><Loader2 size={18} className="animate-spin"/>Henter aktiviteter...</div>:loadError?<div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertCircle size={19}/><div><p className="text-sm font-semibold">Aktivitetsmodulen kan ikke laste data</p><p className="mt-1 text-xs">{loadError}</p></div></div>:filteredItems.length===0?<div className="rounded-2xl border bg-white p-8 text-center"><Activity size={28} className="mx-auto opacity-30"/><p className="mt-3 text-sm font-medium">Ingen aktiviteter funnet</p></div>:<div className="space-y-2">{filteredItems.map(item=><article key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm" style={{borderColor:mix(brand.primary,14),color:brand.text}}><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-semibold" style={{backgroundColor:mix(brand.primary,10),color:brand.primary}}><CalendarDays size={17}/><span>{item.activityDate?item.activityDate.slice(8,10):'—'}</span></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{item.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></div><p className="mt-1 truncate text-xs opacity-50">{item.activityDate}{item.startTime?` · ${item.startTime}`:''}{item.location?` · ${item.location}`:''}</p>{item.contactPersonId&&contactName(item.contactPersonId)&&<p className="mt-1 flex items-center gap-1 truncate text-[11px] opacity-50"><UserRound size={12}/>Kontakt: {contactName(item.contactPersonId)}</p>}</div></div><div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3" style={{borderColor:mix(brand.primary,12)}}><button type="button" onClick={()=>openEdit(item)} className="flex items-center justify-center gap-1 rounded-lg bg-black/5 px-2 py-2 text-xs"><Edit3 size={14}/>Rediger</button><button type="button" disabled={actionId===item.id} onClick={()=>void deleteItem(item)} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-2 text-xs text-red-700 disabled:opacity-50"><Trash2 size={14}/>Slett</button><button type="button" disabled={actionId===item.id} onClick={()=>void resendPush(item)} className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs disabled:opacity-50" style={{backgroundColor:mix(brand.primary,12),color:brand.primary}}><BellRing size={14}/>Push igjen</button></div></article>)}</div>}

    {editorOpen&&<div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" style={{color:brand.text}}><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Aktiviteter</p><h3 className="font-serif text-2xl">{editingItem?'Rediger aktivitet':'Ny aktivitet'}</h3></div><button type="button" onClick={closeEditor} className="rounded-full bg-black/5 p-2"><X size={18}/></button></div><form onSubmit={saveItem} className="mt-5 space-y-4">
      <div><label className="text-xs font-medium">Tittel *</label><input required className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
      <div><label className="text-xs font-medium">Beskrivelse</label><textarea rows={5} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <div className="grid gap-3 sm:grid-cols-3"><div><label className="text-xs font-medium">Dato *</label><input required type="date" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.activityDate} onChange={e=>setForm(p=>({...p,activityDate:e.target.value}))}/></div><div><label className="text-xs font-medium">Start</label><input type="time" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.startTime} onChange={e=>setForm(p=>({...p,startTime:e.target.value}))}/></div><div><label className="text-xs font-medium">Slutt</label><input type="time" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.endTime} onChange={e=>setForm(p=>({...p,endTime:e.target.value}))}/></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-xs font-medium">Sted</label><div className="relative mt-1"><MapPin size={15} className="absolute left-3 top-3.5 opacity-35"/><input className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div></div><div><label className="text-xs font-medium">Kapasitet</label><div className="relative mt-1"><Users size={15} className="absolute left-3 top-3.5 opacity-35"/><input type="number" min="0" className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))}/></div></div></div>
      <div className="rounded-2xl border p-4"><label className="text-sm font-semibold">Kontaktperson (valgfritt)</label><p className="mt-1 text-xs opacity-55">Bare aktive og offentlige kontaktpersoner kan velges.</p><label className="mt-3 flex items-center gap-2 rounded-xl border px-3"><Search size={15} className="opacity-40"/><input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Søk kontaktperson" value={contactQuery} onChange={e=>setContactQuery(e.target.value)}/></label><div className="mt-3 max-h-44 space-y-2 overflow-y-auto"><button type="button" onClick={()=>setForm(p=>({...p,contactPersonId:''}))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${!form.contactPersonId?'ring-2':''}`} style={!form.contactPersonId?{borderColor:brand.primary}:{}}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={15}/></span><span className="text-sm font-medium">Ingen kontaktperson</span></button>{filteredContacts.map(contact=><button key={contact.id} type="button" onClick={()=>setForm(p=>({...p,contactPersonId:contact.id}))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${form.contactPersonId===contact.id?'ring-2':''}`} style={form.contactPersonId===contact.id?{borderColor:brand.primary}:{}}>{contact.image_url?<img src={contact.image_url} alt="" className="h-9 w-9 rounded-full object-cover"/>:<span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5"><UserRound size={16}/></span>}<span className="min-w-0"><span className="block truncate text-sm font-semibold">{contact.name}</span>{contact.position&&<span className="block truncate text-xs opacity-50">{contact.position}</span>}</span></button>)}</div></div>
      <div><label className="text-xs font-medium">Status</label><select className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as ActivityStatus}))}><option value="draft">Utkast</option><option value="published">Publisert</option><option value="cancelled">Avlyst</option></select></div>
      <label className="flex items-start gap-3 rounded-xl border bg-amber-50 p-3"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={sendPush} onChange={e=>setSendPush(e.target.checked)}/><span><span className="block text-sm font-medium">Send push-varsel</span><span className="block text-xs opacity-60">{editingItem?'Av som standard ved redigering. Slå på bare når du ønsker nytt varsel.':'Slå av dersom aktiviteten skal lagres uten varsel.'}</span></span></label>
      {saveError&&<p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}
      <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-60" style={{backgroundColor:brand.primary,color:'var(--brand-primary-text)'}}>{saving&&<Loader2 size={16} className="animate-spin"/>}{saving?'Lagrer...':editingItem?'Lagre endringer':'Opprett aktivitet'}</button>
    </form></div></div>}
  </div>;
}
