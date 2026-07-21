import { useEffect, useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';
import { loadActivePushMessages, markPushMessageRead, type PushMessage } from '../lib/notificationCenter';

const copy: Record<string, Record<string, string>> = {
  nb: { title: 'Varsler', empty: 'Ingen aktive varsler.', close: 'Lukk', error: 'Kunne ikke hente varsler.' },
  en: { title: 'Notifications', empty: 'No active notifications.', close: 'Close', error: 'Could not load notifications.' },
  tr: { title: 'Bildirimler', empty: 'Aktif bildirim yok.', close: 'Kapat', error: 'Bildirimler yüklenemedi.' },
  ar: { title: 'الإشعارات', empty: 'لا توجد إشعارات نشطة.', close: 'إغلاق', error: 'تعذر تحميل الإشعارات.' },
  ur: { title: 'اطلاعات', empty: 'کوئی فعال اطلاع نہیں۔', close: 'بند کریں', error: 'اطلاعات لوڈ نہیں ہو سکیں۔' },
};

export function NotificationsPage({ initialMessageId, onConsumedInitialMessage }: { initialMessageId?: string | null; onConsumedInitialMessage?: () => void }) {
  const i18n = useAppI18n();
  const text = copy[i18n.language] || copy.nb;
  const [messages, setMessages] = useState<PushMessage[]>([]);
  const [selected, setSelected] = useState<PushMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await loadActivePushMessages(DEFAULT_ORGANIZATION_ID);
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : []);

        if (initialMessageId) {
          const match = data.find((item) => item.id === initialMessageId) || null;
          if (match) setSelected(match);
          onConsumedInitialMessage?.();
        }
      } catch (loadError) {
        console.error('Notification page load failed:', loadError);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, [initialMessageId]);

  const openMessage = (message: PushMessage) => {
    try { markPushMessageRead(message.id); } catch (storageError) { console.warn('Could not save read state:', storageError); }
    setSelected(message);
  };

  const formatDate = (value: string) => {
    try {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    } catch {
      return '';
    }
  };

  return (
    <div dir={i18n.direction || 'ltr'} className="min-h-screen pb-28" style={{ backgroundColor: '#F4FAFF', color: '#071B53' }}>
      <header className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Bell size={22} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Yasaflow</p>
            <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        {loading && <div className="flex justify-center py-16 text-blue-600"><Loader2 className="animate-spin" /></div>}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">{text.error}</div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Bell className="mx-auto mb-3 text-slate-300" size={34} />
            <p className="text-slate-600">{text.empty}</p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((message) => (
              <button key={message.id} type="button" onClick={() => openMessage(message)} className="flex w-full items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-start shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Bell size={19} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-slate-900">{message.title || 'Yasaflow'}</strong>
                  <span className="mt-1 block text-sm text-slate-600">{message.body || ''}</span>
                  <span className="mt-2 block text-xs text-slate-400">{formatDate(message.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <section className="w-full max-w-lg rounded-3xl bg-white p-5 text-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Bell size={22} /></span>
              <div className="min-w-0 flex-1"><h2 className="text-xl font-semibold">{selected.title || 'Yasaflow'}</h2><p className="mt-1 text-xs text-slate-400">{formatDate(selected.created_at)}</p></div>
              <button type="button" onClick={() => setSelected(null)} aria-label={text.close} className="grid h-9 w-9 place-items-center rounded-xl"><X size={20} /></button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.body || ''}</p>
            <button type="button" onClick={() => setSelected(null)} className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">{text.close}</button>
          </section>
        </div>
      )}
    </div>
  );
}
