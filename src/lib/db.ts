import { supabase, isSupabaseConfigured } from './supabase';
import type {
  NewsItem, StaffMember, SohbetItem,
  MosqueSettings, AdminAccount, DailyInspiration,
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_ADMINS } from './constants';

// ── Row types (snake_case from Supabase) ──────────────────────

interface NewsRow {
  id: string; title: string; content: string; category: string;
  image_base64: string | null; date: string;
}
interface SohbetRow {
  id: string; title: string; description: string; date: string;
  time: string; location: string; speaker: string; image_base64: string | null;
}
interface StaffRow {
  id: string; name: string; position: string; phone: string | null;
}
interface AdminRow {
  id: string; username: string; password: string;
  display_name: string; role: string;
}
interface SettingsRow {
  mosque_name: string; short_name: string; vipps_number: string;
  address: string; map_url: string; phone: string; email: string;
  whatsapp_number: string; bank_account: string; iban: string;
  opening_hours: string; friday_prayer: string;
}
interface InspirationRow {
  verse_text: string; verse_reference: string; hadith_text: string;
  hadith_source: string; published: boolean;
}

// ── Mappers ────────────────────────────────────────────────────

function mapNews(r: NewsRow): NewsItem {
  return {
    id: r.id, title: r.title, content: r.content, category: r.category,
    imageBase64: r.image_base64 ?? undefined,
    date: r.date,
  };
}
function mapSohbet(r: SohbetRow): SohbetItem {
  return {
    id: r.id, title: r.title, description: r.description, date: r.date,
    time: r.time, location: r.location, speaker: r.speaker,
    imageBase64: r.image_base64 ?? undefined,
  };
}
function mapStaff(r: StaffRow): StaffMember {
  return { id: r.id, name: r.name, position: r.position, phone: r.phone ?? '' };
}
function mapAdmin(r: AdminRow): AdminAccount {
  return {
    id: r.id, username: r.username, password: r.password,
    displayName: r.display_name,
    role: r.role as 'superadmin' | 'admin',
  };
}
function mapSettings(r: SettingsRow): MosqueSettings {
  return {
    mosqueName: r.mosque_name, shortName: r.short_name,
    vippsNumber: r.vipps_number, address: r.address, mapUrl: r.map_url,
    phone: r.phone ?? '', email: r.email ?? '',
    whatsappNumber: r.whatsapp_number, bankAccount: r.bank_account ?? '',
    iban: r.iban ?? '', openingHours: r.opening_hours ?? '',
    fridayPrayer: r.friday_prayer ?? '',
  };
}
function mapInspiration(r: InspirationRow): DailyInspiration {
  return {
    verseText: r.verse_text, verseReference: r.verse_reference,
    hadithText: r.hadith_text, hadithSource: r.hadith_source,
    published: r.published,
  };
}

// ── Read operations ────────────────────────────────────────────

export async function fetchNews(): Promise<NewsItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('fetchNews:', error); return []; }
  return (data as NewsRow[]).map(mapNews);
}

export async function fetchSohbet(): Promise<SohbetItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sohbet')
    .select('*')
    .order('date', { ascending: true });
  if (error) { console.error('fetchSohbet:', error); return []; }
  return (data as SohbetRow[]).map(mapSohbet);
}

export async function fetchStaff(): Promise<StaffMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchStaff:', error); return []; }
  return (data as StaffRow[]).map(mapStaff);
}

export async function fetchAdmins(): Promise<AdminAccount[]> {
  if (!supabase) return DEFAULT_ADMINS;
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchAdmins:', error); return DEFAULT_ADMINS; }
  const mapped = (data as AdminRow[]).map(mapAdmin);
  // Ensure superadmin always exists
  if (!mapped.some(a => a.role === 'superadmin')) return [...DEFAULT_ADMINS, ...mapped];
  return mapped;
}

export async function fetchSettings(): Promise<MosqueSettings> {
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) { console.error('fetchSettings:', error); return DEFAULT_SETTINGS; }
  return mapSettings(data as SettingsRow);
}

export async function fetchInspiration(): Promise<DailyInspiration> {
  if (!supabase) return {
    verseText: 'Şüphesiz zorlukla birlikte kolaylık vardır.',
    verseReference: "Kur'an-ı Kerim, İnşirah Suresi 6. Ayet",
    hadithText: "Sizin en hayırlınız Kur'an'ı öğrenip öğreteninizdir.",
    hadithSource: 'Hadis-i Şerif, Buhari',
    published: true,
  };
  const { data, error } = await supabase
    .from('inspiration')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) { console.error('fetchInspiration:', error); return { verseText: '', verseReference: '', hadithText: '', hadithSource: '', published: true }; }
  return mapInspiration(data as InspirationRow);
}

// ── Write operations ───────────────────────────────────────────

export async function insertNews(item: NewsItem): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('news').insert({
    id: item.id, title: item.title, content: item.content,
    category: item.category, image_base64: item.imageBase64 ?? null,
    date: item.date,
  });
  if (error) console.error('insertNews:', error);
}

export async function updateNews(id: string, updates: Partial<NewsItem>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.imageBase64 !== undefined) payload.image_base64 = updates.imageBase64;
  const { error } = await supabase.from('news').update(payload).eq('id', id);
  if (error) console.error('updateNews:', error);
}

export async function deleteNews(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) console.error('deleteNews:', error);
}

export async function insertSohbet(item: SohbetItem): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('sohbet').insert({
    id: item.id, title: item.title, description: item.description,
    date: item.date, time: item.time, location: item.location,
    speaker: item.speaker, image_base64: item.imageBase64 ?? null,
  });
  if (error) console.error('insertSohbet:', error);
}

export async function updateSohbet(id: string, updates: Partial<SohbetItem>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.time !== undefined) payload.time = updates.time;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.speaker !== undefined) payload.speaker = updates.speaker;
  if (updates.imageBase64 !== undefined) payload.image_base64 = updates.imageBase64;
  const { error } = await supabase.from('sohbet').update(payload).eq('id', id);
  if (error) console.error('updateSohbet:', error);
}

export async function deleteSohbet(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('sohbet').delete().eq('id', id);
  if (error) console.error('deleteSohbet:', error);
}

export async function insertStaff(member: StaffMember): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('staff').insert({
    id: member.id, name: member.name, position: member.position,
    phone: member.phone,
  });
  if (error) console.error('insertStaff:', error);
}

export async function updateStaff(id: string, updates: Partial<StaffMember>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.position !== undefined) payload.position = updates.position;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  const { error } = await supabase.from('staff').update(payload).eq('id', id);
  if (error) console.error('updateStaff:', error);
}

export async function deleteStaff(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) console.error('deleteStaff:', error);
}

export async function insertAdmin(admin: AdminAccount): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('admins').insert({
    id: admin.id, username: admin.username, password: admin.password,
    display_name: admin.displayName, role: admin.role,
  });
  if (error) console.error('insertAdmin:', error);
}

export async function deleteAdmin(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) console.error('deleteAdmin:', error);
}

export async function updateAdminPassword(username: string, newPassword: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('admins')
    .update({ password: newPassword })
    .ilike('username', username);
  if (error) console.error('updateAdminPassword:', error);
}

export async function upsertSettings(settings: MosqueSettings): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('settings').upsert({
    id: 1,
    mosque_name: settings.mosqueName,
    short_name: settings.shortName,
    vipps_number: settings.vippsNumber,
    address: settings.address,
    map_url: settings.mapUrl,
    phone: settings.phone,
    email: settings.email,
    whatsapp_number: settings.whatsappNumber,
    bank_account: settings.bankAccount,
    iban: settings.iban,
    opening_hours: settings.openingHours,
    friday_prayer: settings.fridayPrayer,
  });
  if (error) console.error('upsertSettings:', error);
}

export async function upsertInspiration(insp: DailyInspiration): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('inspiration').upsert({
    id: 1,
    verse_text: insp.verseText,
    verse_reference: insp.verseReference,
    hadith_text: insp.hadithText,
    hadith_source: insp.hadithSource,
    published: insp.published,
  });
  if (error) console.error('upsertInspiration:', error);
}

// ── Realtime subscription helper ──────────────────────────────

export function subscribeToTable(
  table: string,
  onChange: () => void,
): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`realtime-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    .subscribe();
  return () => { client.removeChannel(channel); };
}

export { isSupabaseConfigured };
