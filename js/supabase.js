let supabaseClient = null;

export async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('./config.js');
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) throw new Error('Supabase not initialized');
  return supabaseClient;
}
