import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { detectBrowser, isInstalled, type BrowserType, type Platform } from '../lib/browserDetect';
import { usePWAInstall } from '../lib/usePWAInstall';

interface InstallButtonProps {
  onShowGuide: (browser: BrowserType, platform: Platform) => void;
}

/**
 * Smart install button:
 * - On Chromium (Chrome/Edge): uses beforeinstallprompt for native install
 * - On Safari/Samsung/other: opens the installation guide modal
 * - Hidden if app is already installed (standalone mode)
 * - Dismissible by user (remembers dismissal in sessionStorage)
 */
export function InstallButton({ onShowGuide }: InstallButtonProps) {
  const { canInstall, promptInstall } = usePWAInstall();
  const [browserInfo, setBrowserInfo] = useState(() => detectBrowser());
  const [installed, setInstalled] = useState(() => isInstalled());
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('dtim_install_dismissed') === 'true'; } catch { return false; }
  });
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setBrowserInfo(detectBrowser());
    setInstalled(isInstalled());
  }, []);

  // Don't show if installed or dismissed
  if (installed || dismissed) return null;

  // On Chromium with beforeinstallprompt support — wait for the event
  if (browserInfo.supportsBeforeInstallPrompt && !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    if (browserInfo.supportsBeforeInstallPrompt && canInstall) {
      setInstalling(true);
      await promptInstall();
      setInstalling(false);
    } else {
      // Safari, Samsung, or other — show the guide
      onShowGuide(browserInfo.browser, browserInfo.platform);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem('dtim_install_dismissed', 'true'); } catch { /* noop */ }
  };

  return (
    <div className="fixed top-16 right-3 z-40">
      <div className="relative bg-white rounded-xl shadow-lg border-2 border-[#C5A880]/30 overflow-hidden">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-2.5 pl-4 pr-7 py-2.5 hover:bg-[#FAF6F0] transition-colors"
        >
          {installing ? (
            <div className="w-4 h-4 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={16} className="text-[#C5A880]" />
          )}
          <span className="text-xs font-semibold text-[#2D2A26]">
            {installing ? 'Yükleniyor...' : 'Uygulamayı Yükle'}
          </span>
        </button>
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 w-5 h-5 rounded-full hover:bg-[#C5A880]/15 flex items-center justify-center transition-colors"
          aria-label="Kapat"
        >
          <X size={12} className="text-[#2D2A26]/40" />
        </button>
      </div>
    </div>
  );
}
