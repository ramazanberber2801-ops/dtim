function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: Omit<SettingsManagerProps, 'inspiration' | 'onUpdateInspiration'>) {
  const [form, setForm] = useState<MosqueSettings>(settings);
  const [saved, setSaved] = useState(false);

  // Şifre değiştirme state'leri (Kaldığı gibi duruyor)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChange = (field: keyof MosqueSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ... handlePasswordSubmit fonksiyonu aynı kalmalı ...

  const fields: { key: keyof MosqueSettings; label: string; placeholder: string; type?: string; textarea?: boolean }[] = [
    { key: 'mosqueName', label: 'Camı / Dernek Adı', placeholder: 'Drammen Türk İnanç Cemiyeti' },
    // ... diğer alanlar aynı kalmalı ...
  ];

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <SettingsIcon size={20} className="text-[#C5A880]" />
          <h2 className="font-serif text-xl text-[#2D2A26]">Genel Cami Ayarları</h2>
        </div>

        {/* ... alanlar render kısmı ... */}

        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <Check size={16} />✅ Ayarlar başarıyla kaydedildi!
          </div>
        )}

        {/* ===== Şifre Değiştir Bölümü (Aynı kalacak) ===== */}
        {/* ... (Şifre değiştirme JSX kodları buraya gelecek) ... */}

        <button type="submit" className="w-full py-3 rounded-lg bg-[#C5A880] text-white text-sm font-medium hover:bg-[#C5A880]/90 transition-colors flex items-center justify-center gap-2">
          <Save size={16} />KAYDET
        </button>
      </form>
    </div>
  );
}
