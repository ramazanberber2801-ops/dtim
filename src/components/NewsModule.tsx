import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, BellRing, Edit3, Loader2, Newspaper, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../lib/pushNotifications';

type NewsStatus = 'draft' | 'published';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  status: NewsStatus;
  publishedAt: string;
};

type NewsForm = Omit<NewsItem, 'id' | 'publishedAt'>;

const emptyForm: NewsForm = { title: '', summary: '', content: '', imageUrl: '', status: 'draft' };
const brand = { primary: 'var(--brand-primary)', text: 'var(--brand-text)', card: 'var(--brand-card)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const newsPushBody = (item: Pick<NewsItem, 'summary' | 'content'>) =>
  item.summary.trim() || item.content.trim() || 'En ny nyhet er publisert i appen.';

export function NewsModule({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NewsStatus>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [sendPush, setSendPush] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [actionId, setActionId] = useState('');

  const loadItems = async () => {
    if (!supabase) {
      setLoadError('Supabase er ikke konfigurert.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase
      .from('organization_news')
      .select('id, title, summary, content, image_url, status, published_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) {
      setItems([]);
      setLoadError(error.message.includes('organization_news') ? 'Nyhetstabellen er ikke klar i Supabase ennå.' : error.message);
    } else {
      setItems((data || []).map((row) => ({
        id: row.id,
        title: row.title || '',
        summary: row.summary || '',
        content: row.content || '',
        imageUrl: row.image_url || '',
        status: row.status === 'published' ? 'published' : 'draft',
        publishedAt: row.published_at || '',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { void loadItems(); }, [organizationId]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return !needle || [item.title, item.summary, item.content].join(' ').toLowerCase().includes(needle);
    });
  }, [items, query, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setSendPush(true);
    setSaveError('');
    setEditorOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditingItem(item);
    setForm({ title: item.title, summary: item.summary, content: item.content, imageUrl: item.imageUrl, status: item.status });
    setSendPush(false);
    setSaveError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setSendPush(false);
    setSaveError('');
  };

  const sendItemPush = async (item: Pick<NewsItem, 'title' | 'summary' | 'content'>) => {
    await sendPushNotification({ title: `Nyhet: ${item.title}`, body: newsPushBody(item) });
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const title = form.title.trim();
    if (!title) return setSaveError('Tittel er obligatorisk.');

    setSaving(true);
    setSaveError('');
    const publishedAt = form.status === 'published' ? (editingItem?.publishedAt || new Date().toISOString()) : '';
    const payload = {
      organization_id: organizationId,
      title,
      summary: form.summary.trim() || null,
      content: form.content.trim() || null,
      image_url: form.imageUrl.trim() || null,
      status: form.status,
      published_at: publishedAt || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingItem) {
        const { error } = await supabase.from('organization_news').update(payload).eq('id', editingItem.id).eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('organization_news').insert(payload);
        if (error) throw error;
      }
      if (sendPush) await sendItemPush({ title, summary: form.summary, content: form.content });
      closeEditor();
      await loadItems();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Nyheten kunne ikke lagres.');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: NewsItem) => {
    if (!supabase || !window.confirm(`Slette nyheten «${item.title}»?`)) return;
    setActionId(item.id);
    const { error } = await supabase.from('organization_news').delete().eq('id', item.id).eq('organization_id', organizationId);
    setActionId('');
    if (error) return alert('Nyheten kunne ikke slettes: ' + error.message);
    await loadItems();
  };

  const resendPush = async (item: NewsItem) => {
    setActionId(item.id);
    try {
      const result = await sendItemPush(item);
      void result;
      alert('Push-varselet ble sendt på nytt.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Push-varselet kunne ikke sendes.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border p-5 shadow-sm" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16), color: brand.text }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Kjernemodul</p><h3 className="font-serif text-2xl">Nyheter</h3><p className="mt-1 text-sm opacity-60">{items.length} nyheter i organisasjonen.</p></div>
          <button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}><Plus size={17} /> Ny nyhet</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="flex items-center gap-2 rounded-xl border bg-white px-3" style={{ borderColor: mix(brand.primary, 18) }}><Search size={16} className="opacity-45" /><input className="w-full bg-transparent py-3 text-sm outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søk i nyheter" /></label>
          <select className="rounded-xl border bg-white px-3 py-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | NewsStatus)}><option value="all">Alle statuser</option><option value="published">Publisert</option><option value="draft">Utkast</option></select>
        </div>
      </section>

      {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-sm opacity-60"><Loader2 size={18} className="animate-spin" /> Henter nyheter...</div>
      : loadError ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertCircle size={19} /><div><p className="text-sm font-semibold">Nyhetsmodulen kan ikke laste data</p><p className="mt-1 text-xs">{loadError}</p></div></div>
      : filteredItems.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><Newspaper size={28} className="mx-auto opacity-30" /><p className="mt-3 text-sm font-medium">Ingen nyheter funnet</p></div>
      : <div className="space-y-2">{filteredItems.map((item) => (
        <article key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 14), color: brand.text }}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Newspaper size={19} />}</div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{item.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'published' ? 'Publisert' : 'Utkast'}</span></div><p className="mt-1 line-clamp-2 text-xs opacity-50">{item.summary || item.content || 'Ingen sammendrag'}</p></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: mix(brand.primary, 12) }}>
            <button type="button" onClick={() => openEdit(item)} className="flex items-center justify-center gap-1 rounded-lg bg-black/5 px-2 py-2 text-xs"><Edit3 size={14} /> Rediger</button>
            <button type="button" disabled={actionId === item.id} onClick={() => void deleteItem(item)} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-2 text-xs text-red-700 disabled:opacity-50"><Trash2 size={14} /> Slett</button>
            <button type="button" disabled={actionId === item.id} onClick={() => void resendPush(item)} className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs disabled:opacity-50" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}><BellRing size={14} /> Push igjen</button>
          </div>
        </article>
      ))}</div>}

      {editorOpen && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" style={{ color: brand.text }}>
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] opacity-45">Nyheter</p><h3 className="font-serif text-2xl">{editingItem ? 'Rediger nyhet' : 'Ny nyhet'}</h3></div><button type="button" onClick={closeEditor} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5"><X size={18} /></button></div>
        <form onSubmit={saveItem} className="mt-5 space-y-4">
          <div><label className="text-xs font-medium">Tittel *</label><input required className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div><label className="text-xs font-medium">Sammendrag</label><input className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} /></div>
          <div><label className="text-xs font-medium">Innhold</label><textarea rows={7} className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} /></div>
          <div><label className="text-xs font-medium">Bilde-URL</label><input type="url" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} /></div>
          <div><label className="text-xs font-medium">Status</label><select className="mt-1 w-full rounded-xl border px-3 py-3 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as NewsStatus }))}><option value="draft">Utkast</option><option value="published">Publisert</option></select></div>
          <label className="flex items-start gap-3 rounded-xl border bg-amber-50 p-3"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} /><span><span className="block text-sm font-medium">Send push-varsel</span><span className="block text-xs opacity-60">{editingItem ? 'Av som standard ved redigering. Slå på bare når du ønsker nytt varsel.' : 'Slå av dersom nyheten skal lagres uten varsel.'}</span></span></label>
          {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}
          <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: brand.primary, color: 'var(--brand-primary-text)' }}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Lagrer...' : editingItem ? 'Lagre endringer' : 'Opprett nyhet'}</button>
        </form>
      </div></div>}
    </div>
  );
}
