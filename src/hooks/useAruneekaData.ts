import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAruneekaData(workspaceId: string, selectedAccountId: string = 'all') {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contentPlans, setContentPlans] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      // Fetch Accounts
      const { data: accs } = await supabase.from('v2_agency_accounts').select('*').eq('workspace_id', workspaceId);
      setAccounts(accs || []);

      // Fetch Content Plans
      let query = supabase.from('v2_agency_content_plans').select('*').eq('workspace_id', workspaceId);
      if (selectedAccountId !== 'all') {
        query = query.eq('account_id', selectedAccountId);
      }
      const { data: plans } = await query.order('due_date', { ascending: true });
      setContentPlans(plans || []);

      // Fetch Intelligence (SOP)
      const { data: intel } = await supabase.from('v2_agency_intelligence').select('*').eq('workspace_id', workspaceId).maybeSingle();
      setIntelligence(intel);

    } catch (err) {
      console.error('Error fetching Aruneeka data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchInitialData();
      
      // Realtime listener for live updates
      const channel = supabase.channel(`aruneeka_${workspaceId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_content_plans' }, () => fetchInitialData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_intelligence' }, () => fetchInitialData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [workspaceId, selectedAccountId]);

  return { accounts, contentPlans, intelligence, loading, refresh: fetchInitialData };
}
