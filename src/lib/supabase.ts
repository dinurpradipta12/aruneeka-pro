import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Kita bungkus agar jika URL tidak valid, ia tidak langsung membuat server 500 saat module loading
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Penting untuk lingkungan server/edge
  }
});
