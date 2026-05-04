'use client';

import React, { useMemo, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  FileText, 
  Video, 
  Eye,
  TrendingUp,
  Users,
  MousePointer2,
  Clock,
  Calendar,
  Layers,
  Target,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Link as LinkIcon,
  AlertCircle,
  MessageSquare,
  Share2,
  Bookmark,
  Repeat,
  UserPlus,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  onStatusChange?: (id: string, newStatus: string) => void;
  onEdit?: () => void;
}

const statusConfig: any = {
  draft:        { label: 'Draft',       color: 'bg-slate-100 text-slate-500',         dot: 'bg-slate-400' },
  'in progress':{ label: 'In Progress', color: 'bg-blue-50 text-blue-500',            dot: 'bg-blue-400' },
  review:       { label: 'Review',      color: 'bg-orange-50 text-orange-500',        dot: 'bg-orange-400' },
  approved:     { label: 'Approved',    color: 'bg-emerald-50 text-emerald-500',      dot: 'bg-emerald-400' },
  uploaded:     { label: 'Uploaded',    color: 'bg-amethyst-light text-amethyst-dark', dot: 'bg-amethyst-primary' },
};

const platformIcons: any = {
  tiktok:    <img src="https://cdn.simpleicons.org/tiktok/9d6fe8" className="w-4 h-4" alt="TikTok" />,
  instagram: <img src="https://cdn.simpleicons.org/instagram/9d6fe8" className="w-4 h-4" alt="Instagram" />,
  threads:   <img src="https://cdn.simpleicons.org/threads/9d6fe8" className="w-4 h-4" alt="Threads" />,
  youtube:   <img src="https://cdn.simpleicons.org/youtube/9d6fe8" className="w-4 h-4" alt="YouTube" />,
  facebook:  <img src="https://cdn.simpleicons.org/facebook/9d6fe8" className="w-4 h-4" alt="Facebook" />,
};

const ContentDetailModal: React.FC<ContentDetailModalProps> = ({ isOpen, onClose, content, onStatusChange, onEdit }) => {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'details'>('details');

  const metrics = content?.metrics || {};
  const views        = Number(metrics.views || 0);
  const newFollowers = Number(metrics.follows || 0);

  const interactions = useMemo(() => {
    const platform = (content?.platform || 'instagram').toLowerCase();
    if (platform === 'threads') {
      return (Number(metrics.likes) || 0) + (Number(metrics.replies) || 0);
    }
    return (Number(metrics.likes) || 0) + 
           (Number(metrics.comments) || 0) + 
           (Number(metrics.shares) || 0) + 
           (Number(metrics.saves) || 0);
  }, [content?.platform, metrics]);

  const erPercent = metrics.engagementRate?.toFixed(2) || (views > 0 ? ((interactions / views) * 100).toFixed(2) : '0.00');

  const grade = useMemo(() => {
    const er = parseFloat(erPercent);
    if (er >= 10) return { label: 'Exceptional', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (er >= 5)  return { label: 'Good',         color: 'text-blue-500',   bg: 'bg-blue-50' };
    if (er >= 2)  return { label: 'Average',      color: 'text-orange-500', bg: 'bg-orange-50' };
    return        { label: 'Needs Work',          color: 'text-rose-500',   bg: 'bg-rose-50' };
  }, [erPercent]);

  const statusKey  = (content?.status || 'draft').toLowerCase();
  const statusInfo = statusConfig[statusKey] || statusConfig.draft;



  const platformCards = useMemo(() => {
    const p = (content?.platform || 'instagram').toLowerCase();
    const parse = (k: string) => Number(metrics[k] || 0);
    const format = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v;
    
    let cards = [];
    if (p === 'tiktok') {
      cards = [
         { icon: <Eye size={14}/>,           label: 'Views',      value: format(parse('views')) },
         { icon: <MousePointer2 size={14}/>, label: 'Interactions',value: format(interactions) },
         { icon: <Clock size={14}/>,         label: 'Avg Watch',  value: `${parse('avg_watch')}s` },
         { icon: <UserPlus size={14}/>,      label: 'Followers',  value: `+${parse('new_followers')}` },
      ];
    } else if (p === 'threads') {
      cards = [
         { icon: <Eye size={14}/>,           label: 'Views',      value: format(parse('views')) },
         { icon: <MousePointer2 size={14}/>, label: 'Interactions',value: format(interactions) },
         { icon: <Repeat size={14}/>,        label: 'Reposts',    value: format(parse('reposts')) },
         { icon: <UserPlus size={14}/>,      label: 'Follows',    value: `+${parse('follows')}` },
      ];
    } else {
      cards = [
         { icon: <Target size={14}/>,        label: 'Reach',      value: format(parse('reach')) },
         { icon: <Eye size={14}/>,           label: 'Views',      value: format(parse('views')) },
         { icon: <MousePointer2 size={14}/>, label: 'Interactions',value: format(interactions) },
         { icon: <Repeat size={14}/>,        label: 'Reposts',    value: format(parse('reposts')) },
         { icon: <UserPlus size={14}/>,      label: 'Profile Vis.',value: format(parse('profile_visit')) },
         { icon: <UserPlus size={14}/>,      label: 'Follows',    value: `+${parse('follows')}` },
      ];
    }

    // Always add Engagement Rate at the bottom
    cards.push({ icon: <TrendingUp size={14}/>, label: 'Eng. Rate', value: `${erPercent}%` });
    return cards;
  }, [content?.platform, metrics, erPercent]);

  const hasMetrics = views > 0 || interactions > 0 || newFollowers > 0;

  const workflow = [
    { label: 'Draft',       done: true },
    { label: 'In Progress', done: ['in progress','review','approved','uploaded'].includes(statusKey) },
    { label: 'Review',      done: ['review','approved','uploaded'].includes(statusKey) },
    { label: 'Approved',    done: ['approved','uploaded'].includes(statusKey) },
    { label: 'Uploaded',    done: statusKey === 'uploaded' },
  ];

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl z-[9999] p-4"
          >
            <div className="relative bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[72vh] md:h-auto w-full md:w-auto md:max-w-5xl rounded-[32px] md:rounded-[44px] md:max-h-[92vh] border border-amethyst-light/20">
              
              {/* ── MOBILE TOP BAR & TAB SWITCHER ── */}
              <div className="md:hidden flex items-center justify-between px-6 pt-5 pb-3 bg-white z-[30] border-b border-slate-50">
                <div className="flex bg-slate-50 p-1 rounded-[18px] border border-slate-100 items-center w-full max-w-[240px]">
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    <FileText size={14}/> Info
                  </button>
                  <button 
                    onClick={() => setActiveTab('performance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'performance' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    <BarChart2 size={14}/> Metric
                  </button>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-slate-50 rounded-[14px] flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                  <X size={18}/>
                </button>
              </div>

              {/* ── WRAPPER FOR SCROLL ── */}
              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden no-scrollbar">
                
                {/* ── PERFORMANCE PANEL (TAB: performance) ── */}
                <motion.div 
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`w-full md:w-80 flex-shrink-0 bg-gradient-to-b from-amethyst-dark via-amethyst-dark to-[#4c1d95] text-white flex flex-col p-6 md:p-8 space-y-5 md:space-y-8 md:overflow-y-auto no-scrollbar min-h-full pb-32 md:pb-32 ${activeTab === 'performance' ? 'flex' : 'hidden md:flex'}`}
                >
                  {/* Header - Desktop Only */}
                  <div className="hidden md:block space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} animate-pulse`}/>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">{statusInfo.label}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Performance Report</h3>
                  </div>

                  {/* Metric Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 md:gap-3.5">
                    {platformCards.map((m: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3.5 md:p-4 bg-white/10 rounded-[22px] border border-white/5 hover:bg-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                          <div className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0">
                            {React.cloneElement(m.icon as React.ReactElement, { size: 12 })}
                          </div>
                          <span className="text-[8px] md:text-[9px] font-bold text-white/50 uppercase tracking-widest truncate">{m.label}</span>
                        </div>
                        <span className="text-xs md:text-base font-black text-white ml-2">{m.value}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Grade Badge - Unified Glass Style */}
                  {hasMetrics && (
                    <div className="p-6 md:p-5 bg-white/5 backdrop-blur-xl rounded-[28px] text-center border border-white/10 shadow-2xl">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Performance Grade</p>
                      <p className={`text-base md:text-xl font-black ${grade.color.replace('amethyst-primary', 'white')}`}>{grade.label}</p>
                      <div className="mt-2.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(parseFloat(erPercent) * 10, 100)}%` }}
                          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                      </div>
                      <p className="text-[8px] text-white/40 mt-2 font-bold uppercase tracking-tighter">ER Score: {erPercent}%</p>
                    </div>
                  )}

                  {/* Platform Dashboard */}
                  <div className="mt-auto pt-5 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-[18px] flex items-center justify-center border border-white/5">
                        {platformIcons[content.platform?.toLowerCase()] || <Layers size={18} className="text-white/40"/>}
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Platform</p>
                        <p className="text-xs font-black text-white capitalize tracking-wide">{content.platform || 'General'}</p>
                      </div>
                    </div>
                    {content.post_link && (
                      <a href={content.post_link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-[18px] bg-white text-amethyst-dark flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                        <ArrowUpRight size={18}/>
                      </a>
                    )}
                  </div>
                </motion.div>

                {/* ── CONTENT DETAIL PANEL ── */}
                <motion.div 
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex-1 flex flex-col bg-white z-10 relative ${activeTab === 'details' ? 'flex' : 'hidden md:flex'}`}
                >
                  {/* Top Bar - Desktop Only */}
                  <div className="hidden md:flex px-10 pt-8 pb-6 items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80 ${statusInfo.color}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}/>
                          {statusInfo.label}
                          <ChevronDown size={10} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}/>
                        </button>

                        <AnimatePresence>
                          {statusDropdownOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-[100]" 
                                onClick={() => setStatusDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[101] py-1.5"
                              >
                                {Object.keys(statusConfig).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      onStatusChange?.(content.id, s);
                                      setStatusDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 ${statusKey === s ? 'text-amethyst-primary' : 'text-slate-400'}`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`}/>
                                    {statusConfig[s].label}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Calendar size={11}/> 
                        {content.due_date ? new Date(content.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button onClick={onEdit} className="w-9 h-9 bg-slate-50 hover:bg-amethyst-light/30 rounded-xl flex items-center justify-center text-amethyst-primary transition-all">
                          <Sparkles size={16}/>
                        </button>
                      )}
                      <button onClick={onClose} className="w-9 h-9 bg-slate-50 hover:bg-amethyst-light/30 rounded-xl flex items-center justify-center text-amethyst-primary transition-all">
                        <X size={18}/>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 md:overflow-y-auto px-6 md:px-10 py-6 space-y-6 no-scrollbar pb-24 md:pb-24">
                    {/* Mobile Status Header */}
                    <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl mb-2 border border-slate-100">
                       <div className="flex items-center gap-3">
                        <div className="relative">
                          <button
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${statusInfo.color}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}/>
                            {statusInfo.label}
                            <ChevronDown size={10} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}/>
                          </button>

                          <AnimatePresence>
                            {statusDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[100]" 
                                  onClick={() => setStatusDropdownOpen(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                  className="absolute top-full left-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[101] py-1.5"
                                >
                                  {Object.keys(statusConfig).map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => {
                                        onStatusChange?.(content.id, s);
                                        setStatusDropdownOpen(false);
                                      }}
                                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-[8px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 ${statusKey === s ? 'text-amethyst-primary' : 'text-slate-400'}`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`}/>
                                      {statusConfig[s].label}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="w-px h-3 bg-slate-200"/>
                        <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Calendar size={10}/> 
                          {content.due_date ? new Date(content.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'No date'}
                        </span>
                       </div>
                       {onEdit && (
                        <button onClick={onEdit} className="w-8 h-8 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-center text-amethyst-primary">
                          <Sparkles size={14}/>
                        </button>
                       )}
                    </div>
                    
                    {/* Title & Tags */}
                    <div className="space-y-3">
                      <h2 className="text-xl md:text-3xl font-extrabold text-amethyst-dark tracking-tight leading-tight">{content.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        {content.content_pillar && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-light text-amethyst-dark text-[8px] font-black uppercase tracking-widest rounded-lg">
                            <Target size={10}/> {content.content_pillar}
                          </span>
                        )}
                        {content.content_format && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-mauve/20 text-amethyst-dark text-[8px] font-black uppercase tracking-widest rounded-lg border border-amethyst-mauve/30">
                            <Layers size={10}/> {content.content_format}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker - Desktop Only */}
                    <div className="hidden md:block space-y-4">
                      <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Workflow Pipeline</h4>
                      <div className="flex items-center gap-0 overflow-x-auto no-scrollbar py-2">
                        {workflow.map((step: any, i: number) => (
                          <React.Fragment key={i}>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${step.done ? 'bg-amethyst-dark' : 'bg-slate-200'}`}>
                                {step.done 
                                  ? <CheckCircle2 size={12} className="text-white"/>
                                  : <div className="w-2 h-2 bg-slate-400 rounded-full"/>
                                }
                              </div>
                              <span className={`text-[7px] font-bold uppercase tracking-wide text-center leading-tight ${step.done ? 'text-amethyst-dark' : 'text-slate-400'}`} style={{maxWidth: 50}}>
                                {step.label}
                              </span>
                            </div>
                            {i < workflow.length - 1 && (
                              <div className={`flex-1 min-w-[28px] md:min-w-[40px] h-0.5 mb-5 transition-all ${workflow[i+1].done ? 'bg-amethyst-dark' : 'bg-slate-200'}`}/>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Asset Cards - Simplified on Mobile */}
                    <div className="space-y-3">
                      <h4 className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        {activeTab === 'details' ? 'Publication Link' : 'Connected Assets'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:hidden w-full">
                           {content.post_link ? (
                            <a
                              href={content.post_link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 rounded-[24px] hover:shadow-md transition-all active:scale-95"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <ExternalLink size={18}/>
                              </div>
                              <div className="flex-1">
                                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none">Live Post</p>
                                <p className="text-[7px] text-emerald-600 mt-1">Tap to view published content</p>
                              </div>
                              <ArrowUpRight size={14} className="text-emerald-400"/>
                            </a>
                           ) : (
                            <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] opacity-60">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                                <ExternalLink size={18}/>
                              </div>
                              <div className="flex-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Post</p>
                                <p className="text-[7px] text-slate-300 italic mt-1">Not yet published</p>
                              </div>
                            </div>
                           )}
                        </div>

                        {[
                          { label: 'Script Brief', url: content.script_link, icon: <FileText size={18}/>, color: 'text-blue-500 bg-blue-50' },
                          { label: 'Raw Content', url: content.content_link, icon: <Video size={18}/>, color: 'text-amethyst-primary bg-amethyst-light/30' },
                          { label: 'Live Post', url: content.post_link, icon: <ExternalLink size={18}/>, color: 'text-emerald-500 bg-emerald-50' },
                        ].map((item: any, i: number) => (
                          <div key={i} className="hidden md:block">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col gap-3 p-5 bg-white border border-slate-100 rounded-[28px] hover:border-amethyst-primary hover:shadow-md transition-all active:scale-95"
                              >
                                <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 ${item.color}`}>
                                  {item.icon}
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-amethyst-dark uppercase tracking-widest leading-tight">{item.label}</p>
                                </div>
                              </a>
                            ) : (
                              <div className="flex flex-col gap-3 p-5 bg-slate-50/50 border border-dashed border-slate-200 rounded-[28px] opacity-60">
                                <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-slate-100 text-slate-300 shrink-0">
                                  {item.icon}
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Insights */}
                    {hasMetrics && (
                      <div className="space-y-4">
                        <h4 className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={10} className="text-amethyst-primary"/> AI Optimization
                        </h4>
                        <div className="p-5 bg-gradient-to-br from-amethyst-light/10 to-transparent rounded-[24px] border border-amethyst-light/20 space-y-4">
                          {parseFloat(erPercent) >= 5 ? (
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><TrendingUp size={14} className="text-emerald-600"/></div>
                              <p className="text-[11px] font-bold text-amethyst-dark leading-tight">Engagement rate Anda sangat kuat ({erPercent}%). Pertahankan audiens ini!</p>
                            </div>
                          ) : (
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-xl bg-amethyst-light flex items-center justify-center shrink-0"><Sparkles size={14} className="text-amethyst-primary"/></div>
                              <p className="text-[11px] font-bold text-amethyst-dark leading-tight">Coba gunakan hook yang lebih kuat untuk menaikkan engagement rate.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* ── STICKY FOOTER ACTIONS ── */}
              <div className="sticky md:absolute bottom-0 left-0 right-0 px-6 md:px-10 py-4 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-between z-[40]">
                <div className="flex items-center">
                  <span className="text-[8px] font-black text-amethyst-primary/40 uppercase tracking-[0.2em] leading-none">
                    {content.post_link ? 'Status: Live' : 'Status: Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={onClose} className="px-5 md:px-8 py-3 bg-slate-50 text-amethyst-dark rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all leading-none">
                    Dismiss
                  </button>
                  {content.post_link && (
                    <a href={content.post_link} target="_blank" rel="noreferrer" className="px-5 md:px-8 py-3 bg-amethyst-dark text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-2xl shadow-amethyst-dark/30 flex items-center gap-2 active:scale-95 transition-all leading-none">
                      <ExternalLink size={12}/> <span>Go To Post</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContentDetailModal;
