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
  Plus,
  Lock,
  ShieldCheck,
  TrendingUp,
  Globe,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

const DashboardHome = ({ 
  selectedProfileId, 
  selectedWorkspaceId 
}: { 
  selectedProfileId?: string,
  selectedWorkspaceId?: string
}) => {
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
  const { subscriptionTier, openUpgrade } = useWorkspace();

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('aruneeka_user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
  const isLocked = subscriptionTier === 'free' && !isPowerUser;

  const fetchDashboardIntelligence = async () => {
    try {
      const workspaceId = selectedWorkspaceId;
      if (!workspaceId) return;

      setIsLoading(true);
      
      const [
        kpiResponse,
        contentResponse,
        strategyResponse,
        profileResponse,
        recentResponse
      ] = await Promise.all([
         supabase.from('v2_agency_kpi_targets').select('*').eq('workspace_id', workspaceId).eq(selectedProfileId ? 'profile_id' : '', selectedProfileId || ''),
         supabase.from('v2_agency_content_plans').select('status, due_date, title, platform, target_account').eq('workspace_id', workspaceId).eq(selectedProfileId ? 'target_account' : '', selectedProfileId || ''),
         supabase.from('v2_agency_strategy_checklist').select('status, is_completed').eq('workspace_id', workspaceId),
         supabase.from('v2_agency_social_profiles').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
         supabase.from('v2_agency_content_plans').select('*').eq('workspace_id', workspaceId).eq(selectedProfileId ? 'target_account' : '', selectedProfileId || '').order('created_at', { ascending: false }).limit(3)
      ]);

      // Processing
      let kpiAvg = 0;
      if (kpiResponse.data && kpiResponse.data.length > 0) {
        const totalProgress = kpiResponse.data.reduce((acc: number, kpi: any) => {
          const current = kpi.current_value || kpi.actual_value || 0;
          const target = kpi.target_value || 1;
          return acc + Math.min((current / target) * 100, 100);
        }, 0);
        kpiAvg = Math.round(totalProgress / kpiResponse.data.length);
      }

      const statusCounts: any = {};
      let closestContent: any = null;
      if (contentResponse.data) {
        contentResponse.data.forEach((item: any) => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
          if (item.status !== 'Uploaded' && item.status !== 'Approved' && item.due_date) {
            const dueDate = new Date(item.due_date);
            if (!closestContent || dueDate < new Date(closestContent.due_date)) { closestContent = item; }
          }
        });
      }

      let strategyProgress = 0;
      if (strategyResponse.data && strategyResponse.data.length > 0) {
        const completed = strategyResponse.data.filter((s: any) => s.is_completed).length;
        strategyProgress = Math.round((completed / strategyResponse.data.length) * 100);
      }

      setStats({
        kpiProgress: kpiAvg,
        totalContent: contentResponse.data?.length || 0,
        strategyCompletion: strategyProgress,
        activeProfiles: profileResponse.count || 0
      });
      setStatusDistribution(Object.entries(statusCounts).map(([name, value]: [string, any]) => ({ name, value: value as number })));
      setNextToPost(closestContent);
      setRecentOutput(recentResponse.data || []);
    } catch (e) {
      console.error("Dashboard Intelligence Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardIntelligence();
  }, [selectedProfileId, selectedWorkspaceId]);

  const platformIcons: any = {
    instagram: <img src="https://cdn.simpleicons.org/instagram/slate-400" className="w-3.5 h-3.5 group-hover:filter group-hover:invert transition-all" alt="IG" />,
    tiktok: <img src="https://cdn.simpleicons.org/tiktok/slate-400" className="w-3.5 h-3.5 group-hover:filter group-hover:invert transition-all" alt="TT" />,
    facebook: <img src="https://cdn.simpleicons.org/facebook/slate-400" className="w-3.5 h-3.5 group-hover:filter group-hover:invert transition-all" alt="FB" />,
    youtube: <img src="https://cdn.simpleicons.org/youtube/slate-400" className="w-3.5 h-3.5 group-hover:filter group-hover:invert transition-all" alt="YT" />,
    threads: <img src="https://cdn.simpleicons.org/threads/slate-400" className="w-3.5 h-3.5 group-hover:filter group-hover:invert transition-all" alt="TH" />,
    default: <Share2 size={14} />
  };

  return (
    <div className="space-y-8 pb-20">
      <section className="py-2">
          <div className="space-y-1 max-w-4xl">
             <h2 className="text-4xl font-black text-amethyst-primary tracking-tight">Selamat Datang, {user?.full_name?.split(' ')[0]}!</h2>
             <p className="text-[13px] text-slate-400 font-medium italic leading-relaxed">Dashboard pusat operasional Aruneeka Pro.</p>
          </div>
      </section>

      <section className="grid grid-cols-4 gap-6 relative">
        {[
          { label: 'Strategic KPI', value: `${stats.kpiProgress}%`, sub: 'Target average', icon: <Target/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Strategy Milestone', value: `${stats.strategyCompletion}%`, sub: 'Checklist completion', icon: <CheckCircle2/>, color: 'text-amethyst-primary', bg: 'bg-amethyst-light/20' },
          { label: 'Production Volume', value: stats.totalContent, sub: 'Total content units', icon: <Layers/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Account Matrix', value: stats.activeProfiles, sub: 'Connected profiles', icon: <TrendingUp/>, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((item: any, i: number) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all relative overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
            <div>
               <p className="text-[10px] font-black text-slate-300 leading-none mb-1">{item.label}</p>
               <h4 className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</h4>
               <p className="text-[9px] font-bold text-slate-400 italic mt-0.5">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 h-full relative group">
           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100">KPI Performance</div>
                 <BarChart3 size={18} className="text-slate-200"/>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50"/>
                       <motion.circle initial={{ strokeDasharray: "0 502" }} animate={{ strokeDasharray: `${(stats.kpiProgress / 100) * 502} 502` }} transition={{ duration: 1.5, ease: "easeOut" }} cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="transparent" className="text-emerald-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black text-slate-800">{stats.kpiProgress}%</span>
                       <span className="text-[9px] font-bold text-slate-400">Realized</span>
                    </div>
                 </div>
              </div>
            </div>
         </div>

        <div className="col-span-8 grid grid-cols-2 gap-8">
           <div className="bg-gradient-to-br from-amethyst-primary to-amethyst-dark rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
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
                            <div className="brightness-0 invert opacity-80">{platformIcons[nextToPost.platform?.toLowerCase()] || <Share2 size={12}/>}</div>
                            <span className="text-[10px] font-bold">{nextToPost.platform}</span>
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
              <button onClick={() => window.location.href = '/content'} className="relative z-10 w-full py-4 bg-white text-amethyst-dark rounded-2xl font-black text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">Review Schedule <ChevronRight size={14}/></button>
           </div>

           <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className={`flex flex-col h-full ${isLocked ? 'blur-md grayscale opacity-40 select-none pointer-events-none' : ''}`}>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Workload Flow</h3>
                    <Layers size={18} className="text-slate-200"/>
                 </div>
                 <div className="flex-1 space-y-4">
                    {statusDistribution.map((item: any, i: number) => (
                      <div key={i} className="space-y-1.5">
                         <div className="flex items-center justify-between text-[10px] font-black">
                            <span className="text-slate-400">{item.name}</span>
                            <span className="text-slate-800">{item.value} Units</span>
                         </div>
                         <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / (stats.totalContent || 1)) * 100}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${item.name === 'Published' ? 'bg-emerald-500' : 'bg-amethyst-primary'}`} />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-[12px]">
                   <ShieldCheck size={24} className="text-amber-500 mb-4" />
                   <h4 className="text-sm font-black text-amethyst-dark tracking-tight">Workload Flow Locked</h4>
                   <button onClick={() => openUpgrade()} className="mt-4 px-6 py-2.5 bg-amethyst-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg">Upgrade Now</button>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* RECENT OUTPUT SECTION - Restoration */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Content Output</h3>
            <button onClick={() => window.location.href = '/content'} className="text-[10px] font-black uppercase text-amethyst-primary tracking-widest hover:underline px-4">View All Plans</button>
         </div>
         <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            {recentOutput.length > 0 ? recentOutput.map((item: any, i: number) => (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 transition={{ delay: i * 0.1 }} 
                 key={i} 
                 className="flex-shrink-0 w-[350px] bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all relative overflow-hidden"
               >
                  <div className="flex items-center justify-between relative z-10">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.status === 'Uploaded' || item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                     }`}>
                        {item.status}
                     </span>
                     <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-amethyst-primary transition-colors">
                        {platformIcons[item.platform?.toLowerCase()] || <Share2 size={14}/>}
                     </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 leading-tight line-clamp-2 h-14">{item.title}</h4>
                  <div className="pt-4 flex items-center justify-between border-t border-slate-50 relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amethyst-light/20 flex items-center justify-center text-[10px] font-bold text-amethyst-dark border border-amethyst-light/30">
                           {item.platform?.charAt(0)}
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Platform</p>
                           <p className="text-[10px] font-bold text-slate-500">{item.platform}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Due Date</p>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                     </div>
                  </div>
               </motion.div>
            )) : (
                <div className="w-full py-16 text-center bg-slate-50/30 rounded-[48px] border-2 border-dashed border-slate-100">
                   <p className="text-sm font-bold text-slate-300 italic">Belum ada konten terbaru untuk ditampilkan.</p>
                </div>
            )}
         </div>
      </section>
    </div>
  );
};

export default DashboardHome;
