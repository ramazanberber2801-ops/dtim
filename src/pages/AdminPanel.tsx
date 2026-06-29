import { useState, type FormEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'news' | 'sohbet' | 'staff' | 'settings' | 'admins';

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { news, staff, sohbet, settings, addNews, addStaff, addSohbet, updateSettings } = useApp();
  const [tab, setTab] = useState<AdminTab>('news');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#FAF6F0] flex flex-col">
      <header className="bg-[#2D2A26] px-5 py-4 flex items-center justify-between shrink-0">
        <h1 className="font-serif text-lg text-[#FAF6F0]">Yönetim Paneli</h1>
        <button onClick={onClose} className="text-[#FAF6F0]"><X size={24} /></button>
      </header>

      <div className="flex border-b border-[#C5A880]/20 bg-white overflow-x-auto">
        {(['news', 'sohbet', 'staff', 'settings', 'admins'] as AdminTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest ${tab === t ? 'text-[#C5A880] border-b-2 border-[#C5A880]' : 'text-[#2D2A26]/40'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'news' && <ManagerList title="Haberler" data={news} onAdd={() => addNews({ title: 'Yeni Haber', content: '' })} />}
        {tab === 'sohbet' && <ManagerList title="Sohbetler" data={sohbet} onAdd={() => addSohbet({ title: 'Yeni Sohbet' })} />}
        {tab === 'staff' && <ManagerList title="Kadro" data={staff} onAdd={() => addStaff({ name: 'Yeni Üye' })} />}
        {tab === 'settings' && <SettingsManager settings={settings} onUpdate={updateSettings} />}
      </div>
    </div>
  );
}

// Genel Liste Yönetimi (Haber/Sohbet/Kadro için)
function ManagerList({ title, data, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-lg">{title}</h2>
        <button onClick={onAdd} className="bg-[#C5A880] text-white p-2 rounded-full shadow-lg"><Plus size={20} /></button>
      </div>
      {data.map((item: any) => (
        <div key={item.id} className="bg-white p-4 rounded-xl border border-[#C5A880]/10 shadow-sm">
          {item.title || item.name}
        </div>
      ))}
    </div>
  );
}

// Ayarlar Yönetimi (Görseldeki tüm alanlar)
function SettingsManager({ settings, onUpdate }: any) {
  const [form, setForm] = useState(settings || {});
  return (
    <form onSubmit={(e) => { e.preventDefault(); onUpdate(form); alert("Kaydedildi!"); }} className="space-y-4">
      <input className="w-full p-3 rounded-xl border" placeholder="Cami Adı" value={form.mosqueName || ''} onChange={e => setForm({...form, mosqueName: e.target.value})} />
      <input className="w-full p-3 rounded-xl border" placeholder="Vipps Numarası" value={form.vippsNumber || ''} onChange={e => setForm({...form, vippsNumber: e.target.value})} />
      <input className="w-full p-3 rounded-xl border" placeholder="WhatsApp" value={form.whatsapp || ''} onChange={e => setForm({...form, whatsapp: e.target.value})} />
      <input className="w-full p-3 rounded-xl border" placeholder="Telefon" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
      <input className="w-full p-3 rounded-xl border" placeholder="E-posta" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
      <button type="submit" className="w-full bg-[#2D2A26] text-white p-4 rounded-xl font-bold">DEĞİŞİKLİKLERİ KAYDET</button>
    </form>
  );
}
