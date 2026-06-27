/**
 * SQL schema for the DTIM Supabase project.
 *
 * Run this in the Supabase Dashboard → SQL Editor → New query.
 * After running, copy your Project URL and anon key into a `.env` file:
 *
 *   VITE_SUPABASE_URL=https://yourproject.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

-- ============================================================
-- 1. NEWS (Haberler)
-- ============================================================
create table if not exists public.news (
  id          text primary key,
  title       text not null,
  content     text not null,
  category    text not null default 'Duyuru',
  image_base64 text,
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. SOHBET / DERS
-- ============================================================
create table if not exists public.sohbet (
  id          text primary key,
  title       text not null,
  description text not null,
  date        date not null,
  time        text not null default '19:00',
  location    text not null default 'Dernek Merkezi - Drammen',
  speaker     text not null,
  image_base64 text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 3. STAFF (Dernek Kadromuz)
-- ============================================================
create table if not exists public.staff (
  id          text primary key,
  name        text not null,
  position    text not null,
  phone       text default '',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 4. ADMINS (Yönetici Hesapları)
-- ============================================================
create table if not exists public.admins (
  id           text primary key,
  username     text not null unique,
  password     text not null,
  display_name text not null,
  role         text not null default 'admin',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 5. SETTINGS (single-row config table)
-- ============================================================
create table if not exists public.settings (
  id             int primary key default 1,
  mosque_name    text not null default 'Drammen Türk İnanç Cemiyeti',
  short_name     text not null default 'Norveç · Drammen',
  vipps_number   text not null default '29816',
  address        text not null default 'Lauritz Grønlands vei 30, 3035 Drammen',
  map_url        text not null default 'https://www.google.com/maps/search/?api=1&query=Lauritz+Grønlands+vei+30+3035+Drammen+Norway',
  phone          text default '',
  email          text default '',
  whatsapp_number text not null default '4712345678',
  bank_account   text default '',
  iban           text default '',
  opening_hours  text default '',
  friday_prayer  text default '',
  constraint settings_singleton check (id = 1)
);

-- ============================================================
-- 6. INSPIRATION (single-row daily verse/hadith)
-- ============================================================
create table if not exists public.inspiration (
  id               int primary key default 1,
  verse_text       text not null default 'Şüphesiz zorlukla birlikte kolaylık vardır.',
  verse_reference  text not null default 'Kur''an-ı Kerim, İnşirah Suresi 6. Ayet',
  hadith_text      text not null default 'Sizin en hayırlınız Kur''an''ı öğrenip öğreteninizdir.',
  hadith_source    text not null default 'Hadis-i Şerif, Buhari',
  published        boolean not null default true,
  constraint inspiration_singleton check (id = 1)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Superadmin
insert into public.admins (id, username, password, display_name, role)
values ('superadmin', 'Ramazan', 'ramazan2801', 'Ramazan', 'superadmin')
on conflict (id) do nothing;

-- Settings singleton
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Inspiration singleton
insert into public.inspiration (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- The app uses the anon key for both reads and writes.
-- We enable RLS and allow all operations for the anon role.
-- For a production app you would tighten this, but this
-- mirrors the existing localStorage behaviour where any
-- visitor can read and the admin panel can write.
-- ============================================================

alter table public.news        enable row level security;
alter table public.sohbet      enable row level security;
alter table public.staff       enable row level security;
alter table public.admins      enable row level security;
alter table public.settings    enable row level security;
alter table public.inspiration enable row level security;

-- Allow anonymous read + write on all tables
create policy "anon all news"        on public.news        for all using (true) with check (true);
create policy "anon all sohbet"      on public.sohbet      for all using (true) with check (true);
create policy "anon all staff"       on public.staff       for all using (true) with check (true);
create policy "anon all admins"      on public.admins      for all using (true) with check (true);
create policy "anon all settings"    on public.settings    for all using (true) with check (true);
create policy "anon all inspiration" on public.inspiration for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime on all tables so the app receives
-- instant updates when the admin panel makes changes.
-- ============================================================

alter publication supabase_realtime add table public.news;
alter publication supabase_realtime add table public.sohbet;
alter publication supabase_realtime add table public.staff;
alter publication supabase_realtime add table public.admins;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.inspiration;
