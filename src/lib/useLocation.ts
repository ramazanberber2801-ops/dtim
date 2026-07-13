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

const STORAGE_KEY = 'yasaflow_selected_city';
const LEGACY_STORAGE_KEY = 'dtim_selected_city';

const DEFAULT_CITY: SelectedCity = {
  name: 'Drammen',
  country: 'Norveç',
  latitude: 59.744,
  longitude: 10.2045,
};

function loadStoredCity(): { city: SelectedCity; isAuto: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const stored = { city: parsed.city, isAuto: parsed.isAuto !== false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return stored;
    }
  } catch {
    // Ignore unavailable or invalid storage.
  }
  return { city: DEFAULT_CITY, isAuto: true };
}

function saveStoredCity(city: SelectedCity, isAuto: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, isAuto }));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

async function reverseGeocode(latitude: number, longitude: number): Promise<Pick<SelectedCity, 'name' | 'country'> | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=tr&count=1`,
      { cache: 'no-store' },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.results?.[0];
    if (!result) return null;
    return { name: result.name || 'Mevcut Konum', country: result.country || '' };
  } catch {
    return null;
  }
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
  const locatingRef = useRef(false);
  const lastLocationRequestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPrayerTimes(city.latitude, city.longitude, city.name)
      .then((data) => {
        if (!cancelled) setPrayerData(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city.latitude, city.longitude, city.name]);

  const updateFromDeviceLocation = useCallback((force = false) => {
    if (!navigator.geolocation || locatingRef.current) return;

    const now = Date.now();
    if (!force && now - lastLocationRequestRef.current < 60_000) return;

    locatingRef.current = true;
    lastLocationRequestRef.current = now;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Apply fresh coordinates immediately. Prayer times must not wait for city-name lookup.
        const rawCity: SelectedCity = {
          name: 'Mevcut Konum',
          country: '',
          latitude,
          longitude,
        };
        setCity(rawCity);
        saveStoredCity(rawCity, true);

        const label = await reverseGeocode(latitude, longitude);
        if (label) {
          const resolvedCity: SelectedCity = { ...rawCity, ...label };
          setCity(resolvedCity);
          saveStoredCity(resolvedCity, true);
        }
        locatingRef.current = false;
      },
      (error) => {
        console.warn('Konum alınamadı:', error.message);
        locatingRef.current = false;
      },
      {
        timeout: 20_000,
        enableHighAccuracy: true,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (!isAuto) return;

    updateFromDeviceLocation(true);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') updateFromDeviceLocation(false);
    };
    const refreshWhenOnline = () => updateFromDeviceLocation(false);

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenOnline);
    window.addEventListener('online', refreshWhenOnline);

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenOnline);
      window.removeEventListener('online', refreshWhenOnline);
    };
  }, [isAuto, updateFromDeviceLocation]);

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
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=tr&format=json`,
          { cache: 'no-store' },
        );
        const data = await response.json();
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
    updateFromDeviceLocation(true);
  }, [updateFromDeviceLocation]);

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
