import type { PrayerData, PrayerTimings } from '../types';

const METHOD = 13; // Diyanet İşleri Başkanlığı, Turkey

/**
 * Fallback prayer times by month (approximate averages for Scandinavian region).
 * Used only if the Aladhan API is unreachable.
 */
const FALLBACK_BY_MONTH: PrayerTimings[] = [
  { Fajr: '06:30', Sunrise: '09:00', Dhuhr: '12:30', Asr: '14:00', Maghrib: '15:30', Isha: '17:00' },
  { Fajr: '06:00', Sunrise: '08:00', Dhuhr: '12:30', Asr: '14:30', Maghrib: '16:30', Isha: '18:00' },
  { Fajr: '05:00', Sunrise: '06:45', Dhuhr: '12:30', Asr: '15:00', Maghrib: '17:30', Isha: '19:00' },
  { Fajr: '04:00', Sunrise: '05:45', Dhuhr: '12:30', Asr: '15:30', Maghrib: '18:30', Isha: '20:15' },
  { Fajr: '02:45', Sunrise: '04:30', Dhuhr: '12:30', Asr: '16:00', Maghrib: '19:45', Isha: '22:00' },
  { Fajr: '01:30', Sunrise: '03:45', Dhuhr: '12:30', Asr: '16:15', Maghrib: '20:30', Isha: '22:45' },
  { Fajr: '01:45', Sunrise: '04:00', Dhuhr: '12:30', Asr: '16:15', Maghrib: '20:30', Isha: '22:30' },
  { Fajr: '03:00', Sunrise: '05:00', Dhuhr: '12:30', Asr: '16:00', Maghrib: '19:45', Isha: '21:30' },
  { Fajr: '04:15', Sunrise: '06:15', Dhuhr: '12:30', Asr: '15:30', Maghrib: '18:30', Isha: '20:15' },
  { Fajr: '05:30', Sunrise: '07:30', Dhuhr: '12:30', Asr: '14:45', Maghrib: '17:00', Isha: '18:30' },
  { Fajr: '06:15', Sunrise: '08:15', Dhuhr: '12:30', Asr: '14:15', Maghrib: '15:45', Isha: '17:15' },
  { Fajr: '06:45', Sunrise: '09:15', Dhuhr: '12:30', Asr: '14:00', Maghrib: '15:30', Isha: '17:00' },
];

const HIJRI_MONTHS = [
  'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir',
  'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban',
  'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce',
];

function getFallbackTimes(): PrayerData {
  const now = new Date();
  const month = now.getMonth();
  const timings = FALLBACK_BY_MONTH[month];
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const hijriDayApprox = ((dayOfYear % 354) + 354) % 354 + 1;
  const hijriMonthIdx = Math.floor(hijriDayApprox / 29.5) % 12;
  return {
    timings,
    hijriDate: `${hijriDayApprox} ${HIJRI_MONTHS[hijriMonthIdx]} ${1446}`,
    gregorianDate: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

/** Fetch prayer times for arbitrary coordinates. */
export async function fetchPrayerTimes(lat: number, lng: number): Promise<PrayerData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${METHOD}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('API response not OK');
    const data = await response.json();

    if (data.code === 200 && data.data?.timings) {
      const h = data.data.date.hijri;
      const g = data.data.date.gregorian;
      return {
        timings: {
          Fajr: data.data.timings.Fajr,
          Sunrise: data.data.timings.Sunrise,
          Dhuhr: data.data.timings.Dhuhr,
          Asr: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isha: data.data.timings.Isha,
        },
        hijriDate: `${h.day} ${h.month.en} ${h.year} H`,
        gregorianDate: `${g.day} ${g.month.en} ${g.year}`,
      };
    }
    throw new Error('Invalid API response');
  } catch {
    return getFallbackTimes();
  }
}

export function getNextPrayer(timings: PrayerTimings): { name: string; time: string } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayers = [
    { name: 'Sabah', time: timings.Fajr },
    { name: 'Güneş', time: timings.Sunrise },
    { name: 'Öğle', time: timings.Dhuhr },
    { name: 'İkindi', time: timings.Asr },
    { name: 'Akşam', time: timings.Maghrib },
    { name: 'Yatsı', time: timings.Isha },
  ];
  for (const p of prayers) {
    const [h, m] = p.time.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins > currentMinutes) return p;
  }
  return { name: 'Sabah', time: timings.Fajr };
}

export function getTimeUntil(timeStr: string): string {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} sa ${minutes} dk`;
  return `${minutes} dk`;
}
