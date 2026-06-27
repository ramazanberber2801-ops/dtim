import { X, Share, Plus, Menu, Smartphone, Check } from 'lucide-react';
import type { BrowserType, Platform } from '../lib/browserDetect';

interface InstallGuideModalProps {
  open: boolean;
  onClose: () => void;
  browser: BrowserType;
  platform: Platform;
}

export function InstallGuideModal({ open, onClose, browser, platform }: InstallGuideModalProps) {
  if (!open) return null;

  const isSafari = browser === 'safari' || platform === 'ios';
  const isSamsung = browser === 'samsung';

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2A26]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-6 bg-gradient-to-br from-[#2D2A26] to-[#3D3A36]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X size={18} className="text-[#FAF6F0]" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#C5A880]/20 flex items-center justify-center mb-3">
              <Smartphone size={26} className="text-[#C5A880]" />
            </div>
            <h2 className="font-serif text-xl text-[#FAF6F0]">Kurulum Rehberi</h2>
            <p className="text-xs text-[#FAF6F0]/60 mt-1">
              Uygulamayı ana ekranınıza ekleyin
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSafari && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-block text-[10px] font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-3 py-1 rounded-full">
                  Safari · iOS
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A880] flex items-center justify-center">
                    <span className="font-serif text-sm text-white font-bold">1</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Paylaş butonuna basın
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Ekranın alt kısmındaki Paylaş (Share) butonuna dokunun.
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                    <Share size={16} className="text-[#C5A880]" />
                    <span className="text-xs text-[#2D2A26]/70">Paylaş (Share)</span>
                    <span className="ml-auto text-[10px] text-[#2D2A26]/40">Ekranın altında</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A880] flex items-center justify-center">
                    <span className="font-serif text-sm text-white font-bold">2</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Ana Ekrana Ekle seçeneğine tıklayın
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Açılan menüde aşağı kaydırın ve "Ana Ekrana Ekle" (Add to Home Screen) seçeneğine dokunun.
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                    <Plus size={16} className="text-[#C5A880]" />
                    <span className="text-xs text-[#2D2A26]/70">Ana Ekrana Ekle</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <Check size={18} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Tamamlandı!
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Ana ekranınızda DTIM uygulama simgesi belirecektir. Artık uygulamayı doğrudan ana ekranınızdan açabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSamsung && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-block text-[10px] font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-3 py-1 rounded-full">
                  Samsung Internet · Android
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A880] flex items-center justify-center">
                    <span className="font-serif text-sm text-white font-bold">1</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Tarayıcı menüsünü açın
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Sağ üst köşedeki üç çizgi (☰) menü simgesine dokunun.
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                    <Menu size={16} className="text-[#C5A880]" />
                    <span className="text-xs text-[#2D2A26]/70">Menü (☰)</span>
                    <span className="ml-auto text-[10px] text-[#2D2A26]/40">Sağ üst köşe</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A880] flex items-center justify-center">
                    <span className="font-serif text-sm text-white font-bold">2</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Ana Ekrana Ekle seçeneğine tıklayın
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Açılan menüde "Ana sayfaına ekle" (Add to Home screen) seçeneğine dokunun.
                  </p>
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                    <Plus size={16} className="text-[#C5A880]" />
                    <span className="text-xs text-[#2D2A26]/70">Ana sayfaına ekle</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <Check size={18} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Tamamlandı!
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Ana ekranınızda DTIM uygulama simgesi belirecektir. Artık uygulamayı doğrudan ana ekranınızdan açabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other browsers */}
          {!isSafari && !isSamsung && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-block text-[10px] font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-3 py-1 rounded-full">
                  Tarayıcı Menüsü
                </span>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#C5A880] flex items-center justify-center">
                    <Menu size={18} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">
                    Tarayıcı menüsünü açın
                  </h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Tarayıcınızın menüsünü (üç nokta veya üç çizgi) açın ve "Ana ekrana ekle" veya "Uygulamayı yükle" seçeneğine dokunun.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <Check size={18} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-semibold text-[#2D2A26] mb-1">Tamamlandı!</h3>
                  <p className="text-xs text-[#2D2A26]/60 leading-relaxed">
                    Ana ekranınızda DTIM uygulama simgesi belirecektir.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-lg bg-[#2D2A26] text-[#FAF6F0] text-sm font-medium hover:bg-[#2D2A26]/90 transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
