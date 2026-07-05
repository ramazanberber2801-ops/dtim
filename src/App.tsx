function RecoveryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (first.length < 6) return setError('En az 6 karakter girin.');
    if (first !== second) return setError('İki giriş aynı değil.');
    if (!supabase) return setError('Sistem bağlantısı yok.');

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: first });
    setBusy(false);

    if (updateError) return setError('Kaydedilemedi: ' + updateError.message);

    setMessage('Kaydedildi. Yeni şifreyle giriş yapabilirsiniz.');
    setFirst('');
    setSecond('');
    window.history.replaceState({}, document.title, window.location.pathname);

    setTimeout(() => {
      void supabase?.auth.signOut();
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between mb-5">
          <h2 className="font-serif text-xl">Yeni Şifre Belirle</h2>
          <button onClick={onClose} className="text-xl leading-none">×</button>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {message && <p className="text-green-700 text-xs mb-3">{message}</p>}

        <form onSubmit={submit} className="space-y-4">
          <input type={visible ? 'text' : 'password'} className="w-full p-3 border rounded-xl" placeholder="Yeni şifre" value={first} onChange={(e) => setFirst(e.target.value)} required />
          <input type={visible ? 'text' : 'password'} className="w-full p-3 border rounded-xl" placeholder="Yeni şifre tekrar" value={second} onChange={(e) => setSecond(e.target.value)} required />

          <label className="flex items-center gap-2 text-xs text-[#2D2A26]/60">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Şifreyi göster
          </label>

          <button type="submit" disabled={busy} className="w-full bg-[#C5A880] text-white p-3 rounded-xl font-medium">
            {busy ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
