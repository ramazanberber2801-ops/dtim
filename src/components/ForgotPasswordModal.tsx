import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPasswordModal({
  open,
  onClose,
  initialUsername,
}: {
  open: boolean;
  onClose: () => void;
  initialUsername?: string;
}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialUsername || '');
      setMessage('');
      setError('');
      setLoading(false);
    }
  }, [open, initialUsername]);

  if (!open) return null;

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('E-posta zorunludur.');
      return;
    }

    const client = supabase;
    if (!client) {
      setError('Sistem bağlantısı yok.');
      return;
    }

    setLoading(true);

    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (error) {
      setError('Sıfırlama e-postası gönderilemedi: ' + error.message);
      return;
    }

    setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between mb-5">
          <h2 className="font-serif text-xl">Şifremi Sıfırla</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-[#2D2A26]/60 mb-4">
          E-posta adresinizi girin. Supabase Auth size güvenli bir şifre sıfırlama bağlantısı gönderecek.
        </p>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {message && <p className="text-green-700 text-xs mb-3">{message}</p>}

        <form onSubmit={sendResetEmail} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 border rounded-xl"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sıfırlama E-postası Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}
