import CONFIG from './config.js';

let supabaseClient = null;

export async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) throw new Error('Supabase not initialized');
  return supabaseClient;
}
