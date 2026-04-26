const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqvcswuddpashhnytjmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xdmNzd3VkZHBhc2hobnl0am1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAwNzc4MiwiZXhwIjoyMDkyNTgzNzgyfQ.XpDZl2g5RuQvdhUoyaFTPOTrMrEq14fAmN6qv8L-cew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { data, error } = await supabase
    .from('v2_agency_users')
    .update({ role: 'developer' })
    .eq('username', 'arunika');

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update successful:', data);
  }
}

update();
