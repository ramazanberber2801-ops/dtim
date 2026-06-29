import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AppContextType {
  news: any[];
  staff: any[];
  sohbet: any[];
  settings: any;
  inspiration: any;
  admins: any[];
  currentAdmin: any | null;
  loading: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  login: (u: string, p: string, r?: string) => Promise<boolean>;
  logout: () => void;
  addNews: (item: any) => Promise<void>;
  updateNews: (id: string, item: any) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addStaff: (item: any) => Promise<void>;
  updateStaff: (id: string, item: any) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addSohbet: (item: any) => Promise<void>;
  updateSohbet: (id: string, item: any) => Promise<void>;
  deleteSohbet: (id: string) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  updateInspiration: (updates: any) => Promise<void>;
  addAdmin: (admin: any) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  updateAdminPassword: (id: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [news, setNews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [sohbet, setSohbet] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ vippsNumber: '29816' });
  const [inspiration, setInspiration] = useState<any>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isInitialized] = useState<boolean>(true);

  const mapSettingsFromDb = (row: any) => ({
    id: row.id,
    mosqueName: row.mosque_name || '',
    shortName: row.short_name || '',
    vippsNumber: row.vipps_number || '',
    address: row.address || '',
    mapUrl: row.map_url || '',
    phone: row.phone || '',
    whatsappNumber: row.whatsapp_number || '',
    bankAccount: row.bank_account || '',
    iban: row.iban || '',
  });

  const mapSettingsToDb = (s: any) => ({
    mosque_name: s.mosqueName || '',
    short_name: s.shortName || '',
    vipps_number: s.vippsNumber || '',
    address: s.address || '',
    map_url: s.mapUrl || '',
    phone: s.phone || '',
    whatsapp_number: s.whatsappNumber || '',
    bank_account: s.bankAccount || '',
    iban: s.iban || '',
  });

  const loadAllData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [n, s, soh, insp, a, setRes] = await Promise.all([
        supabase.from('news').select('*'),
        supabase.from('staff').select('*'),
        supabase.from('sohbet').select('*'),
        supabase.from('inspiration').select('*').limit(1).maybeSingle(),
        supabase.from('admins').select('*'),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
      ]);

      if (n.data) setNews(n.data);
      if (s.data) setStaff(s.data);
      if (soh.data) setSohbet(soh.data);
      if (insp.data) setInspiration(insp.data);
      if (a.data) setAdmins(a.data);
      if (setRes.data) setSettings(mapSettingsFromDb(setRes.data));
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const login = async (u: string, p: string): Promise<boolean> => {
    if (!supabase) return false;

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', u)
      .eq('password', p)
      .maybeSingle();

    if (data && !error) {
      setCurrentAdmin(data);
      setIsAdmin(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setCurrentAdmin(null);
  };

  const addNews = async (item: any) => {
    if (!supabase) return;
    await supabase.from('news').insert(item);
    await loadAllData();
  };

  const updateNews = async (id: string, item: any) => {
    if (!supabase) return;
    await supabase.from('news').update(item).eq('id', id);
    await loadAllData();
  };

  const deleteNews = async (id: string) => {
    if (!supabase) return;
    await supabase.from('news').delete().eq('id', id);
    await loadAllData();
  };

  const addStaff = async (item: any) => {
    if (!supabase) return;
    await supabase.from('staff').insert(item);
    await loadAllData();
  };

  const updateStaff = async (id: string, item: any) => {
    if (!supabase) return;
    await supabase.from('staff').update(item).eq('id', id);
    await loadAllData();
  };

  const deleteStaff = async (id: string) => {
    if (!supabase) return;
    await supabase.from('staff').delete().eq('id', id);
    await loadAllData();
  };

  const addSohbet = async (item: any) => {
    if (!supabase) return;
    await supabase.from('sohbet').insert(item);
    await loadAllData();
  };

  const updateSohbet = async (id: string, item: any) => {
    if (!supabase) return;
    await supabase.from('sohbet').update(item).eq('id', id);
    await loadAllData();
  };

  const deleteSohbet = async (id: string) => {
    if (!supabase) return;
    await supabase.from('sohbet').delete().eq('id', id);
    await loadAllData();
  };

  const updateSettings = async (s: any) => {
    setSettings(s);

    if (!supabase) return;

    const dbSettings = mapSettingsToDb(s);
    const id = s.id || 1;

    await supabase
      .from('settings')
      .update(dbSettings)
      .eq('id', id);

    await loadAllData();
  };

  const updateInspiration = async (updates: any) => {
    if (!supabase || !inspiration?.id) return;
    await supabase.from('inspiration').update(updates).eq('id', inspiration.id);
    await loadAllData();
  };

  const addAdmin = async (admin: any) => {
    if (!supabase) return;
    await supabase.from('admins').insert(admin);
    await loadAllData();
  };

  const deleteAdmin = async (id: string) => {
    if (!supabase) return;
    await supabase.from('admins').delete().eq('id', id);
    await loadAllData();
  };

  const updateAdminPassword = async (id: string, newPassword: string) => {
    if (!supabase) return;
    await supabase.from('admins').update({ password: newPassword }).eq('id', id);
    await loadAllData();
  };

  return (
    <AppContext.Provider
      value={{
        news,
        staff,
        sohbet,
        settings,
        inspiration,
        admins,
        currentAdmin,
        loading,
        isAdmin,
        isInitialized,
        login,
        logout,
        addNews,
        updateNews,
        deleteNews,
        addStaff,
        updateStaff,
        deleteStaff,
        addSohbet,
        updateSohbet,
        deleteSohbet,
        updateSettings,
        updateInspiration,
        addAdmin,
        deleteAdmin,
        updateAdminPassword,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp, AppProvider içinde kullanılmalı');
  return context;
};
