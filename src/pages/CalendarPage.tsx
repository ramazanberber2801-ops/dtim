import { CalendarDays } from 'lucide-react';
import { PublicActivitiesCalendar } from '../components/PublicActivitiesCalendar';
import { useAppI18n } from '../lib/appI18n';
import { DEFAULT_ORGANIZATION_ID } from '../lib/organization';

export function CalendarPage() {
  const { locale, direction } = useAppI18n();
  return (
    <div className="min-h-screen pb-28" dir={direction} style={{ background: 'var(--brand-background)', color: 'var(--brand-text)' }}>
      <header className="border-b px-4 py-6" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><CalendarDays size={22} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] opacity-45">Yasaflow</p><h1 className="text-2xl font-semibold">Kalender</h1></div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 rounded-2xl border p-4 text-sm opacity-70" style={{ background: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>Kalenderen viser organisasjonens publiserte aktiviteter. Du kan åpne en aktivitet og legge den til i din personlige kalender.</div>
        <PublicActivitiesCalendar organizationId={DEFAULT_ORGANIZATION_ID} locale={locale} />
      </main>
    </div>
  );
}
