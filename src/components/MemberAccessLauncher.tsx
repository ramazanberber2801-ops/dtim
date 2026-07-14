import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Loader2, LogIn, UserPlus, X } from 'lucide-react';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { supabase } from '../lib/supabase';

const PENDING_CODE_KEY = 'yasaflow_pending_invitation_code';
type Mode = 'login' | 'register' | 'join';
type AccessMode = 'public' | 'mixed' | 'authenticated';

export function MemberAccessLauncher() {
  const [open,setOpen]=useState(false);
  const [mode,setMode]=useState<Mode>('join');
  const [accessMode,setAccessMode]=useState<AccessMode>('public');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [signedIn,setSignedIn]=useState(false);

  const notifyAccessChanged=()=>window.dispatchEvent(new Event('yasaflow-membership-changed'));

  const joinWithCode=async(invitationCode:string)=>{
    if(!supabase)return;
    const normalized=invitationCode.trim().toUpperCase();
    if(!normalized)throw new Error('Skriv inn invitasjonskoden.');
    const {data,error}=await supabase.rpc('join_organization_with_code',{p_code:normalized});
    if(error)throw error;
    localStorage.removeItem(PENDING_CODE_KEY);
    notifyAccessChanged();
    return data as {status?:string;role?:string};
  };

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const joinCode=params.get('join')||params.get('code');
    if(joinCode){setCode(joinCode.toUpperCase());setMode('join');setOpen(true);}

    if(!supabase)return;
    void supabase.from('organizations').select('app_access_mode').eq('id',DEFAULT_ORGANIZATION_ID).maybeSingle().then(({data})=>setAccessMode((data?.app_access_mode||'public') as AccessMode));
    void supabase.auth.getSession().then(({data})=>setSignedIn(Boolean(data.session)));
    const {data}=supabase.auth.onAuthStateChange(async(_event,session)=>{
      setSignedIn(Boolean(session));
      notifyAccessChanged();
      if(session){
        const pending=localStorage.getItem(PENDING_CODE_KEY);
        if(pending){
          try{
            const result=await joinWithCode(pending);
            setMessage(result?.status==='pending'?'Registreringen er mottatt og venter på godkjenning.':'Du er nå medlem av organisasjonen.');
            setOpen(true);
          }catch(err){setError(err instanceof Error?err.message:'Kunne ikke bruke invitasjonskoden.');setOpen(true);}
        }
      }
    });
    const reloadMode=()=>void supabase?.from('organizations').select('app_access_mode').eq('id',DEFAULT_ORGANIZATION_ID).maybeSingle().then(({data})=>setAccessMode((data?.app_access_mode||'public') as AccessMode));
    window.addEventListener('yasaflow-organization-settings-changed',reloadMode);
    return()=>{data.subscription.unsubscribe();window.removeEventListener('yasaflow-organization-settings-changed',reloadMode);};
  },[]);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(!supabase)return;
    setBusy(true);setError('');setMessage('');
    try{
      if(mode==='login'){
        const {error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
        if(error)throw error;
        setMessage('Du er logget inn.');
        notifyAccessChanged();
      }else if(mode==='register'){
        if(password.length<6)throw new Error('Passordet må ha minst 6 tegn.');
        if(code.trim())localStorage.setItem(PENDING_CODE_KEY,code.trim().toUpperCase());
        const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:window.location.origin}});
        if(error)throw error;
        if(data.session&&code.trim()){
          const result=await joinWithCode(code);
          setMessage(result?.status==='pending'?'Kontoen er opprettet og venter på godkjenning.':'Kontoen er opprettet og koblet til organisasjonen.');
        }else setMessage('Kontoen er opprettet. Bekreft e-posten din for å fortsette.');
      }else{
        const {data}=await supabase.auth.getSession();
        if(!data.session){localStorage.setItem(PENDING_CODE_KEY,code.trim().toUpperCase());setMode('register');setMessage('Opprett eller logg inn på en konto for å bruke koden.');}
        else{
          const result=await joinWithCode(code);
          setMessage(result?.status==='pending'?'Forespørselen er sendt og venter på godkjenning.':'Du er nå medlem av organisasjonen.');
        }
      }
    }catch(err){setError(err instanceof Error?err.message:'Noe gikk galt.');}
    finally{setBusy(false);}
  };

  const logout=async()=>{await supabase?.auth.signOut();setSignedIn(false);setMessage('Du er logget ut.');notifyAccessChanged();};

  const hasJoinLink=Boolean(new URLSearchParams(window.location.search).get('join')||new URLSearchParams(window.location.search).get('code'));
  if(accessMode==='public'&&!hasJoinLink)return null;

  return <>
    <button type="button" onClick={()=>{setOpen(true);setMode(signedIn?'join':'login');setError('');setMessage('');}} className="fixed right-3 top-3 z-[70] flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur" style={{backgroundColor:'color-mix(in srgb, var(--brand-card) 92%, transparent)',borderColor:'var(--brand-border)',color:'var(--brand-text)'}}>
      {signedIn?<KeyRound size={15}/>:<LogIn size={15}/>} {signedIn?'Bruk kode':'Logg inn'}
    </button>

    {open&&<div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/55 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl border bg-white p-5 shadow-2xl sm:rounded-3xl" style={{borderColor:'var(--brand-border)',color:'var(--brand-text)'}}>
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider opacity-45">Tilgang og medlemskap</p><h2 className="font-serif text-2xl">{mode==='login'?'Logg inn':mode==='register'?'Opprett bruker':'Bruk invitasjonskode'}</h2></div><button onClick={()=>setOpen(false)} className="rounded-full bg-black/5 p-2"><X size={18}/></button></div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-black/5 p-1 text-xs"><button onClick={()=>setMode('login')} className={`rounded-lg py-2 ${mode==='login'?'bg-white shadow':''}`}>Logg inn</button><button onClick={()=>setMode('register')} className={`rounded-lg py-2 ${mode==='register'?'bg-white shadow':''}`}>Ny bruker</button><button onClick={()=>setMode('join')} className={`rounded-lg py-2 ${mode==='join'?'bg-white shadow':''}`}>Invitasjonskode</button></div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode!=='join'&&<><input required type="email" className="w-full rounded-xl border p-3 text-sm" placeholder="E-post" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" minLength={6} className="w-full rounded-xl border p-3 text-sm" placeholder="Passord" value={password} onChange={e=>setPassword(e.target.value)}/></>}
          {mode!=='login'&&<input required={mode==='join'} className="w-full rounded-xl border p-3 font-mono text-sm uppercase" placeholder="Invitasjonskode, f.eks. YSF-AB12-CD34" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>} 
          {error&&<p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50" style={{background:'var(--brand-primary)',color:'var(--brand-primary-text)'}}>{busy?<Loader2 size={16} className="animate-spin"/>:mode==='login'?<LogIn size={16}/>:mode==='register'?<UserPlus size={16}/>:<KeyRound size={16}/>} {busy?'Behandler...':mode==='login'?'Logg inn':mode==='register'?'Opprett bruker':'Bruk kode'}</button>
        </form>
        {signedIn&&<button onClick={()=>void logout()} className="mt-3 w-full rounded-xl border py-2.5 text-xs opacity-65">Logg ut</button>}
      </div>
    </div>}
  </>;
}
