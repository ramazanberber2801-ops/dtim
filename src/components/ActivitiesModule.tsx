import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, AlertCircle, CalendarDays, Edit3, Loader2, MapPin, Plus, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ActivityStatus = 'draft' | 'published' | 'cancelled';

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
  status: ActivityStatus;
  publishedAt: string;
};

type ActivityForm = Omit<ActivityItem, 'id' | 'publishedAt'>;

const emptyForm: ActivityForm = {
  title: '',
  description: '',
  activityDate: '',
  startTime: '',
  endTime: '',
  location: '',
  capacity: '',
  status: 'draft',
};

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
  card: 'var(--brand-card)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const statusLabel = (status: ActivityStatus) =>
  status === 'published' ? 'Publisert' : status === 'cancelled' ? 'Avlyst' : 'Utkast';

const statusClass = (status: ActivityStatus) =>
  status === 'published'
    ? 'bg-green-100 text-green-700'
    : status === 'cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';

export function ActivitiesModule({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadItems = async () => {
    if (!supabase) {
      setLoadError('Supabase er ikke konfigurert.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    const { data, error } = await supabase
      .from('organization_activities')
      .select('id, title, description, activity_date, start_time, end_time, location, capacity, status, published_at')
      .eq('organization_id', organizationId)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      setItems([]);
      setLoadError(
        error.message.includes('organization_activities')
          ? 'Aktivitetstabellen er ikke klar i Supabase ennå. Kjør Activities-migrasjonen i SQL Editor.'
          : error.message,
      );
    } else {
      setItems((data || []).map((row) => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        activityDate: row.activity_date || '',
        startTime: row.start_time?.slice(0, 5) || '',
        endTime: row.end_time?.slice(0, 5) || '',
        location: row.location || '',
        capacity: row.capacity === null || row.capacity === undefined ? '' : String(row.capacity),
        status: row.status === 'published' || row.status === 'cancelled' ? row.status : 'draft',
        publishedAt: row.published_at || '',
      })));
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadItems();
  }, [organizationId]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!needle) return true;
      return [item.title, item.description, item.location].join(' ').toLowerCase().includes(needle);
    });
  }, [items, query, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, activityDate: new Date().toISOString().slice(0, 10) });
    setSaveError('');
    setEditorOpen(true);
  };

  const openEdit = (item: ActivityItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description,
      activityDate: item.activityDate,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      capacity: item.capacity,
      status: item.status,
    });
    setSaveError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setSaveError('');
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    if (!form.title.trim()) {
      setSaveError('Tittel er obligatorisk.');
      return;
    }

    if (!form.activityDate) {
      setSaveError('Dato er obligatorisk.');
      return;
    }

    const capacity = form.capacity.trim() === '' ? null : Number(form.capacity);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
      setSaveError('Kapasitet må være 0 eller et positivt heltall.');
      return;
    }

    setSaving(true);
    setSaveError('');

    const payload = {
      organization_id: organizationId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      activity_date: form.activityDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      location: form.location.trim() || null,
      capacity,
      status: form.status,
      published_at: form.status === 'published' ? (editingItem?.publishedAt || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('organization_activities')
          .update(payload)
          .eq('id', editingItem.id)
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('organization_activities').insert(payload);
        if (error) throw error;
      }

      setEditorOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
      await loadItems();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Aktiviteten kunne ikke lagres.');
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
            <h3 className="font-serif text-2xl">Aktiviteter</h3>
            <p className="mt-1 text-sm opacity-60">{items.length} aktiviteter i organisasjonen.</p>
          </div>
          <button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>
            <Plus size={17} /> Ny aktivitet
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="flex items-center gap-2 rounded-xl border bg-white px-3" style={{ borderColor: mix(brand.primary, 18) }}>
            <Search size={16} className="opacity-45" />
            <input className="w-full bg-transparent py-3 text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søk aktivitet eller sted" />
          </label>
          <select className="rounded-xl border bg-white px-3 py-3 text-sm" style={{ borderColor: mix(brand.primary, 18) }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ActivityStatus)}>
            <option value="all">Alle statuser</option>
            <option value="published">Publisert</option>
            <option value="draft">Utkast</option>
            <option value="cancelled">Avlyst</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-sm opacity-60" style={{ borderColor: mix(brand.primary, 14) }}><Loader2 size={18} className="animate-spin" /> Henter aktiviteter...</div>
      ) : loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertCircle size={19} className="mt-0.5 shrink-0" /><div><p className="text-sm font-semibold">Aktivitetsmodulen kan ikke laste data</p><p className="mt-1 text-xs leading-5">{loadError}</p></div></div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: mix(brand.primary, 14) }}><Activity size={28} className="mx-auto opacity-30" /><p className="mt-3 text-sm font-medium">Ingen aktiviteter funnet</p><p className="mt-1 text-xs opacity-50">Opprett den første aktiviteten eller endre søk/filter.</p></div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <button key={item.id} type="button" onClick={() => openEdit(item)} className="flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm" style={{ borderColor: mix(brand.primary, 14), color: brand.text }}>
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-semibold" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                <CalendarDays size={17} />
                <span>{item.activityDate ? item.activityDate.slice(8, 10) : '—'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{item.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></div>
                <p className="mt-1 truncate text-xs opacity-50">{item.activityDate}{item.startTime ? ` · ${item.startTime}` : ''}{item.location ? ` · ${item.location}` : ''}</p>
                {(item.capacity || item.description) && <p className="mt-1 truncate text-[11px] opacity-40">{item.capacity ? `Kapasitet ${item.capacity}` : item.description}</p>}
              </div>
              <Edit3 size={16} className="shrink-0 opacity-35" />
            </button>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" style={{ color: brand.text }}>
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Aktiviteter</p><h3 className="font-serif text-2xl">{editingItem ? 'Rediger aktivitet' : 'Ny aktivitet'}</h3></div><button type="button" onClick={closeEditor} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5"><X size={18} /></button></div>
            <form onSubmit={saveItem} className="mt-5 space-y-4">
              <div><label className="text-xs font-medium">Tittel *</label><input required className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} /></div>
              <div><label className="text-xs font-medium">Beskrivelse</label><textarea rows={5} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><label className="text-xs font-medium">Dato *</label><input required type="date" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.activityDate} onChange={(event) => setForm((previous) => ({ ...previous, activityDate: event.target.value }))} /></div>
                <div><label className="text-xs font-medium">Start</label><input type="time" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.startTime} onChange={(event) => setForm((previous) => ({ ...previous, startTime: event.target.value }))} /></div>
                <div><label className="text-xs font-medium">Slutt</label><input type="time" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.endTime} onChange={(event) => setForm((previous) => ({ ...previous, endTime: event.target.value }))} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium">Sted</label><div className="relative mt-1"><MapPin size={15} className="absolute left-3 top-3.5 opacity-35" /><input className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm" value={form.location} onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))} /></div></div>
                <div><label className="text-xs font-medium">Kapasitet</label><div className="relative mt-1"><Users size={15} className="absolute left-3 top-3.5 opacity-35" /><input type="number" min="0" className="w-full rounded-xl border py-3 pl-9 pr-3 text-sm" value={form.capacity} onChange={(event) => setForm((previous) => ({ ...previous, capacity: event.target.value }))} /></div></div>
              </div>
              <div><label className="text-xs font-medium">Status</label><select className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.status} onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value as ActivityStatus }))}><option value="draft">Utkast</option><option value="published">Publisert</option><option value="cancelled">Avlyst</option></select></div>
              {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}
              <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Lagrer...' : editingItem ? 'Lagre endringer' : 'Opprett aktivitet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
