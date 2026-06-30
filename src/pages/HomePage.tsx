import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  ChevronRight,
  Newspaper,
  BookOpen,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudSun,
  Mic,
  User,
  Crosshair,
  ChevronDown,
  Check,
  Search,
  Loader2,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNextPrayer, getTimeUntil } from '../lib/prayerTimes';
import { useClock } from '../lib/useClock';
import { useLocation } from '../lib/useLocation';
import { NewsModal } from '../components/NewsModal';
import { SohbetModal } from '../components/SohbetModal';
import { InstallAppButton } from '../components/InstallAppButton';
import { supabase } from '../lib/supabase';
import type { NewsItem, SohbetItem } from '../types';

type NewsWithDbImage = NewsItem & { image_base64?: string };
type SohbetWithDbImage = SohbetItem & { image_base64?: string };

export function HomePage() {
  const { news, sohbet, settings } = useApp();

  const [dailyData, setDailyData] = useState<{
    verse_text?: string;
    verse_reference?: string;
    hadith_text?: string;
    hadith_source?: string;
  } | null>(null);

  const now = useClock();

  const {
    city,
    isAuto,
    loading,
    prayerData,
    showSelector,
    setShowSelector,
    searchQuery,
    searchResults,
    searching,
    handleSearch,
    selectCity,
    resetToAuto,
  } = useLocation();

  const [selectedNews, setSelectedNews] = useState<NewsWithDbImage | null>(null);
  const [selectedSohbet, setSelectedSohbet] = useState<SohbetWithDbImage | null>(null);

  useEffect(() => {
    async function fetchDailyInspiration() {
      try {
        if (!supabase) return;

        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = new Date().getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const { data, error } = await supabase
          .from('inspiration')
          .select('verse_text, verse_reference, hadith_text, hadith_source')
          .eq('day_of_year', dayOfYear)
          .single();

        if (!error && data) setDailyData(data);
      } catch (err) {
        console.error('Ayet/Hadis yüklenirken hata oluştu:', err);
      }
    }

    fetchDailyInspiration();
  }, [now.getDate()]);

  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  const timeUntil = nextPrayer ? getTimeUntil(nextPrayer.time) : null;

  const prayerItems = prayerData
    ? [
        { name: 'Imsak', time: prayerData.timings.Fajr, icon: Sunrise, color: '#C5A880' },
        { name: 'Güneş', time: prayerData.timings.Sunrise, icon: Sun, color: '#E8B86D' },
        { name: 'Öğle', time: prayerData.timings.Dhuhr, icon: CloudSun, color: '#D4A04C' },
        { name: 'İkindi', time: prayerData.timings.Asr, icon: Sun, color: '#C5A880' },
        { name: 'Akşam', time: prayerData.timings.Maghrib, icon: Sunset, color: '#B8935A' },
        { name: 'Yatsı', time: prayerData.timings.Isha, icon: Moon, color: '#8B7355' },
      ]
    : [];

  const featuredNews = (news || []).slice(0, 6) as NewsWithDbImage[];
  const upcomingSohbet = (sohbet || []).slice(0, 4) as SohbetWithDbImage[];

  return (
    <div className="min-h-screen pb-28">
      <header className="bg-[#2D2A26] text-[#FAF6F0] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2.5">
          <img src="/images/dtim-logo.svg" alt="DTIM" className="w-10 h-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-base leading-tight truncate">
              {settings?.mosqueName || 'Drammen Türk İnanç Cemiyeti'}
            </h1>
            <p className="text-[10px] text-[#C5A880] uppercase tracking-wider">
              {settings?.shortName || 'Norveç · Drammen'}
            </p>
          </div>
        </div>
      </header>

      {/* ... (Resten av koden forblir lik, men fixet dailyData seksjonen under) */}

      <section className="px-4 pt-4">
        {/* ... Location og Prayer Time seksjonene dine forblir her ... */}
      </section>

      <InstallAppButton />

      {dailyData && (
        <section className="px-4 mt-4">
          <div className="bg-[#2D2A26] rounded-xl p-5 text-[#FAF6F0]">
            {dailyData.verse_text && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-[#C5A880]" />
                  <h3 className="text-[#C5A880] text-[11px] font-bold uppercase">Bugünün Ayeti</h3>
                </div>
                <p className="text-sm italic mb-4">"{dailyData.verse_text}" <span className="text-[#C5A880]">({dailyData.verse_reference})</span></p>
              </>
            )}

            {dailyData.hadith_text && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-[#C5A880]" />
                  <h3 className="text-[#C5A880] text-[11px] font-bold uppercase">Bugünün Hadisi</h3>
                </div>
                <p className="text-sm">{dailyData.hadith_text}</p>
              </>
            )}
          </div>
        </section>
      )}

      {/* ... Sohbet og News seksjonene dine følger her ... */}
      
      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      <SohbetModal item={selectedSohbet} onClose={() => setSelectedSohbet(null)} />
    </div>
  );
}
