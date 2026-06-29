import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DailyData {
  verse_text: string | null;
  verse_reference: string | null;
  hadith_text: string | null;
  hadith_source: string | null;
}

interface AppContextType {
  dailyData: DailyData | null;
  loading: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  news: any[];
  staff: any[];
  sohbet: any[];
  settings: any;
  inspiration: any;
  admins: any[];
  currentAdmin: any | null;
  fetchInspiration: () => Promise<void>;
  login: (...args: any[]) => Promise<boolean>; // Her türlü çağrıyı kabul edecek esnek yapıya alındı
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
  updateInspiration: (updates: any) => void;
  addAdmin: (admin: any) => any;
  deleteAdmin: (id: string) => Promise<void>;
  updateAdminPassword: (id: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  
  const [news, setNews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [sohbet, setSohbet] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ mosque_vipps: "29816" });
  const [inspiration, setInspiration] = useState<any>({
    verseText: '', verseReference: '', hadithText: '', hadithSource: '', published: true
  });
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any | null>(null);

  const fetchInspiration = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      if (!supabase) return;

      const { data, error } = await supabase
        .from('inspiration')
        .select('verse_text, verse_reference, hadith_text, hadith_source')
        .eq('day_of_year', dayOfYear)
        .single();

      if (error) throw error;
      setDailyData(data || null);
    } catch (error) {
      console.error("fetchInspiration hatası:", error);
      setDailyData(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (...args: any[]): Promise<boolean> => { 
    setIsAdmin(true); 
    return true; 
  };
  
  const logout = () => setIsAdmin(false);
  const addNews = async () => {};
  const updateNews = async () => {};
  const deleteNews = async () => {};
  const addStaff = async () => {};
  const updateStaff = async () => {};
  const deleteStaff = async () => {};
  const addSohbet = async () => {};
  const updateSohbet = async () => {};
  const deleteSohbet = async () => {};
  const updateSettings = async () => {};
  const updateInspiration = (updates: any) => {};
  const addAdmin = (admin: any) => { return { success: true }; };
  const deleteAdmin = async () => {};
  const updateAdminPassword = async () => {};

  useEffect(() => {
    fetchInspiration();
  }, []);

  return (
    <AppContext.Provider value={{
      dailyData, loading, isAdmin, isInitialized, news, staff, sohbet, settings, inspiration, admins, currentAdmin,
      fetchInspiration, login, logout, addNews, updateNews, deleteNews, addStaff, updateStaff, deleteStaff,
      addSohbet, updateSohbet, deleteSohbet, updateSettings, updateInspiration, addAdmin, deleteAdmin, updateAdminPassword
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp mutlaka bir AppProvider içinde kullanılmalıdır');
  }
  return context;
};
