import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon,
  UserCog, Check, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880]";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    news, staff, sohbet, settings, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, addAdmin, deleteAdmin, updateAdminPassword
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const isSuperadmin = currentAdmin?.role === 'superadmin';

  const handleLogout = () => {
    logout();
    onClose();
  };

  const tabs = [
    { id: 'news' as AdminTab, label: 'Haberler', icon: Newspaper },
    { id: 'sohbet' as AdminTab, label: 'Sohbet/Ders', icon: Mic },
    { id: 'staff' as AdminTab, label: 'Yönetim', icon: Users },
    { id: 'settings' as AdminTab, label: 'Ayarlar', icon: SettingsIcon },
    { id: 'admins' as AdminTab, label: 'Yöneticiler', icon: UserCog },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A880]/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-[#C5A880]" />
          </div>
          <div>
            <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
            <p className="text-[10px] text-[#FAF6F0]/50">
              {currentAdmin?.displayName || currentAdmin?.username || 'Admin'} · {isSuperadmin ? 'Süper Admin' : 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF6F0]/10 text-[#FAF6F0] text-xs">
            <LogOut size={14} /> Çıkış
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-[#FAF6F0]/10 flex items-center justify-center">
            <X size={18} className="text-[#FAF6F0]" />
          </button>
        </div>
      </header>

      <div className="flex border-b-2 border-[#C5A880]/20 bg-white shrink-0 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[78px] flex items-center justify-center gap-1.5 py-3 text-xs font-medium relative ${
                tab === t.id ? 'text-[#C5A880]' : 'text-[#2D2A26]/40'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A880]" />}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto">
        {tab === 'news' && <NewsManager items={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {tab === 'sohbet' && <SohbetManager items={sohbet} onAdd={addSohbet} onUpdate={updateSohbet} onDelete={deleteSohbet} />}
        {tab === 'staff' && <StaffManager items={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} currentAdmin={currentAdmin} onUpdatePassword={updateAdminPassword} />}
        {tab === 'admins' && <AdminsManager admins={admins} onAdd={addAdmin} onDelete={deleteAdmin} isSuperadmin={isSuperadmin} />}
      </main>
    </div>
  );
}

// ... Yardımcı bileşenler (BackButton, AddButton, ActionButtons, SaveCancelButtons, EmptyState) aynı kalabilir ...

function BackButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-[#2D2A26]/60 mb-4"><ArrowLeft size={16} /> Geri</button>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full mb-4 py-3 rounded-xl bg-[#C5A880] text-white font-medium flex items-center justify-center gap-2"><Plus size={18} /> {label}</button>;
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-[#C5A880]/10 flex items-center justify-center"><Edit3 size={14} className="text-[#C5A880]" /></button>
      <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-red-500" /></button>
    </div>
  );
}

function SaveCancelButtons({ onCancel, saving }: { onCancel: () => void, saving?: boolean }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg bg-white border border-[#C5A880]/30 text-sm">İptal</button>
      <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-[#C5A880] text-white text-sm font-medium flex items-center justify-center gap-2">
        <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="bg-white rounded-xl p-8 text-center border-2 border-[#C5A880]/25"><p className="text-sm text-[#2D2A26]/50">{text}</p></div>;
}

/* NEWS MANAGED */
function NewsManager({ items, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <NewsForm item={editing} onAdd={onAdd} onUpdate={onUpdate} onClose={() => { setEditing(null); setShowForm(false); }} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Haber Ekle" onClick={() => setShowForm(true)} />
      {items.length === 0 ? <EmptyState text="Henüz haber eklenmemiş." /> : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border-2 border-[#C5A880]/25 flex gap-3">
              {item.image_base64 && <img src={item.image_base64} className="w-16 h-16 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#C5A880] uppercase">{item.category}</span>
                <h3 className="font-serif text-sm truncate">{item.title}</h3>
                <p className="text-xs text-[#2D2A26]/50 truncate">{item.content}</p>
              </div>
              <ActionButtons onEdit={() => setEditing(item)} onDelete={() => { if (confirm('Silmek istiyor musunuz?')) onDelete(item.id); }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsForm({ item, onAdd, onUpdate, onClose }: any) {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [category, setCategory] = useState(item?.category || 'Duyuru');
  const [imageBase64, setImageBase64] = useState(item?.image_base64 || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToOptimizedBase64(file);
      setImageBase64(base64);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = { title, content, category, image_base64: imageBase64, date: item?.date || new Date().toISOString() };
    if (item) await onUpdate(item.id, data);
    else await onAdd(data);
    onClose();
  };

  return (
    <div className="p-4">
      <BackButton onClick={onClose} />
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-serif text-xl">{item ? 'Düzenle' : 'Yeni Haber'}</h2>
        {imageBase64 ? (
          <div className="relative"><img src={imageBase64} className="w-full h-40 object-cover rounded-xl" /><button type="button" onClick={() => setImageBase64('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2"><Trash2 size={14}/></button></div>
        ) : (
          <label className="h-32 border-2 border-dashed border-[#C5A880]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer"><Upload size={20}/><input type="file" onChange={uploadImage} className="hidden" /></label>
        )}
        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" required />
        <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}><option>Duyuru</option><option>Etkinlik</option></select>
        <textarea className={inputClass} rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="İçerik" required />
        <SaveCancelButtons onCancel={onClose} saving={isSaving} />
      </form>
    </div>
  );
}

// ... (SohbetManager, StaffManager, SettingsManager, AdminsManager aynı mantıkla korunabilir)
