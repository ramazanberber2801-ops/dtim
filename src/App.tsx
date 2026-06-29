import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './pages/AdminPanel';
import { DonationModal } from './components/DonationModal';
import { InstallButton } from './components/InstallButton';
import { InstallGuideModal } from './components/InstallGuideModal';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';
import type { Page } from './types';
import type { BrowserType, Platform } from './lib/browserDetect';

function AppContent() {
  const { isAdmin, isInitialized } = useApp();
  const [page, setPage] = useState<Page>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guideBrowser, setGuideBrowser] = useState<BrowserType>('safari');
  const [guidePlatform, setGuidePlatform] = useState<Platform>('ios');

  // Once initialization is complete, if the admin session was persisted
  // (survives refresh/redeploy), automatically reopen the admin panel.
  useEffect(() => {
    if (isInitialized && isAdmin) {
      setShowPanel(true);
    }
  }, [isInitialized, isAdmin]); // Bağımlılık dizisi güvenli hale getirildi

  // Giriş başarılı olduğunda paneli açıp modalı kapatmak için useApp'teki isAdmin durumunu izliyoruz
  useEffect(() => {
    if (isInitialized && isAdmin && showLogin) {
      setShowLogin(false);
      setShowPanel(true);
    }
  }, [isAdmin, isInitialized, showLogin]);

  const handleSecretTrigger = () => {
    if (isAdmin) {
      setShowPanel(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleShowGuide = (browser: BrowserType, platform: Platform) => {
    setGuideBrowser(browser);
    setGuidePlatform(platform);
    setShowInstallGuide(true);
  };

  // Loading gate
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#2D2A26]/40 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {page === 'home' && <HomePage />}
      {page === 'contact' && <ContactPage />}

      <InstallButton onShowGuide={handleShowGuide} />

      <BottomNav
        current={page}
        onNavigate={setPage}
        onDonate={() => setShowDonate(true)}
        onSecretTrigger={handleSecretTrigger}
      />

      {/* AdminLoginModal yeni prop yapısına göre güncellendi */}
      <AdminLoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <AdminPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
      />

      <DonationModal
        open={showDonate}
        onClose={() => setShowDonate(false)}
      />

      <InstallGuideModal
        open={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        browser={guideBrowser}
        platform={guidePlatform}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
