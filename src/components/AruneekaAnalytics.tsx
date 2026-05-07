'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, TrendingUp, Users, Sparkles, ChevronRight, TrendingDown,
  Layout, MousePointer2, Share2, Calendar as CalendarIcon, Activity,
  ExternalLink, Package, ShieldCheck, HelpCircle, Zap, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

// --- NEW COMPACT PERFORMANCE CHART (SMOOTH CURVE STYLE) ---

const PerformanceChart = ({ data, activeMetric, maxVal }: { data: any[], activeMetric: string, maxVal: number }) => {
   const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
   if (data.length === 0) return null;
   
   const width = 800;
   const height = 450; 
   const paddingLeft = 50;
   const paddingRight = 20;
   const paddingTop = 40;
   const paddingBottom = 60;
   
   const chartWidth = width - paddingLeft - paddingRight;
   const chartHeight = height - paddingTop - paddingBottom;
   
   const key = activeMetric.toLowerCase();
   
   const getCoords = (i: number) => {
      const x = (i / (data.length - 1 || 1)) * chartWidth + paddingLeft;
      const y = paddingTop + chartHeight - ((Number(data[i][key]) / (maxVal || 1)) * chartHeight);
      return { x, y };
   };

   // Generate Smooth Path (Cubic Bezier Interpolation)
   const generateSmoothPath = () => {
    if (!data || data.length < 2) return "";
    try {
      const coords = data.map((_, i) => getCoords(i));
      if (!coords || coords.length === 0 || !coords[0]) return "";
      
      let d = `M ${coords[0].x},${coords[0].y}`;

      for (let i = 0; i < coords.length - 1; i++) {
         const curr = coords[i];
         const next = coords[i + 1];
         if (!curr || !next) continue;
         
         const cp1x = curr.x + (next.x - curr.x) * 0.5;
         const cp2x = curr.x + (next.x - curr.x) * 0.5;
         d += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
      }
      return d;
    } catch (e) {
      return "";
    }
  };

  const smoothPath = useMemo(generateSmoothPath, [data, activeMetric, maxVal]);
  const areaPath = useMemo(() => {
    if (!smoothPath) return "";
    return `${smoothPath} V ${paddingTop + chartHeight} H ${paddingLeft} Z`;
  }, [smoothPath, paddingTop, chartHeight, paddingLeft]);

   const yIndicators = [0, Math.ceil(maxVal * 0.25), Math.ceil(maxVal * 0.5), Math.ceil(maxVal * 0.75), maxVal];

   const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (width / rect.width);
      const relativeX = x - paddingLeft;
      const idx = Math.round((relativeX / chartWidth) * (data.length - 1));
      if (idx >= 0 && idx < data.length) setHoveredIdx(idx);
   };

   return (
      <div className="w-full relative aspect-[800/450]">
         <svg 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIdx(null)}
         >
            <defs>
               <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#916DD5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#916DD5" stopOpacity="0" />
               </linearGradient>
            </defs>

            {/* Y-Axis Grid Lines */}
            {yIndicators.map((val: number, i: number) => {
               const y = paddingTop + chartHeight - (((val || 0) / (maxVal || 1)) * chartHeight);
               return (
                  <g key={`y-${i}`}>
                     <line 
                        x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} 
                        stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4"
                     />
                     <text 
                        x={paddingLeft - 12} y={y} 
                        textAnchor="end" alignmentBaseline="middle" 
                        className="text-[10px] font-black fill-slate-300 tracking-tighter"
                     >
                        {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                     </text>
                  </g>
               );
            })}

            {/* Subtle Vertical Hover Line */}
            <AnimatePresence>
               {hoveredIdx !== null && (
                  <motion.line
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     x1={getCoords(hoveredIdx).x}
                     y1={paddingTop}
                     x2={getCoords(hoveredIdx).x}
                     y2={paddingTop + chartHeight}
                     stroke="#E2E8F0"
                     strokeWidth="1"
                     strokeDasharray="4,4"
                  />
               )}
            </AnimatePresence>

            {/* Smooth Area */}
            <motion.path 
               key={'area-'+activeMetric}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1, d: areaPath }}
               transition={{ duration: 1, ease: 'easeOut' }}
               fill="url(#chartGrad)"
            />

            {/* The Smooth Curve Line */}
            <motion.path
               key={'line-'+activeMetric}
               fill="none"
               stroke="#916DD5"
               strokeWidth="4"
               strokeLinecap="round"
               strokeLinejoin="round"
               d={smoothPath}
               initial={{ pathLength: 0, opacity: 0 }}
               animate={{ pathLength: 1, opacity: 1 }}
               transition={{ duration: 1.5, ease: 'easeInOut' }}
            />

            {/* X-Axis Labels */}
            {data.map((d: any, i: number) => {
               if (data.length > 10 && i % 4 !== 0 && i !== data.length - 1) return null;
               const { x } = getCoords(i);
               return (
                  <text 
                     key={`x-${i}`}
                     x={x} y={height - 20}
                     textAnchor="middle"
                     className="text-[10px] font-bold fill-slate-400 tracking-tight"
                  >
                     {d.day} {d.month.charAt(0).toUpperCase() + d.month.slice(1).toLowerCase()}
                  </text>
               );
            })}

            {/* Data Points (Preserved) */}
            {data.map((d: any, i: number) => {
               const val = Number(d[key]);
               if (val === 0) return null;
               const { x, y } = getCoords(i);
               return (
                  <g key={`pt-${i}`} className="group/pt">
                     <motion.circle 
                        cx={x} cy={y} r="4.5" 
                        fill="white" 
                        stroke="#916DD5" 
                        strokeWidth="3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + (i * 0.02) }}
                     />
                  </g>
               );
            })}

            {/* ABSOLUTE PRECISION HOVER TOOLTIP */}
            <AnimatePresence>
               {hoveredIdx !== null && (() => {
                  const { x, y } = getCoords(hoveredIdx);
                  const val = Number(data[hoveredIdx][key]);
                  return (
                     <foreignObject 
                        key="tooltip-fo"
                        x={x - 100} y={y - 120} 
                        width="200" height="120"
                        className="overflow-visible pointer-events-none"
                     >
                        <motion.div 
                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                           className="w-full h-full flex flex-col items-center justify-end pb-4"
                        >
                           <div className="bg-white/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1 border border-white ring-1 ring-slate-100/50 relative">
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                 {data[hoveredIdx].day} {data[hoveredIdx].month.charAt(0).toUpperCase() + data[hoveredIdx].month.slice(1).toLowerCase()}
                              </span>
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                 <div className="w-2 h-2 bg-amethyst-primary rounded-full animate-pulse" />
                                 <span className="text-sm font-black text-amethyst-dark tracking-tight">{val.toLocaleString()} {activeMetric}</span>
                              </div>
                              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/95 border-r border-b border-slate-100 rotate-45" />
                           </div>
                        </motion.div>
                     </foreignObject>
                  );
               })()}
            </AnimatePresence>
         </svg>
      </div>
   );
};

// --- MAIN COMPONENT ---

const AruneekaAnalytics = ({ 
  selectedProfileId, selectedWorkspaceId, subscriptionTier = 'free', isPublic = false 
}: { 
  selectedProfileId?: string, selectedWorkspaceId?: string, subscriptionTier?: string, isPublic?: boolean 
}) => {
  const [activeRange, setActiveRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeMetric, setActiveMetric] = useState('Views');
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openHintIdx, setOpenHintIdx] = useState<number | null>(null);
  
  const workspaceContext = useWorkspace();
  const currentTier = isPublic ? (subscriptionTier || 'free') : workspaceContext.subscriptionTier;
  const { openUpgrade, openDetail, openMetrics, selectedWorkspaceId: ctxWsId, user } = workspaceContext;
  const workspaceId = isPublic ? selectedWorkspaceId : (selectedWorkspaceId || ctxWsId);

  const isPowerUserActual = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    return role === 'superuser' || role === 'developer';
  }, [user]);

  const currentMonthYear = useMemo(() => {
    const d = new Date();
    return `Bulan ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  }, []);

  const getV = (m: any, keys: string[]) => {
    if (!m) return 0;
    for (const k of keys) {
      if (m[k] !== undefined) return Number(m[k]) || 0;
      const lk = k.toLowerCase();
      for (const ak in m) { if (ak.toLowerCase() === lk) return Number(m[ak]) || 0; }
    }
    return 0;
  };

  const fetchData = async () => {
    if (data.length === 0) setIsLoading(true);
    try {
      if (!workspaceId) return;
      const { data: profileData } = await supabase.from('v2_agency_social_profiles').select('*').eq('workspace_id', workspaceId);
      if (profileData) setProfiles(profileData);
      
      let query = supabase.from('v2_agency_content_plans').select('*').eq('workspace_id', workspaceId);
      if (selectedProfileId) query = query.eq('target_account', selectedProfileId);
      
      const now = new Date();
      if (activeRange === 'This Month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDay.setHours(0,0,0,0);
        query = query.gte('due_date', firstDay.toISOString());
      } else if (activeRange === 'Last Month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        firstDay.setHours(0,0,0,0); lastDay.setHours(23,59,59,999);
        query = query.gte('due_date', firstDay.toISOString()).lte('due_date', lastDay.toISOString());
      } else if (activeRange === 'Custom Range' && customStart && customEnd) {
        query = query.gte('due_date', customStart).lte('due_date', customEnd);
      }
      
      const { data: planData } = await query;
      setData(planData || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [workspaceId, selectedProfileId, activeRange, customStart, customEnd, currentTier]);

  const dailyMetrics = useMemo(() => {
    const grouped: any = {};
    let startDate: Date; let endDate: Date; const now = new Date();
    if (activeRange === 'This Month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); }
    else if (activeRange === 'Last Month') { startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0); }
    else if (activeRange === 'Custom Range' && customStart && customEnd) { startDate = new Date(customStart); endDate = new Date(customEnd); }
    else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); }
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dStr = cur.toISOString().split('T')[0];
      grouped[dStr] = { views: 0, interactions: 0, followers: 0, date: dStr, day: cur.getDate(), month: cur.toLocaleDateString('id-ID', { month: 'short' }) };
      cur.setDate(cur.getDate() + 1);
    }
    data.forEach((item: any) => {
      const d = (item.due_date || '').split('T')[0];
      if (grouped[d]) {
        const m = item.metrics || {};
        grouped[d].views += getV(m, ["views", "impressions"]);
        grouped[d].followers += getV(m, ["new_followers", "follows"]);
        grouped[d].interactions += getV(m, ["likes"]) + getV(m, ["comments"]) + getV(m, ["shares"]) + getV(m, ["saves"]);
      }
    });
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data, activeRange, customStart, customEnd]);

  const activePlatform = useMemo(() => {
    if (!selectedProfileId) return 'all';
    return profiles.find((p: any) => p.id === selectedProfileId)?.platform?.toLowerCase() || 'all';
  }, [selectedProfileId, profiles]);

  const metrics = useMemo(() => {
    const totals = { views: 0, reach: 0, interactions: 0, reposts: 0, uploadedCount: 0, followers: 0 };
    data.forEach((curr: any) => {
      const platform = curr.platform?.toLowerCase() || '';
      if (activePlatform !== 'all' && platform !== activePlatform) return;
      const m = curr.metrics || {};
      const v = getV(m, ["views", "impressions"]);
      totals.views += v; totals.reach += getV(m, ["reach"]) || v;
      totals.interactions += getV(m, ["likes"]) + getV(m, ["comments"]) + getV(m, ["shares"]) + getV(m, ["saves"]);
      totals.reposts += getV(m, ["reposts"]);
      if (curr.status?.toLowerCase() === 'uploaded') totals.uploadedCount++;
      totals.followers += getV(m, ["new_followers", "follows"]);
    });
    
    const targetProfiles = selectedProfileId ? profiles.filter((p: any) => p.id === selectedProfileId) : profiles;
    const initialFollowers = targetProfiles.reduce((acc: number, curr: any) => {
      const val = String(curr.followers || '0');
      const mult = val.toLowerCase().includes('k') ? 1000 : val.toLowerCase().includes('m') ? 1000000 : 1;
      return acc + (parseFloat(val.replace(/[^0-9.]/g, '')) * mult);
    }, 0);

    return { 
      totalViews: totals.views, totalReach: totals.reach, totalInteractions: totals.interactions, totalReposts: totals.reposts, 
      contentUploaded: totals.uploadedCount, newFollowers: totals.followers, 
      totalFollowersOverall: initialFollowers + totals.followers, 
      engagementRate: totals.views > 0 ? (totals.interactions / totals.views) * 100 : 0 
    };
  }, [data, profiles, selectedProfileId, activePlatform]);

  const stats = useMemo(() => {
    const common: Record<string, { 
      label: string; 
      value: string | number; 
      trend: string; 
      icon: React.ReactNode; 
      bg: string; 
      hintTitle: string; 
      hintFormula: string; 
      hintDesc: string; 
      subValue?: string; 
    }> = {
      views: { label: 'Total views', value: metrics.totalViews >= 1000 ? `${(metrics.totalViews/1000).toFixed(1)}k` : metrics.totalViews, trend: '100%', icon: <Eye size={16} className="text-blue-500"/>, bg: 'bg-blue-50', 
        hintTitle: 'Total views', hintFormula: 'Jumlah berapa kali konten Anda dilihat (termasuk pengulangan).', hintDesc: 'Mengukur jangkauan visual konten.' },
      interactions: { label: 'Total interactions', value: metrics.totalInteractions.toLocaleString(), trend: '100%', icon: <Sparkles size={16} className="text-amethyst-dark"/>, bg: 'bg-amethyst-light/30', 
        hintTitle: 'Total interactions', hintFormula: 'Like + Comment + Share + Save.', hintDesc: 'Total tindakan aktif yang dilakukan audiens.' },
      er: { label: 'Engagement rate', value: `${metrics.engagementRate.toFixed(2)}%`, trend: '100%', icon: <TrendingUp size={16} className="text-rose-500"/>, bg: 'bg-rose-50', 
        hintTitle: 'Engagement rate', hintFormula: '(Total interaksi / Total views) x 100%.', hintDesc: 'Mengukur efektivitas konten dalam menarik interaksi.' },
      content: { label: 'Content uploaded', value: metrics.contentUploaded.toString(), trend: '100%', icon: <Layout size={16} className="text-emerald-500"/>, bg: 'bg-emerald-50', subValue: `${Math.round(metrics.contentUploaded / (dailyMetrics.length || 1))} konten / hari`, 
        hintTitle: 'Content uploaded', hintFormula: 'Total unit konten yang berstatus "Uploaded".', hintDesc: 'Mengukur produktivitas publikasi agency.' },
      follows: { label: 'New followers', value: `+${metrics.newFollowers}`, trend: '100%', icon: <Users size={16} className="text-orange-500"/>, bg: 'bg-orange-50', subValue: `${metrics.totalFollowersOverall.toLocaleString()} total`, 
        hintTitle: 'New followers', hintFormula: 'Jumlah pengikut baru yang didapat dalam periode ini.', hintDesc: 'Mengukur pertumbuhan audiens baru.' },
      reach: { label: 'Total reach', value: metrics.totalReach >= 1000 ? `${(metrics.totalReach/1000).toFixed(1)}k` : metrics.totalReach, trend: '100%', icon: <Activity size={16} className="text-indigo-500"/>, bg: 'bg-indigo-50', 
        hintTitle: 'Total reach', hintFormula: 'Jumlah unik akun yang melihat konten Anda.', hintDesc: 'Mengukur penetrasi audiens unik.' },
      reposts: { label: 'Total reposts', value: metrics.totalReposts.toLocaleString(), trend: '100%', icon: <Share2 size={16} className="text-cyan-500"/>, bg: 'bg-cyan-50', 
        hintTitle: 'Total reposts', hintFormula: 'Jumlah berapa kali konten dibagikan ulang.', hintDesc: 'Mengukur virality konten Anda.' }
    };
    if (activePlatform.includes('instagram')) return [common.reach, common.views, common.er, common.reposts, common.content, common.interactions, common.follows];
    return [common.views, common.er, common.content, common.interactions, common.follows];
  }, [activePlatform, metrics, dailyMetrics.length]);

  const chartMax = useMemo(() => Math.max(...dailyMetrics.map((d: any) => Number(d[activeMetric.toLowerCase()])), 10), [dailyMetrics, activeMetric]);

  return (
    <div className="analytics-main-container" onClick={() => setOpenHintIdx(null)}>
      <div className="space-y-10 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-extrabold text-amethyst-dark tracking-tight">Content Performance</h2>
              <p className="text-sm text-slate-400 font-medium italic">Measurable impact of your agency&apos;s published content.</p>
           </div>
           <div className="flex items-center w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {['This Month', 'Last Month', 'Custom Range'].map((range) => (
                <button key={range} onClick={() => setActiveRange(range)} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeRange === range ? 'bg-white text-amethyst-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{range}</button>
              ))}
           </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><div className="w-10 h-10 border-4 border-amethyst-light border-t-amethyst-dark rounded-full animate-spin"/></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {stats.map((stat, i) => {
                   const isLocked = i >= 3 && currentTier === 'free' && !isPowerUserActual;
                   const isHintOpen = openHintIdx === i;
                   return (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative bg-white p-6 rounded-[32px] border border-slate-50 shadow-premium flex flex-col justify-between group">
                         <div className={`flex flex-col h-full justify-between transition-all duration-500 ${isLocked ? 'blur-md opacity-30 select-none grayscale' : ''}`}>
                            <div className="flex items-start justify-between mb-8">
                               <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center shadow-sm`}>{React.cloneElement(stat.icon as any, { size: 16 })}</div>
                               <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500"><TrendingUp size={10}/> {stat.trend}</div>
                                  <div className="relative group/hint">
                                     <div 
                                      className="p-1 text-slate-300 hover:text-amethyst-primary cursor-help transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setOpenHintIdx(isHintOpen ? null : i); }}
                                     >
                                      <HelpCircle size={14}/>
                                     </div>
                                     <div className={`absolute ${i % 2 === 0 ? 'left-0 md:left-auto md:right-0' : 'right-0'} top-full mt-3 w-[210px] md:w-72 bg-amethyst-light/10 backdrop-blur-xl p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl transition-all z-[100] border border-white/40 ring-1 ring-amethyst-primary/10 ${isHintOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible lg:group-hover/hint:opacity-100 lg:group-hover/hint:visible translate-y-2'}`}>
                                        <div className="flex items-center justify-between mb-4 md:mb-6">
                                           <div className="flex items-center gap-3"><div className="w-1 h-5 bg-amethyst-primary rounded-full"/><span className="text-[10px] md:text-[11px] font-black text-amethyst-dark tracking-[0.15em]">Insight</span></div>
                                           <span className="text-[9px] md:text-[10px] font-bold text-amethyst-primary/60 italic">{currentMonthYear}</span>
                                        </div>
                                        <div className="space-y-3 md:space-y-4">
                                           <p className="text-[11px] md:text-[13px] font-black text-amethyst-dark leading-relaxed italic">{stat.hintFormula}</p>
                                           <p className="text-[9px] md:text-[11px] font-bold text-amethyst-primary/70 leading-relaxed">{stat.hintDesc}</p>
                                        </div>
                                        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-amethyst-primary/10"><p className="text-[8px] md:text-[9px] font-bold text-amethyst-primary/40 leading-none">Data dihitung otomatis berdasarkan filter periode aktif.</p></div>
                                        <div className={`absolute top-[-8px] ${i % 2 === 0 ? 'left-[14px] md:left-auto md:right-[14px]' : 'right-[4px] md:right-[14px]'} w-4 h-4 bg-amethyst-light/10 backdrop-blur-xl border-l border-t border-white/40 rotate-45`}/>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-slate-300 tracking-widest">{stat.label}</p>
                               <h3 className="text-2xl font-black text-amethyst-dark tracking-tight">{stat.value}</h3>
                               {stat.subValue && <p className="text-[10px] font-bold text-slate-400 italic">{stat.subValue}</p>}
                            </div>
                         </div>
                         {isLocked && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[32px]"><ShieldCheck size={16} className="text-amber-500 mb-2"/><span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Subscribe only</span></div>}
                      </motion.div>
                   );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-50 shadow-premium p-6 md:p-10 flex flex-col h-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                           <TrendingUp size={16} className="text-amethyst-primary"/>
                           <h4 className="text-sm font-black text-amethyst-dark tracking-tight">Growth Performance Trend</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium italic">Daily visualizer — this month</p>
                     </div>
                     <div className="flex items-center w-full md:w-auto bg-slate-50/80 p-1.5 rounded-full border border-slate-100 shadow-inner overflow-x-auto custom-scrollbar">
                        {[
                          { id: 'Views', icon: <Eye size={14}/> },
                          { id: 'Interactions', icon: <Zap size={14}/> },
                          { id: 'Followers', icon: <Users size={14}/> }
                        ].map((type) => (
                          <button key={type.id} onClick={() => setActiveMetric(type.id)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${activeMetric === type.id ? 'bg-amethyst-primary text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                             {type.icon} {type.id}
                          </button>
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex-1 relative">
                     <PerformanceChart data={dailyMetrics} activeMetric={activeMetric} maxVal={chartMax} />
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-premium">
                     <div className="flex items-center justify-between mb-8"><h4 className="text-[10px] font-black text-slate-300 flex items-center gap-2 italic tracking-widest"><Sparkles size={14} className="text-amethyst-primary"/> Top 3 performers</h4><span className="px-2 py-0.5 bg-amethyst-light/10 text-amethyst-primary rounded-md text-[8px] font-black tracking-widest uppercase">Views</span></div>
                     <div className="space-y-4">
                        {data.filter(p => p.metrics && getV(p.metrics, [activeMetric.toLowerCase()]) !== undefined).sort((a,b) => (getV(b.metrics, [activeMetric.toLowerCase()]))-(getV(a.metrics, [activeMetric.toLowerCase()]))).slice(0,3).map((item,i) => (
                          <div key={i} onClick={() => openDetail(item)} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-4 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                             <div className="flex items-center gap-4"><div className={`w-10 h-10 ${i === 0 ? 'bg-amethyst-primary text-white shadow-xl shadow-amethyst-primary/30' : 'bg-slate-50 text-amethyst-primary'} rounded-xl flex items-center justify-center text-[11px] font-black italic`}>#{i+1}</div><div><p className="text-xs font-black text-amethyst-dark group-hover:text-amethyst-primary truncate max-w-[140px] transition-colors">{item.title}</p><p className="text-[9px] font-bold text-slate-400 italic">{getV(item.metrics, [activeMetric.toLowerCase()]).toLocaleString()} {activeMetric}</p></div></div><ChevronRight size={16} className="text-slate-100 group-hover:text-amethyst-primary transition-colors"/>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-premium">
                     <div className="flex items-center justify-between mb-8"><h4 className="text-[10px] font-black text-slate-300 flex items-center gap-2 italic tracking-widest"><TrendingDown size={14} className="text-rose-400"/> Needs attention</h4><span className="px-2 py-0.5 bg-rose-50 text-rose-400 rounded-md text-[8px] font-black tracking-widest uppercase">Bottom 3</span></div>
                     <div className="space-y-4">
                        {data.filter(p => p.status?.toLowerCase() === 'uploaded').sort((a,b) => (getV(a.metrics, [activeMetric.toLowerCase()]))-(getV(b.metrics, [activeMetric.toLowerCase()]))).slice(0,3).map((item,i) => (
                          <div key={i} onClick={() => openDetail(item)} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-4 rounded-3xl transition-all border border-transparent hover:border-slate-100"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-[11px] font-black italic">#{i+1}</div><div><p className="text-xs font-black text-amethyst-dark truncate max-w-[140px]">{item.title}</p><p className="text-[9px] font-bold text-slate-400 italic">{getV(item.metrics, [activeMetric.toLowerCase()]).toLocaleString()} {activeMetric}</p></div></div><TrendingDown size={16} className="text-slate-100 group-hover:text-rose-400 transition-colors"/></div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="hidden md:block bg-white rounded-[48px] shadow-premium p-12 border border-slate-50 relative overflow-hidden">
               {(() => {
                  const isLocked = currentTier === "free" && !isPowerUserActual;
                  return isLocked && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[16px]">
                       <div className="flex flex-col items-center gap-6 text-center max-w-sm"><div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner"><ShieldCheck size={40} /></div><div className="space-y-2"><h3 className="text-2xl font-black text-slate-800 tracking-tight">Pro insight required</h3><p className="text-xs text-slate-400 font-medium leading-relaxed">Unlock granular analytics for each individual asset.</p></div><button onClick={() => openUpgrade()} className="px-10 py-4 bg-amethyst-primary text-white rounded-2xl text-xs font-black shadow-xl shadow-amethyst-primary/30 hover:scale-105 transition-all">Upgrade to Unlock</button></div>
                    </div>
                  );
               })()}
               <div className={currentTier === "free" && !isPowerUserActual ? "blur-md grayscale opacity-30 select-none" : ""}>
                  <div className="flex items-center justify-between mb-12"><h3 className="text-3xl font-black text-amethyst-dark tracking-tight">Detailed asset breakdown</h3><div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="text-[10px] font-black text-slate-300 tracking-widest">Live data</span></div></div>
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full">
                        <thead>
                           <tr className="border-b border-slate-100 text-[11px] font-black text-slate-300 uppercase tracking-widest"><th className="text-left py-8 px-6">Content identity</th><th className="text-center py-8 px-6">Author</th><th className="text-center py-8 px-6">Posting date</th><th className="text-center py-8 px-6">Views</th><th className="text-center py-8 px-6">ER %</th><th className="text-right py-8 px-6">Action</th></tr>
                        </thead>
                        <tbody>
                           {data.filter(p => p.status?.toLowerCase() === 'uploaded').sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()).map((item, i) => {
                              const m = item.metrics || {}; const v = getV(m, ["views", "impressions"]);
                              const iat = getV(m, ["likes"]) + getV(m, ["comments"]) + getV(m, ["shares"]) + getV(m, ["saves"]);
                              const er = v > 0 ? ((iat/v)*100).toFixed(2) : '0.00';
                              return (
                                 <tr key={i} onClick={() => openDetail(item)} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 cursor-pointer">
                                    <td className="py-8 px-6"><div className="flex items-center gap-6"><div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">{item.platform?.toLowerCase().includes('instagram') ? <img src="https://cdn.simpleicons.org/instagram/E4405F" className="w-6 h-6" /> : item.platform?.toLowerCase().includes('tiktok') ? <img src="https://cdn.simpleicons.org/tiktok/000000" className="w-6 h-6" /> : <Package size={20}/>}</div><div><p className="text-base font-black text-amethyst-dark group-hover:text-amethyst-primary transition-colors leading-tight mb-1 truncate max-w-[240px]">{item.title}</p><p className="text-[10px] font-black text-slate-300 italic">{item.content_pillar || "Insight"}</p></div></div></td>
                                    <td className="py-8 px-6 text-center"><div className="flex flex-col items-center gap-2"><div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">{item.author_avatar ? <img src={item.author_avatar} className="w-full h-full object-cover" /> : <span className="text-[11px] font-black text-slate-300">{item.author_name?.charAt(0)}</span>}</div><p className="text-[9px] font-black text-slate-400 tracking-widest">{item.author_name || "Owner"}</p></div></td>
                                    <td className="py-8 px-6 text-center text-[12px] font-bold text-slate-500 italic">{new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-8 px-6 text-center text-base font-black text-amethyst-dark">{v >= 1000 ? (v/1000).toFixed(1)+'k' : v}</td>
                                    <td className="py-8 px-6 text-center"><div className="flex flex-col items-center gap-2"><p className={`text-base font-black ${Number(er) > 5 ? "text-emerald-500" : "text-amethyst-primary"}`}>{er}%</p><div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${Number(er) > 5 ? "bg-emerald-500" : "bg-amethyst-primary"}`} style={{ width: `${Math.min(Number(er)*5, 100)}%` }}></div></div></div></td>
                                    <td className="py-8 px-6"><div className="flex items-center justify-end gap-3"><button onClick={(e) => { e.stopPropagation(); openMetrics(item); }} className="w-11 h-11 bg-amethyst-light/10 text-amethyst-primary rounded-xl flex items-center justify-center hover:bg-amethyst-primary hover:text-white transition-all shadow-sm"><Activity size={18}/></button><a href={item.post_link || '#'} target="_blank" rel="noreferrer" className="w-11 h-11 bg-amethyst-dark text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-sm"><ExternalLink size={18}/></a></div></td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AruneekaAnalytics;
