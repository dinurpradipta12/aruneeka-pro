import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Supabase will not be initialized correctly.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Create a singleton instance that works on both client and server (Edge)
export const supabase = getSupabase();
