import { useMemo, useState } from 'react';
import {
  Building2,
  Boxes,
  Brush,
  ChevronDown,
  Cloud,
  CreditCard,
  ExternalLink,
  Github,
  LayoutDashboard,
  Palette,
  Plus,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  X,
} from 'lucide-react';

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
  primaryText: 'var(--brand-primary-text)',
  secondaryText: 'var(--brand-secondary-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const defaultModules = [
  { id: 'news', name: 'Nyheter', type: 'Core', status: 'Inkludert', enabled: true, locked: true },
  { id: 'events', name: 'Aktiviteter', type: 'Core', status: 'Inkludert', enabled: true, locked: true },
  { id: 'contact', name: 'Kontakt', type: 'Core', status: 'Inkludert', enabled: true, locked: true },
  { id: 'donation', name: 'Donasjon', type: 'Tillegg', status: 'Aktiv', enabled: true, locked: false },
  { id: 'push', name: 'Push-varsler', type: 'Tillegg', status: 'Aktiv', enabled: true, locked: false },
  { id: 'members', name: 'Medlemsregister', type: 'Premium', status: 'Planlagt', enabled: false, locked: false },
  { id: 'prayer', name: 'Bønnetider', type: 'Religiøs', status: 'Av', enabled: false, locked: false },
  { id: 'member-card', name: 'Digitalt medlemskort', type: 'Fremtidig', status: 'Planlagt', enabled: false, locked: false },
];

type Organization = {
  id: string;
  name: string;
  type: 'Moské' | 'Forening' | 'Kirke' | 'Idrettslag' | 'Kultur' | 'Annen';
  country: string;
  status: 'Aktiv' | 'Prøve' | 'Frosset';
  hosting: 'Managed' | 'Self Hosted';
  domain: string;
  liveUrl: string;
  vercelUrl: string;
  supabaseUrl: string;
  githubUrl: string;
  adminCount: number;
  memberCount: number;
  onboardingStep: 'Bestilling' | 'Oppsett' | 'Testing' | 'Klar';
};

const defaultOrganizations: Organization[] = [
  {
    id: 'yasaflow',
    name: 'Yasaflow Demo',
    type: 'Moské',
    country: 'Norge',
    status: 'Aktiv',
    hosting: 'Managed',
    domain: 'yasaflow.vercel.app',
    liveUrl: '/',
    vercelUrl: '',
    supabaseUrl: '',
    githubUrl: 'https://github.com/ramazanberber2801-ops/dtim',
    adminCount: 1,
    memberCount: 0,
    onboardingStep: 'Testing',
  },
];

const emptyOrganization: Organization = {
  id: '',
  name: '',
  type: 'Forening',
  country: 'Norge',
  status: 'Prøve',
  hosting: 'Managed',
  domain: '',
  liveUrl: '',
  vercelUrl: '',
  supabaseUrl: '',
  githubUrl: '',
  adminCount: 1,
  memberCount: 0,
  onboardingStep: 'Bestilling',
};

const roadmap = [
  'Koble organisasjoner til Supabase',
  'Lagre moduler per organisasjon',
  'Velg branding per organisasjon',
  'Opprett første administrator automatisk',
  'Bygg selvbetjent bestillingsside',
  'Koble betaling og abonnement',
];

function OwnerCard({ title, value, icon: Icon, note }: any) {
  return (
    <div className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-50">{title}</p>
          <p className="font-serif text-2xl mt-1">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
          <Icon size={20} />
        </div>
      </div>
      {note && <p className="text-xs opacity-55 mt-3">{note}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: any) {
  return (
    <section className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
          <Icon size={18} />
        </div>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function OwnerInput({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (value: string) => void; placeholder: string; type?: string }) {
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

function OwnerSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      className="px-4 py-3 rounded-xl border bg-white text-sm"
      style={{ borderColor: mix(brand.primary, 22), color: brand.text }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function StatusPill({ label }: { label: string }) {
  const isReady = label === 'Klar' || label === 'Aktiv';
  return (
    <span
      className="text-[10px] uppercase px-2 py-1 rounded-full font-semibold"
      style={{ backgroundColor: isReady ? mix(brand.primary, 14) : mix(brand.text, 8), color: isReady ? brand.primary : mix(brand.text, 60) }}
    >
      {label}
    </span>
  );
}

export function OwnerPanel() {
  const [modules, setModules] = useState(defaultModules);
  const [organizations, setOrganizations] = useState<Organization[]>(defaultOrganizations);
  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrganizations[0].id);
  const [form, setForm] = useState<Organization>(defaultOrganizations[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Alle' | Organization['status']>('Alle');
  const [hostingFilter, setHostingFilter] = useState<'Alle' | Organization['hosting']>('Alle');

  const activeModules = useMemo(() => modules.filter((mod) => mod.enabled).length, [modules]);
  const totalAdmins = useMemo(() => organizations.reduce((sum, org) => sum + org.adminCount, 0), [organizations]);
  const totalMembers = useMemo(() => organizations.reduce((sum, org) => sum + org.memberCount, 0), [organizations]);
  const selectedOrg = organizations.find((org) => org.id === selectedOrgId) || organizations[0];

  const filteredOrganizations = useMemo(() => {
    const query = orgSearch.trim().toLowerCase();
    return organizations.filter((org) => {
      const haystack = [org.name, org.domain, org.type, org.country, org.hosting, org.status, org.onboardingStep].join(' ').toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = statusFilter === 'Alle' || org.status === statusFilter;
      const matchesHosting = hostingFilter === 'Alle' || org.hosting === hostingFilter;
      return matchesSearch && matchesStatus && matchesHosting;
    });
  }, [organizations, orgSearch, statusFilter, hostingFilter]);

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((mod) =>
        mod.id === id && !mod.locked
          ? { ...mod, enabled: !mod.enabled, status: !mod.enabled ? 'Aktiv' : 'Av' }
          : mod
      )
    );
  };

  const selectOrganization = (org: Organization) => {
    setSelectedOrgId(org.id);
    setForm(org);
    setSelectorOpen(false);
    setOrgSearch('');
  };

  const newOrganization = () => {
    const id = `org-${Date.now()}`;
    const org = { ...emptyOrganization, id, name: 'Ny organisasjon' };
    setOrganizations((prev) => [...prev, org]);
    setSelectedOrgId(id);
    setForm(org);
    setSelectorOpen(false);
  };

  const saveOrganization = () => {
    const cleanName = form.name.trim() || 'Uten navn';
    const cleanId = form.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
    const cleanOrg = { ...form, id: cleanId, name: cleanName };
    setOrganizations((prev) => prev.map((org) => (org.id === selectedOrgId ? cleanOrg : org)));
    setSelectedOrgId(cleanOrg.id);
    setForm(cleanOrg);
  };

  const quickLinks = [
    { label: 'Live app', url: selectedOrg?.liveUrl || '/', icon: ExternalLink, note: selectedOrg?.domain || 'Åpner aktiv app' },
    { label: 'GitHub repo', url: selectedOrg?.githubUrl || '', icon: Github, note: 'Kodebase' },
    { label: 'Vercel project', url: selectedOrg?.vercelUrl || '', icon: Rocket, note: 'Deployment' },
    { label: 'Supabase project', url: selectedOrg?.supabaseUrl || '', icon: Server, note: 'Database' },
  ];

  return (
    <div className="p-4 space-y-5" style={{ color: brand.text }}>
      <div className="rounded-3xl p-5 shadow-sm border-2 overflow-hidden relative" style={{ backgroundColor: brand.secondary, color: brand.secondaryText, borderColor: mix(brand.primary, 24) }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-25" style={{ backgroundColor: brand.primary }} />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 25), color: brand.primary }}>
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs opacity-65">Yasaflow</p>
              <h2 className="font-serif text-2xl leading-tight">Owner Dashboard</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="w-full rounded-2xl border px-4 py-3 text-left flex items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.14)' }}
          >
            <div>
              <p className="text-[10px] uppercase opacity-55">Aktiv organisasjon</p>
              <p className="font-serif text-xl">{selectedOrg?.name || 'Velg organisasjon'}</p>
              <p className="text-xs opacity-65">{selectedOrg?.type} · {selectedOrg?.country} · {selectedOrg?.status} · {activeModules} moduler</p>
            </div>
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {selectorOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-lg max-h-[82vh] rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ color: brand.text }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: mix(brand.primary, 18) }}>
              <div>
                <p className="text-xs opacity-50">Yasaflow Owner</p>
                <h3 className="font-serif text-xl">Velg organisasjon</h3>
              </div>
              <button type="button" onClick={() => setSelectorOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 10) }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45" />
                <input
                  autoFocus
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: mix(brand.primary, 22), color: brand.text }}
                  placeholder="Søk navn, type, land, domene eller status..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <OwnerSelect value={statusFilter} onChange={(value) => setStatusFilter(value as any)}>
                  <option>Alle</option>
                  <option>Aktiv</option>
                  <option>Prøve</option>
                  <option>Frosset</option>
                </OwnerSelect>
                <OwnerSelect value={hostingFilter} onChange={(value) => setHostingFilter(value as any)}>
                  <option>Alle</option>
                  <option>Managed</option>
                  <option>Self Hosted</option>
                </OwnerSelect>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-2 overflow-y-auto max-h-[42vh]">
              {filteredOrganizations.length === 0 ? (
                <div className="rounded-2xl border p-6 text-center text-sm opacity-60" style={{ borderColor: mix(brand.primary, 18) }}>Ingen treff.</div>
              ) : (
                filteredOrganizations.map((org) => {
                  const active = org.id === selectedOrgId;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => selectOrganization(org)}
                      className="w-full rounded-2xl border p-3 text-left"
                      style={{ borderColor: active ? brand.primary : mix(brand.primary, 16), backgroundColor: active ? mix(brand.primary, 8, '#FFFFFF') : '#FFFFFF' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-serif text-base truncate">{org.name}</p>
                          <p className="text-xs opacity-50 truncate">{org.type} · {org.country} · {org.domain || 'Ingen domene'}</p>
                          <p className="text-[11px] opacity-45 mt-1">{org.adminCount} admin · {org.memberCount} medlemmer · {org.onboardingStep}</p>
                        </div>
                        <StatusPill label={org.status} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: mix(brand.primary, 18) }}>
              <button type="button" onClick={newOrganization} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: brand.primary, color: brand.primaryText }}>
                <Plus size={16} /> Ny organisasjon
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <OwnerCard title="Organisasjoner" value={organizations.length} icon={Building2} note={`Valgt: ${selectedOrg?.name || 'Ingen'}`} />
        <OwnerCard title="Administratorer" value={totalAdmins} icon={UserCog} note="Første admin opprettes senere automatisk." />
        <OwnerCard title="Medlemmer" value={totalMembers} icon={Users} note="Kobles til medlemsmodul senere." />
        <OwnerCard title="Aktive moduler" value={activeModules} icon={Boxes} note="Core + valgte tillegg." />
      </div>

      <SectionCard title="Rediger organisasjon" icon={Building2}>
        <div className="space-y-3">
          <OwnerInput value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="Organisasjonsnavn" />
          <div className="grid grid-cols-2 gap-3">
            <OwnerSelect value={form.type} onChange={(value) => setForm((prev) => ({ ...prev, type: value as Organization['type'] }))}>
              <option>Moské</option>
              <option>Forening</option>
              <option>Kirke</option>
              <option>Idrettslag</option>
              <option>Kultur</option>
              <option>Annen</option>
            </OwnerSelect>
            <OwnerInput value={form.country} onChange={(value) => setForm((prev) => ({ ...prev, country: value }))} placeholder="Land" />
          </div>
          <OwnerInput value={form.domain} onChange={(value) => setForm((prev) => ({ ...prev, domain: value }))} placeholder="Domene eller subdomene" />
          <OwnerInput value={form.liveUrl} onChange={(value) => setForm((prev) => ({ ...prev, liveUrl: value }))} placeholder="Live app URL" />
          <OwnerInput value={form.vercelUrl} onChange={(value) => setForm((prev) => ({ ...prev, vercelUrl: value }))} placeholder="Vercel project URL" />
          <OwnerInput value={form.supabaseUrl} onChange={(value) => setForm((prev) => ({ ...prev, supabaseUrl: value }))} placeholder="Supabase project URL" />
          <OwnerInput value={form.githubUrl} onChange={(value) => setForm((prev) => ({ ...prev, githubUrl: value }))} placeholder="GitHub repo URL" />

          <div className="grid grid-cols-2 gap-3">
            <OwnerSelect value={form.hosting} onChange={(value) => setForm((prev) => ({ ...prev, hosting: value as Organization['hosting'] }))}>
              <option>Managed</option>
              <option>Self Hosted</option>
            </OwnerSelect>
            <OwnerSelect value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value as Organization['status'] }))}>
              <option>Aktiv</option>
              <option>Prøve</option>
              <option>Frosset</option>
            </OwnerSelect>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <OwnerInput type="number" value={form.adminCount} onChange={(value) => setForm((prev) => ({ ...prev, adminCount: Number(value) || 0 }))} placeholder="Admin" />
            <OwnerInput type="number" value={form.memberCount} onChange={(value) => setForm((prev) => ({ ...prev, memberCount: Number(value) || 0 }))} placeholder="Medlemmer" />
            <OwnerSelect value={form.onboardingStep} onChange={(value) => setForm((prev) => ({ ...prev, onboardingStep: value as Organization['onboardingStep'] }))}>
              <option>Bestilling</option>
              <option>Oppsett</option>
              <option>Testing</option>
              <option>Klar</option>
            </OwnerSelect>
          </div>

          <button type="button" onClick={saveOrganization} className="w-full py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: brand.primary, color: brand.primaryText }}>
            Lagre organisasjon
          </button>
          <p className="text-xs opacity-50">Denne versjonen lagres lokalt i Owner-panelet. Neste steg er Supabase-tabell.</p>
        </div>
      </SectionCard>

      <SectionCard title="Drift-lenker" icon={ExternalLink}>
        <div className="space-y-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const disabled = !link.url;
            const content = (
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: disabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-[11px] opacity-50">{link.note}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase opacity-50">{disabled ? 'Ikke satt' : 'Åpne'}</span>
              </div>
            );

            return disabled ? <div key={link.label} className="opacity-75">{content}</div> : <a key={link.label} href={link.url} target={link.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">{content}</a>;
          })}
        </div>
      </SectionCard>

      <SectionCard title="Modulbibliotek" icon={Boxes}>
        <div className="space-y-2">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: mix(brand.primary, 16), backgroundColor: mod.enabled ? mix(brand.primary, 4, '#FFFFFF') : '#FFFFFF' }}>
              <button type="button" onClick={() => toggleModule(mod.id)} disabled={mod.locked} className="flex flex-1 items-center justify-between gap-3 text-left disabled:cursor-not-allowed">
                <div>
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="text-[11px] opacity-50">{mod.type}{mod.locked ? ' · låst core' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill label={mod.status} />
                  <span className="relative inline-flex h-6 w-11 items-center rounded-full transition" style={{ backgroundColor: mod.enabled ? brand.primary : mix(brand.text, 18) }}>
                    <span className="inline-block h-5 w-5 transform rounded-full bg-white transition" style={{ transform: mod.enabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-3">Neste steg er å lagre modulene per valgt organisasjon i Supabase.</p>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title="Branding" icon={Palette}>
          <p className="text-sm opacity-65 mb-3">Logo, farger, splash og app-ikon per organisasjon.</p>
          <div className="flex gap-2">
            {[brand.primary, brand.secondary, brand.background, brand.text].map((color, index) => (
              <div key={index} className="w-9 h-9 rounded-full border" style={{ backgroundColor: color, borderColor: mix(brand.primary, 25) }} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Themes & Layouts" icon={Brush}>
          <p className="text-sm opacity-65 mb-3">Arkitektur for Standard, Modern, Tech, Classic og Dashboard-layout.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Standard', 'Modern', 'Tech', 'Dashboard'].map((item) => (
              <span key={item} className="rounded-lg border px-3 py-2" style={{ borderColor: mix(brand.primary, 18) }}>{item}</span>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Pakker og abonnement" icon={CreditCard}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Lisens + grunnpakke</span><span className="opacity-55">Senere</span></div>
          <div className="flex justify-between"><span>Modulpriser</span><span className="opacity-55">Etter MVP</span></div>
          <div className="flex justify-between"><span>Self Hosted / Managed</span><span className="opacity-55">Enterprise senere</span></div>
          <div className="flex justify-between"><span>Automatisk betaling</span><span className="opacity-55">Senere</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Neste milepæler" icon={LayoutDashboard}>
        <div className="space-y-2">
          {roadmap.map((item, index) => (
            <div key={item} className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>{index + 1}</div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 text-xs opacity-50 pb-4">
        <ShieldCheck size={14} /> Kun superadmin/owner skal ha tilgang til dette området.
      </div>
    </div>
  );
}
