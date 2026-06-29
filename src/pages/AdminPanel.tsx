import { useState, useRef, type FormEvent } from 'react';
import { X, Newspaper, UserPlus, Users, LogOut, Trash2, Edit3, Plus, Upload, Save, ArrowLeft, ShieldCheck, Mic, Settings as SettingsIcon, UserCog, Check, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToOptimizedBase64 } from '../lib/imageUtils';

// 1. Önce yardımcı bileşenleri tanımlayalım (Hata TS2304 çözümü)
const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-[#C5A880]/20 text-sm text-[#2D2A26]";

function BackButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-[#2D2A26]/60 mb-4"><ArrowLeft size={16} />Geri</button>;
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <button onClick={onEdit} className="p-2 rounded-lg bg-[#C5A880]/10"><Edit3 size={14} className="text-[#C5A880]" /></button>
      <button onClick={onDelete} className="p-2 rounded-lg bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full mb-4 py-3 rounded-xl bg-[#C5A880] text-white font-medium flex items-center justify-center gap-2">
      <Plus size={18} />{label}
    </button>
  );
}

// 2. Ana AdminPanel bileşeni
export function AdminPanel({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { news, staff, sohbet, settings, addNews, addStaff, addSohbet } = useApp();
  const [tab, setTab] = useState('news');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between">
        <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
        <button onClick={onClose}><X size={24} className="text-white" /></button>
      </header>

      <div className="flex border-b bg-white">
        {['news', 'sohbet', 'staff'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-xs uppercase ${tab === t ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'news' && <div className="text-sm">Haberler yönetimi (Burayı geliştirebilirsiniz)</div>}
        {tab === 'sohbet' && <div className="text-sm">Sohbetler yönetimi</div>}
        {tab === 'staff' && <div className="text-sm">Kadro yönetimi</div>}
      </div>
    </div>
  );
}
