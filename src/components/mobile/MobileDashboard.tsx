'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  TrendingUp, 
  Users, 
  Sparkles,
  ArrowUpRight,
  Activity,
  Zap,
  ChevronRight,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMobileWorkspace } from './MobileShell';

export default function MobileDashboard() {
  const { selectedWorkspace, subscriptionTier } = useMobileWorkspace();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiTargets, setKpiTargets] = useState<any[]>([]);

  const fetchData = async () => {
    if (!selectedWorkspace?.id) return;
    setLoading(true);
    try {
      // Fetch Content Plans for Metrics
      const { data: planData } = await supabase
        .from('v2_agency_content_plans')
        .select('metrics, status, platform')
        .eq('workspace_id', selectedWorkspace.id);
      
      setData(planData || []);

      // Fetch KPI Targets
      const { data: kpiData } = await supabase
        .from('v2_agency_kpi_targets')
        .select('*')
        .eq('workspace_id', selectedWorkspace.id);
      
      setKpiTargets(kpiData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWorkspace]);

  const metrics = useMemo(() => {
    let views = 0;
    let interactions = 0;
    let followers = 0;
    let uploaded = 0;

    data.forEach(item => {
      const m = item.metrics || {};
      views += Number(m.views || m.reach || 0);
      
      const plat = item.platform?.toLowerCase();
      if (plat === 'threads') {
        interactions += (Number(m.likes) || 0) + (Number(m.replies) || 0) + (Number(m.reposts) || 0) + (Number(m.quotes) || 0);
      } else {
        interactions += (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0);
      }
      
      followers += Number(m.new_followers || m.follows || 0);
      if (item.status?.toLowerCase() === 'uploaded') uploaded++;
    });

    return { views, interactions, followers, uploaded };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-[32px]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amethyst-primary to-amethyst-dark rounded-[32px] p-6 text-white shadow-xl shadow-amethyst-primary/20">
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-white/80">Performance Overview</span>
          <h2 className="text-2xl font-black tracking-tight">{selectedWorkspace?.name}</h2>
          <p className="text-[11px] font-medium text-white/60">Live production tracking is active.</p>
        </div>
        {/* Abstract decor */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amethyst-light/20 rounded-full blur-2xl" />
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="Total Views" 
          value={metrics.views >= 1000 ? `${(metrics.views/1000).toFixed(1)}K` : metrics.views} 
          icon={<Eye size={18} />} 
          color="blue"
        />
        <MetricCard 
          label="Interactions" 
          value={metrics.interactions >= 1000 ? `${(metrics.interactions/1000).toFixed(1)}K` : metrics.interactions} 
          icon={<Sparkles size={18} />} 
          color="amethyst"
        />
        <MetricCard 
          label="New Followers" 
          value={metrics.followers} 
          icon={<Users size={18} />} 
          color="orange"
        />
        <MetricCard 
          label="Engagement" 
          value={metrics.views > 0 ? `${((metrics.interactions / metrics.views) * 100).toFixed(2)}%` : '0%'} 
          icon={<TrendingUp size={18} />} 
          color="rose"
        />
      </div>

      {/* KPI Section Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Target size={12} className="text-amethyst-primary" /> Active KPIs
          </h3>
          <span className="text-[10px] font-bold text-amethyst-primary">View All</span>
        </div>
        <div className="space-y-3">
          {kpiTargets.slice(0, 3).map((kpi, idx) => {
            // Find progress
            let current = 0;
            if (kpi.metric.toLowerCase().includes('views')) current = metrics.views;
            else if (kpi.metric.toLowerCase().includes('engagement')) current = (metrics.interactions / (metrics.views || 1)) * 100;
            else if (kpi.metric.toLowerCase().includes('follower')) current = metrics.followers;

            const progress = Math.min((current / (kpi.target_value || 1)) * 100, 100);

            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amethyst-dark uppercase tracking-tight">{kpi.metric}</span>
                  <span className="text-[10px] font-black text-slate-400">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-amethyst-primary"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: any, icon: any, color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-500',
    amethyst: 'bg-amethyst-light/30 text-amethyst-primary',
    orange: 'bg-orange-50 text-orange-500',
    rose: 'bg-rose-50 text-rose-500',
  };

  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm space-y-3 active:scale-95 transition-all">
      <div className={`w-8 h-8 ${colors[color]} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div className="space-y-0.5">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{label}</span>
        <h4 className="text-lg font-black text-amethyst-dark tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
