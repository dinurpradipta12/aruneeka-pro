'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  ChevronRight,
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMobileWorkspace } from './MobileShell';

const statusStyles: any = {
  draft: 'bg-slate-50 text-slate-400',
  'in progress': 'bg-blue-50 text-blue-500',
  review: 'bg-orange-50 text-orange-500',
  approved: 'bg-emerald-50 text-emerald-600',
  uploaded: 'bg-amethyst-light/30 text-amethyst-primary',
};

const platformIcons: any = {
  tiktok: 'https://cdn.simpleicons.org/tiktok/916DD5',
  instagram: 'https://cdn.simpleicons.org/instagram/916DD5',
  threads: 'https://cdn.simpleicons.org/threads/916DD5',
  youtube: 'https://cdn.simpleicons.org/youtube/916DD5',
};

export default function MobileContentPlan() {
  const { selectedWorkspace } = useMobileWorkspace();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPlans = async () => {
    if (!selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v2_agency_content_plans')
        .select('*')
        .eq('workspace_id', selectedWorkspace.id)
        .order('due_date', { ascending: false });
      
      setPlans(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [selectedWorkspace]);

  const filteredPlans = plans.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.platform?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-2 ring-amethyst-primary/10 outline-none transition-all shadow-sm"
        />
        <button className="absolute inset-y-0 right-4 flex items-center text-amethyst-primary">
          <Filter size={18} />
        </button>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan, idx) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 rounded-[24px] border border-slate-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                  {plan.platform ? (
                    <img src={platformIcons[plan.platform.toLowerCase()] || 'https://cdn.simpleicons.org/target/916DD5'} className="w-6 h-6 object-contain" alt={plan.platform} />
                  ) : (
                    <Calendar size={20} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusStyles[plan.status?.toLowerCase()] || 'bg-slate-50 text-slate-400'}`}>
                      {plan.status || 'Draft'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate">
                      {plan.due_date ? new Date(plan.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'No Date'}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-tight truncate">
                    {plan.title || 'Untitled Content'}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                  <ExternalLink size={14} />
                </button>
                <ChevronRight size={18} className="text-slate-200" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Calendar size={32} />
            </div>
            <p className="text-xs font-bold text-slate-400 italic">No content plans found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
