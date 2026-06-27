import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X, KeyRound, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RECOVERY_ANSWER } from '../lib/constants';
import type { AdminView } from '../types';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const { login, updateAdminPassword } = useApp();
  const [view, setView] = useState<AdminView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setView('login');
    setUsername('');
    setPassword('');
    setRecoveryAnswer('');
    setNewPasswordState('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Lütfen kullanıcı adınızı girin.');
      return;
    }

    if (login(username, password, rememberMe)) {
      reset();
      onSuccess();
    } else {
      setError('Kullanıcı adı veya şifre hatalı.');
    }
  };

  const handleRecovery = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (recoveryAnswer.trim().toLowerCase() === RECOVERY_ANSWER) {
      setView('resetPassword');
    } else {
      setError('Cevap yanlış. Lütfen tekrar deneyin.');
    }
  };

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    // Reset the superadmin password
    updateAdminPassword('Ramazan', newPassword);

    // Auto-login with new password (use rememberMe state)
    if (login('Ramazan', newPassword, rememberMe)) {
      reset();
      onSuccess();
    } else {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D2A26]/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#FAF6F0] rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#C5A880]/20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#C5A880]/15 flex items-center justify-center">
              {view === 'login' && <ShieldCheck size={18} className="text-[#C5A880]" />}
              {(view === 'recovery' || view === 'resetPassword') && <KeyRound size={18} className="text-[#C5A880]" />}
            </div>
            <h2 className="font-serif text-lg text-[#2D2A26]">
              {view === 'login' && 'Yönetici Girişi'}
              {view === 'recovery' && 'Şifre Sıfırlama'}
              {view === 'resetPassword' && 'Yeni Şifre Belirle'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-[#C5A880]/15 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X size={18} className="text-[#2D2A26]/60" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2A26]/70 mb-1.5">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                  placeholder="Kullanıcı adınız"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2A26]/70 mb-1.5">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/40 hover:text-[#C5A880] transition-colors"
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Beni Hatırla Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                    rememberMe
                      ? 'bg-[#C5A880] border-[#C5A880]'
                      : 'bg-white border-[#C5A880]/30'
                  }`}
                >
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-[#2D2A26]/70">Beni Hatırla</span>
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#2D2A26] text-[#FAF6F0] font-medium hover:bg-[#2D2A26]/90 transition-colors"
              >
                Giriş Yap
              </button>

              <button
                type="button"
                onClick={() => { setView('recovery'); setError(''); }}
                className="w-full text-sm text-[#C5A880] hover:text-[#C5A880]/80 transition-colors"
              >
                Şifremi Unuttum
              </button>
            </form>
          )}

          {view === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="bg-[#C5A880]/10 rounded-lg p-3">
                <p className="text-sm text-[#2D2A26]/70">Güvenlik sorusu:</p>
                <p className="text-sm font-medium text-[#2D2A26] mt-1">İlk evcil hayvanımın ismi?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2A26]/70 mb-1.5">Cevabınız</label>
                <input
                  type="text"
                  value={recoveryAnswer}
                  onChange={(e) => setRecoveryAnswer(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                  placeholder="Cevabınızı girin"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" className="w-full py-3 rounded-lg bg-[#2D2A26] text-[#FAF6F0] font-medium hover:bg-[#2D2A26]/90 transition-colors">
                Doğrula
              </button>

              <button type="button" onClick={() => { setView('login'); setError(''); }} className="w-full text-sm text-[#2D2A26]/50 hover:text-[#2D2A26]/70 transition-colors">
                Geri Dön
              </button>
            </form>
          )}

          {view === 'resetPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-700">Doğrulama başarılı! Lütfen yeni şifrenizi belirleyin.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2A26]/70 mb-1.5">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPasswordState(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                    placeholder="En az 6 karakter"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/40 hover:text-[#C5A880] transition-colors"
                    aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2A26]/70 mb-1.5">Şifre Tekrar</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                  placeholder="Şifreyi tekrar girin"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" className="w-full py-3 rounded-lg bg-[#C5A880] text-white font-medium hover:bg-[#C5A880]/90 transition-colors">
                Şifreyi Güncelle ve Giriş Yap
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
