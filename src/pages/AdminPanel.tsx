import { useState, useRef, type FormEvent } from 'react';
import {
  X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus,
  Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';
import type { NewsItem, StaffMember, SohbetItem, MosqueSettings, AdminAccount } from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsManagerProps {
  settings: MosqueSettings;
  onUpdate: (updates: Partial<MosqueSettings>) => void;
  currentAdmin: AdminAccount | null;
  onUpdatePassword: (username: string, newPassword: string) => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const {
    news, staff, sohbet, settings, admins, currentAdmin, logout,
    addNews, updateNews, deleteNews,
    addStaff, updateStaff, deleteStaff,
    addSohbet, updateSohbet, deleteSohbet,
    updateSettings, addAdmin, deleteAdmin, updateAdminPassword,
  } = useApp();
  
  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  const handleLogout = () => { logout(); onClose(); };
  const isSuperadmin = currentAdmin?.role === 'superadmin';

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'news', label: 'Haberler', icon: Newspaper },
    { id: 'sohbet', label: 'Sohbet', icon: Mic },
    { id: 'staff', label: 'Kadro', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
    { id: 'admins', label: 'Yöneticiler', icon: UserCog },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
        <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="text-[#FAF6F0] text-xs flex items-center gap-1"><LogOut size={14}/>Çıkış</button>
          <button onClick={onClose}><X size={18} className="text-[#FAF6F0]" /></button>
        </div>
      </header>

      <div className="flex border-b border-[#C5A880]/20 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 p-3 text-xs font-medium ${tab === t.id ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'settings' && (
          <SettingsManager 
            settings={settings} 
            onUpdate={updateSettings} 
            currentAdmin={currentAdmin} 
            onUpdatePassword={updateAdminPassword} 
          />
        )}
        {/* Diğer manager'lar (NewsManager, SohbetManager vb.) buraya eklenecek */}
      </div>
    </div>
  );
}

function SettingsManager({ settings, onUpdate, currentAdmin, onUpdatePassword }: SettingsManagerProps) {
  const [form, setForm] = useState<MosqueSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-[#C5A880]/20">
        <h2 className="text-lg font-serif mb-4">Genel Ayarlar</h2>
        <div className="space-y-3">
          <label className="block text-xs">Cami Adı</label>
          <input className="w-full p-2 border rounded" value={form.mosqueName} onChange={(e) => setForm({...form, mosqueName: e.target.value})} />
          <button type="submit" className="w-full py-2 bg-[#C5A880] text-white rounded">Kaydet</button>
        </div>
      </form>
    </div>
  );
}
