import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, User, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    if (!username.trim() || !password.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      setLoading(true);
      // TS2801 hatasını engellemek için doğrudan fonksiyonun kendisini değil, 
      // döndürdüğü sonucu (result) bir değişkene atayıp onu kontrol ediyoruz.
      const success = await login(username, password, role);
      
      if (success) {
        setUsername('');
        setPassword('');
        onClose();
      } else {
        setError('Hatalı kullanıcı adı veya şifre!');
      }
    } catch (err: any) {
      setError(err?.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FAF6F0] w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden transform transition-all scale-100">
        <div className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between border-b-2 border-[#C5A880]/20">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#C5A880]" />
            <h2 className="font-serif text-base text-[#FAF6F0]">Yönetici Girişi</h2>
          </div>
          <button onClick={onClose} className="text-[#FAF6F0]/60 hover:text-[#FAF6F0] transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-600 text-xs animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2D2A26]/60 uppercase tracking-wider">Kullanıcı Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  role === 'admin'
                    ? 'bg-[#2D2A26] text-[#FAF6F0] border-[#2D2A26] shadow-sm'
                    : 'bg-white text-[#2D2A26]/70 border-[#C5A880]/20 hover:bg-[#C5A880]/5'
                }`}
              >
                Yönetici
              </button>
              <button
                type="button"
                onClick={() => setRole('superadmin')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  role === 'superadmin'
                    ? 'bg-[#2D2A26] text-[#FAF6F0] border-[#2D2A26] shadow-sm'
                    : 'bg-white text-[#2D2A26]/70 border-[#C5A880]/20 hover:bg-[#C5A880]/5'
                }`}
              >
                Süper Admin
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2D2A26]/60 uppercase tracking-wider">Kullanıcı Adı</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2A26]/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2D2A26]/60 uppercase tracking-wider">Şifre</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2A26]/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A880] hover:bg-[#B8935A] text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
