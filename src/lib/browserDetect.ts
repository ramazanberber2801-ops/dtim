export type BrowserType = 'chrome' | 'safari' | 'samsung' | 'firefox' | 'edge' | 'opera' | 'other';
export type Platform = 'ios' | 'android' | 'desktop' | 'other';

interface BrowserInfo {
  browser: BrowserType;
  platform: Platform;
  isStandalone: boolean;
  supportsBeforeInstallPrompt: boolean;
}

export function detectBrowser(): BrowserInfo {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { browser: 'other', platform: 'other', isStandalone: false, supportsBeforeInstallPrompt: false };
  }

  const ua = navigator.userAgent;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Platform detection
  let platform: Platform = 'desktop';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';

  // Browser detection (order matters — Samsung must be checked before Chrome)
  let browser: BrowserType = 'other';

  if (/SamsungBrowser/i.test(ua)) {
    browser = 'samsung';
  } else if (/Edg/i.test(ua)) {
    browser = 'edge';
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'opera';
  } else if (/Firefox/i.test(ua)) {
    browser = 'firefox';
  } else if (/Chrome|CriOS/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua)) {
    browser = 'chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) {
    browser = 'safari';
  }

  // Chrome on iOS is actually Safari under the hood — no beforeinstallprompt
  const supportsBeforeInstallPrompt =
    (browser === 'chrome' || browser === 'edge' || browser === 'opera') && platform !== 'ios';

  return { browser, platform, isStandalone, supportsBeforeInstallPrompt };
}

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
