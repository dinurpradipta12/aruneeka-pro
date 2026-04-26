import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // I need the service role if available or just check if I can use the public key if RLS allows

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('v2_agency_users')
    .update({ role: 'developer' })
    .eq('username', 'arunika');

  if (error) console.error("Error updating user:", error);
  else console.log("User 'arunika' updated to developer role successfully.");
}

run();
