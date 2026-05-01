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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl z-[100] p-4"
          >
            <div className="bg-white rounded-[44px] shadow-2xl border border-amethyst-light/20 overflow-hidden flex max-h-[92vh]">
              
              {/* ── LEFT: Dark Performance Panel ── */}
              <div className="w-72 flex-shrink-0 bg-amethyst-dark text-white flex flex-col p-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} animate-pulse`}/>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">{statusInfo.label}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Performance Report</h3>
                </div>

                {/* Metric Cards */}
                <div className="space-y-3">
                  {platformCards.map((m: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-amethyst-light shrink-0">
                          {m.icon}
                        </div>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{m.label}</span>
                      </div>
                      <span className="text-sm font-black text-white">{m.value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Grade Badge */}
                {hasMetrics && (
                  <div className={`p-4 ${grade.bg} rounded-2xl text-center`}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Performance Grade</p>
                    <p className={`text-lg font-black ${grade.color}`}>{grade.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">ER: {erPercent}%</p>
                  </div>
                )}

                {/* Platform */}
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                    {platformIcons[content.platform?.toLowerCase()] || <Layers size={16} className="text-white/40"/>}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Platform</p>
                    <p className="text-xs font-black text-white capitalize">{content.platform || 'General'}</p>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Content Detail Panel ── */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="px-10 pt-8 pb-6 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    {/* Clickable Status Badge with Dropdown */}
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
                            <div className="fixed inset-0 z-[110]" onClick={() => setStatusDropdownOpen(false)}/>
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="absolute top-full left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-amethyst-light/20 overflow-hidden z-[111] py-1.5"
                            >
                              {Object.entries(statusConfig).map(([key, cfg]: [string, any]) => (
                                <button
                                  key={key}
                                  onClick={() => {
                                    if (onStatusChange && content.id) {
                                      onStatusChange(content.id, cfg.label);
                                      content.status = cfg.label;
                                    }
                                    setStatusDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 ${
                                    statusKey === key ? 'bg-amethyst-light/30 text-amethyst-dark' : 'text-slate-400'
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
                                  {cfg.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Calendar size={11}/> 
                      {content.due_date ? new Date(content.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No date'}
                    </span>
                  </div>
                   <div className="flex items-center gap-2">
                     {onEdit && (
                       <button 
                         onClick={onEdit}
                         className="w-9 h-9 bg-slate-50 hover:bg-amethyst-light/30 rounded-xl flex items-center justify-center text-amethyst-primary transition-all"
                         title="Edit Content"
                       >
                         <Sparkles size={16}/>
                       </button>
                     )}
                     <button onClick={onClose} className="w-9 h-9 bg-slate-50 hover:bg-amethyst-light/30 rounded-xl flex items-center justify-center text-amethyst-primary transition-all">
                       <X size={18}/>
                     </button>
                   </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 no-scrollbar">
                  
                  {/* Title & Pillar */}
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-amethyst-dark tracking-tight leading-tight">{content.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      {content.content_pillar && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-light text-amethyst-dark text-[9px] font-black uppercase tracking-widest rounded-lg">
                          <Target size={10}/> {content.content_pillar}
                        </span>
                      )}
                      {content.content_format && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-mauve/20 text-amethyst-dark text-[9px] font-black uppercase tracking-widest rounded-lg border border-amethyst-mauve/30">
                          <Layers size={10}/> {content.content_format}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Workflow Progress */}
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Production Progress</h4>
                    <div className="flex items-center gap-0">
                      {workflow.map((step: any, i: number) => (
                        <React.Fragment key={i}>
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${step.done ? 'bg-amethyst-dark' : 'bg-slate-100'}`}>
                              {step.done 
                                ? <CheckCircle2 size={12} className="text-white"/>
                                : <div className="w-2 h-2 bg-slate-300 rounded-full"/>
                              }
                            </div>
                            <span className={`text-[7px] font-bold uppercase tracking-wide text-center leading-tight ${step.done ? 'text-amethyst-dark' : 'text-slate-300'}`} style={{maxWidth: 40}}>
                              {step.label}
                            </span>
                          </div>
                          {i < workflow.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 transition-all ${workflow[i+1].done ? 'bg-amethyst-dark' : 'bg-slate-100'}`}/>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Assets */}
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Assets & Links</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Script', url: content.script_link, icon: <FileText size={16}/>, color: 'text-blue-500 bg-blue-50' },
                        { label: 'File/Content', url: content.content_link, icon: <Video size={16}/>, color: 'text-amethyst-primary bg-amethyst-light/30' },
                        { label: 'Live Post', url: content.post_link, icon: <ExternalLink size={16}/>, color: 'text-emerald-500 bg-emerald-50' },
                      ].map((item: any, i: number) => (
                        item.url ? (
                          <a
                            key={i}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-amethyst-primary hover:scale-[1.02] transition-all text-center shadow-sm"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                              {item.icon}
                            </div>
                            <span className="text-[9px] font-bold text-amethyst-dark uppercase tracking-widest">{item.label}</span>
                            <ArrowUpRight size={10} className="text-slate-300"/>
                          </a>
                        ) : (
                          <div
                            key={i}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl text-center opacity-50"
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-300">
                              {item.icon}
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.label}</span>
                            <span className="text-[8px] text-slate-200 italic">Not yet uploaded</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  {content.description && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Content Brief</h4>
                      <div className="p-5 bg-amethyst-light/10 rounded-2xl border border-amethyst-light/20">
                        <p className="text-sm font-medium text-amethyst-dark/80 leading-relaxed italic">{content.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Insights (only if has metrics) */}
                  {hasMetrics && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={10} className="text-amethyst-primary"/> AI Insight
                      </h4>
                      <div className="p-5 bg-gradient-to-br from-amethyst-light/20 to-white border border-amethyst-light/30 rounded-2xl space-y-3">
                        {parseFloat(erPercent) >= 5 && (
                          <div className="flex items-start gap-2">
                            <TrendingUp size={14} className="text-emerald-500 mt-0.5 flex-shrink-0"/>
                            <p className="text-xs font-bold text-amethyst-dark">Konten ini menunjukkan engagement rate di atas rata-rata ({erPercent}%). Pertimbangkan untuk membuat konten serupa.</p>
                          </div>
                        )}
                        {newFollowers > 0 && (
                          <div className="flex items-start gap-2">
                            <Users size={14} className="text-blue-500 mt-0.5 flex-shrink-0"/>
                            <p className="text-xs text-amethyst-dark/70">Berhasil menambahkan <strong className="text-amethyst-dark">{newFollowers}</strong> followers baru dari konten ini.</p>
                          </div>
                        )}
                        {parseFloat(erPercent) < 2 && views > 0 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-orange-500 mt-0.5 flex-shrink-0"/>
                            <p className="text-xs text-orange-600">Engagement rate masih di bawah target. Coba variasikan *Call-To-Action* (CTA) atau maksimalkan transisi 3 detik pertama di postingan berikutnya.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-10 py-5 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest">
                    {content.post_link ? '✓ Published' : 'Not yet published'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-50 text-amethyst-dark rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                      Close
                    </button>
                    {content.post_link && (
                      <a
                        href={content.post_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-2.5 bg-amethyst-dark text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amethyst-primary transition-all flex items-center gap-2 shadow-lg"
                      >
                        <ExternalLink size={12}/> View Live
                      </a>
                    )}
                  </div>
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
