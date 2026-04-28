import { createClient } from '@supabase/supabase-js';

// Inisialisasi hanya saat dibutuhkan (Lazy)
export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Jangan throw error, kembalikan dummy atau handle dengan aman di client
    console.warn("Supabase credentials missing!");
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
};

// Supabase constant as a proxy or simple object to avoid breaking existing imports
// tapi tetap memanggil getSupabase() saat diakses
export const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as any);
