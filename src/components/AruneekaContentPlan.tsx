'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Table2, 
  Kanban, 
  Calendar, 
  FileText, 
  Video, 
  TrendingUp, 
  Pencil, 
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Link as LinkIcon,
  ExternalLink,
  Repeat,
  ShieldCheck,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const platforms = [
  { id: 'all', label: 'All Platforms' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
];

const platformIcons: any = {
  tiktok: <img src="https://cdn.simpleicons.org/tiktok/916DD5" className="w-4.5 h-4.5" alt="TikTok" />,
  instagram: <img src="https://cdn.simpleicons.org/instagram/916DD5" className="w-4.5 h-4.5" alt="Instagram" />,
  threads: <img src="https://cdn.simpleicons.org/threads/916DD5" className="w-4.5 h-4.5" alt="Threads" />,
  youtube: <img src="https://cdn.simpleicons.org/youtube/916DD5" className="w-4.5 h-4.5" alt="YouTube" />,
  facebook: <img src="https://cdn.simpleicons.org/facebook/916DD5" className="w-4.5 h-4.5" alt="Facebook" />,
};

const statusStyles: any = {
  draft: 'bg-slate-50 text-slate-400 capitalize',
  'in progress': 'bg-blue-50 text-blue-500 capitalize',
  review: 'bg-orange-50 text-orange-500 capitalize',
  approved: 'bg-emerald-50 text-emerald-600 capitalize',
  uploaded: 'bg-amethyst-light text-amethyst-dark capitalize',
};

const periods = [
  'All Time',
  'Unscheduled',
  'Oktober 2025',
  'November 2025',
  'Desember 2025',
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
];

const AruneekaContentPlan = ({ 
  plans = [], 
  onSelectContent, 
  onNewContent,
  onDelete,
  onEdit,
  onInsight,
  onStatusChange,
  onInlineUpdate,
  selectedProfileId,
  view = 'table',
  onViewChange,
  subscriptionTier = 'free'
}: { 
  plans: any[], 
  onSelectContent: (p: any) => void, 
  onNewContent: () => void,
  onDelete: (id: string) => void,
  onEdit: (p: any) => void,
  onInsight: (p: any) => void,
  onStatusChange?: (id: string, status: string) => void,
  onInlineUpdate?: (id: string, field: string, value: string) => void,
  selectedProfileId?: string,
  view?: 'table' | 'kanban' | 'calendar',
  onViewChange?: (view: any) => void,
  subscriptionTier?: string
}) => {
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  const [editingAsset, setEditingAsset] = useState<{ id: string, type: 'post' | 'script' | 'content' } | null>(null);
  const [tempLink, setTempLink] = useState('');
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [statusDropPos, setStatusDropPos] = useState<{ top: number; left: number } | null>(null);
  const openPlan = plans.find(p => p.id === openStatusId);

  const filteredPlans = plans.filter(p => {
    // Platform filter
    const platformMatch = filter === 'all' || p.platform?.toLowerCase() === filter.toLowerCase();
    
    // Date Range filter
    let dateMatch = true;
    if (p.due_date) {
      const pDate = new Date(p.due_date).toISOString().split('T')[0];
      dateMatch = pDate >= dateRange.start && pDate <= dateRange.end;
    } else {
      dateMatch = true; // Jangan sembunyikan konten yang tidak ada due_date-nya
    }

    // Account filter (from Shell)
    // Tampilkan jika cocok dengan profil aktif ATAU jika target_account-nya kosong (belum di-assign)
    const accountMatch = !selectedProfileId || p.target_account === selectedProfileId || !p.target_account;

    return platformMatch && dateMatch && accountMatch;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex items-end justify-between">
         <div className="space-y-2">
            <h2 className="text-3xl font-bold text-amethyst-dark tracking-tight">Content Production Line</h2>
            <p className="text-sm text-slate-400 font-normal italic">Manage your content lifecycle from strategy to publishing.</p>
         </div>

         <div className="flex items-center gap-4">
            <div className="relative">
               <button 
                  onClick={() => setIsRangeOpen(!isRangeOpen)}
                  className="flex items-center gap-4 bg-white border border-amethyst-light rounded-2xl px-6 py-3 shadow-sm hover:border-amethyst-primary transition-all group"
               >
                  <Calendar size={16} className="text-amethyst-primary" />
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-amethyst-dark tracking-wider">{new Date(dateRange.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                     <div className="w-4 h-px bg-slate-200" />
                     <span className="text-[10px] font-black text-amethyst-dark tracking-wider">{new Date(dateRange.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <ChevronDown size={14} className={`text-amethyst-primary transition-transform ${isRangeOpen ? 'rotate-180' : ''}`}/>
               </button>

               <AnimatePresence>
                 {isRangeOpen && (
                   <>
                     <div className="fixed inset-0 z-[110]" onClick={() => setIsRangeOpen(false)}/>
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="absolute top-full right-0 mt-3 w-[320px] bg-white rounded-[32px] shadow-2xl border border-amethyst-light/20 overflow-hidden z-[111] p-6 space-y-6"
                     >
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Start Range</label>
                              <input 
                                 type="date" 
                                 value={dateRange.start}
                                 onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                 className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1 italic">End Range</label>
                              <input 
                                 type="date" 
                                 value={dateRange.end}
                                 onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                 className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                              />
                           </div>
                        </div>
                        <button 
                           onClick={() => setIsRangeOpen(false)}
                           className="w-full py-3 bg-amethyst-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amethyst-dark/20 hover:bg-black transition-all"
                        >
                           Apply Filter
                        </button>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 items-center">
               <button 
                 onClick={() => onViewChange?.('table')}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all ${view === 'table' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <List size={14} /> List
               </button>
               <button 
                 onClick={() => {
                    const userStr = localStorage.getItem('aruneeka_user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                    if (subscriptionTier === 'free' && !isPowerUser) {
                      alert("Kanban is a Pro feature. upgrade to unlock.");
                    } else {
                      onViewChange?.('kanban');
                    }
                 }}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all relative ${view === 'kanban' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {(subscriptionTier === 'free' && !(localStorage.getItem('aruneeka_user')?.includes('Superuser') || localStorage.getItem('aruneeka_user')?.includes('developer'))) && <ShieldCheck size={10} className="text-amber-400 absolute top-1 right-1" />}
                 <Kanban size={14} /> Kanban
               </button>
               <button 
                 onClick={() => {
                    const userStr = localStorage.getItem('aruneeka_user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                    if (subscriptionTier === 'free' && !isPowerUser) {
                      alert("Calendar is a Pro feature. upgrade to unlock.");
                    } else {
                      onViewChange?.('calendar');
                    }
                 }}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all relative ${view === 'calendar' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {(subscriptionTier === 'free' && !(localStorage.getItem('aruneeka_user')?.includes('Superuser') || localStorage.getItem('aruneeka_user')?.includes('developer'))) && <ShieldCheck size={10} className="text-amber-400 absolute top-1 right-1" />}
                 <Calendar size={14} /> Calendar
               </button>
            </div>

            <div className="w-px h-6 bg-slate-100 hidden md:block" />

            <button 
               onClick={onNewContent}
               className="flex items-center gap-3 px-8 py-3.5 bg-amethyst-dark text-white rounded-[16px] font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-105 active:scale-95 transition-all"
            >
               <Plus size={16}/> New Content
            </button>
         </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
         {platforms.map(p => (
           <button
             key={p.id}
             onClick={() => setFilter(p.id)}
             className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
               filter === p.id 
               ? 'bg-amethyst-dark text-white shadow-sm' 
               : 'bg-white text-amethyst-primary/60 border border-amethyst-light hover:bg-amethyst-light/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
             }`}
           >
             {p.label}
           </button>
         ))}
      </div>

      {/* Content View */}
      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] border border-amethyst-light shadow-sm overflow-hidden p-10"
          >
             <table className="w-full">
                <thead>
                   <tr className="text-[10px] font-bold text-amethyst-primary/40 uppercase tracking-[0.1em] border-b border-amethyst-light">
                      <th className="text-left pb-6 px-4">Content / Pillar</th>
                      <th className="text-left pb-6 px-4">Platform</th>
                      <th className="text-left pb-6 px-4">Phase</th>
                      <th className="text-left pb-6 px-4">Pic</th>
                      <th className="text-left pb-6 px-4">Due Date</th>
                      <th className="text-left pb-6 px-4">Assets</th>
                      <th className="text-left pb-6 px-4">Live Link</th>
                      <th className="text-right pb-6 px-4">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredPlans.map((plan, i) => (
                     <tr key={i} className={`group hover:bg-amethyst-light/10 transition-all cursor-pointer ${plan.status?.toLowerCase() === 'uploaded' ? 'opacity-60 hover:opacity-100' : ''}`} onClick={() => onSelectContent(plan)}>
                        <td className="py-8 px-4">
                           <div className="space-y-1">
                              <h4 className={`text-sm font-bold text-amethyst-dark ${plan.status?.toLowerCase() === 'uploaded' ? 'line-through decoration-amethyst-primary/40' : ''}`}>{plan.title}</h4>
                              <span className="inline-block px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                           </div>
                        </td>
                        <td className="py-8 px-4">
                           <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl">
                              {platformIcons[plan.platform.toLowerCase()] || <span className="text-[8px] font-bold uppercase text-slate-300">{plan.platform}</span>}
                           </div>
                        </td>
                        <td className="py-8 px-4" onClick={(e) => e.stopPropagation()}>
                           <div className="relative">
                              <button
                                ref={(el) => { if (el && openStatusId === plan.id) { const r = el.getBoundingClientRect(); } }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusId(openStatusId === plan.id ? null : plan.id);
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setStatusDropPos({ top: rect.bottom + 6, left: rect.left });
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-tight uppercase transition-all hover:opacity-80 ${
                                  statusStyles[plan.status?.toLowerCase()] || 'bg-slate-50 text-slate-400'
                                }`}
                              >
                                {plan.status}
                                <ChevronDown size={10} className={`transition-transform ${openStatusId === plan.id ? 'rotate-180' : ''}`}/>
                              </button>
                           </div>
                        </td>
                        <td className="py-8 px-4 text-xs font-normal text-amethyst-dark/60">{plan.author_name || "Owner"}</td>
                        <td className="py-8 px-4">
                           <div className="text-xs font-bold text-amethyst-dark/80">{new Date(plan.due_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </td>
                        <td className="py-8 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                               {/* Script Asset */}
                               {editingAsset?.id === plan.id && editingAsset?.type === 'script' ? (
                                 <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <input 
                                       autoFocus
                                       value={tempLink}
                                       onChange={(e) => setTempLink(e.target.value)}
                                       placeholder="Script URL..."
                                       className="w-32 h-9 bg-white border border-amethyst-primary/30 rounded-xl px-3 text-[9px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300 shadow-sm"
                                    />
                                    <button 
                                       onClick={() => {
                                          plan.script_link = tempLink;
                                          if (onInlineUpdate) onInlineUpdate(plan.id, 'script_link', tempLink);
                                          setEditingAsset(null);
                                       }}
                                       className="px-3 py-2 bg-amethyst-dark text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    >
                                       Save
                                    </button>
                                    <button onClick={() => setEditingAsset(null)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                       <X size={12}/>
                                    </button>
                                 </div>
                               ) : (
                                 <button 
                                   onClick={() => {
                                      setEditingAsset({ id: plan.id, type: 'script' });
                                      setTempLink(plan.script_link || '');
                                   }}
                                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all shadow-sm ${
                                      plan.script_link 
                                      ? 'bg-amethyst-light text-amethyst-dark hover:bg-white border border-amethyst-light/50' 
                                      : 'bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-amethyst-light'
                                   }`}
                                 >
                                    <FileText size={12}/> {plan.script_link ? 'Lihat Script' : 'Input Script'}
                                 </button>
                               )}

                               {/* Content Asset */}
                               {editingAsset?.id === plan.id && editingAsset?.type === 'content' ? (
                                 <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <input 
                                       autoFocus
                                       value={tempLink}
                                       onChange={(e) => setTempLink(e.target.value)}
                                       placeholder="Content URL..."
                                       className="w-32 h-8 bg-white border border-amethyst-primary/30 rounded-xl px-3 text-[8px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300 shadow-sm"
                                    />
                                    <button 
                                       onClick={() => {
                                          plan.content_link = tempLink;
                                          if (onInlineUpdate) onInlineUpdate(plan.id, 'content_link', tempLink);
                                          setEditingAsset(null);
                                       }}
                                       className="px-3 py-1.5 bg-amethyst-primary text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    >
                                       Save
                                    </button>
                                    <button onClick={() => setEditingAsset(null)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                       <X size={10}/>
                                    </button>
                                 </div>
                               ) : (
                                 <button 
                                    onClick={() => {
                                       setEditingAsset({ id: plan.id, type: 'content' });
                                       setTempLink(plan.content_link || '');
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all shadow-sm ${
                                       plan.content_link 
                                       ? 'bg-amethyst-mauve/20 text-amethyst-dark hover:bg-white border border-amethyst-mauve/30' 
                                       : 'bg-amethyst-light/30 text-amethyst-primary hover:bg-white border border-transparent hover:border-amethyst-light'
                                    }`}
                                 >
                                    <Video size={12}/> {plan.content_link ? 'Lihat Konten' : 'Input Konten'}
                                 </button>
                               )}
                            </div>
                        </td>
                        <td className="py-8 px-4" onClick={(e) => e.stopPropagation()}>
                           {editingAsset?.id === plan.id && editingAsset?.type === 'post' ? (
                             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <input 
                                  autoFocus
                                  value={tempLink}
                                  onChange={(e) => setTempLink(e.target.value)}
                                  placeholder="Paste link..."
                                  className="w-40 h-8 bg-slate-50 border border-amethyst-primary/30 rounded-xl px-3 text-[8px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300"
                                />
                                <button 
                                  onClick={() => {
                                    plan.post_link = tempLink;
                                    if (onInlineUpdate) onInlineUpdate(plan.id, 'post_link', tempLink);
                                    setEditingAsset(null);
                                  }}
                                  className="px-3 py-1.5 bg-amethyst-dark text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingAsset(null)}
                                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                  <X size={12}/>
                                </button>
                             </div>
                           ) : plan.post_link ? (
                             <a 
                               href={plan.post_link} 
                               target="_blank" 
                               rel="noreferrer"
                               className="flex items-center gap-1.5 px-3 py-1.5 bg-amethyst-light text-amethyst-dark rounded-lg text-[8px] font-bold uppercase border border-amethyst-light hover:bg-white transition-all w-fit"
                             >
                               <ExternalLink size={12}/> View Post
                             </a>
                           ) : (
                             <button 
                               onClick={() => {
                                 setEditingAsset({ id: plan.id, type: 'post' });
                                 setTempLink('');
                               }}
                               className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-bold uppercase border border-transparent hover:border-amethyst-light transition-all"
                             >
                                <Plus size={12}/> Input Post Link
                             </button>
                           )}
                        </td>
                        <td className="py-8 px-4 text-right">
                           <div className="flex items-center justify-end gap-1 text-slate-200">
                              {plan.status.toLowerCase() === 'uploaded' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onInsight(plan); }}
                                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest ${
                                    plan.metrics_updated 
                                    ? 'bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-amethyst-light opacity-60 font-medium' 
                                    : 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] hover:scale-105 active:scale-95'
                                  }`}
                                  title={plan.metrics_updated ? 'View Insights' : 'Input Metrics Insight'}
                                >
                                  <TrendingUp size={12}/> {plan.metrics_updated ? 'Insights' : 'Add Metrics'}
                                  {/* Metrics Status Indicator */}
                                  {!plan.metrics_updated && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[2px] border-white animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"/>
                                  )}
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                                className="p-2 hover:text-amethyst-dark transition-colors text-amethyst-primary/60"
                                title="Edit Content"
                              >
                                <Pencil size={14}/>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                                className="p-2 hover:text-rose-500 transition-colors text-amethyst-primary/60"
                                title="Delete Content"
                              >
                                <Trash2 size={14}/>
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </motion.div>
        ) : view === 'kanban' ? (
          <motion.div 
            key="kanban"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-6 overflow-x-auto pb-8 no-scrollbar"
          >
             {['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded'].map(status => (
                <div key={status} className="flex-shrink-0 w-80 space-y-6">
                   <div className="flex items-center justify-between px-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-amethyst-dark/40">{status}</h3>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${statusStyles[status.toLowerCase()] || 'bg-slate-100 text-slate-400'}`}>
                         {filteredPlans.filter(p => p.status?.toLowerCase() === status.toLowerCase()).length}
                      </span>
                   </div>
                   <div className="space-y-4">
                      {filteredPlans.filter(p => p.status?.toLowerCase() === status.toLowerCase()).map((plan, i) => (
                        <div 
                          key={i} 
                          onClick={() => onSelectContent(plan)}
                          className="bg-white p-6 rounded-[24px] border border-amethyst-light shadow-sm hover:scale-[1.02] transition-all cursor-pointer space-y-4 group"
                        >
                           <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                              <div className="flex items-center gap-2">
                                 {platformIcons[plan.platform?.toLowerCase()] || ''}
                                 <span className="text-[9px] font-normal text-amethyst-dark/20 uppercase truncate max-w-[60px]">
                                    {plan.platform}
                                 </span>
                              </div>
                           </div>
                           <h4 className="text-sm font-bold text-amethyst-dark group-hover:text-amethyst-primary transition-colors">{plan.title}</h4>
                           <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                              <div className="w-6 h-6 rounded-full bg-amethyst-light border border-white"/>
                              <span className="text-[9px] font-normal text-amethyst-dark/40 italic">{new Date(plan.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                           </div>
                        </div>
                      ))}
                      {filteredPlans.filter(p => p.status?.toLowerCase() === status.toLowerCase()).length === 0 && (
                        <div className="h-24 border-2 border-dashed border-slate-50 rounded-3xl flex items-center justify-center">
                           <p className="text-[10px] font-bold text-slate-200 tracking-widest">No Tasks</p>
                        </div>
                      )}
                   </div>
                </div>
             ))}
          </motion.div>
        ) : view === 'calendar' ? (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] border border-amethyst-light shadow-sm overflow-hidden flex flex-col"
          >
             {/* Calendar Header */}
             <div className="p-10 flex items-center justify-between border-b border-amethyst-light">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-amethyst-light text-amethyst-dark rounded-2xl flex items-center justify-center border border-amethyst-light/50">
                      <Calendar size={24}/>
                   </div>
                   <div>
                      <h3 className="text-3xl font-bold text-amethyst-dark tracking-tight">
                         {new Date(dateRange.start).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="text-xs font-normal text-amethyst-primary flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-amethyst-primary rounded-full animate-pulse"/>
                         {filteredPlans.length} Tasks in this range
                      </div>
                   </div>
                </div>

                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                   <button 
                     onClick={() => {
                        const s = new Date(dateRange.start);
                        const e = new Date(dateRange.end);
                        s.setMonth(s.getMonth() - 1);
                        e.setMonth(e.getMonth() - 1);
                        setDateRange({ start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] });
                     }}
                     className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-amethyst-dark transition-all"
                   >
                     <ChevronLeft size={20}/>
                   </button>
                   <button 
                     onClick={() => {
                        const now = new Date();
                        const s = new Date(now.getFullYear(), now.getMonth(), 1);
                        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        setDateRange({ start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] });
                     }}
                     className="px-6 py-2 bg-amethyst-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-xl mx-2 shadow-lg"
                   >
                     This Month
                   </button>
                   <button 
                     onClick={() => {
                        const s = new Date(dateRange.start);
                        const e = new Date(dateRange.end);
                        s.setMonth(s.getMonth() + 1);
                        e.setMonth(e.getMonth() + 1);
                        setDateRange({ start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] });
                     }}
                     className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-amethyst-dark transition-all"
                   >
                     <ChevronRight size={20}/>
                   </button>
                </div>
             </div>

             {/* Weekday Labels */}
             <div className="grid grid-cols-7 border-b border-amethyst-light bg-slate-50/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst-primary/40">
                     {day}
                  </div>
                ))}
             </div>

             {/* Calendar Grid */}
             <div className="grid grid-cols-7 grid-rows-5 h-[auto] min-h-[700px]">
                {(() => {
                  const startDate = new Date(dateRange.start);
                  const monthIndex = startDate.getMonth();
                  const year = startDate.getFullYear();

                  const firstDay = new Date(year, monthIndex, 1).getDay();
                  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                  
                  // Generate total cells (35 or 42 depending on how it stretches)
                  const totalCells = firstDay + daysInMonth > 35 ? 42 : 35;
                  const cells = Array.from({ length: totalCells }, (_, i) => i);
                  
                  return cells.map(cellIdx => {
                    const dayNum = cellIdx - firstDay + 1;
                    const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                    
                    const now = new Date();
                    const isToday = isValidDay && 
                                    dayNum === now.getDate() && 
                                    monthIndex === now.getMonth() && 
                                    year === now.getFullYear();
                    
                    const dayContent = filteredPlans.filter(p => {
                      const d = new Date(p.due_date);
                      return d.getDate() === dayNum && 
                             d.getMonth() === monthIndex && 
                             d.getFullYear() === year;
                    });

                    return (
                      <div key={cellIdx} className={`border-r border-b border-slate-50 p-4 transition-all hover:bg-amethyst-light/20 flex flex-col gap-2 min-h-[140px] ${!isValidDay ? 'bg-slate-50/10 text-transparent pointer-events-none' : ''}`}>
                         {isValidDay && (
                           <>
                             <div className="flex items-center justify-between pointer-events-none mb-1">
                                <span className={`text-xs font-bold ${isToday ? 'w-7 h-7 bg-amethyst-dark text-white rounded-full flex items-center justify-center shadow-md' : 'text-slate-300'}`}>
                                   {dayNum}
                                </span>
                             </div>
                             
                             <div className="flex flex-col gap-1.5 overflow-hidden">
                                {dayContent.map((plan, idx) => (
                                  <motion.div 
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); onSelectContent(plan); }}
                                    className="px-3 py-2 bg-white border border-amethyst-light rounded-xl shadow-sm cursor-pointer hover:border-amethyst-dark transition-all"
                                  >
                                     <p className="text-[9px] font-bold text-amethyst-dark truncate leading-tight">{plan.title}</p>
                                  </motion.div>
                                ))}
                             </div>
                           </>
                         )}
                      </div>
                    );
                  });
                })()}
             </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Fixed-position Status Dropdown Portal — renders outside table overflow */}
      <AnimatePresence>
        {openStatusId && statusDropPos && openPlan && (
          <div key="status-dropdown-portal">
            <div className="fixed inset-0 z-[200]" onClick={() => setOpenStatusId(null)}/>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ position: 'fixed', top: statusDropPos.top, left: statusDropPos.left, zIndex: 201 }}
              className="w-44 bg-white rounded-2xl shadow-2xl border border-amethyst-light/20 overflow-hidden py-1.5"
            >
              {(['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded']).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    if (onStatusChange) onStatusChange(openPlan.id, s);
                    openPlan.status = s;
                    setOpenStatusId(null);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-slate-50 ${
                    openPlan.status?.toLowerCase() === s.toLowerCase() ? 'bg-amethyst-light/30 text-amethyst-dark' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    s === 'Draft' ? 'bg-slate-400' :
                    s === 'In Progress' ? 'bg-blue-400' :
                    s === 'Review' ? 'bg-orange-400' :
                    s === 'Approved' ? 'bg-emerald-600' : 'bg-amethyst-primary'
                  }`}/>
                  {s}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaContentPlan;
