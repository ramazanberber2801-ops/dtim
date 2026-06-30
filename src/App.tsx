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
import { SecuritySetupModal } from './components/SecuritySetupModal'; // Lagt til import
import type { Page } from './types';
import type { BrowserType, Platform } from './lib/browserDetect';

function AppContent() {
  const { isAdmin, isInitialized, currentAdmin } = useApp(); // currentAdmin lagt til
  const [page, setPage] = useState<Page>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false); // Ny state
  const [guideBrowser, setGuideBrowser] = useState<BrowserType>('safari');
  const [guidePlatform, setGuidePlatform] = useState<Platform>('ios');

  // Logikk for å tvinge sikkerhetsoppsett
  useEffect(() => {
    if (
      isInitialized &&
      isAdmin &&
      currentAdmin &&
      (!currentAdmin.security_question || !currentAdmin.security_answer)
    ) {
      setShowSecuritySetup(true);
      setShowPanel(false);
    }
  }, [isInitialized, isAdmin, currentAdmin]);

  useEffect(() => {
    if (isInitialized && isAdmin && !showSecuritySetup) {
      setShowPanel(true);
    }
  }, [isInitialized, isAdmin, showSecuritySetup]);

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

      {/* Sikkerhetsmodal nederst */}
      <SecuritySetupModal
        open={showSecuritySetup}
        admin={currentAdmin}
        onDone={() => {
          setShowSecuritySetup(false);
          setShowPanel(true);
        }}
        onClose={() => setShowSecuritySetup(false)}
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
