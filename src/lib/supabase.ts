import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client.
 *
 * The URL and Anon Key are read from Vite environment variables:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * When you create your Supabase project, copy the Project URL and the
 * `anon` public key from  Settings ▸ API  and set them in a `.env` file:
 *
 *   VITE_SUPABASE_URL=https://yourproject.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * On Vercel, add the same two variables in  Project ▸ Settings ▸ Environment Variables.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
