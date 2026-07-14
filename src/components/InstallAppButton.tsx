import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { useAppI18n } from '../lib/appI18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_UNTIL_KEY = 'yasaflow_install_dismissed_until_v2';
const LEGACY_INSTALL_DISMISSED_KEYS = ['yasaflow_install_dismissed', 'dtim_install_dismissed'];
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

export function InstallAppButton() {
  const { t, direction } = useAppI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    try {
      for (const key of LEGACY_INSTALL_DISMISSED_KEYS) localStorage.removeItem(key);
      const dismissedUntil = Number(localStorage.getItem(INSTALL_DISMISSED_UNTIL_KEY) || 0);
      if (dismissedUntil > Date.now()) setDismissed(true);
      else localStorage.removeItem(INSTALL_DISMISSED_UNTIL_KEY);
    } catch {
      // Ignore unavailable storage.
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    void trackEvent('install_click');
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch {
      // Ignore unavailable storage.
    }
  };

  if (installed || dismissed || !deferredPrompt) return null;

  return (
    <div className="mt-4 px-4" dir={direction}>
      <div className="flex items-center gap-3 rounded-xl border-2 p-4 shadow-md" style={{ background: 'linear-gradient(135deg, var(--brand-secondary), color-mix(in srgb, var(--brand-secondary) 84%, var(--brand-primary) 16%))', borderColor: 'var(--brand-border)', color: 'var(--brand-secondary-text)' }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 22%, transparent)' }}>
          <Download size={20} style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t('install.title')}</p>
          <p className="text-[11px] opacity-60">{t('install.description')}</p>
        </div>
        <button onClick={handleInstall} className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>{t('install.button')}</button>
        <button onClick={handleDismiss} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary-text) 8%, transparent)' }} aria-label={t('install.close')}>
          <X size={15} style={{ color: 'color-mix(in srgb, var(--brand-secondary-text) 55%, transparent)' }} />
        </button>
      </div>
    </div>
  );
}
