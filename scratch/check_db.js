
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log("Checking v2_agency_users schema...");
  const { data, error } = await supabase
    .from('v2_agency_users')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching user:", error.message);
    if (error.message.includes('column')) {
       console.log("CONFIRMED: Column mismatch detected.");
    }
  } else {
    console.log("Columns found:", Object.keys(data[0] || {}));
  }
}

checkSchema();
