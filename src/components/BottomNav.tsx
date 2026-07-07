import { useEffect } from 'react';
import { Home, HandCoins, Phone } from 'lucide-react';
import { SecretTapDetector } from './SecretTapDetector';
import { supabase } from '../lib/supabase';
import type { Page } from '../types';

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  onDonate: () => void;
  onSecretTrigger: () => void;
  showDonation?: boolean;
  showContact?: boolean;
}

function findHomeSections() {
  return Array.from(document.querySelectorAll('div.min-h-screen.pb-28 > section')) as HTMLElement[];
}

function sectionIncludes(section: HTMLElement, text: string) {
  return section.textContent?.toLowerCase().includes(text.toLowerCase()) || false;
}

function setSectionVisible(section: HTMLElement | undefined, visible: boolean) {
  if (!section) return;
  section.style.display = visible ? '' : 'none';
}

function setSectionsByText(texts: string[], visible: boolean) {
  for (const section of findHomeSections()) {
    if (texts.some((text) => sectionIncludes(section, text))) {
      setSectionVisible(section, visible);
    }
  }
}

function applyHomeModuleVisibility(modules: Record<string, boolean>) {
  const sections = findHomeSections();
  setSectionVisible(sections[0], modules.prayer !== false);
  setSectionsByText(['Yaklaşan Sohbet', 'Yaklaşan program'], modules.sohbet !== false);
  setSectionsByText(['Duyurular ve Haberler', 'Henüz haber'], modules.news !== false);
  setSectionsByText(['RAMAZAN', 'Ramazan'], modules.ramadan !== false);
  setSectionsByText(['KURBAN BAYRAMI', 'Kurban Bayramı'], modules.kurban !== false);

  if (modules.ayet === false && modules.hadis === false) {
    setSectionsByText(['Bugünün Ayeti', 'Bugünün Hadisi'], false);
  } else {
    setSectionsByText(['Bugünün Ayeti', 'Bugünün Hadisi'], true);
  }
}

export function BottomNav({ current, onNavigate, onDonate, onSecretTrigger, showDonation = true, showContact = true }: BottomNavProps) {
  const inactiveColor = 'color-mix(in srgb, var(--brand-text) 40%, transparent)';

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let alive = true;

    const load = async () => {
      const { data, error } = await client
        .from('organization_modules')
        .select('module_id, enabled')
        .eq('organization_id', 'dtim');

      if (!alive || error) return;

      const modules: Record<string, boolean> = {};
      for (const row of data || []) {
        modules[row.module_id] = Boolean(row.enabled);
      }

      window.setTimeout(() => applyHomeModuleVisibility(modules), 80);
    };

    void load();

    return () => {
      alive = false;
    };
  }, [current]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--brand-background) 95%, transparent)',
        borderColor: 'color-mix(in srgb, var(--brand-primary) 20%, transparent)',
      }}
    >
      <div className="max-w-md mx-auto px-4 pt-2 pb-3 pb-[env(safe-area-inset-bottom)] relative">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
          >
            <Home
              size={22}
              style={{ color: current === 'home' ? 'var(--brand-primary)' : inactiveColor }}
              strokeWidth={current === 'home' ? 2.5 : 2}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: current === 'home' ? 'var(--brand-primary)' : inactiveColor }}
            >
              Ana Sayfa
            </span>
          </button>

          {showDonation && (
            <div className="flex flex-col items-center -mt-6">
              <button
                onClick={onDonate}
                className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 80%, #000 20%))',
                  boxShadow: '0 10px 20px color-mix(in srgb, var(--brand-primary) 30%, transparent)',
                  borderColor: 'var(--brand-background)',
                }}
                aria-label="Bağış Yap"
              >
                <HandCoins size={26} style={{ color: 'var(--brand-primary-text)' }} />
              </button>
              <span className="text-[10px] font-medium mt-1" style={{ color: 'var(--brand-primary)' }}>Bağış</span>
            </div>
          )}

          {showContact && (
            <button
              onClick={() => onNavigate('contact')}
              className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
            >
              <Phone
                size={22}
                style={{ color: current === 'contact' ? 'var(--brand-primary)' : inactiveColor }}
                strokeWidth={current === 'contact' ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: current === 'contact' ? 'var(--brand-primary)' : inactiveColor }}
              >
                İletişim
              </span>
            </button>
          )}
        </div>

        <div className="absolute bottom-[env(safe-area-inset-bottom)] right-2 mb-2">
          <SecretTapDetector onTrigger={onSecretTrigger} />
        </div>
      </div>
    </nav>
  );
}
