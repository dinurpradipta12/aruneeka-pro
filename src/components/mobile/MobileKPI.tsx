'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMobileWorkspace } from './MobileShell';

export default function MobileKPI() {
  const { selectedWorkspace } = useMobileWorkspace();
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    if (!selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v2_agency_kpi_targets')
        .select('*')
        .eq('workspace_id', selectedWorkspace.id);
      
      setKpis(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [selectedWorkspace]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-[28px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Target Progress</span>
          <h3 className="text-xl font-black text-amethyst-dark tracking-tight">Strategy Center</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amethyst-light/30 text-amethyst-primary flex items-center justify-center">
          <Award size={24} />
        </div>
      </div>

      {/* KPI List */}
      <div className="space-y-4">
        {kpis.length > 0 ? (
          kpis.map((kpi, idx) => (
            <motion.div 
              key={kpi.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-amethyst-primary">
                    <Target size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{kpi.category || 'Metric'}</span>
                    <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-none">{kpi.metric}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Target</span>
                  <p className="text-sm font-black text-amethyst-primary">
                    {kpi.target_value >= 1000 ? `${(kpi.target_value/1000).toFixed(1)}K` : kpi.target_value}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Current Progress</span>
                  <span>45%</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    className="h-full bg-gradient-to-r from-amethyst-primary to-amethyst-dark"
                  />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-xs font-bold text-slate-400 italic">No KPIs defined for this workspace.</p>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button className="w-full py-4 bg-white border border-dashed border-amethyst-light text-amethyst-primary rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amethyst-light/5 transition-all">
        <Plus size={16} /> Add New KPI
      </button>
    </div>
  );
}
