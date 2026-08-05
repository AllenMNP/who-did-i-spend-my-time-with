import { createClient } from '@supabase/supabase-js';

// Accept either the base project URL or a pasted REST endpoint; normalize to base.
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const url = rawUrl ? rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') : rawUrl;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// When unconfigured, createClient would throw; guard with a null client so the
// app can render a helpful message instead of crashing.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;
