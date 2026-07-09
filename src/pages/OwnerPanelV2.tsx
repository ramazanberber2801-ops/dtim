import { useMemo, useState, type ReactNode } from 'react';
import { Building2, Boxes, Crown, Mail, Plus, Save, Send, ShieldCheck, UserCog } from 'lucide-react';
import { supabase } from '../lib/supabase';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type Organization = {
  id: string;
  name: string;
  type: string;
  country: string;
  language: string;
  status: string;
  hosting: string;
  domain: string;
  liveUrl: string;
  adminName: string;
  adminEmail: string;
  memberCount: number;
  themeId: string;
  onboardingStep: string;
};

type ModuleItem = {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
  locked: boolean;
};

const defaultOrganization: Organization = {
  id: 'dtim',
  name: 'Drammen',
  type: 'Moské',
  country: 'Norge',
  language: 'Tyrkisk',
  status: 'Prøve',
  hosting: 'Managed',
  domain: '',
  liveUrl: '/',
  adminName: '',
  adminEmail: '',
  memberCount: 0,
  themeId: 'classic-mosque',
  onboardingStep: 'Testing',
};

const defaultModules: ModuleItem[] = [
  { id: 'news', name: 'Nyheter', status: 'Inkludert', enabled: true, locked: true },
  { id: 'activities', name: 'Aktiviteter', status: 'Inkludert', enabled: true, locked: true },
  { id: 'contact', name: 'Kontakt', status: 'Inkludert', enabled: true, locked: true },
  { id: 'push', name: 'Push-varsler', status: 'Aktiv', enabled: true, locked: false },
  { id: 'donation', name: 'Donasjon', status: 'Aktiv', enabled: true, locked: false },
  { id: 'members', name: 'Medlemsregister', status: 'Av', enabled: false, locked: false },
  { id: 'prayer', name: 'Bønnetider', status: 'Av', enabled: false, locked: false },
];

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={18} /></div>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wide opacity-45 mb-1">{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <input type={type} className="w-full px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select className="w-full px-4 py-3 rounded-xl border bg-white text-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

function StatusMessage({ state, text }: { state: 'idle' | 'saving' | 'success' | 'error' | 'sending' | 'sent'; text: string }) {
  if (!text) return null;
  return <p className={`text-xs rounded-xl px-3 py-2 ${state === 'error' ? 'text-red-700 bg-red-50' : 'bg-black/5'}`}>{text}</p>;
}

export function OwnerPanelV2() {
  const [organization, setOrganization] = useState<Organization>(defaultOrganization);
  const [modules, setModules] = useState<ModuleItem[]>(defaultModules);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');

  const activeModules = useMemo(() => modules.filter((mod) => mod.enabled).length, [modules]);

  const setOrgField = (key: keyof Organization, value: string | number) => {
    setOrganization((prev) => ({ ...prev, [key]: value }));
  };

  const persistOrganization = async () => {
    const org = { ...organization, id: organization.id || 'dtim', name: organization.name.trim() || 'Drammen' };
    setOrganization(org);

    if (!supabase) return org;

    const now = new Date().toISOString();
    const { error: orgError } = await supabase.from('organizations').upsert({
      id: org.id,
      name: org.name,
      organization_type: org.type,
      country: org.country,
      language: org.language,
      status: org.status,
      hosting_mode: org.hosting,
      domain: org.domain || null,
      live_url: org.liveUrl || null,
      theme_id: org.themeId,
      onboarding_step: org.onboardingStep,
      admin_name: org.adminName || null,
      admin_email: org.adminEmail || null,
      member_count: org.memberCount || 0,
      updated_at: now,
    }, { onConflict: 'id' });
    if (orgError) throw orgError;

    const { error: moduleError } = await supabase.from('organization_modules').upsert(modules.map((mod) => ({
      organization_id: org.id,
      module_id: mod.id,
      enabled: mod.enabled,
      status: mod.status,
      updated_at: now,
    })), { onConflict: 'organization_id,module_id' });
    if (moduleError) throw moduleError;

    if (org.adminEmail.trim()) {
      const { error: adminError } = await supabase.from('organization_admins').upsert({
        organization_id: org.id,
        display_name: org.adminName || org.adminEmail,
        email: org.adminEmail.trim().toLowerCase(),
        role: 'admin',
        invitation_status: inviteState === 'sent' ? 'invited' : 'pending',
        updated_at: now,
      }, { onConflict: 'organization_id,email' });
      if (adminError) throw adminError;
    }

    const { error: stepError } = await supabase.from('organization_provisioning_steps').upsert([
      { step_key: 'order_received', label: 'Bestilling mottatt', status: 'done' },
      { step_key: 'organization_created', label: 'Organisasjon opprettet', status: 'done' },
      { step_key: 'admin_ready', label: 'Admin klar', status: inviteState === 'sent' ? 'invited' : org.adminEmail ? 'pending' : 'waiting' },
      { step_key: 'theme_selected', label: 'Tema valgt', status: org.themeId ? 'done' : 'pending' },
      { step_key: 'published', label: 'Publisering', status: org.onboardingStep === 'Klar' ? 'done' : 'pending' },
    ].map((step) => ({ organization_id: org.id, ...step, updated_at: now })), { onConflict: 'organization_id,step_key' });
    if (stepError) throw stepError;

    return org;
  };

  const saveOrganization = async () => {
    setSaveState('saving');
    setSaveMessage('Lagrer organisasjon...');
    try {
      await persistOrganization();
      setSaveState('success');
      setSaveMessage('Organisasjonen er lagret.');
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Kunne ikke lagre organisasjonen.');
    }
  };

  const inviteAdministrator = async () => {
    const email = organization.adminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setInviteState('error');
      setInviteMessage('Skriv inn en gyldig admin e-post først.');
      return;
    }
    if (!supabase) {
      setInviteState('error');
      setInviteMessage('Supabase er ikke konfigurert.');
      return;
    }

    setInviteState('sending');
    setInviteMessage('Sender invitasjon...');
    try {
      const org = await persistOrganization();
      const { data, error } = await supabase.functions.invoke('invite-organization-admin', {
        body: {
          organizationId: org.id,
          email,
          displayName: org.adminName || email,
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error));
      setInviteState('sent');
      setInviteMessage(`Invitasjon sendt til ${email}.`);
    } catch (error) {
      setInviteState('error');
      setInviteMessage(error instanceof Error ? error.message : 'Kunne ikke sende invitasjon.');
    }
  };

  const toggleModule = (id: string) => setModules((prev) => prev.map((mod) => {
    if (mod.id !== id || mod.locked) return mod;
    const enabled = !mod.enabled;
    return { ...mod, enabled, status: enabled ? 'Aktiv' : 'Av' };
  }));

  return (
    <div className="p-4 space-y-5" style={{ color: brand.text }}>
      <div className="rounded-3xl p-5 border-2 shadow-sm" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}><Crown size={20} /></div>
            <div>
              <p className="text-xs opacity-65">Yasaflow</p>
              <h2 className="font-serif text-2xl leading-tight">Owner Dashboard V2</h2>
              <p className="text-[11px] opacity-60">OwnerPanelV2 admin invite active</p>
            </div>
          </div>
          <button type="button" onClick={() => setOrganization({ ...defaultOrganization, id: `org-${Date.now()}`, name: 'Ny organisasjon', adminName: '', adminEmail: '' })} className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5" style={{ backgroundColor: mix(brand.primary, 25), color: brand.secondaryText }}><Plus size={14} /> Ny</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Organisasjon</p><p className="font-serif text-xl">{organization.name}</p></div>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Aktive moduler</p><p className="font-serif text-xl">{activeModules}</p></div>
      </div>

      <Card title="Admin-invitasjon" icon={Mail}>
        <div className="space-y-3">
          <div><FieldLabel>Admin navn</FieldLabel><TextInput value={organization.adminName} onChange={(value) => setOrgField('adminName', value)} placeholder="Første administrator" /></div>
          <div><FieldLabel>Admin e-post</FieldLabel><TextInput type="email" value={organization.adminEmail} onChange={(value) => { setOrgField('adminEmail', value); setInviteState('idle'); setInviteMessage(''); }} placeholder="admin@organisasjon.no" /></div>
          <button type="button" disabled={inviteState === 'sending' || !organization.adminEmail.trim()} onClick={inviteAdministrator} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}><Send size={16} /> {inviteState === 'sending' ? 'Sender invitasjon...' : inviteState === 'sent' ? 'Invitasjon sendt' : 'Inviter administrator'}</button>
          <StatusMessage state={inviteState} text={inviteMessage} />
        </div>
      </Card>

      <Card title="Organisasjon" icon={Building2}>
        <div className="space-y-3">
          <div><FieldLabel>Organisasjonsnavn</FieldLabel><TextInput value={organization.name} onChange={(value) => setOrgField('name', value)} placeholder="Organisasjonsnavn" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Type</FieldLabel><SelectInput value={organization.type} onChange={(value) => setOrgField('type', value)}><option>Moské</option><option>Forening</option><option>Kirke</option><option>Idrettslag</option><option>Kultur</option><option>Annen</option></SelectInput></div>
            <div><FieldLabel>Status</FieldLabel><SelectInput value={organization.status} onChange={(value) => setOrgField('status', value)}><option>Aktiv</option><option>Prøve</option><option>Frosset</option></SelectInput></div>
          </div>
          <div><FieldLabel>Domene</FieldLabel><TextInput value={organization.domain} onChange={(value) => setOrgField('domain', value)} placeholder="Domene" /></div>
          <div><FieldLabel>Live URL</FieldLabel><TextInput value={organization.liveUrl} onChange={(value) => setOrgField('liveUrl', value)} placeholder="Live URL" /></div>
          <button type="button" disabled={saveState === 'saving'} onClick={saveOrganization} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.primary, color: brand.primaryText }}><Save size={16} /> {saveState === 'saving' ? 'Lagrer...' : 'Lagre organisasjon'}</button>
          <StatusMessage state={saveState} text={saveMessage} />
        </div>
      </Card>

      <Card title="Moduler" icon={Boxes}>
        <div className="space-y-2">
          {modules.map((mod) => <button key={mod.id} type="button" disabled={mod.locked} onClick={() => toggleModule(mod.id)} className="w-full rounded-xl border p-3 flex items-center justify-between text-left disabled:cursor-not-allowed" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mod.enabled ? mix(brand.primary, 5, '#FFFFFF') : '#FFFFFF' }}><div><p className="text-sm font-medium">{mod.name}</p><p className="text-[11px] opacity-50">{mod.locked ? 'Core · låst' : mod.enabled ? 'Aktiv' : 'Av'}</p></div><span className="relative inline-flex h-6 w-11 items-center rounded-full transition" style={{ backgroundColor: mod.enabled ? brand.primary : mix(brand.text, 18) }}><span className="inline-block h-5 w-5 transform rounded-full bg-white transition" style={{ transform: mod.enabled ? 'translateX(22px)' : 'translateX(2px)' }} /></span></button>)}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs opacity-50 pb-4"><ShieldCheck size={14} /> Kun superadmin/owner skal ha tilgang til dette området.</div>
    </div>
  );
}
