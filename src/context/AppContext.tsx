import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon,
  UserCog, Check, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26] placeholder-[#2D2A26]/30 focus:outline-none focus:border-[#C5A880]";

/* --- YARDIMCI BİLEŞENLER --- */
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

/* --- YÖNETİM BİLEŞENLERİ --- */

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
        <h2 className="font-serif text-xl">{item ? 'Haberi Düzenle' : 'Yeni Haber'}</h2>
        {imageBase64 ? (
          <div className="relative"><img src={imageBase64} className="w-full h-40 object-cover rounded-xl" /><button type="button" onClick={() => setImageBase64('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2"><Trash2 size={14}/></button></div>
        ) : (
          <label className="h-32 border-2 border-dashed border-[#C5A880]/30 rounded-xl flex flex-col items-center justify-center cursor-pointer"><Upload size={20}/><span className="text-xs text-[#2D2A26]/50 mt-2">Resim Seç</span><input type="file" ref={fileRef} onChange={uploadImage} className="hidden" /></label>
        )}
        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık" required />
        <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}><option>Duyuru</option><option>Etkinlik</option><option>Eğitim</option><option>Ramazan</option></select>
        <textarea className={`${inputClass} resize-none`} rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="İçerik" required />
        <SaveCancelButtons onCancel={onClose} saving={isSaving} />
      </form>
    </div>
  );
}

// (Diğer Manager bileşenlerini buraya aynı yapıda ekleyebilirsiniz: SohbetManager, StaffManager, SettingsManager, AdminsManager)

/* --- ANA PANEL BİLEŞENİ --- */

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { news, staff, sohbet, settings, admins, currentAdmin, logout, addNews, updateNews, deleteNews } = useApp();
  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
         {/* Başlık ve Çıkış butonları... */}
         <button onClick={onClose} className="text-white">Kapat</button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'news' && <NewsManager items={news} onAdd={addNews} onUpdate={updateNews} onDelete={deleteNews} />}
        {/* Diğer sekmeler... */}
      </main>
    </div>
  );
}
