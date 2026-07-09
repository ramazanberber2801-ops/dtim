import { useMemo, useState, type ReactNode } from 'react';
import {
  Building2,
  Boxes,
  CheckCircle2,
  Crown,
  Image as ImageIcon,
  Mail,
  Palette,
  Plus,
  Rocket,
  Save,
  Send,
  Server,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
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
  logoUrl: string;
  themeId: string;
  adminName: string;
  adminEmail: string;
  memberCount: number;
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
  id: 'yasaflow',
  name: 'Yasaflow Demo',
  type: 'Moské',
  country: 'Norge',
  language: 'Tyrkisk',
  status: 'Aktiv',
  hosting: 'Managed',
  domain: 'yasaflow.vercel.app',
  liveUrl: '/',
  logoUrl: '',
  themeId: 'classic-mosque',
  adminName: 'Owner Admin',
  adminEmail: '',
  memberCount: 0,
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
  { id: 'ayet-hadis', name: 'Ayet / Hadis', status: 'Av', enabled: false, locked: false },
];

function Card({ children, title, icon: Icon }: { children: ReactNode; title?: string; icon?: any }) {
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={18} /></div>}
          <h3 className="font-serif text-lg">{title}</h3>
        </div>
      )}
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wide opacity-45 mb-1">{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <input
      type={type}
      className="w-full px-4 py-3 rounded-xl border bg-white text-sm"
      style={{ borderColor: mix(brand.primary, 22), color: brand.text }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <select
      className="w-full px-4 py-3 rounded-xl border bg-white text-sm"
      style={{ borderColor: mix(brand.primary, 22), color: brand.text }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: mix(brand.primary, 18) }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase opacity-45">{label}</p>
          <p className="font-serif text-xl">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><Icon size={18} /></div>
      </div>
    </div>
  );
}

function StatusMessage({ type, text }: { type: 'idle' | 'saving' | 'success' | 'error' | 'sending' | 'sent'; text: string }) {
  if (!text) return null;
  const danger = type === 'error';
  const success = type === 'success' || type === 'sent';
  return (
    <p className="text-xs rounded-xl px-3 py-2" style={{ backgroundColor: danger ? '#fee2e2' : success ? mix(brand.primary, 10, '#FFFFFF') : mix(brand.text, 6, '#FFFFFF'), color: danger ? '#b91c1c' : brand.text }}>
      {text}
    </p>
  );
}

export function OwnerPanel() {
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

  const cleanOrganization = () => {
    const cleanName = organization.name.trim() || 'Uten navn';
    const id = organization.id.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
    return { ...organization, id, name: cleanName };
  };

  const persistOrganization = async () => {
    const org = cleanOrganization();
    setOrganization(org);

    if (!supabase) {
      return org;
    }

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
      logo_url: org.logoUrl || null,
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
      setSaveMessage(supabase ? 'Organisasjonen er lagret i Supabase.' : 'Lagret lokalt. Supabase er ikke konfigurert.');
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
      setInviteMessage('Supabase er ikke konfigurert i miljøet.');
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
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        throw new Error(String(data.error));
      }

      setInviteState('sent');
      setInviteMessage(`Invitasjon sendt til ${email}.`);
      setSaveState('success');
      setSaveMessage('Admin-invitasjonen er sendt og onboarding-status er oppdatert.');
    } catch (error) {
      setInviteState('error');
      setInviteMessage(error instanceof Error ? error.message : 'Kunne ikke sende invitasjon.');
    }
  };

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((mod) => {
      if (mod.id !== id || mod.locked) return mod;
      const enabled = !mod.enabled;
      return { ...mod, enabled, status: enabled ? 'Aktiv' : 'Av' };
    }));
  };

  const newOrganization = () => {
    setOrganization({ ...defaultOrganization, id: `org-${Date.now()}`, name: 'Ny organisasjon', adminName: '', adminEmail: '', memberCount: 0, status: 'Prøve', onboardingStep: 'Bestilling' });
    setInviteState('idle');
    setInviteMessage('');
    setSaveState('idle');
    setSaveMessage('');
  };

  return (
    <div className="p-4 space-y-5" style={{ color: brand.text }}>
      <div className="rounded-3xl p-5 border-2 shadow-sm" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}><Crown size={20} /></div>
            <div>
              <p className="text-xs opacity-65">Yasaflow</p>
              <h2 className="font-serif text-2xl leading-tight">Owner Dashboard</h2>
              <p className="text-[11px] opacity-60">OwnerPanel v2.2 admin invite</p>
            </div>
          </div>
          <button type="button" onClick={newOrganization} className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5" style={{ backgroundColor: mix(brand.primary, 25), color: brand.secondaryText }}><Plus size={14} /> Ny</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Organisasjon" value={organization.name} icon={Building2} />
        <StatCard label="Aktive moduler" value={activeModules} icon={Boxes} />
        <StatCard label="Admin" value={organization.adminEmail ? 'Klar' : 'Mangler'} icon={UserCog} />
        <StatCard label="Status" value={inviteState === 'sent' ? 'Invitert' : organization.status} icon={CheckCircle2} />
      </div>

      <Card title="Admin-invitasjon" icon={Mail}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Admin navn</FieldLabel>
            <TextInput value={organization.adminName} onChange={(value) => setOrgField('adminName', value)} placeholder="Første administrator" />
          </div>
          <div>
            <FieldLabel>Admin e-post</FieldLabel>
            <TextInput type="email" value={organization.adminEmail} onChange={(value) => { setOrgField('adminEmail', value); setInviteState('idle'); setInviteMessage(''); }} placeholder="admin@organisasjon.no" />
          </div>
          <button type="button" disabled={inviteState === 'sending' || !organization.adminEmail.trim()} onClick={inviteAdministrator} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.secondary, color: brand.secondaryText }}>
            <Send size={16} /> {inviteState === 'sending' ? 'Sender invitasjon...' : inviteState === 'sent' ? 'Invitasjon sendt' : 'Inviter administrator'}
          </button>
          <StatusMessage type={inviteState} text={inviteMessage} />
          <p className="text-xs opacity-50">Invitasjonen sendes via Supabase Edge Function. Organisasjonen lagres automatisk før e-posten sendes.</p>
        </div>
      </Card>

      <Card title="Organisasjon" icon={Building2}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Organisasjonsnavn</FieldLabel>
            <TextInput value={organization.name} onChange={(value) => setOrgField('name', value)} placeholder="Organisasjonsnavn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Type</FieldLabel>
              <SelectInput value={organization.type} onChange={(value) => setOrgField('type', value)}>
                <option>Moské</option>
                <option>Forening</option>
                <option>Kirke</option>
                <option>Idrettslag</option>
                <option>Kultur</option>
                <option>Annen</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Land</FieldLabel>
              <TextInput value={organization.country} onChange={(value) => setOrgField('country', value)} placeholder="Land" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Språk</FieldLabel>
              <SelectInput value={organization.language} onChange={(value) => setOrgField('language', value)}>
                <option>Norsk</option>
                <option>Tyrkisk</option>
                <option>Engelsk</option>
                <option>Arabisk</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <SelectInput value={organization.status} onChange={(value) => setOrgField('status', value)}>
                <option>Aktiv</option>
                <option>Prøve</option>
                <option>Frosset</option>
              </SelectInput>
            </div>
          </div>
          <div>
            <FieldLabel>Domene</FieldLabel>
            <TextInput value={organization.domain} onChange={(value) => setOrgField('domain', value)} placeholder="domene eller subdomene" />
          </div>
          <div>
            <FieldLabel>Live URL</FieldLabel>
            <TextInput value={organization.liveUrl} onChange={(value) => setOrgField('liveUrl', value)} placeholder="https://..." />
          </div>
          <button type="button" disabled={saveState === 'saving'} onClick={saveOrganization} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: brand.primary, color: brand.primaryText }}>
            <Save size={16} /> {saveState === 'saving' ? 'Lagrer...' : 'Lagre organisasjon'}
          </button>
          <StatusMessage type={saveState} text={saveMessage} />
        </div>
      </Card>

      <Card title="Logo og tema" icon={Palette}>
        <div className="space-y-3">
          <div className="grid grid-cols-[56px_1fr] gap-3 items-center">
            <div className="w-14 h-14 rounded-2xl border flex items-center justify-center overflow-hidden" style={{ borderColor: mix(brand.primary, 22), backgroundColor: mix(brand.primary, 6, '#FFFFFF') }}>
              {organization.logoUrl ? <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon size={20} style={{ color: brand.primary }} />}
            </div>
            <div>
              <FieldLabel>Logo URL</FieldLabel>
              <TextInput value={organization.logoUrl} onChange={(value) => setOrgField('logoUrl', value)} placeholder="Logo URL" />
            </div>
          </div>
          <div>
            <FieldLabel>Standardtema</FieldLabel>
            <SelectInput value={organization.themeId} onChange={(value) => setOrgField('themeId', value)}>
              <option value="classic-mosque">Classic Mosque</option>
              <option value="modern-community">Modern Community</option>
              <option value="green-trust">Green Trust</option>
              <option value="blue-civic">Blue Civic</option>
            </SelectInput>
          </div>
        </div>
      </Card>

      <Card title="Moduler" icon={Boxes}>
        <div className="space-y-2">
          {modules.map((mod) => (
            <button key={mod.id} type="button" disabled={mod.locked} onClick={() => toggleModule(mod.id)} className="w-full rounded-xl border p-3 flex items-center justify-between text-left disabled:cursor-not-allowed" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mod.enabled ? mix(brand.primary, 5, '#FFFFFF') : '#FFFFFF' }}>
              <div>
                <p className="text-sm font-medium">{mod.name}</p>
                <p className="text-[11px] opacity-50">{mod.locked ? 'Core · låst' : mod.enabled ? 'Aktiv' : 'Av'}</p>
              </div>
              <span className="relative inline-flex h-6 w-11 items-center rounded-full transition" style={{ backgroundColor: mod.enabled ? brand.primary : mix(brand.text, 18) }}>
                <span className="inline-block h-5 w-5 transform rounded-full bg-white transition" style={{ transform: mod.enabled ? 'translateX(22px)' : 'translateX(2px)' }} />
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Drift" icon={Server}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Hosting</p><p>{organization.hosting}</p></div>
          <div className="rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Onboarding</p><p>{organization.onboardingStep}</p></div>
          <div className="rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Vercel</p><p>Senere</p></div>
          <div className="rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 18) }}><p className="text-[10px] uppercase opacity-45">Supabase</p><p>Aktiv</p></div>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs opacity-50 pb-4">
        <ShieldCheck size={14} /> Kun superadmin/owner skal ha tilgang til dette området.
      </div>
    </div>
  );
}
