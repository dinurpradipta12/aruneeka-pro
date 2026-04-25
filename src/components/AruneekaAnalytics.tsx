'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  TrendingUp, 
  Users, 
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  Layout,
  MousePointer2,
  Share2,
  Calendar as CalendarIcon,
  Activity,
  Music,
  AtSign,
  Camera,
  ExternalLink,
  Check,
  FileText,
  Video,
  Zap,
  ShieldCheck,
  Package,
  CheckCircle2,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

const AruneekaAnalytics = ({ 
  selectedProfileId,
  selectedWorkspaceId,
  subscriptionTier = 'free'
}: { 
  selectedProfileId?: string,
  selectedWorkspaceId?: string,
  subscriptionTier?: string
}) => {
  const [activeRange, setActiveRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeMetric, setActiveMetric] = useState('Views');
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  }, [currentTier]);

  const fetchData = async () => {
    const isInitial = data.length === 0;
    if (isInitial) setIsLoading(true);
    
    try {
      const workspaceId = selectedWorkspaceId;
      if (!workspaceId) return;

      const { data: profileData, error: profileError } = await supabase
        .from('v2_agency_social_profiles')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (!profileError && profileData) {
        setProfiles(profileData);
      }

      // Fetch Content Plans
      let query = supabase.from('v2_agency_content_plans')
        .select('id, title, platform, content_pillar, due_date, metrics, status, post_link')
        .eq('workspace_id', workspaceId);

      // Filter by selected account if applicable
      if (selectedProfileId) {
        query = query.eq('target_account', selectedProfileId);
      }

      if (activeRange === 'This Month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        query = query.gte('due_date', firstDay.toISOString());
      } else if (activeRange === 'Last Month') {
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        firstDayLastMonth.setHours(0, 0, 0, 0);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        lastDayLastMonth.setHours(23, 59, 59, 999);
        query = query.gte('due_date', firstDayLastMonth.toISOString()).lte('due_date', lastDayLastMonth.toISOString());
      } else if (activeRange === 'Custom Range' && customStart && customEnd) {
        query = query.gte('due_date', customStart).lte('due_date', customEnd);
      }

      const { data: planData, error } = await query;
      if (error) throw error;
      setData(planData || []);
    } catch (e) {
      console.error("Critical Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Group Data by Date for Charting
  const dailyMetrics = useMemo(() => {
    const grouped: any = {};
    let startDate: Date;
    let endDate: Date;
    
    if (activeRange === 'This Month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (activeRange === 'Last Month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (activeRange === 'Custom Range' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      const now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      endDate = now;
    }

    // Ensure we have a valid range to prevent infinite loops
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split('T')[0];
      grouped[dayStr] = { views: 0, interactions: 0, followers: 0 };
    }

    data.forEach(p => {
      if (!p.due_date) return;
      try {
        const dayStr = new Date(p.due_date).toISOString().split('T')[0];
        if (grouped[dayStr]) {
          const m = p.metrics || {};
          const plat = p.platform?.toLowerCase();
          let inter = 0;
          if (plat === 'threads') {
            inter = (Number(m.likes) || 0) + (Number(m.replies) || 0) + (Number(m.reposts) || 0) + (Number(m.quotes) || 0);
          } else {
            inter = (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0);
          }

          grouped[dayStr].views += Number(m.views || m.reach || 0);
          grouped[dayStr].interactions += inter;
          grouped[dayStr].followers += Number(m.new_followers || m.follows || 0);
        }
      } catch (e) { /* ignore individual date parsing errors */ }
    });

    return Object.entries(grouped).map(([date, vals]: any) => ({
      date,
      day: new Date(date).getDate(),
      month: new Date(date).toLocaleDateString('id-ID', { month: 'short' }),
      ...vals
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, activeRange, customStart, customEnd]);

  // Global Metric Calculations - OPTIMIZED SINGLE PASS
  const metrics = useMemo(() => {
    let totals = {
      views: 0, reach: 0, interactions: 0, reposts: 0,
      retentionSum: 0, uploadedCount: 0, followers: 0
    };

    data.forEach(curr => {
      const m = curr.metrics || {};
      const platform = curr.platform?.toLowerCase() || '';

      // Views & Reach
      const v = Number(m.views || m.Views || m.impressions || m.Impressions || 0);
      totals.views += v;
      totals.reach += Number(m.reach || m.Reach || v);

      // Interactions
      let platformInteractions = Number(m.interactions || m.Interactions || 0);
      if (platformInteractions === 0) {
        if (platform === 'threads') {
          platformInteractions = (Number(m.likes) || 0) + (Number(m.replies) || 0) + (Number(m.reposts) || 0) + (Number(m.quotes) || 0);
        } else {
          platformInteractions = (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0);
        }
      }
      totals.interactions += platformInteractions;

      // Reposts & Others
      totals.reposts += Number(m.reposts || m.shares || m.Reposts || m.Shares || 0);
      totals.retentionSum += Number(m.avg_retention || m.retention || 0);
      if (curr.status?.toLowerCase() === 'uploaded') totals.uploadedCount++;
      totals.followers += Number(m.new_followers || m.follower_gain || m.Followers || m.follows || m.new_follows || 0);
    });

    const avgRetention = data.length > 0 ? totals.retentionSum / data.length : 0;
    
    const targetProfiles = selectedProfileId ? profiles.filter(p => p.id === selectedProfileId) : profiles;

    const initialFollowers = targetProfiles.reduce((acc, curr) => {
      let val = curr.followers ? String(curr.followers) : '0';
      const multiplier = val.toLowerCase().includes('k') ? 1000 : val.toLowerCase().includes('m') ? 1000000 : 1;
      const cleanVal = val.replace(/[^0-9.]/g, '');
      return acc + ((val.toLowerCase().includes('k') || val.toLowerCase().includes('m')) ? (parseFloat(cleanVal) * multiplier) : (parseInt(val.replace(/\D/g, '')) || 0));
    }, 0);

    return { 
      totalViews: totals.views, 
      totalReach: totals.reach, 
      totalInteractions: totals.interactions, 
      totalReposts: totals.reposts, 
      avgRetention, 
      contentUploaded: totals.uploadedCount, 
      newFollowers: totals.followers, 
      totalFollowersOverall: initialFollowers + totals.followers, 
      engagementRate: totals.views > 0 ? (totals.interactions / totals.views) * 100 : 0 
    };
  }, [data, profiles, selectedProfileId]);

  const activePlatform = useMemo(() => {
    if (!selectedProfileId) return 'all';
    const profile = profiles.find(p => p.id === selectedProfileId);
    return profile?.platform?.toLowerCase() || 'all';
  }, [selectedProfileId, profiles]);

  const stats = useMemo(() => {
    const common = {
      views: { label: 'Total Views', value: metrics.totalViews >= 1000 ? `${(metrics.totalViews / 1000).toFixed(1)}K` : metrics.totalViews, trend: '100%', icon: <Eye size={16} className="text-blue-500"/>, bg: 'bg-blue-50' },
      interactions: { label: 'Total Interactions', value: metrics.totalInteractions.toLocaleString(), trend: '100%', icon: <Sparkles size={16} className="text-amethyst-dark"/>, bg: 'bg-amethyst-light/30' },
      er: { label: 'Engagement Rate', value: `${metrics.engagementRate.toFixed(2)}%`, trend: '100%', icon: <TrendingUp size={16} className="text-rose-500"/>, bg: 'bg-rose-50' },
      content: { 
        label: 'Content Uploaded', 
        value: metrics.contentUploaded.toString(), 
        trend: '100%', 
        icon: <Layout size={16} className="text-emerald-500"/>, 
        bg: 'bg-emerald-50',
        subValue: `${(metrics.contentUploaded / (dailyMetrics.length || 1)).toFixed(2)} content / hari`
      },
      follows: { 
        label: 'New Followers', 
        value: `+${metrics.newFollowers}`, 
        trend: '100%', 
        icon: <Users size={16} className="text-orange-500"/>, 
        bg: 'bg-orange-50', 
        subValue: `${metrics.totalFollowersOverall.toLocaleString()} Total` 
      },
      reach: { label: 'Total Reach', value: metrics.totalReach >= 1000 ? `${(metrics.totalReach / 1000).toFixed(1)}K` : metrics.totalReach, trend: '100%', icon: <Activity size={16} className="text-indigo-500"/>, bg: 'bg-indigo-50' },
      reposts: { label: 'Total Reposts', value: metrics.totalReposts.toLocaleString(), trend: '100%', icon: <Share2 size={16} className="text-cyan-500"/>, bg: 'bg-cyan-50' },
      retention: { label: 'Avg Retention', value: `${metrics.avgRetention.toFixed(1)}%`, trend: '100%', icon: <MousePointer2 size={16} className="text-purple-500"/>, bg: 'bg-purple-50' },
    };

    if (activePlatform.includes('instagram')) {
      return [common.reach, common.views, common.er, common.reposts, common.content, common.interactions, common.follows];
    }
    if (activePlatform.includes('tiktok')) {
      return [common.views, common.interactions, common.retention, common.er, common.content, common.follows];
    }
    if (activePlatform.includes('threads')) {
      return [common.views, common.interactions, common.content, common.er, common.reposts, common.follows];
    }

    // Default for 'all' or others
    return [common.views, common.er, common.content, common.interactions, common.follows];
  }, [activePlatform, metrics]);

  const chartMax = useMemo(() => {
    const key = activeMetric.toLowerCase();
    const vals = dailyMetrics.map(d => Number(d[key]));
    return Math.max(...vals, 10);
  }, [dailyMetrics, activeMetric]);

  const generateLinePath = (dataItems: any[], max: number) => {
    if (dataItems.length === 0) return '';
    const width = 800;
    const height = 300;
    const key = activeMetric.toLowerCase();
    const step = width / Math.max(dataItems.length - 1, 1);
    
    let path = `M 0,${height - (Number(dataItems[0][key]) / max) * height}`;
    
    for (let i = 0; i < dataItems.length - 1; i++) {
      const x1 = i * step;
      const y1 = height - (Number(dataItems[i][key]) / max) * height;
      const x2 = (i + 1) * step;
      const y2 = height - (Number(dataItems[i + 1][key]) / max) * height;
      
      const cp1x = x1 + (x2 - x1) / 3;
      const cp2x = x1 + (x2 - x1) * 2 / 3;
      
      path += ` C ${cp1x},${y1} ${cp2x},${y2} ${x2},${y2}`;
    }
    
    return path;
  };

  const generateAreaPath = (dataItems: any[], max: number) => {
    const linePath = generateLinePath(dataItems, max);
    if (!linePath) return '';
    const width = 800;
    const height = 300;
    return `${linePath} L 800,300 L 0,300 Z`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width); // Scale to viewbox width
    const totalPoints = dailyMetrics.length;
    if (totalPoints <= 1) return;

    const step = 800 / (totalPoints - 1);
    const index = Math.round(x / step);
    if (index >= 0 && index < totalPoints) {
      setHoveredIdx(index);
    }
  };

  return (
    <div className="analytics-main-container">
      <div className="space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex items-start justify-between">
         <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-amethyst-dark tracking-tight">Content Performance</h2>
            <p className="text-sm text-slate-400 font-medium italic">Measurable impact of your agency's published content.</p>
         </div>

         <div className="flex items-center gap-4">
            <AnimatePresence>
              {activeRange === 'Custom Range' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                    <CalendarIcon size={12} className="text-amethyst-primary"/>
                    <input 
                      type="date" 
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-amethyst-dark outline-none cursor-pointer"
                    />
                  </div>
                  <span className="text-slate-300 text-[10px] font-black">to</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                    <CalendarIcon size={12} className="text-amethyst-primary"/>
                    <input 
                      type="date" 
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-amethyst-dark outline-none cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
               {['This Month', 'Last Month', 'Custom Range'].map((range) => (
                 <button
                   key={range}
                   onClick={() => setActiveRange(range)}
                   className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                     activeRange === range ? 'bg-white text-amethyst-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {range}
                 </button>
               ))}
            </div>
          </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><div className="w-10 h-10 border-4 border-amethyst-light border-t-amethyst-dark rounded-full animate-spin"/></div>
      ) : (
        <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          <div 
            className="grid gap-4" 
            style={{ 
              gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` 
            }}
          >
             {stats.map((stat, i) => {
                const userStr = typeof window !== 'undefined' ? localStorage.getItem('aruneeka_user') : null;
                const user = userStr ? JSON.parse(userStr) : null;
                const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                const isLocked = i >= 3 && currentTier === 'free' && !isPowerUser;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }} 
                    key={i} 
                    className={`relative bg-white p-5 rounded-[24px] border border-slate-50 shadow-premium group transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden ${isLocked ? 'cursor-default' : ''}`}
                  >
                     <div className={`flex flex-col h-full justify-between transition-all duration-500 ${isLocked ? 'blur-[8px] opacity-30 select-none grayscale' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                           <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                              {React.cloneElement(stat.icon as React.ReactElement, { size: 14 })}
                           </div>
                           <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-500">
                              <TrendingUp size={9}/> {stat.trend}
                           </div>
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-[9px] font-bold text-slate-300 leading-none truncate">{stat.label}</p>
                           <h3 className="text-xl font-bold text-amethyst-dark tracking-tight">{stat.value}</h3>
                           {stat.subValue && <p className="text-[8px] font-bold text-slate-400 truncate">{stat.subValue}</p>}
                        </div>
                     </div>

                     {/* Subscribe Overlay */}
                     {isLocked && (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[1px]">
                          <div className="bg-amber-400 p-2 rounded-full shadow-lg mb-2 shadow-amber-400/30">
                             <ShieldCheck size={12} className="text-white"/>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 whitespace-nowrap">Subscribe only</span>
                       </div>
                     )}
                  </motion.div>
                );
             })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-50 shadow-premium p-10 flex flex-col min-h-[550px]">
                <div className="flex items-center justify-between mb-12">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <TrendingUp size={14} className="text-amethyst-primary"/>
                         <h4 className="text-xs font-bold text-amethyst-dark tracking-tight">Growth Performance Trend</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium tracking-tight">Daily visualizer — {activeRange.toLowerCase()}</p>
                   </div>

                   <div className="flex items-center bg-slate-50 p-1 rounded-xl">
                      {['Views', 'Interactions', 'Followers'].map((type) => (
                        <button 
                          key={type}
                          onClick={() => setActiveMetric(type)}
                          className={`px-5 py-2 rounded-lg text-[9px] font-bold transition-all flex items-center gap-2 ${
                            activeMetric === type ? 'bg-amethyst-dark text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {type === 'Views' && <Eye size={12}/>}
                          {type === 'Interactions' && <Activity size={12}/>}
                          {type === 'Followers' && <Users size={12}/>}
                          {type}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 relative flex flex-col justify-end">
                   <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-2 text-[9px] font-bold text-slate-300 pointer-events-none">
                      <span>{chartMax >= 1000 ? `${(chartMax / 1000).toFixed(1)}K` : chartMax}</span>
                      <span>{chartMax >= 1000 ? `${(chartMax * 0.75 / 1000).toFixed(1)}K` : (chartMax * 0.75).toFixed(0)}</span>
                      <span>{chartMax >= 1000 ? `${(chartMax * 0.5 / 1000).toFixed(1)}K` : (chartMax * 0.5).toFixed(0)}</span>
                      <span>{chartMax >= 1000 ? `${(chartMax * 0.25 / 1000).toFixed(1)}K` : (chartMax * 0.25).toFixed(0)}</span>
                      <span className="text-slate-200">0</span>
                   </div>
                   
                   <div className="ml-12 flex-1 relative border-l border-b border-slate-50 group/chart">
                      <svg 
                         className="w-full h-full overflow-visible cursor-crosshair" 
                         viewBox="0 0 800 300" 
                         preserveAspectRatio="none"
                         onMouseMove={handleMouseMove}
                         onMouseLeave={() => setHoveredIdx(null)}
                      >
                         <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#AC8BEE" stopOpacity="0.1" />
                               <stop offset="100%" stopColor="#AC8BEE" stopOpacity="0" />
                            </linearGradient>
                         </defs>

                         {/* Horizontal Grid Lines */}
                         {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                           <line 
                             key={i} 
                             x1="0" 
                             y1={300 - p * 300} 
                             x2="800" 
                             y2={300 - p * 300} 
                             stroke="#F1F5F9" 
                             strokeWidth="1" 
                           />
                         ))}

                         {/* Vertical Grid Lines (matching X labels) */}
                         {dailyMetrics.filter((_, i) => i % Math.ceil(dailyMetrics.length / 4) === 0).map((_, i, arr) => (
                           <line 
                             key={i} 
                             x1={(i * (dailyMetrics.length / (arr.length - 1)) * (800 / (dailyMetrics.length - 1)))} 
                             y1="0" 
                             x2={(i * (dailyMetrics.length / (arr.length - 1)) * (800 / (dailyMetrics.length - 1)))} 
                             y2="300" 
                             stroke="#F1F5F9" 
                             strokeWidth="1" 
                           />
                         ))}
                         
                         {/* Fix vertical grid calc - simpler approach */}
                         {[0, 200, 400, 600, 800].map((x) => (
                           <line 
                             key={'v'+x}
                             x1={x}
                             y1="0"
                             x2={x}
                             y2="300"
                             stroke="#F8FAFC"
                             strokeWidth="1"
                           />
                         ))}
                         <motion.path 
                            key={'area' + activeMetric + activeRange + selectedProfileId + customStart + customEnd}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            d={generateAreaPath(dailyMetrics, chartMax)} 
                            fill="url(#chartGradient)" 
                         />
                         <motion.path 
                            key={'line' + activeMetric + activeRange + selectedProfileId + customStart + customEnd}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={generateLinePath(dailyMetrics, chartMax)} 
                            fill="none" 
                            stroke="#AC8BEE" 
                            strokeWidth="5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                         />

                         {hoveredIdx !== null && dailyMetrics[hoveredIdx] && (
                           <g>
                             <line 
                               x1={hoveredIdx * (800 / Math.max(dailyMetrics.length - 1, 1))} 
                               y1="0" 
                               x2={hoveredIdx * (800 / Math.max(dailyMetrics.length - 1, 1))} 
                               y2="300" 
                               stroke="#AC8BEE" 
                               strokeWidth="1" 
                               strokeDasharray="4 4"
                               opacity="0.3"
                             />
                             <circle 
                               cx={hoveredIdx * (800 / Math.max(dailyMetrics.length - 1, 1))} 
                               cy={300 - (Number(dailyMetrics[hoveredIdx][activeMetric.toLowerCase()]) / chartMax) * 300} 
                               r="5" 
                               fill="#AC8BEE" 
                               stroke="white" 
                               strokeWidth="2"
                             />
                           </g>
                         )}
                      </svg>

                      <AnimatePresence>
                        {hoveredIdx !== null && dailyMetrics[hoveredIdx] && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            style={{ 
                              left: `${(hoveredIdx * (100 / Math.max(dailyMetrics.length - 1, 1)))}%`,
                              top: `${(300 - (Number(dailyMetrics[hoveredIdx][activeMetric.toLowerCase()]) / chartMax) * 300) / 3}%` 
                            }}
                            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+20px)]"
                          >
                             <div className="bg-amethyst-dark text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md min-w-[120px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amethyst-light/60 mb-1">
                                  {dailyMetrics[hoveredIdx].day} {dailyMetrics[hoveredIdx].month}
                                </p>
                                <div className="flex items-center justify-between gap-4">
                                   <span className="text-xs font-bold text-white">{activeMetric}</span>
                                   <span className="text-sm font-black text-amethyst-light">
                                     {Number(dailyMetrics[hoveredIdx][activeMetric.toLowerCase()]).toLocaleString()}
                                   </span>
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-amethyst-dark" />
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>

                   <div className="ml-12 flex justify-between pt-6 text-[9px] font-bold text-slate-300">
                      {dailyMetrics.filter((_, i) => i % Math.ceil(dailyMetrics.length / 4) === 0).map((d, i) => (
                        <span key={i}>{d.day} {d.month}</span>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-12">
                <div className="space-y-5">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 italic">
                         <Sparkles size={12} className="text-amethyst-primary"/> Top 3 Performers
                      </h4>
                      <span className="text-[8px] font-bold text-amethyst-primary uppercase tracking-widest bg-amethyst-light/20 px-2 py-0.5 rounded-full">{activeMetric}</span>
                   </div>
                   <div className="space-y-4">
                      {data.filter(p => p.metrics && p.metrics[activeMetric.toLowerCase()] !== undefined).sort((a, b) => (Number(b.metrics[activeMetric.toLowerCase()]) || 0) - (Number(a.metrics[activeMetric.toLowerCase()]) || 0)).slice(0, 3).map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedContent(item)}
                          className="bg-white p-5 rounded-2xl border border-slate-50 shadow-premium flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 ${i === 0 ? 'bg-amethyst-primary shadow-lg shadow-amethyst-primary/30' : 'bg-amethyst-light/30 text-amethyst-primary'} rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'text-white' : 'text-amethyst-primary'} italic`}>#{i+1}</div>
                              <div>
                                 <p className="text-[11px] font-bold text-amethyst-dark group-hover:text-amethyst-primary transition-colors line-clamp-1 max-w-[120px]">{item.title}</p>
                                 <p className="text-[9px] text-slate-400 font-medium italic">{Number(item.metrics[activeMetric.toLowerCase()]).toLocaleString()} {activeMetric}</p>
                              </div>
                           </div>
                           <ChevronRight size={14} className="text-slate-200 group-hover:text-amethyst-primary transition-all"/>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-5">
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 italic">
                         <TrendingDown size={12} className="text-slate-400"/> Needs Attention
                      </h4>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">Bottom 3</span>
                   </div>
                   <div className="space-y-4">
                      {data.filter(p => p.status?.toLowerCase() === 'uploaded').sort((a, b) => (Number(a.metrics?.[activeMetric.toLowerCase()] || 0)) - (Number(b.metrics?.[activeMetric.toLowerCase()] || 0))).slice(0, 3).map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedContent(item)}
                          className="bg-white p-5 rounded-2xl border border-slate-50 shadow-premium flex items-center justify-between group hover:bg-slate-50 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[10px] font-bold italic group-hover:bg-slate-200 group-hover:text-slate-600 transition-all">#{i+1}</div>
                              <div>
                                 <p className="text-[11px] font-bold text-amethyst-dark line-clamp-1 max-w-[120px]">{item.title}</p>
                                 <p className="text-[9px] text-slate-400 font-medium italic">{Number(item.metrics?.[activeMetric.toLowerCase()] || 0).toLocaleString()} {activeMetric}</p>
                              </div>
                           </div>
                           <TrendingDown size={14} className="text-slate-200 group-hover:text-rose-400 transition-all"/>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Detailed Asset Breakdown Section */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-white rounded-[40px] shadow-premium p-12 border border-slate-50 relative overflow-hidden"
        >
           {/* Logic Locking for Breakdown Table */}
           {(() => {
              const userStr = typeof window !== 'undefined' ? localStorage.getItem('aruneeka_user') : null;
              const user = userStr ? JSON.parse(userStr) : null;
              const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
              const isBreakdownLocked = currentTier === 'free' && !isPowerUser;

              return isBreakdownLocked && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/5 backdrop-blur-[12px] transition-all duration-700">
                   <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="flex flex-col items-center gap-4 text-center p-12"
                   >
                      <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                            <ShieldCheck size={32} />
                          </div>
                          <div className="space-y-1">
                             <h3 className="text-xl font-bold text-slate-800 tracking-tight">Pro Insight Required</h3>
                             <p className="text-[10px] text-slate-400 font-medium">Upgrade to view detailed analytics for each individual asset.</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => openUpgrade()}
                         className="mt-2 px-8 py-3 bg-amethyst-primary text-white rounded-xl text-[10px] font-bold shadow-xl shadow-amethyst-primary/20 hover:scale-105 transition-all">
                        Upgrade to Unlock
                      </button>
                   </motion.div>
                </div>
              );
           })()}

           <div className={`transition-all duration-700 ${currentTier === 'free' && !(localStorage.getItem('aruneeka_user')?.includes('Superuser') || localStorage.getItem('aruneeka_user')?.includes('developer')) ? 'blur-md grayscale opacity-30 select-none' : ''}`}>
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-2xl font-black text-amethyst-dark tracking-tight">Detailed Asset Breakdown</h3>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black text-slate-300">Live Tracking Data (this month)</span>
                 </div>
              </div>

           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                 <thead>
                    <tr className="border-b border-slate-50">
                       <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300">Content identity</th>
                       <th className="text-center py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Platform</th>
                       <th className="text-center py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Posting Date</th>
                       <th className="text-center py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Views</th>
                       <th className="text-center py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">ER %</th>
                       <th className="text-right py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {data.filter(p => p.status?.toLowerCase() === 'uploaded').sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()).map((item, i) => {
                       const m = item.metrics || {};
                       const getV = (searchKeys: string[]) => {
                         const normalizedSearches = searchKeys.map(k => k.replace(/[\s_.]/g, '').toLowerCase());
                         for (const dbKey in m) {
                           const normalizedDbKey = dbKey.replace(/[\s_.]/g, '').toLowerCase();
                           if (normalizedSearches.includes(normalizedDbKey)) {
                             return Number(m[dbKey]) || 0;
                           }
                         }
                         return 0;
                       };

                       const views = getV(['views', 'impressions']);
                       const likes = getV(['likes']);
                       const comments = getV(['comments']);
                       const shares = getV(['shares', 'reposts']);
                       const saves = getV(['saves', 'bookmarks']);
                       const interactions = getV(['interactions']) || (likes + comments + shares + saves);
                       const er = views > 0 ? ((interactions / views) * 100).toFixed(2) : '0.00';

                       const PlatformIcon = () => {
                          const p = item.platform?.toLowerCase() || '';
                          if (p.includes('instagram')) return <img src="https://cdn.simpleicons.org/instagram/E4405F" className="w-5 h-5" alt="IG" />;
                          if (p.includes('tiktok')) return <img src="https://cdn.simpleicons.org/tiktok/000000" className="w-5 h-5" alt="TT" />;
                          if (p.includes('threads')) return <img src="https://cdn.simpleicons.org/threads/000000" className="w-5 h-5" alt="TH" />;
                          return <Layout size={18} className="text-amethyst-primary"/>;
                       };

                       return (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0">
                             <td className="py-6 px-4">
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                      <PlatformIcon />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-amethyst-dark group-hover:text-amethyst-primary transition-colors leading-tight mb-1">{item.title}</p>
                                      <p className="text-[10px] font-bold text-slate-400 italic uppercase tracking-widest">{item.content_pillar || 'Insight'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <div className="flex justify-center">
                                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100/50 group-hover:bg-amethyst-light/10 transition-all">
                                      <PlatformIcon />
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <p className="text-[11px] font-bold text-slate-500 italic">
                                   {new Date(item.due_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <p className="text-sm font-black text-amethyst-dark">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</p>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                   <p className={`text-sm font-black ${Number(er) > 5 ? 'text-emerald-500' : 'text-amethyst-primary'}`}>{er}%</p>
                                   <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full ${Number(er) > 5 ? 'bg-emerald-500' : 'bg-amethyst-primary'}`} style={{ width: `${Math.min(Number(er) * 5, 100)}%` }}></div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 px-4">
                                <div className="flex items-center justify-end gap-3">
                                   <button 
                                     onClick={() => setSelectedContent(item)}
                                     className="w-10 h-10 bg-amethyst-light/10 text-amethyst-primary rounded-xl flex items-center justify-center hover:bg-amethyst-primary hover:text-white transition-all shadow-sm"
                                   >
                                      <Activity size={16}/>
                                   </button>
                                   <a 
                                     href={item.post_link || '#'} 
                                     target="_blank" 
                                     rel="noreferrer"
                                     className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                       item.post_link ? 'bg-amethyst-dark text-white hover:bg-black' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                     }`}
                                   >
                                      <ExternalLink size={16}/>
                                   </a>
                                </div>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           </div>
        </motion.div>
        </>
      )}
    </div>
    <AnimatePresence>
        {selectedContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-12 bg-amethyst-dark/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-6xl rounded-[48px] shadow-[0_32px_64px_-16px_rgba(172,139,238,0.3)] overflow-hidden border border-white/20 flex flex-col md:flex-row h-auto max-h-[90vh]"
            >
              {/* Sidebar: Performance Summary (Purple BG) */}
              <div className="w-full md:w-[280px] bg-amethyst-primary p-7 flex flex-col text-white flex-shrink-0 relative overflow-hidden">
                 {/* Decorative background circle */}
                 <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-amethyst-dark/20 rounded-full blur-3xl" />

                 <div className="relative z-10 flex flex-col h-full">
                    <div className="space-y-1 mb-6">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-60"></div>
                          <span className="text-[8px] font-black uppercase tracking-[3px] text-white/60">Uploaded</span>
                       </div>
                       <h3 className="text-lg font-black tracking-tight">Performance report</h3>
                    </div>
                    
                    {(() => {
                       const m = selectedContent.metrics || {};
                       const get = (searchKeys: string[]) => {
                         const ns = searchKeys.map(k => k.replace(/[\s_.]/g, '').toLowerCase());
                         for (const k in m) if (ns.includes(k.replace(/[\s_.]/g, '').toLowerCase())) return Number(m[k]) || 0;
                         return 0;
                       };
                       
                       const views = get(['views', 'impressions']);
                       const reach = get(['reach']) || views;
                       let interactions = get(['interactions']) || (get(['likes']) + get(['comments']) + get(['shares', 'reposts']) + get(['saves', 'bookmarks']));
                       const profile_visits = get(['profilevisits', 'profilevisit', 'visits', 'profilevis']);
                       const followers = get(['newfollowers', 'followers', 'follows', 'newfollows']);
                       const er = views > 0 ? ((interactions / views) * 100).toFixed(2) : '0';

                       return (
                         <>
                           <div className="flex-1 space-y-1.5 overflow-hidden">
                               {[
                                 { label: 'Reach', value: reach, icon: <Activity size={12}/> },
                                 { label: 'Views', value: views, icon: <Eye size={12}/> },
                                 { label: 'Interacts', value: interactions, icon: <Sparkles size={12}/> },
                                 { label: 'Reposts', value: get(['shares', 'reposts']), icon: <Share2 size={12}/> },
                                 { label: 'Visits', value: profile_visits, icon: <Users size={12}/> },
                                 { label: 'Follows', value: `+${followers}`, icon: <Users size={12}/> },
                                 { label: 'E. Rate', value: `${er}%`, icon: <TrendingUp size={12}/> },
                               ].map((item, i) => (
                                 <div key={i} className="bg-white/10 p-2 rounded-lg flex items-center justify-between border border-white/5 hover:bg-white/20 transition-all">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center text-white/80">{item.icon}</div>
                                       <span className="text-[8px] font-bold uppercase tracking-widest text-white/60">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-black">{Number(item.value.toString().replace('+', '')) >= 1000 ? `${(Number(item.value.toString().replace('+', '')) / 1000).toFixed(1)}K` : item.value}</span>
                                 </div>
                               ))}
                           </div>

                           <div className="mt-auto pt-3 border-t border-white/10 space-y-3">
                              <div className="bg-amethyst-dark/30 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                                 <div>
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Grade</p>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <div className={`w-1 h-1 rounded-full ${Number(er) > 10 ? "bg-emerald-400" : Number(er) > 5 ? "bg-yellow-400" : Number(er) > 2 ? "bg-white/60" : "bg-rose-400"}`}></div>
                                        <h4 className="text-sm font-black text-white">{Number(er) > 10 ? "Excellent" : Number(er) > 5 ? "Good" : Number(er) > 2 ? "Average" : "Review"}</h4>
                                     </div>
                                  </div>
                                 <div className="text-right">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">ER Snapshot</p>
                                    <p className="text-[10px] font-black text-white">{er}%</p>
                                 </div>
                              </div>

                              <div className="flex items-center justify-center gap-3 py-2 bg-white/5 rounded-xl border border-white/5">
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                     {(() => {
                                       const p = selectedContent.platform?.toLowerCase() || '';
                                       if (p.includes('instagram')) return <img src="https://cdn.simpleicons.org/instagram/E4405F" className="w-4 h-4" alt="IG" />;
                                       if (p.includes('tiktok')) return <img src="https://cdn.simpleicons.org/tiktok/000000" className="w-4 h-4" alt="TT" />;
                                       if (p.includes('threads')) return <img src="https://cdn.simpleicons.org/threads/000000" className="w-4 h-4" alt="TH" />;
                                       return <Activity size={14} className="text-amethyst-primary"/>;
                                     })()}
                                  </div>
                                  <div>
                                     <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Active On</p>
                                     <p className="text-[10px] font-black truncate max-w-[100px]">{selectedContent.platform}</p>
                                  </div>
                              </div>
                           </div>
                         </>
                       );
                    })()}
                 </div>
              </div>              {/* Main Content (White BG) */}
              <div className="flex-1 bg-white p-8 sm:p-10 flex flex-col relative overflow-hidden">
                 <button 
                   onClick={() => setSelectedContent(null)}
                   className="absolute top-6 right-6 w-9 h-9 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all rounded-full border border-slate-100 z-30"
                 >✕</button>

                 <div className="relative z-10 flex flex-col h-full space-y-6">
                    {/* Header Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-md border border-emerald-100/50">{selectedContent.status}</span>
                           <span className="text-slate-300 text-[10px] font-semibold">{new Date(selectedContent.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <h2 className="text-3xl font-black text-amethyst-dark tracking-tight leading-tight">{selectedContent.title}</h2>
                        <div className="mt-2 flex items-center gap-2">
                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amethyst-primary/5 rounded-lg border border-amethyst-primary/10">
                              <Sparkles size={10} className="text-amethyst-primary"/>
                              <span className="text-[9px] font-black text-amethyst-primary uppercase tracking-widest">{selectedContent.content_pillar || 'Educational'}</span>
                           </div>
                        </div>
                    </div>

                    {/* Timeline - Much Slimmer */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                        <div className="flex items-center justify-between mb-4">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Workflow Status</p>
                           <span className="text-[9px] font-bold text-amethyst-primary">Stage 5/5</span>
                        </div>
                        <div className="relative flex items-center justify-between px-2">
                           <div className="absolute left-2 right-2 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 rounded-full">
                              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-amethyst-primary shadow-[0_0_8px_rgba(172,139,238,0.5)]" />
                           </div>
                           {['Draft', 'Production', 'Review', 'Approved', 'Ready'].map((step, idx) => (
                             <div key={idx} className="relative z-10 flex flex-col items-center">
                                <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all ${idx < 5 ? 'bg-amethyst-primary text-white' : 'bg-slate-200 text-white'}`}>
                                   <Check size={8} strokeWidth={5}/>
                                </div>
                                <span className={`mt-2 text-[7px] font-black uppercase tracking-widest transition-colors ${idx < 5 ? 'text-amethyst-dark' : 'text-slate-300'}`}>{step}</span>
                             </div>
                           ))}
                        </div>
                    </div>

                    {/* Split Content: Resources vs AI */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                        {/* Resource Column */}
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Content Resources</p>
                           <div className="space-y-2">
                              {[
                                { label: 'Link Script', url: selectedContent.script_link, icon: <FileText size={16}/> },
                                { label: 'Konten Folder', url: selectedContent.content_link, icon: <Video size={16}/> },
                              ].map((link, i) => (
                                <a 
                                  key={i}
                                  href={link.url || '#'} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                    link.url ? 'bg-white border-slate-100 hover:border-amethyst-primary hover:shadow-lg' : 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed'
                                  }`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                         link.url ? (link.active ? 'bg-emerald-50 text-emerald-500' : 'bg-amethyst-primary/10 text-amethyst-primary') : 'bg-slate-100 text-slate-300'
                                      }`}>
                                         {link.icon}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-600 tracking-tight">{link.label}</span>
                                   </div>
                                   {link.url && <ArrowUpRight size={12} className="text-slate-300"/>}
                                </a>
                              ))}
                           </div>
                        </div>

                        {/* AI Insight Column */}
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Advanced Strategy AI</p>
                           <div className="h-full max-h-[160px] p-5 bg-gradient-to-br from-amethyst-primary/5 to-transparent border border-amethyst-primary/10 rounded-3xl relative overflow-hidden flex flex-col justify-center">
                              <div className="absolute -top-4 -right-4 opacity-5"><Sparkles size={80}/></div>
                              <div className="relative z-10 space-y-3">
                                 <div className="w-10 h-10 bg-amethyst-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-amethyst-primary/30">
                                    <Zap size={20}/>
                                 </div>
                                 <p className="text-sm font-bold text-amethyst-dark/90 leading-relaxed italic">
                                    {(() => {
                                      const m = selectedContent.metrics || {};
                                      const hasMetrics = Object.keys(m).length > 0 && Object.values(m).some(v => Number(v) > 0);
                                      if (!hasMetrics) return "Lengkapi data metrics untuk mendapatkan insight strategis.";
                                      
                                      const getV = (keys: string[]) => {
                                        const ns = keys.map(k => k.replace(/[\s_.]/g, '').toLowerCase());
                                        for (const k in m) if (ns.includes(k.replace(/[\s_.]/g, '').toLowerCase())) return Number(m[k]) || 0;
                                        return 0;
                                      };

                                      const v = getV(['views', 'impressions']);
                                      const l = getV(['likes']);
                                      const c = getV(['comments']);
                                      const s = getV(['shares', 'reposts']);
                                      const f = getV(['newfollowers', 'followers', 'follows']);
                                      const er = v > 0 ? (l + c + s) / v * 100 : 0;
                                      const platform = selectedContent.platform?.toLowerCase() || '';

                                      if (v > 5000 && er < 2) return "Reach tinggi tapi engagement rendah. Coba ganti pola 'Call to Action' di awal video.";
                                      if (er > 12) return `Performa luar biasa! Konten ini berhasil menarik ${f} followers baru secara organik.`;
                                      return "Performa konten stabil. Fokus pada konsistensi jadwal posting untuk menjaga momentum algoritma.";
                                    })()}
                                 </p>
                              </div>
                           </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tracking-[1px]">Operational Sync Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setSelectedContent(null)}
                             className="px-6 py-3 text-slate-400 text-[10px] font-black hover:bg-slate-50 transition-all rounded-xl"
                           >
                             Close
                           </button>
                           {selectedContent.post_link ? (
                             <a 
                               href={selectedContent.post_link} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="px-8 py-3 bg-amethyst-primary text-white rounded-xl text-[10px] font-black shadow-lg shadow-amethyst-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2 active:scale-95"
                             >
                                <ExternalLink size={12}/> View Live Link
                             </a>
                           ) : (
                             <button 
                               disabled
                               className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black flex items-center gap-2 cursor-not-allowed border border-slate-200"
                             >
                                <ExternalLink size={12}/> Link Unavailable
                             </button>
                           )}
                        </div>
                    </div>
                     </div>
                     
                     <p className="text-[9px] text-center text-slate-300 font-medium mt-10">
                        Secured by Aruneeka Encryption. Payments are manually verified by our team.
                     </p>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
     </div>

  );
};

export default AruneekaAnalytics;
