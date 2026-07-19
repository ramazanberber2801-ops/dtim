import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Clock3, Loader2, PauseCircle, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import { getOwnerOverviewTranslation } from '../lib/ownerOverviewTranslations';
import { supabase } from '../lib/supabase';

const brand = { primary: 'var(--brand-primary)', text: 'var(--brand-text)', card: 'var(--brand-card)' };
const mix = (color: string, amount: number, fallback = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

type OverviewStats = {
  total: number;
  active: number;
  trial: number;
  paused: number;
  pendingInvitations: number;
  readyToPublish: number;
};

type OrganizationRow = {
  id: string;
  status: string | null;
  onboarding_step: string | null;
  organization_type: string | null;
};

type AdminRow = {
  organization_id: string | null;
  invitation_status: string | null;
};

const emptyStats: OverviewStats = {
  total: 0,
  active: 0,
  trial: 0,
  paused: 0,
  pendingInvitations: 0,
  readyToPublish: 0,
};

const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

export function OwnerOverview() {
  const { language } = useAppI18n();
  const t = (key: string) => getOwnerOverviewTranslation(language, key);
  const [stats, setStats] = useState<OverviewStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!supabase) {
      setError(t('ownerOverview.supabaseUnavailable'));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const [organizationsResult, adminsResult] = await Promise.all([
        supabase.from('organizations').select('id,status,onboarding_step,organization_type'),
        supabase.from('organization_admins').select('organization_id,invitation_status'),
      ]);

      const firstError = organizationsResult.error || adminsResult.error;
      if (firstError) throw firstError;

      const organizations = ((organizationsResult.data || []) as OrganizationRow[]).filter((organization) => {
        const type = normalize(organization.organization_type);
        return type !== 'system' && organization.id !== 'dtim';
      });
      const organizationIds = new Set(organizations.map((organization) => organization.id));
      const admins = ((adminsResult.data || []) as AdminRow[]).filter((admin) => admin.organization_id && organizationIds.has(admin.organization_id));

      setStats({
        total: organizations.length,
        active: organizations.filter((organization) => ['aktiv', 'active'].includes(normalize(organization.status))).length,
        trial: organizations.filter((organization) => ['prøve', 'prove', 'trial'].includes(normalize(organization.status))).length,
        paused: organizations.filter((organization) => ['pause', 'paused', 'satt på pause'].includes(normalize(organization.status))).length,
        pendingInvitations: admins.filter((admin) => ['pending', 'invited', 'venter'].includes(normalize(admin.invitation_status))).length,
        readyToPublish: organizations.filter((organization) => ['klar', 'ready', 'ready_to_publish'].includes(normalize(organization.onboarding_step))).length,
      });

      if (isRefresh) setStatusMessage(t('ownerOverview.updated'));
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message ? loadError.message : t('ownerOverview.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => [
    { key: 'total', label: t('ownerOverview.total'), value: stats.total, icon: Building2 },
    { key: 'active', label: t('ownerOverview.active'), value: stats.active, icon: CheckCircle2 },
    { key: 'trial', label: t('ownerOverview.trial'), value: stats.trial, icon: Clock3 },
    { key: 'paused', label: t('ownerOverview.paused'), value: stats.paused, icon: PauseCircle },
    { key: 'pendingInvitations', label: t('ownerOverview.pendingInvitations'), value: stats.pendingInvitations, icon: Send },
    { key: 'readyToPublish', label: t('ownerOverview.readyToPublish'), value: stats.readyToPublish, icon: Sparkles },
  ], [language, stats]);

  return (
    <section className="px-4 pt-4 sm:px-5" style={{ color: brand.text }} aria-labelledby="owner-overview-title">
      <div className="rounded-3xl border p-4 shadow-sm sm:p-5" style={{ backgroundColor: brand.card, borderColor: mix(brand.primary, 16) }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-45">Yasaflow</p>
            <h2 id="owner-overview-title" className="mt-1 font-serif text-xl sm:text-2xl">{t('ownerOverview.title')}</h2>
            <p className="mt-1 text-sm leading-6 opacity-60">{t('ownerOverview.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            className="flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: mix(brand.primary, 20), color: brand.primary }}
            aria-label={t('ownerOverview.refresh')}
          >
            {refreshing ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
            <span>{t('ownerOverview.refresh')}</span>
          </button>
        </div>

        <div className="sr-only" role="status" aria-live="polite">
          {loading ? t('ownerOverview.loading') : statusMessage}
        </div>

        {error && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs leading-5">{error}</p>
            </div>
            <button type="button" onClick={() => void load()} className="shrink-0 rounded-xl border border-red-300 px-3 py-2 text-xs font-medium">
              {t('ownerOverview.retry')}
            </button>
          </div>
        )}

        {!error && !loading && stats.total === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed p-5 text-center text-sm opacity-60" style={{ borderColor: mix(brand.primary, 20) }}>
            {t('ownerOverview.empty')}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy={loading || refreshing}>
          {cards.map(({ key, label, value, icon: Icon }) => (
            <article key={key} className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: mix(brand.primary, 18) }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: mix(brand.primary, 10), color: brand.primary }}>
                  <Icon size={17} aria-hidden="true" />
                </div>
                {loading ? <Loader2 size={18} className="animate-spin opacity-45" aria-hidden="true" /> : <span className="text-2xl font-semibold tabular-nums">{value}</span>}
              </div>
              <p className="text-[11px] leading-tight opacity-60">{label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
