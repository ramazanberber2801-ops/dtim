import { X, Share, Plus, Menu, Smartphone, Check } from 'lucide-react';
import type { BrowserType, Platform } from '../lib/browserDetect';
import { useAppI18n } from '../lib/appI18n';

interface InstallGuideModalProps {
  open: boolean;
  onClose: () => void;
  browser: BrowserType;
  platform: Platform;
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return <div className="w-10 h-10 rounded-full flex items-center justify-center theme-primary-button"><span className="font-serif text-sm font-bold">{children}</span></div>;
}

function StepCompleteIcon() {
  return <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center"><Check size={18} className="text-white" /></div>;
}

function StepHelper({ icon, children, note }: { icon: React.ReactNode; children: React.ReactNode; note?: string }) {
  return <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 theme-card">{icon}<span className="text-xs theme-muted">{children}</span>{note && <span className="ml-auto text-[10px] theme-muted">{note}</span>}</div>;
}

export function InstallGuideModal({ open, onClose, browser, platform }: InstallGuideModalProps) {
  const { t } = useAppI18n();
  if (!open) return null;

  const isSafari = browser === 'safari' || platform === 'ios';
  const isSamsung = browser === 'samsung';

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 60%, transparent)' }} onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl shadow-2xl border-2 overflow-hidden theme-surface">
        <div className="relative px-6 py-6 theme-secondary-panel">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label={t('common.close')}>
            <X size={18} />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--brand-subtle)' }}><Smartphone size={26} style={{ color: 'var(--brand-primary)' }} /></div>
            <h2 className="font-serif text-xl">{t('installGuide.title')}</h2>
            <p className="text-xs opacity-60 mt-1">{t('installGuide.subtitle')}</p>
          </div>
        </div>

        <div className="p-6">
          {isSafari && (
            <div className="space-y-5">
              <div className="text-center"><span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>Safari · iOS</span></div>
              <div className="flex gap-4"><div className="shrink-0"><StepNumber>1</StepNumber></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.iosShareTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.iosShareBody')}</p><StepHelper icon={<Share size={16} style={{ color: 'var(--brand-primary)' }} />} note={t('installGuide.bottomOfScreen')}>{t('installGuide.share')}</StepHelper></div></div>
              <div className="flex gap-4"><div className="shrink-0"><StepNumber>2</StepNumber></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.addHomeTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.iosAddHomeBody')}</p><StepHelper icon={<Plus size={16} style={{ color: 'var(--brand-primary)' }} />}>{t('installGuide.addHome')}</StepHelper></div></div>
              <div className="flex gap-4"><div className="shrink-0"><StepCompleteIcon /></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.doneTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.doneBody')}</p></div></div>
            </div>
          )}

          {isSamsung && (
            <div className="space-y-5">
              <div className="text-center"><span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>Samsung Internet · Android</span></div>
              <div className="flex gap-4"><div className="shrink-0"><StepNumber>1</StepNumber></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.openMenuTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.samsungMenuBody')}</p><StepHelper icon={<Menu size={16} style={{ color: 'var(--brand-primary)' }} />} note={t('installGuide.topRight')}>{t('installGuide.menu')}</StepHelper></div></div>
              <div className="flex gap-4"><div className="shrink-0"><StepNumber>2</StepNumber></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.addHomeTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.samsungAddHomeBody')}</p><StepHelper icon={<Plus size={16} style={{ color: 'var(--brand-primary)' }} />}>{t('installGuide.addHome')}</StepHelper></div></div>
              <div className="flex gap-4"><div className="shrink-0"><StepCompleteIcon /></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.doneTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.doneBody')}</p></div></div>
            </div>
          )}

          {!isSafari && !isSamsung && (
            <div className="space-y-4">
              <div className="text-center"><span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>{t('installGuide.browserMenu')}</span></div>
              <div className="flex gap-4"><div className="shrink-0"><StepNumber><Menu size={18} /></StepNumber></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.openMenuTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.genericBody')}</p></div></div>
              <div className="flex gap-4"><div className="shrink-0"><StepCompleteIcon /></div><div className="flex-1 pt-1"><h3 className="text-sm font-semibold mb-1">{t('installGuide.doneTitle')}</h3><p className="text-xs theme-muted leading-relaxed">{t('installGuide.doneShort')}</p></div></div>
            </div>
          )}

          <button onClick={onClose} className="theme-secondary-panel w-full mt-6 py-3 rounded-lg text-sm font-medium transition-colors">{t('installGuide.understood')}</button>
        </div>
      </div>
    </div>
  );
}
