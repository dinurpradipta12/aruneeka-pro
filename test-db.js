import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: plans } = await supabase.from('v2_agency_content_plans').select('title, target_account, platform');
  console.log('Plans:', plans);
  
  const { data: profs } = await supabase.from('v2_agency_social_profiles').select('id, name, platform');
  console.log('\nProfiles:', profs);
}
run();
