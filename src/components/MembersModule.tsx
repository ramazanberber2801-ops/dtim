import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Edit3, Loader2, Plus, Search, UserRound, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type MemberStatus = 'active' | 'inactive';

type PersonRow = {
  id: string;
  full_name: string;
  primary_email: string | null;
  primary_phone: string | null;
  profile_image_url: string | null;
};

type MembershipRow = {
  id: string;
  organization_id: string;
  person_id: string;
  member_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  join_date: string | null;
  status: MemberStatus;
  internal_role: string | null;
  internal_notes: string | null;
  people: PersonRow | PersonRow[] | null;
};

type Member = {
  membershipId: string;
  personId: string;
  fullName: string;
  memberNumber: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  status: MemberStatus;
  internalRole: string;
  internalNotes: string;
  profileImageUrl: string;
};

type MemberForm = Omit<Member, 'membershipId' | 'personId' | 'profileImageUrl'>;

const emptyForm: MemberForm = {
  fullName: '',
  memberNumber: '',
  email: '',
  phone: '',
  address: '',
  joinDate: '',
  status: 'active',
  internalRole: '',
  internalNotes: '',
};

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
  card: 'var(--brand-card)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

function relatedPerson(value: MembershipRow['people']): PersonRow | null {
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function normalizeMember(row: MembershipRow): Member {
  const person = relatedPerson(row.people);
  return {
    membershipId: row.id,
    personId: row.person_id,
    fullName: person?.full_name || 'Uten navn',
    memberNumber: row.member_number || '',
    email: row.email || person?.primary_email || '',
    phone: row.phone || person?.primary_phone || '',
    address: row.address || '',
    joinDate: row.join_date || '',
    status: row.status || 'active',
    internalRole: row.internal_role || '',
    internalNotes: row.internal_notes || '',
    profileImageUrl: person?.profile_image_url || '',
  };
}

function toForm(member: Member): MemberForm {
  return {
    fullName: member.fullName,
    memberNumber: member.memberNumber,
    email: member.email,
    phone: member.phone,
    address: member.address,
    joinDate: member.joinDate,
    status: member.status,
    internalRole: member.internalRole,
    internalNotes: member.internalNotes,
  };
}

export function MembersModule({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadMembers = async () => {
    if (!supabase) {
      setLoadError('Supabase er ikke konfigurert.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    const { data, error } = await supabase
      .from('organization_memberships')
      .select('id, organization_id, person_id, member_number, email, phone, address, join_date, status, internal_role, internal_notes, people(id, full_name, primary_email, primary_phone, profile_image_url)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      setLoadError(error.message.includes('organization_memberships')
        ? 'Medlemstabellene er ikke klare i Supabase ennå. Kjør Members-migrasjonen i SQL Editor.'
        : error.message);
      setMembers([]);
    } else {
      setMembers(((data || []) as MembershipRow[]).map(normalizeMember));
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadMembers();
  }, [organizationId]);

  const filteredMembers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (statusFilter !== 'all' && member.status !== statusFilter) return false;
      if (!needle) return true;
      return [member.fullName, member.memberNumber, member.email, member.phone]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [members, query, statusFilter]);

  const openCreate = () => {
    setEditingMember(null);
    setForm({ ...emptyForm, joinDate: new Date().toISOString().slice(0, 10) });
    setSaveError('');
    setEditorOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setForm(toForm(member));
    setSaveError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditingMember(null);
    setForm(emptyForm);
    setSaveError('');
  };

  const updateField = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const saveMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    const fullName = form.fullName.trim();
    if (!fullName) {
      setSaveError('Navn er obligatorisk.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const personPayload = {
        full_name: fullName,
        primary_email: form.email.trim() || null,
        primary_phone: form.phone.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const membershipPayload = {
        organization_id: organizationId,
        member_number: form.memberNumber.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        join_date: form.joinDate || null,
        status: form.status,
        internal_role: form.internalRole.trim() || null,
        internal_notes: form.internalNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingMember) {
        const { error: personError } = await supabase
          .from('people')
          .update(personPayload)
          .eq('id', editingMember.personId);
        if (personError) throw personError;

        const { error: membershipError } = await supabase
          .from('organization_memberships')
          .update(membershipPayload)
          .eq('id', editingMember.membershipId)
          .eq('organization_id', organizationId);
        if (membershipError) throw membershipError;
      } else {
        const { data: person, error: personError } = await supabase
          .from('people')
          .insert(personPayload)
          .select('id')
          .single();
        if (personError || !person) throw personError || new Error('Personen kunne ikke opprettes.');

        const { error: membershipError } = await supabase
          .from('organization_memberships')
          .insert({ ...membershipPayload, person_id: person.id });
        if (membershipError) throw membershipError;
      }

      closeEditor();
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Medlemmet kunne ikke lagres.';
      setSaveError(message.includes('member_number') ? 'Medlemsnummeret er allerede i bruk i denne organisasjonen.' : message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border p-5 shadow-sm" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16), color: brand.text }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] opacity-45">Kjernemodul</p>
            <h3 className="font-serif text-2xl">Medlemmer</h3>
            <p className="mt-1 text-sm opacity-60">{members.length} registrerte medlemskap i organisasjonen.</p>
          </div>
          <button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>
            <Plus size={17} /> Legg til medlem
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="flex items-center gap-2 rounded-xl border bg-white px-3" style={{ borderColor: mix(brand.primary, 18) }}>
            <Search size={16} className="opacity-45" />
            <input className="w-full bg-transparent py-3 text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søk navn, e-post, telefon eller medlemsnummer" />
          </label>
          <select className="rounded-xl border bg-white px-3 py-3 text-sm" style={{ borderColor: mix(brand.primary, 18) }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | MemberStatus)}>
            <option value="all">Alle statuser</option>
            <option value="active">Aktive</option>
            <option value="inactive">Inaktive</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-sm opacity-60" style={{ borderColor: mix(brand.primary, 14) }}><Loader2 size={18} className="animate-spin" /> Henter medlemmer...</div>
      ) : loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div><p className="text-sm font-semibold">Medlemsmodulen kan ikke laste data</p><p className="mt-1 text-xs leading-5">{loadError}</p></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: mix(brand.primary, 14) }}>
          <UserRound size={28} className="mx-auto opacity-30" />
          <p className="mt-3 text-sm font-medium">Ingen medlemmer funnet</p>
          <p className="mt-1 text-xs opacity-50">Legg til det første medlemmet eller endre søk/filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <button key={member.membershipId} type="button" onClick={() => openEdit(member)} className="flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm" style={{ borderColor: mix(brand.primary, 14), color: brand.text }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                {member.profileImageUrl ? <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" /> : <UserRound size={19} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{member.fullName}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{member.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span></div>
                <p className="mt-1 truncate text-xs opacity-50">{member.memberNumber || 'Uten medlemsnummer'} · {member.email || member.phone || 'Ingen kontaktinfo'}</p>
              </div>
              <Edit3 size={16} className="shrink-0 opacity-35" />
            </button>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" style={{ color: brand.text }}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Medlemmer</p><h3 className="font-serif text-2xl">{editingMember ? 'Rediger medlem' : 'Legg til medlem'}</h3></div>
              <button type="button" onClick={closeEditor} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5"><X size={18} /></button>
            </div>

            <form onSubmit={saveMember} className="mt-5 space-y-4">
              <div><label className="text-xs font-medium">Fullt navn *</label><input required className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium">Medlemsnummer</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.memberNumber} onChange={(event) => updateField('memberNumber', event.target.value)} /></div>
                <div><label className="text-xs font-medium">Status</label><select className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.status} onChange={(event) => updateField('status', event.target.value as MemberStatus)}><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></select></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium">E-post</label><input type="email" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></div>
                <div><label className="text-xs font-medium">Telefon</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></div>
              </div>
              <div><label className="text-xs font-medium">Adresse</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.address} onChange={(event) => updateField('address', event.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium">Innmeldingsdato</label><input type="date" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.joinDate} onChange={(event) => updateField('joinDate', event.target.value)} /></div>
                <div><label className="text-xs font-medium">Intern rolle</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.internalRole} onChange={(event) => updateField('internalRole', event.target.value)} placeholder="F.eks. frivillig" /></div>
              </div>
              <div><label className="text-xs font-medium">Interne notater</label><textarea rows={3} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.internalNotes} onChange={(event) => updateField('internalNotes', event.target.value)} /></div>

              {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}

              <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>
                {saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Lagrer...' : editingMember ? 'Lagre endringer' : 'Opprett medlem'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
