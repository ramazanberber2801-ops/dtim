import { Home, HandCoins, Phone } from 'lucide-react';
import { SecretTapDetector } from './SecretTapDetector';
import type { Page } from '../types';

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  onDonate: () => void;
  onSecretTrigger: () => void;
}

export function BottomNav({ current, onNavigate, onDonate, onSecretTrigger }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#C5A880]/20">
      <div className="max-w-md mx-auto px-4 pt-2 pb-3 pb-[env(safe-area-inset-bottom)] relative">
        <div className="flex items-center justify-around relative">
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
          >
            <Home
              size={22}
              className={current === 'home' ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'}
              strokeWidth={current === 'home' ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium ${current === 'home' ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
              Ana Sayfa
            </span>
          </button>

          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={onDonate}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C5A880] to-[#B8935A] shadow-lg shadow-[#C5A880]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-[#FAF6F0]"
              aria-label="Bağış Yap"
            >
              <HandCoins size={26} className="text-white" />
            </button>
            <span className="text-[10px] font-medium text-[#C5A880] mt-1">Bağış</span>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="flex flex-col items-center gap-1 py-2 px-6 transition-colors"
          >
            <Phone
              size={22}
              className={current === 'contact' ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'}
              strokeWidth={current === 'contact' ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium ${current === 'contact' ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
              İletişim
            </span>
          </button>
        </div>

        <div className="absolute bottom-[env(safe-area-inset-bottom)] right-2 mb-2">
          <SecretTapDetector onTrigger={onSecretTrigger} />
        </div>
      </div>
    </nav>
  );
}
