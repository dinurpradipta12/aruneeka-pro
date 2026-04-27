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
  List,
  Lock,
  Zap,
  Sparkles,
  MoreVertical,
  Download,
  Upload,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from './AruneekaShell';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import AruneekaConfirmModal from './AruneekaConfirmModal';

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
  selectedWorkspaceId,
  onRefresh,
  view = 'table',
  onViewChange,
  subscriptionTier = 'free',
  isPublic = false
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
  selectedWorkspaceId?: string,
  onRefresh?: () => void,
  view?: 'table' | 'kanban' | 'calendar',
  onViewChange?: (view: any) => void,
  subscriptionTier?: string,
  isPublic?: boolean
}) => {
  const { openUpgrade, user } = useWorkspace();
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState({ title: '', desc: '', icon: <Kanban/> });
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ 
    start: `${new Date().getFullYear() - 1}-01-01`, 
    end: `${new Date().getFullYear() + 1}-12-31` 
  });
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  const [editingAsset, setEditingAsset] = useState<{ id: string, type: 'post' | 'script' | 'content' } | null>(null);
  const [tempLink, setTempLink] = useState('');
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [statusDropPos, setStatusDropPos] = useState<{ top: number; left: number } | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'danger' | 'info' }>({ 
    isOpen: false, title: '', message: '', type: 'info' 
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const openPlan = plans.find(p => p.id === openStatusId);

  const parseIndonesianDate = (dateStr: string) => {
    if (!dateStr) return null;
    const months: any = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    };
    
    // Simple parsing for "D Mmmm YYYY" format
    const parts = dateStr.toLowerCase().split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day).toISOString().split('T')[0];
      }
    }
    
    // Fallback to standard JS Date
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  };

  const mapStatus = (statusStr: string) => {
    if (!statusStr) return 'Draft';
    const s = statusStr.toLowerCase();
    if (s.includes('upload')) return 'Uploaded';
    if (s.includes('progress') || s.includes('kerjakan')) return 'In Progress';
    if (s.includes('review')) return 'Review';
    if (s.includes('setuju') || s.includes('approve')) return 'Approved';
    return 'Draft';
  };

  const filteredPlans = plans.filter(p => {
    // Platform filter
    const platformMatch = filter === 'all' || p.platform?.toLowerCase() === filter.toLowerCase();
    
    // Date Range filter
    let dateMatch = true;
    if (filter === 'unscheduled') {
      return !p.due_date;
    }

    if (p.due_date) {
      const pDate = new Date(p.due_date).toISOString().split('T')[0];
      dateMatch = pDate >= dateRange.start && pDate <= dateRange.end;
    } else {
      dateMatch = true; 
    }

    // Account filter
    const accountMatch = !selectedProfileId || p.target_account === selectedProfileId || !p.target_account;

    return platformMatch && dateMatch && accountMatch;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      complete: async (results) => {
        const data = results.data as any[];
        // Data starts from Row 3 (index 2) according to user mention "A3 and B3"
        const rowsToImport = data.slice(2).filter(row => {
          if (!row[0] || !row[0].trim()) return false;
          // Skip header placeholders
          const title = row[0].toLowerCase();
          if (title === 'headline' || title === 'title' || title === 'headline (hook)') return false;
          return true;
        });
        
        if (rowsToImport.length === 0) {
          setFeedbackModal({
            isOpen: true,
            title: 'File Kosong',
            message: 'Tidak ada data yang ditemukan di template CSV (mulai baris ke-3) yang Anda unggah.',
            type: 'info'
          });
          setIsImporting(false);
          return;
        }

        const userStr = localStorage.getItem('aruneeka_user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const workspaceId = selectedWorkspaceId;

        if (!workspaceId) {
          setFeedbackModal({
            isOpen: true,
            title: 'Akses Ditolak',
            message: 'Pilih workspace terlebih dahulu sebelum melakukan import.',
            type: 'danger'
          });
          setIsImporting(false);
          return;
        }

        const payloads = rowsToImport.map(row => ({
          workspace_id: workspaceId,
          user_id: user?.id,
          target_account: selectedProfileId || null, 
          author_name: row[4] || user?.full_name || 'Owner', // Col E (PIC)
          title: row[0], // Col A (Headline)
          content_pillar: row[1], // Col B (Pillar)
          platform: row[2] || 'Instagram', // Col C (Platform)
          status: mapStatus(row[3]), // Col D (Status/Phase)
          due_date: parseIndonesianDate(row[5]), // Col F (Due Date)
          script_link: row[6], // Col G (Script Link)
          content_link: row[7], // Col H (Content Folder Link)
          post_link: row[8], // Col I (Live Post Link)
          metrics_updated: false,
          metrics: {}
        }));

        try {
          const { error } = await supabase.from('v2_agency_content_plans').insert(payloads);
          if (error) throw error;
          setFeedbackModal({
            isOpen: true,
            title: 'Import Berhasil!',
            message: `Berhasil mengimpor ${payloads.length} konten plan ke dalam workspace Anda.`,
            type: 'success'
          });
          if (onRefresh) onRefresh();

          // Increment usage for free users
          const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
          if (subscriptionTier === 'free' && !isPowerUser) {
             const count = parseInt(localStorage.getItem(`usage_import_${user?.id}`) || '0');
             localStorage.setItem(`usage_import_${user?.id}`, (count + 1).toString());
          }
        } catch (err: any) {
          console.error(err);
          setFeedbackModal({
            isOpen: true,
            title: 'Import Gagal',
            message: 'Terjadi kesalahan: ' + err.message,
            type: 'danger'
          });
        } finally {
          setIsImporting(false);
          setIsMoreOpen(false);
        }
      },
      error: (err) => {
        console.error(err);
        setFeedbackModal({
          isOpen: true,
          title: 'Format Error',
          message: 'Gagal membaca file CSV: ' + err.message,
          type: 'danger'
        });
        setIsImporting(false);
      }
    });
  };

  const handleExportCSV = () => {
    const exportData = filteredPlans.map(p => ({
      'Headline': p.title,
      'Pillar': p.content_pillar,
      'Platform': p.platform,
      'Status': p.status,
      'PIC': p.author_name,
      'Tanggal Posting': p.due_date,
      'Link Script': p.script_link,
      'Link Hasil Konten': p.content_link,
      'Link Posting': p.post_link
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `content-plan-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMoreOpen(false);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
         <div className="space-y-2">
            <h2 className="text-3xl font-bold text-amethyst-dark tracking-tight">Content Production Line</h2>
            <p className="text-sm text-slate-400 font-normal italic">Manage your content lifecycle from strategy to publishing.</p>
         </div>

         <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="relative">
               <button id="tour-content-period" 
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
            <div id="tour-view-mode" className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 items-center">
               <button 
                 onClick={() => onViewChange?.('table')}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all ${view === 'table' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <List size={14} /> List
               </button>
               <button 
                 onClick={() => {
                    const userStr = typeof window !== 'undefined' ? localStorage.getItem('aruneeka_user') : null;
                    const user = userStr ? JSON.parse(userStr) : null;
                    const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                    if (subscriptionTier === 'free' && !isPowerUser) {
                      setLockedFeature({ 
                        title: 'Kanban Visualizer', 
                        desc: 'Kelola alur kerja konten Anda dengan drag-and-drop Kanban board yang intuitif.',
                        icon: <Kanban size={32} />
                      });
                      setIsLockModalOpen(true);
                    } else {
                      onViewChange?.('kanban');
                    }
                 }}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all relative ${view === 'kanban' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {(subscriptionTier === 'free' && !(typeof window !== 'undefined' && (localStorage.getItem('aruneeka_user')?.includes('Superuser') || localStorage.getItem('aruneeka_user')?.includes('developer')))) && <ShieldCheck size={10} className="text-amber-400 absolute top-1 right-1" />}
                 <Kanban size={14} /> Kanban
               </button>
               <button 
                 onClick={() => {
                    const userStr = typeof window !== 'undefined' ? localStorage.getItem('aruneeka_user') : null;
                    const user = userStr ? JSON.parse(userStr) : null;
                    const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                    if (subscriptionTier === 'free' && !isPowerUser) {
                      setLockedFeature({ 
                        title: 'Content Calendar', 
                        desc: 'Rencanakan jadwal posting harian dan bulanan Anda dalam satu tampilan kalender yang rapi.',
                        icon: <Calendar size={32} />
                      });
                      setIsLockModalOpen(true);
                    } else {
                      onViewChange?.('calendar');
                    }
                 }}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[10px] font-bold transition-all relative ${view === 'calendar' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {(subscriptionTier === 'free' && !(typeof window !== 'undefined' && (localStorage.getItem('aruneeka_user')?.includes('Superuser') || localStorage.getItem('aruneeka_user')?.includes('developer')))) && <ShieldCheck size={10} className="text-amber-400 absolute top-1 right-1" />}
                 <Calendar size={14} /> Calendar
               </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">

             {!isPublic && (
               <div className="flex items-center gap-2">
                  <button 
                     onClick={onNewContent}
                     className="flex items-center gap-3 px-8 py-3.5 bg-amethyst-dark text-white rounded-[16px] font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-105 active:scale-95 transition-all"
                  >
                     <Plus size={16}/> New Content
                  </button>

                  <div className="relative">
                     <button id="tour-content-actions" 
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        className={`w-12 h-12 flex items-center justify-center bg-white border border-amethyst-light rounded-[16px] text-amethyst-primary hover:border-amethyst-primary transition-all shadow-sm ${isMoreOpen ? 'ring-2 ring-amethyst-light' : ''}`}
                     >
                        <MoreVertical size={20}/>
                     </button>

                     <AnimatePresence>
                        {isMoreOpen && (
                           <>
                              <div className="fixed inset-0 z-[120]" onClick={() => setIsMoreOpen(false)}/>
                              <motion.div 
                                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                 className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[28px] shadow-2xl border border-amethyst-light/20 overflow-hidden z-[121] py-3"
                              >
                                 <div className="px-5 py-2 mb-2 border-b border-slate-50">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Content Actions</span>
                                 </div>
                                 
                                 <button 
                                    onClick={() => {
                                       if (isImporting) return;
                                       
                                       const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                                       if (subscriptionTier === 'free' && !isPowerUser) {
                                          const count = parseInt(localStorage.getItem(`usage_import_${user?.id}`) || '0');
                                          if (count >= 1) {
                                             setLockedFeature({ 
                                               title: 'Import Limit Reached', 
                                               desc: 'Anda telah mencapai batas 1x import untuk paket Free. Silakan upgrade ke Pro untuk akses tanpa batas.',
                                               icon: <Upload size={32} />
                                             });
                                             setIsLockModalOpen(true);
                                             setIsMoreOpen(false);
                                             return;
                                          }
                                       }
                                       fileInputRef.current?.click();
                                    }}
                                    disabled={isImporting}
                                    className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all group text-left ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                       {isImporting ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Upload size={16}/>}
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-amethyst-dark uppercase tracking-wider">{isImporting ? 'Importing...' : 'Import Konten Plan'}</p>
                                       <p className="text-[8px] text-slate-400 font-bold">Upload file CSV template</p>
                                    </div>
                                 </button>

                                 <a 
                                    href="/contoh-template-kontenplan.csv"
                                    download
                                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all group text-left"
                                    onClick={() => setIsMoreOpen(false)}
                                 >
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                       <Download size={16}/>
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-amethyst-dark uppercase tracking-wider">Download Template</p>
                                       <p className="text-[8px] text-slate-400 font-bold">Contoh format import CSV</p>
                                    </div>
                                 </a>

                                 <button 
                                    onClick={() => {
                                       const isPowerUser = user?.role === 'Superuser' || user?.role === 'developer';
                                       if (subscriptionTier === 'free' && !isPowerUser) {
                                          const count = parseInt(localStorage.getItem(`usage_export_${user?.id}`) || '0');
                                          if (count >= 1) {
                                             setLockedFeature({ 
                                               title: 'Export Limit Reached', 
                                               desc: 'Batas export 1x untuk paket Free telah tercapai. Nikmati export sepuasnya di paket Pro!',
                                               icon: <FileSpreadsheet size={32} />
                                             });
                                             setIsLockModalOpen(true);
                                             setIsMoreOpen(false);
                                             return;
                                          }
                                          // Only increment IF we allow the export
                                          localStorage.setItem(`usage_export_${user?.id}`, (count + 1).toString());
                                       }
                                       handleExportCSV();
                                    }}
                                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all group text-left"
                                 >
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                       <FileSpreadsheet size={16}/>
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-amethyst-dark uppercase tracking-wider">Export Konten Plan</p>
                                       <p className="text-[8px] text-slate-400 font-bold">Download data saat ini</p>
                                    </div>
                                 </button>

                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                 />
                              </motion.div>
                           </>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
             )}
          </div>
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
                      <th 
                          className="text-left pb-6 px-4 cursor-pointer hover:text-amethyst-primary transition-colors group/sort"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                       >
                          <div className="flex items-center gap-1.5">
                             Due Date
                             <span className="text-amethyst-primary/30 group-hover/sort:text-amethyst-primary transition-colors">
                                {sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                             </span>
                          </div>
                       </th>
                      <th className="text-left pb-6 px-4">Assets</th>
                      <th className="text-left pb-6 px-4">Live Link</th>
                      {!isPublic && <th className="text-right pb-6 px-4">Action</th>}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {sortedPlans.map((plan, i) => (
                     <tr key={i} className={`group hover:bg-amethyst-light/10 transition-all cursor-pointer ${plan.status?.toLowerCase() === 'uploaded' ? 'opacity-60 hover:opacity-100' : ''}`} onClick={() => onSelectContent(plan)}>
                        <td className="py-8 px-4">
                           <div className="space-y-1">
                              <h4 className={`text-sm font-bold text-amethyst-dark ${plan.status?.toLowerCase() === 'uploaded' ? 'line-through decoration-amethyst-primary/40' : ''}`}>{plan.title}</h4>
                              <span className="inline-block px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                           </div>
                        </td>
                        <td className="py-8 px-4">
                           <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl">
                              {plan.platform ? (platformIcons[plan.platform.toLowerCase()] || <span className="text-[8px] font-bold uppercase text-slate-300">{plan.platform}</span>) : '-'}
                           </div>
                        </td>
                        <td className="py-8 px-4" onClick={(e) => e.stopPropagation()}>
                           <div className="relative">
                              <button
                                onClick={(e) => {
                                  if (isPublic) return;
                                  e.stopPropagation();
                                  setOpenStatusId(openStatusId === plan.id ? null : plan.id);
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setStatusDropPos({ top: rect.bottom + 6, left: rect.left });
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-tight uppercase transition-all ${isPublic ? 'cursor-default' : 'hover:opacity-80'} ${
                                  statusStyles[plan.status?.toLowerCase()] || 'bg-slate-50 text-slate-400'
                                }`}
                              >
                                {plan.status || 'Draft'}
                                {!isPublic && <ChevronDown size={10} className={`transition-transform ${openStatusId === plan.id ? 'rotate-180' : ''}`}/>}
                              </button>
                           </div>
                        </td>
                        <td className="py-8 px-4 text-xs font-normal text-amethyst-dark/60">{plan.author_name || "-"}</td>
                        <td className="py-8 px-4">
                           <div className="text-xs font-bold text-amethyst-dark/80">
                             {plan.due_date 
                               ? new Date(plan.due_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
                               : 'Unscheduled'
                             }
                           </div>
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
                                      if (isPublic && !plan.script_link) return;
                                      if (isPublic) { window.open(plan.script_link, '_blank'); return; }
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
                                       if (isPublic && !plan.content_link) return;
                                       if (isPublic) { window.open(plan.content_link, '_blank'); return; }
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
                           {(editingAsset?.id === plan.id && editingAsset?.type === 'post' && !isPublic) ? (
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
                                 if (isPublic) return;
                                 setEditingAsset({ id: plan.id, type: 'post' });
                                 setTempLink('');
                               }}
                               className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-bold uppercase border border-transparent transition-all ${isPublic ? 'cursor-default' : 'hover:border-amethyst-light'}`}
                             >
                                {isPublic ? 'N/A' : <><Plus size={12}/> Input Post Link</>}
                             </button>
                           )}
                        </td>
                        {!isPublic && (
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
                        )}
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

      {/* Feature Locked Modal */}
      <AnimatePresence>
        {isLockModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white w-full max-w-sm rounded-[44px] shadow-2xl overflow-hidden border border-white/20 relative"
            >
               {/* Pattern Decor */}
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Zap size={120} />
               </div>

               <div className="p-10 space-y-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/20">
                    {lockedFeature.icon}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                       <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-amber-100 flex items-center gap-1">
                         <Sparkles size={10}/> Pro Feature
                       </span>
                    </div>
                    <h3 className="text-2xl font-black text-amethyst-dark tracking-tight">{lockedFeature.title}</h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">{lockedFeature.desc}</p>
                  </div>

                  <div className="w-full space-y-3">
                    <button 
                      onClick={() => {
                        setIsLockModalOpen(false);
                        openUpgrade();
                      }}
                      className="w-full py-4 rounded-2xl bg-amethyst-dark text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Upgrade to unlock
                    </button>
                    <button 
                      onClick={() => setIsLockModalOpen(false)}
                      className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Mungkin Nanti
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AruneekaConfirmModal
        isOpen={feedbackModal.isOpen}
        onClose={() => {
          const shouldReload = feedbackModal.type === 'success';
          setFeedbackModal(prev => ({ ...prev, isOpen: false }));
          if (shouldReload) window.location.reload();
        }}
        onConfirm={() => {
          const shouldReload = feedbackModal.type === 'success';
          setFeedbackModal(prev => ({ ...prev, isOpen: false }));
          if (shouldReload) window.location.reload();
        }}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        confirmText="Tutup"
        cancelText="Refresh"
      />
    </div>
  );
};

export default AruneekaContentPlan;
