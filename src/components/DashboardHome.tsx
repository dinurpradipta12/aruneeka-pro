'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Video, 
  ChevronRight,
  BarChart3, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Globe,
  Share2,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DashboardHome = ({ selectedProfileId }: { selectedProfileId?: string }) => {
  const [stats, setStats] = useState({
    kpiProgress: 0,
    totalContent: 0,
    strategyCompletion: 0,
    activeProfiles: 0
  });
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [nextToPost, setNextToPost] = useState<any>(null);
  const [recentOutput, setRecentOutput] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardIntelligence();
  }, [selectedProfileId]);

  const fetchDashboardIntelligence = async () => {
    try {
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const workspaceId = user?.workspace_id || user?.parent_user_id || user?.id; // Fallback
      const userId = user?.id;

      if (!workspaceId) return;

      // 1. Fetch KPI Average
      let kpiQuery = supabase
        .from('v2_agency_kpi_targets')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (selectedProfileId) {
        kpiQuery = kpiQuery.eq('profile_id', selectedProfileId);
      }
      
      const { data: kpiData } = await kpiQuery;
      
      let kpiAvg = 0;
      if (kpiData && kpiData.length > 0) {
        const totalProgress = kpiData.reduce((acc, kpi) => {
          const current = kpi.current_value || kpi.actual_value || 0;
          const target = kpi.target_value || 1;
          const progress = (current / target) * 100;
          return acc + Math.min(progress, 100);
        }, 0);
        kpiAvg = Math.round(totalProgress / kpiData.length);
      }

      // 2. Fetch Content Stats & Distribution
      let contentQuery = supabase
        .from('v2_agency_content_plans')
        .select('status, due_date, title, platform, target_account')
        .eq('workspace_id', workspaceId);

      if (selectedProfileId) {
        contentQuery = contentQuery.eq('target_account', selectedProfileId);
      }

      const { data: contentData } = await contentQuery;

      const statusCounts: any = {};
      let closestContent = null;
      const today = new Date();

      if (contentData) {
        contentData.forEach(item => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
          
          if (item.status !== 'Uploaded' && item.status !== 'Approved' && item.due_date) {
            const dueDate = new Date(item.due_date);
            if (!closestContent || dueDate < new Date(closestContent.due_date)) {
               closestContent = item;
            }
          }
        });
      }

      // 3. Fetch Strategy Completion
      const { data: strategyData } = await supabase
        .from('v2_agency_strategy_checklist')
        .select('status, is_completed')
        .eq('workspace_id', workspaceId);
      
      let strategyProgress = 0;
      if (strategyData && strategyData.length > 0) {
        const completed = strategyData.filter(s => s.is_completed).length;
        strategyProgress = Math.round((completed / strategyData.length) * 100);
      }

      // 4. Fetch Active Profiles (Private Only)
      const { count: profileCount } = await supabase
        .from('v2_agency_social_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      // 5. Recent Output
      let recentQuery = supabase
        .from('v2_agency_content_plans')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (selectedProfileId) {
        recentQuery = recentQuery.eq('target_account', selectedProfileId);
      }

      const { data: recent } = await recentQuery
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        kpiProgress: kpiAvg,
        totalContent: contentData?.length || 0,
        strategyCompletion: strategyProgress,
        activeProfiles: profileCount || 0
      });

      const dist = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      setStatusDistribution(dist);
      setNextToPost(closestContent);
      setRecentOutput(recent || []);

    } catch (e) {
      console.error("Dashboard Intelligence Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const platformIcons: any = {
    instagram: <Share2 size={14} />,
    tiktok: <Video size={14} />,
    facebook: <Globe size={14} />,
    default: <Share2 size={14} />
  };

  return (
    <div className="space-y-8 pb-20">
      {/* SECTION 1: CORE INTELLIGENCE CARDS */}
      <section className="grid grid-cols-4 gap-6">
        {[
          { label: 'Strategic KPI', value: `${stats.kpiProgress}%`, sub: 'Target average', icon: <Target/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Strategy Milestone', value: `${stats.strategyCompletion}%`, sub: 'Checklist completion', icon: <CheckCircle2/>, color: 'text-amethyst-primary', bg: 'bg-amethyst-light/20' },
          { label: 'Production Volume', value: stats.totalContent, sub: 'Total content units', icon: <Layers/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Account Matrix', value: stats.activeProfiles, sub: 'Connected profiles', icon: <TrendingUp/>, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-300 leading-none mb-1">{item.label}</p>
               <h4 className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</h4>
               <p className="text-[9px] font-bold text-slate-400 italic mt-0.5">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* SECTION 2: OPERATIONAL CENTER */}
      <div className="grid grid-cols-12 gap-8">
        {/* KPI Performance Gauge */}
        <div className="col-span-4 h-full">
           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px] relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                 <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100">
                    KPI Performance
                 </div>
                 <BarChart3 size={18} className="text-slate-200"/>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50"/>
                       <motion.circle 
                          initial={{ strokeDasharray: "0 502" }}
                          animate={{ strokeDasharray: `${(stats.kpiProgress / 100) * 502} 502` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="transparent" className="text-emerald-500"
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black text-slate-800">{stats.kpiProgress}%</span>
                       <span className="text-[9px] font-bold text-slate-400">Realized</span>
                    </div>
                 </div>
                 <div className="text-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Growth Achievement</h3>
                    <p className="text-xs text-slate-400 font-medium">Average across all active KPI targets</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Operational Focus: Next to Post & Status */}
        <div className="col-span-8 grid grid-cols-2 gap-8">
           {/* Next to Post Spotlight */}
           <div className="bg-gradient-to-br from-amethyst-primary to-amethyst-dark rounded-[48px] p-10 text-white shadow-2xl shadow-amethyst-primary/20 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/> Immediate deadline
                 </div>
                 <Clock size={18} className="text-white/40"/>
              </div>

              <div className="relative z-10 space-y-4">
                 {nextToPost ? (
                   <>
                     <div>
                        <p className="text-[10px] font-bold text-white/60 mb-1">Coming up next</p>
                        <h3 className="text-3xl font-black tracking-tighter leading-none">{nextToPost.title}</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                           {platformIcons[nextToPost.platform?.toLowerCase()] || <Share2 size={12}/>}
                           <span className="text-[10px] font-bold">{nextToPost.platform}</span>
                        </div>
                        <div className="text-[10px] font-black text-amber-300">
                           DUE: {new Date(nextToPost.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                     </div>
                   </>
                 ) : (
                   <div className="text-center py-10 opacity-40">
                      <Layers size={40} className="mx-auto mb-4"/>
                      <p className="text-sm font-bold">No active deadline</p>
                   </div>
                 )}
              </div>

              <button 
                onClick={() => window.location.href = '/plans'}
                className="relative z-10 w-full py-4 bg-white text-amethyst-dark rounded-2xl font-black text-[10px] hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5"
              >
                  Review Schedule <ChevronRight size={14}/>
              </button>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32"/>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-[80px]"/>
           </div>

           {/* Content Status Pie Chart */}
           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Workload Flow</h3>
                 <Layers size={18} className="text-slate-200"/>
              </div>
              
              <div className="flex-1 space-y-4">
                 {statusDistribution.length > 0 ? statusDistribution.map((item, i) => (
                   <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black">
                         <span className="text-slate-400">{item.name}</span>
                         <span className="text-slate-800">{item.value} Units</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / stats.totalContent) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full rounded-full ${
                              item.name === 'Published' ? 'bg-emerald-500' : 
                              item.name === 'Draft' ? 'bg-slate-300' : 'bg-amethyst-primary'
                            }`}
                         />
                      </div>
                   </div>
                 )) : (
                   <div className="h-full flex items-center justify-center text-slate-200 italic text-xs">
                      No distribution data yet
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 3: RECENT OUTPUT & PLATFORM HEALTH */}
      <div className="grid grid-cols-12 gap-8">
         {/* Recent Output Feed */}
         <div className="col-span-7 bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight text-gradient bg-clip-text text-transparent bg-gradient-to-r from-amethyst-dark to-amethyst-primary italic">Recent Output</h3>
                  <p className="text-[10px] font-bold text-slate-300">Latest content movement</p>
               </div>
               <button onClick={() => window.location.href='/plans'} className="text-amethyst-primary hover:text-black transition-colors font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                  View Full <ChevronRight size={14}/>
               </button>
            </div>

            <div className="space-y-4">
               {recentOutput.length > 0 ? recentOutput.map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-amethyst-primary group-hover:text-white transition-all shadow-sm">
                          {platformIcons[item.platform?.toLowerCase()] || <Plus size={16}/>}
                       </div>
                       <div>
                          <h4 className="text-xs font-black text-slate-800 truncate max-w-[200px]">{item.title}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.status}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Due Date</div>
                       <div className="text-[11px] font-black text-slate-600">{new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                    </div>
                 </div>
               )) : (
                  <div className="py-20 text-center text-slate-200">
                     <Layers size={32} className="mx-auto mb-2 opacity-20"/>
                     <p className="text-[10px] font-black">No recent productivity output</p>
                  </div>
               )}
            </div>
         </div>

         {/* Platform Health & Strategy Snapshot */}
         <div className="col-span-5 space-y-8">
            <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Strategy Roadmap</h3>
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">{stats.strategyCompletion}% Done</div>
               </div>
               <div className="space-y-6">
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.strategyCompletion}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">Clear Execution</span>
                        <span className="text-[9px] font-bold text-slate-400">Operational milestone</span>
                     </div>
                     <button onClick={() => window.location.href='/strategy'} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-amethyst-primary hover:text-white transition-all shadow-inner">
                        <ChevronRight size={18}/>
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-white to-amethyst-light/10 rounded-[48px] p-10 border border-slate-100 shadow-xl relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="px-4 py-1.5 bg-amethyst-primary/10 text-amethyst-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-amethyst-primary/20">
                        Platform Dominance
                     </div>
                     <BarChart3 size={18} className="text-amethyst-primary opacity-30"/>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-[28px] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                        {/* Custom Instagram SVG Logo */}
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                           <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                           <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Instagram</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                           <TrendingUp size={12}/> +12.4% Momentum
                        </p>
                        <p className="text-[9px] font-medium text-slate-400 max-w-[140px] italic">
                           Platform dengan interaksi tertinggi minggu ini dalam ekosistem kamu.
                        </p>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Growth Phase</p>
                        <p className="text-xs font-black text-slate-700 leading-none">Market Expansion</p>
                     </div>
                     <button 
                        onClick={() => window.location.href = '/performance'}
                        className="px-6 py-3 bg-slate-50 text-amethyst-primary border border-amethyst-light/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amethyst-primary hover:text-white transition-all shadow-sm"
                     >
                        Lihat Performance
                     </button>
                  </div>
               </div>
               
               {/* Decorative Background Element */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-[60px]"/>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardHome;
