
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log("Checking v2_agency_content_plans schema...");
  const { data, error } = await supabase
    .from('v2_agency_content_plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching content plan:", error.message);
  } else {
    console.log("Columns found in v2_agency_content_plans:", Object.keys(data[0] || {}));
  }
}

checkSchema();
