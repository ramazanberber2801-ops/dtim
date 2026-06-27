import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, BookOpen, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, DailyInspiration } from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const {
    news, staff, sohbet, settings, inspiration, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, updateInspiration, addAdmin, deleteAdmin, updateAdminPassword,
  } = useApp();
  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const isSuperadmin = currentAdmin?.role === 'superadmin';

  const tabs: { id: AdminTab; label: string; icon: typeof Newspaper }[] = [
    { id: 'news', label: 'Haberler', icon: Newspaper },
    { id: 'sohbet', label: 'Sohbet/Ders', icon: Mic },
    { id: 'staff', label: 'Kadromuz', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
    { id: 'admins', label: 'Yöneticiler', icon: UserCog },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      {/* Header */}
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A880]/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-[#C5A880]" />
          </div>
          <div>
            <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
            <p className="text-[10px] text-[#FAF6F0]/50">
              {currentAdmin?.displayName ?? 'Admin'} · {isSuperadmin ? 'Süper Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/20 text-[#FAF6F0] text-xs font-medium transition-colors">
            <LogOut size={14} />Çıkış
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/20 flex items-center justify-center transition-colors" aria-label="Kapat">
            <X size={18} className="text-[#FAF6F0]" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#C5A880]/20 bg-white shrink-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                tab === t.id ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A880]" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'news' && <NewsManager news={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {tab === 'sohbet' && <SohbetManager sohbet={sohbet} onAdd={addSohbet} onUpdate={updateSohbet} onDelete={deleteSohbet} />}
        {tab === 'staff' && <StaffManager staff={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} inspiration={inspiration} onUpdateInspiration={updateInspiration} currentAdmin={currentAdmin} onUpdatePassword={updateAdminPassword} />}
        {tab === 'admins' && <AdminsManager admins={admins} onAdd={addAdmin} onDelete={deleteAdmin} isSuperadmin={isSuperadmin} />}
      </div>
    </div>
  );
}

// ===================== GENERIC HELPERS =====================

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-[#2D2A26]/60 hover:text-[#2D2A26] transition-colors mb-4">
      <ArrowLeft size={16} />Geri
    </button>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-[#C5A880]/10 hover:bg-[#C5A880]/20 flex items-center justify-center transition-colors" aria-label="Düzenle">
        <Edit3 size={14} className="text-[#C5A880]" />
      </button>
      <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors" aria-label="Sil">
        <Trash2 size={14} className="text-red-500" />
      </button>
    </div>
  );
}

function SaveCancelButtons({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-[#2D2A26] text-sm font-medium hover:bg-[#FAF6F0] transition-colors">İptal</button>
      <button type="submit" className="flex-1 py-3 rounded-lg bg-[#C5A880] text-white text-sm font-medium hover:bg-[#C5A880]/90 transition-colors flex items-center justify-center gap-2">
        <Save size={16} />Kaydet
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full mb-4 py-3 rounded-xl bg-[#C5A880] text-white font-medium hover:bg-[#C5A880]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
      <Plus size={18} />{label}
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Newspaper; text: string }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25">
      <Icon size={32} className="mx-auto text-[#C5A880]/40 mb-2" />
      <p className="text-sm text-[#2D2A26]/50">{text}</p>
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-colors";

// ===================== SETTINGS MANAGER (Genel Cami Ayarları) =====================

interface SettingsManagerProps {
  settings: MosqueSettings;
  onUpdate: (updates: Partial<MosqueSettings>) => void;
  inspiration: DailyInspiration;
  onUpdateInspiration: (updates: Partial<DailyInspiration>) => void;
  currentAdmin: import('../types').AdminAccount | null;
  onUpdatePassword: (username: string, newPassword: string) => void;
}

function SettingsManager({ settings, onUpdate, inspiration, onUpdateInspiration, currentAdmin, onUpdatePassword }: SettingsManagerProps) {
  const [form, setForm] = useState<MosqueSettings>(settings);
  const [inspForm, setInspForm] = useState<DailyInspiration>(inspiration);
  const [saved, setSaved] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChange = (field: keyof MosqueSettings, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInspChange = (field: keyof DailyInspiration, value: string | boolean) => {
    setInspForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    onUpdateInspiration(inspForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);

    if (!currentAdmin) {
      setPasswordError('Oturum bilgisi bulunamadı.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.');
      return;
    }

    // Update the password — context keeps currentAdmin in sync, no logout
    onUpdatePassword(currentAdmin.username, newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const fields: { key: keyof MosqueSettings; label: string; placeholder: string; type?: string; textarea?: boolean }[] = [
    { key: 'mosqueName', label: 'Camı / Dernek Adı', placeholder: 'Drammen Türk İnanç Cemiyeti' },
    { key: 'shortName', label: 'Kısa Başlık (üst bar)', placeholder: 'Norveç · Drammen' },
    { key: 'vippsNumber', label: 'Vipps Numarası', placeholder: '29816' },
    { key: 'whatsappNumber', label: 'WhatsApp Numarası (uluslararası, + olmadan)', placeholder: '4712345678' },
    { key: 'phone', label: 'Telefon', placeholder: '+47 12 34 56 78' },
    { key: 'email', label: 'E-posta', placeholder: 'info@dtim.no', type: 'email' },
    { key: 'address', label: 'Adres', placeholder: 'Lauritz Grønlands vei 30, 3035 Drammen', textarea: true },
    { key: 'mapUrl', label: 'Google Harita URL\'i (Yol Tarifi butonu)', placeholder: 'https://www.google.com/maps/search/?api=1&query=...' },
    { key: 'openingHours', label: 'Açılış Saatleri', placeholder: 'Her gün: 09:00 - 22:00' },
    { key: 'fridayPrayer', label: 'Cuma Namazı Saati', placeholder: 'Cuma Namazı: 13:00' },
  ];

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <SettingsIcon size={20} className="text-[#C5A880]" />
          <h2 className="font-serif text-xl text-[#2D2A26]">Genel Cami Ayarları</h2>
        </div>

        <p className="text-xs text-[#2D2A26]/50 bg-[#C5A880]/5 rounded-lg p-3">
          Bu alanda yapılan değişiklikler anında tüm sekmelerde (Ana Sayfa, Bağış, İletişim) güncellenecektir.
        </p>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">{f.label}</label>
            {f.textarea ? (
              <textarea value={form[f.key]} onChange={(e) => handleChange(f.key, e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder={f.placeholder} />
            ) : (
              <input type={f.type ?? 'text'} value={form[f.key]} onChange={(e) => handleChange(f.key, e.target.value)} className={inputClass} placeholder={f.placeholder} />
            )}
          </div>
        ))}

        {/* ===== Günün Ayeti & Hadisi Management Block ===== */}
        <div className="border-t-2 border-[#C5A880]/20 pt-4 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-[#C5A880]" />
            <h3 className="font-serif text-lg text-[#2D2A26]">Günün Ayeti & Hadisi</h3>
          </div>
          <p className="text-xs text-[#2D2A26]/50 mb-4">
            Ana sayfadaki "Günün İlhamı" kartında görünecek ayet ve hadis metinlerini yönetin.
          </p>

          {/* Verse */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-[#C5A880]" />
              <span className="text-sm font-semibold text-[#2D2A26]">Ayet-i Kerime</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Ayet Metni ve Meali</label>
              <textarea
                value={inspForm.verseText}
                onChange={(e) => handleInspChange('verseText', e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Ayet metni ve Türkçe mealini girin..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Sure / Ayet No</label>
              <input
                type="text"
                value={inspForm.verseReference}
                onChange={(e) => handleInspChange('verseReference', e.target.value)}
                className={inputClass}
                placeholder="Örn: İnşirah Suresi 6. Ayet"
              />
            </div>
          </div>

          {/* Hadith */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-[#C5A880]" />
              <span className="text-sm font-semibold text-[#2D2A26]">Hadis-i Şerif</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Hadis Metni</label>
              <textarea
                value={inspForm.hadithText}
                onChange={(e) => handleInspChange('hadithText', e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Hadis-i şerif metnini girin..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Kaynak</label>
              <input
                type="text"
                value={inspForm.hadithSource}
                onChange={(e) => handleInspChange('hadithSource', e.target.value)}
                className={inputClass}
                placeholder="Örn: Buhari, Müslim"
              />
            </div>
          </div>

          {/* Toggle visibility */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={inspForm.published}
                onClick={() => handleInspChange('published', !inspForm.published)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  inspForm.published ? 'bg-[#C5A880]' : 'bg-[#2D2A26]/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    inspForm.published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <span className="text-sm font-medium text-[#2D2A26]">Ana Sayfada Yayınla</span>
                <p className="text-[11px] text-[#2D2A26]/50">
                  {inspForm.published ? 'Kart ana sayfada görünür' : 'Kart ana sayfada gizli'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
            <Check size={16} />✅ Güncellemeler başarıyla kaydedildi!
          </div>
        )}

        {/* ===== Şifre Değiştir (Change Password) ===== */}
        <div className="border-t-2 border-[#C5A880]/20 pt-4 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-[#C5A880]" />
            <h3 className="font-serif text-lg text-[#2D2A26]">Şifre Değiştir</h3>
          </div>
          <p className="text-xs text-[#2D2A26]/50 mb-4">
            Hesabınızın şifresini güvenli şekilde güncelleyin. Oturumunuz açık kalacaktır.
          </p>

          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Yeni Şifre</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/40 hover:text-[#C5A880] transition-colors"
                  aria-label={showNewPassword ? 'Gizle' : 'Göster'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Yeni Şifre (Tekrar)</label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Şifreyi tekrar girin"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>
            )}
            {passwordSaved && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                <Check size={16} />✅ Şifreniz başarıyla güncellendi!
              </div>
            )}

            <button type="submit" className="w-full py-3 rounded-lg bg-[#2D2A26] text-[#FAF6F0] text-sm font-medium hover:bg-[#2D2A26]/90 transition-colors flex items-center justify-center gap-2">
              <Save size={16} />Güncelle
            </button>
          </form>
        </div>

        <button type="submit" className="w-full py-3 rounded-lg bg-[#C5A880] text-white text-sm font-medium hover:bg-[#C5A880]/90 transition-colors flex items-center justify-center gap-2">
          <Save size={16} />KAYDET
        </button>
      </form>
    </div>
  );
}

// ===================== ADMINS MANAGER (Yönetici Hesapları) =====================

interface AdminsManagerProps {
  admins: import('../types').AdminAccount[];
  onAdd: (admin: Omit<import('../types').AdminAccount, 'id'>) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  isSuperadmin: boolean;
}

function AdminsManager({ admins, onAdd, onDelete, isSuperadmin }: AdminsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) { setError('Kullanıcı adı zorunludur.'); return; }
    if (!displayName.trim()) { setError('Görünen ad zorunludur.'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }

    const result = onAdd({
      username: username.trim(),
      displayName: displayName.trim(),
      password,
      role: 'admin',
    });

    if (result.success) {
      setSuccess(`"${displayName}" adlı yönetici başarıyla eklendi. Artık giriş yapabilir.`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setShowForm(false);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(result.error ?? 'Bir hata oluştu.');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCog size={20} className="text-[#C5A880]" />
        <h2 className="font-serif text-xl text-[#2D2A26]">Yönetici Hesapları</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
          <Check size={16} />{success}
        </div>
      )}

      {/* Add button / form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full mb-4 py-3 rounded-xl bg-[#C5A880] text-white font-medium hover:bg-[#C5A880]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
          <Plus size={18} />+ YÖNETİCİ EKLE
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 border-2 border-[#C5A880]/25 space-y-4 mb-4">
          <BackButton onClick={() => { setShowForm(false); setError(''); }} />
          <h3 className="font-serif text-lg text-[#2D2A26]">Yeni Yönetici</h3>

          <div>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Kullanıcı Adı</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="kullanici_adi" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Görünen Ad</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Ad Soyad" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Şifre</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="En az 6 karakter" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2A26]/40 hover:text-[#C5A880] transition-colors">
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <SaveCancelButtons onCancel={() => { setShowForm(false); setError(''); }} />
        </form>
      )}

      {/* Admin list */}
      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-xl p-3 shadow-sm border-2 border-[#C5A880]/25 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${admin.role === 'superadmin' ? 'bg-[#2D2A26]' : 'bg-gradient-to-br from-[#C5A880] to-[#B8935A]'}`}>
              <span className="font-serif text-base text-white">{admin.displayName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-sm text-[#2D2A26] truncate">{admin.displayName}</h3>
              <p className="text-xs text-[#2D2A26]/50 truncate">@{admin.username}</p>
              <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                admin.role === 'superadmin' ? 'bg-[#2D2A26] text-[#C5A880]' : 'bg-[#C5A880]/10 text-[#C5A880]'
              }`}>
                {admin.role === 'superadmin' ? 'Süper Admin' : 'Admin'}
              </span>
            </div>
            {admin.role !== 'superadmin' && isSuperadmin && (
              <button
                onClick={() => {
                  if (confirm(`"${admin.displayName}" adlı yöneticiyi silmek istediğinizden emin misiniz?`)) onDelete(admin.id);
                }}
                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                aria-label="Sil"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== NEWS MANAGER =====================

interface NewsManagerProps {
  news: NewsItem[];
  onAdd: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  onUpdate: (id: string, updates: Partial<NewsItem>) => void;
  onDelete: (id: string) => void;
}

function NewsManager({ news, onAdd, onUpdate, onDelete }: NewsManagerProps) {
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleClose = () => { setEditing(null); setShowForm(false); };

  if (showForm || editing) {
    return <NewsForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={handleClose} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Haber Ekle" onClick={() => setShowForm(true)} />
      {news.length === 0 ? (
        <EmptyState icon={Newspaper} text="Henüz haber eklenmemiş." />
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border-2 border-[#C5A880]/25 flex gap-3">
              {item.imageBase64 ? (
                <img src={item.imageBase64} alt={item.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[#C5A880]/10 flex items-center justify-center shrink-0">
                  <Newspaper size={20} className="text-[#C5A880]/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-[#C5A880] uppercase tracking-wide">{item.category}</span>
                <h3 className="font-serif text-sm text-[#2D2A26] truncate">{item.title}</h3>
                <p className="text-xs text-[#2D2A26]/50 truncate mt-0.5">{item.content}</p>
                <p className="text-[10px] text-[#2D2A26]/40 mt-1">{new Date(item.date).toLocaleDateString('tr-TR')}</p>
              </div>
              <ActionButtons onEdit={() => setEditing(item)} onDelete={() => { if (confirm('Bu haberi silmek istediğinizden emin misiniz?')) onDelete(item.id); }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== NEWS FORM =====================

interface NewsFormProps {
  item: NewsItem | null;
  onAdd: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  onUpdate: (id: string, updates: Partial<NewsItem>) => void;
  onClose: () => void;
}

function NewsForm({ item, onAdd, onUpdate, onClose }: NewsFormProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [category, setCategory] = useState(item?.category ?? 'Duyuru');
  const [imageBase64, setImageBase64] = useState<string | undefined>(item?.imageBase64);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const base64 = await fileToOptimizedBase64(file);
      setImageBase64(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resim yüklenemedi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Başlık zorunludur.'); return; }
    if (!content.trim()) { setError('İçerik zorunludur.'); return; }
    const data = { title: title.trim(), content: content.trim(), category: category.trim() || 'Duyuru', imageBase64 };
    if (item) onUpdate(item.id, data); else onAdd(data);
    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-serif text-xl text-[#2D2A26]">{item ? 'Haberi Düzenle' : 'Yeni Haber'}</h2>

        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Resim (opsiyonel)</label>
          {imageBase64 ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-[#C5A880]/25">
              <img src={imageBase64} alt="Preview" className="w-full h-40 object-cover" />
              <button type="button" onClick={() => setImageBase64(undefined)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors" aria-label="Resmi kaldır">
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-[#C5A880]/30 hover:border-[#C5A880]/50 hover:bg-[#C5A880]/5 cursor-pointer transition-all">
              <div className="flex flex-col items-center gap-1.5">
                {uploading ? <div className="w-6 h-6 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" /> : <Upload size={20} className="text-[#C5A880]/60" />}
                <span className="text-xs text-[#2D2A26]/50">{uploading ? 'Yükleniyor...' : 'Resim seçmek için dokunun'}</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Başlık</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Haber başlığı" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Kategori</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="Duyuru">Duyuru</option>
            <option value="Etkinlik">Etkinlik</option>
            <option value="Eğitim">Eğitim</option>
            <option value="Namaz">Namaz</option>
            <option value="Ramazan">Ramazan</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">İçerik</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className={`${inputClass} resize-none`} placeholder="Haber içeriği..." />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}

// ===================== SOHBET MANAGER =====================

interface SohbetManagerProps {
  sohbet: SohbetItem[];
  onAdd: (item: Omit<SohbetItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<SohbetItem>) => void;
  onDelete: (id: string) => void;
}

function SohbetManager({ sohbet, onAdd, onUpdate, onDelete }: SohbetManagerProps) {
  const [editing, setEditing] = useState<SohbetItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleClose = () => { setEditing(null); setShowForm(false); };

  if (showForm || editing) {
    return <SohbetForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={handleClose} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Sohbet / Ders Ekle" onClick={() => setShowForm(true)} />
      {sohbet.length === 0 ? (
        <EmptyState icon={Mic} text="Henüz sohbet/ders eklenmemiş." />
      ) : (
        <div className="space-y-3">
          {sohbet.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border-2 border-[#C5A880]/25 flex gap-3">
              <div className="w-14 h-14 rounded-lg bg-[#2D2A26] flex flex-col items-center justify-center shrink-0 text-[#FAF6F0]">
                <span className="text-[9px] uppercase text-[#C5A880]">{new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                <span className="font-serif text-lg leading-none">{new Date(item.date).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm text-[#2D2A26] truncate">{item.title}</h3>
                <p className="text-xs text-[#2D2A26]/50 truncate mt-0.5">{item.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#2D2A26]/40">
                  <span className="tabular-nums">{item.time}</span><span>·</span><span className="truncate">{item.speaker}</span>
                </div>
              </div>
              <ActionButtons onEdit={() => setEditing(item)} onDelete={() => { if (confirm('Bu programı silmek istediğinizden emin misiniz?')) onDelete(item.id); }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SOHBET FORM =====================

interface SohbetFormProps {
  item: SohbetItem | null;
  onAdd: (item: Omit<SohbetItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<SohbetItem>) => void;
  onClose: () => void;
}

function SohbetForm({ item, onAdd, onUpdate, onClose }: SohbetFormProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [date, setDate] = useState(item?.date ?? new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(item?.time ?? '19:00');
  const [location, setLocation] = useState(item?.location ?? 'Dernek Merkezi - Drammen');
  const [speaker, setSpeaker] = useState(item?.speaker ?? '');
  const [imageBase64, setImageBase64] = useState<string | undefined>(item?.imageBase64);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const base64 = await fileToOptimizedBase64(file);
      setImageBase64(base64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resim yüklenemedi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Başlık zorunludur.'); return; }
    if (!description.trim()) { setError('Açıklama zorunludur.'); return; }
    if (!speaker.trim()) { setError('Konuşmacı zorunludur.'); return; }
    const data = { title: title.trim(), description: description.trim(), date, time, location: location.trim() || 'Dernek Merkezi - Drammen', speaker: speaker.trim(), imageBase64 };
    if (item) onUpdate(item.id, data); else onAdd(data);
    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-serif text-xl text-[#2D2A26]">{item ? 'Sohbet/Ders Düzenle' : 'Yeni Sohbet / Ders'}</h2>

        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Resim (opsiyonel)</label>
          {imageBase64 ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-[#C5A880]/25">
              <img src={imageBase64} alt="Preview" className="w-full h-40 object-cover" />
              <button type="button" onClick={() => setImageBase64(undefined)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors" aria-label="Resmi kaldır">
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-[#C5A880]/30 hover:border-[#C5A880]/50 hover:bg-[#C5A880]/5 cursor-pointer transition-all">
              <div className="flex flex-col items-center gap-1.5">
                {uploading ? <div className="w-6 h-6 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" /> : <Upload size={20} className="text-[#C5A880]/60" />}
                <span className="text-xs text-[#2D2A26]/50">{uploading ? 'Yükleniyor...' : 'Resim seçmek için dokunun'}</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Başlık</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Sohbet/Ders başlığı" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Açıklama</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="Program açıklaması..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Saat</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Konum</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Konum" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Konuşmacı</label>
          <input type="text" value={speaker} onChange={(e) => setSpeaker(e.target.value)} className={inputClass} placeholder="Örn: İmam Mehmet Demir" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}

// ===================== STAFF MANAGER =====================

interface StaffManagerProps {
  staff: StaffMember[];
  onAdd: (member: Omit<StaffMember, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<StaffMember>) => void;
  onDelete: (id: string) => void;
}

function StaffManager({ staff, onAdd, onUpdate, onDelete }: StaffManagerProps) {
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleClose = () => { setEditing(null); setShowForm(false); };

  if (showForm || editing) {
    return <StaffForm member={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={handleClose} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Personel Ekle" onClick={() => setShowForm(true)} />
      {staff.length === 0 ? (
        <EmptyState icon={Users} text="Henüz personel eklenmemiş." />
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member.id} className="bg-white rounded-xl p-3 shadow-sm border-2 border-[#C5A880]/25 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A880] to-[#B8935A] flex items-center justify-center shrink-0">
                <span className="font-serif text-lg text-white">{member.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm text-[#2D2A26] truncate">{member.name}</h3>
                <p className="text-xs text-[#C5A880] font-medium">{member.position}</p>
                {member.phone && <p className="text-xs text-[#2D2A26]/50 truncate mt-0.5">{member.phone}</p>}
              </div>
              <ActionButtons onEdit={() => setEditing(member)} onDelete={() => { if (confirm('Bu personeli silmek istediğinizden emin misiniz?')) onDelete(member.id); }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== STAFF FORM =====================

interface StaffFormProps {
  member: StaffMember | null;
  onAdd: (member: Omit<StaffMember, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<StaffMember>) => void;
  onClose: () => void;
}

function StaffForm({ member, onAdd, onUpdate, onClose }: StaffFormProps) {
  const [name, setName] = useState(member?.name ?? '');
  const [position, setPosition] = useState(member?.position ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('İsim zorunludur.'); return; }
    if (!position.trim()) { setError('Görev zorunludur.'); return; }
    const data = { name: name.trim(), position: position.trim(), phone: phone.trim() };
    if (member) onUpdate(member.id, data); else onAdd(data);
    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-serif text-xl text-[#2D2A26]">{member ? 'Personeli Düzenle' : 'Yeni Personel'}</h2>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">İsim Soyisim</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ad Soyad" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Görev</label>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className={inputClass} placeholder="Örn: İmam Hatip, Başkan, Yönetim Kurulu Üyesi" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2D2A26]/70 mb-1.5">Telefon</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+47 123 45 678" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <SaveCancelButtons onCancel={onClose} />
      </form>
    </div>
  );
}
