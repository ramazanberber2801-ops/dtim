import { useState, useEffect, useCallback, useRef } from 'react';
import type { PrayerData } from '../types';
import { fetchPrayerTimes } from './prayerTimes';

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface SelectedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'dtim_selected_city';

const DEFAULT_CITY: SelectedCity = {
  name: 'Drammen',
  country: 'Norway',
  latitude: 59.7440,
  longitude: 10.2045,
};

function loadStoredCity(): { city: SelectedCity; isAuto: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { city: parsed.city, isAuto: parsed.isAuto };
    }
  } catch { /* ignore */ }
  return { city: DEFAULT_CITY, isAuto: false }; // Varsayılanı otomatik yerine kontrollü false başlatalım
}

function saveStoredCity(city: SelectedCity, isAuto: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, isAuto }));
  } catch { /* ignore */ }
}

export function useLocation() {
  const initial = loadStoredCity();
  const [city, setCity] = useState<SelectedCity>(initial.city);
  const [isAuto, setIsAuto] = useState(initial.isAuto);
  const [loading, setLoading] = useState(true);
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Namaz vakitlerini getiren ana fonksiyon
  useEffect(() => {
    setLoading(true);
    fetchPrayerTimes(city.latitude, city.longitude)
      .then(data => {
        setPrayerData(data);
      })
      .catch((err) => {
        console.error("Namaz vakitleri alınamadı:", err);
      })
      .finally(() => {
        setLoading(false); // Hata olsa bile yükleniyor animasyonunu kapatıyoruz
      });
  }, [city.latitude, city.longitude]);

  // İlk açılışta GPS sorgusu ve hata toleransı
  useEffect(() => {
    if (!isAuto) return;
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=tr&count=1`
        )
          .then(res => {
            if (!res.ok) throw new Error("CORS veya Sunucu Hatası");
            return res.json();
          })
          .then(data => {
            if (data?.results?.[0]) {
              const r = data.results[0];
              const newCity: SelectedCity = {
                name: r.name,
                country: r.country ?? '',
                latitude: r.latitude,
                longitude: r.longitude,
              };
              setCity(newCity);
              saveStoredCity(newCity, true);
            } else {
              throw new Error("Sonuç bulunamadı");
            }
          })
          .catch(() => {
            // API çökerse koordinatları doğrudan ham haliyle kullan, uygulamayı kilitleme
            const fallbackCity: SelectedCity = {
              name: 'Mevcut Konum',
              country: '',
              latitude,
              longitude,
            };
            setCity(fallbackCity);
            saveStoredCity(fallbackCity, true);
          });
      },
      () => {
        // GPS izni reddedilirse Drammen'e güvenli geçiş yap ve kilidi aç
        setCity(DEFAULT_CITY);
        setIsAuto(false);
        setLoading(false);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=tr&format=json`
        );
        const data = await res.json();
        setSearchResults(data?.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const selectCity = useCallback((result: CityResult) => {
    const newCity: SelectedCity = {
      name: result.name,
      country: result.country ?? '',
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setCity(newCity);
    setIsAuto(false);
    setShowSelector(false);
    setSearchQuery('');
    setSearchResults([]);
    saveStoredCity(newCity, false);
  }, []);

  const resetToAuto = useCallback(() => {
    setIsAuto(true);
    setShowSelector(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=tr&count=1`
          )
            .then(res => res.json())
            .then(data => {
              if (data?.results?.[0]) {
                const r = data.results[0];
                const newCity: SelectedCity = {
                  name: r.name,
                  country: r.country ?? '',
                  latitude: r.latitude,
                  longitude: r.longitude,
                };
                setCity(newCity);
                saveStoredCity(newCity, true);
              } else {
                throw new Error();
              }
            })
            .catch(() => {
              const fallbackCity: SelectedCity = {
                name: 'Mevcut Konum',
                country: '',
                latitude,
                longitude,
              };
              setCity(fallbackCity);
              saveStoredCity(fallbackCity, true);
            });
        },
        () => {
          setCity(DEFAULT_CITY);
          setIsAuto(false);
          setLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      setCity(DEFAULT_CITY);
      setIsAuto(false);
      setLoading(false);
    }
  }, []);

  return {
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
    pref: null,
  };
}
