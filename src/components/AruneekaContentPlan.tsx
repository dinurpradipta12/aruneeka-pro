'use client';

import React, { useState, useEffect } from 'react';
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
  { id: 'linkedin', label: 'LinkedIn' },
];

const platformIcons: any = {
  tiktok: <img src="https://cdn.simpleicons.org/tiktok/916DD5" className="w-4.5 h-4.5" alt="TikTok" />,
  instagram: <img src="https://cdn.simpleicons.org/instagram/916DD5" className="w-4.5 h-4.5" alt="Instagram" />,
  threads: <img src="https://cdn.simpleicons.org/threads/916DD5" className="w-4.5 h-4.5" alt="Threads" />,
  youtube: <img src="https://cdn.simpleicons.org/youtube/916DD5" className="w-4.5 h-4.5" alt="YouTube" />,
  facebook: <img src="https://cdn.simpleicons.org/facebook/916DD5" className="w-4.5 h-4.5" alt="Facebook" />,
  linkedin: <img src="https://cdn.simpleicons.org/linkedin/916DD5" className="w-4.5 h-4.5" alt="LinkedIn" />,
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
   onEditContent,
   onNewContent,
   onDelete,
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
   plans?: any[], 
   onSelectContent?: (p: any) => void, 
   onNewContent?: () => void,
   onDelete?: (id: string) => void,
   onEditContent?: (p: any) => void,
   onInsight?: (p: any) => void,
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
  const [internalPlans, setInternalPlans] = useState<any[]>([]);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [localDeletedIds, setLocalDeletedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('aruneeka_locally_deleted_ids') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [localView, setLocalView] = useState<'table' | 'kanban' | 'calendar'>(view || 'table');
  const basePlans = (plans && plans.length > 0) ? plans : internalPlans;
  const displayPlans = basePlans.filter((p: any) => !localDeletedIds.includes(p.id));
  const currentView = onViewChange ? view : localView;

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
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const openPlan = displayPlans.find((p: any) => p.id === openStatusId);
  
  // Self-fetching logic with simple caching
  const lastFetchedId = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      if (!selectedWorkspaceId || (plans && plans.length > 0)) {
        if (isMounted) setIsLocalLoading(false);
        lastFetchedId.current = null;
        return;
      }
      
      // Mencegah loop jika ID sama dengan yang terakhir diproses
      if (lastFetchedId.current === selectedWorkspaceId) return;
      lastFetchedId.current = selectedWorkspaceId;
      
      // Try cache first for instant feel
      const cacheKey = `aruneeka_plans_cache_${selectedWorkspaceId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
         try {
            const cachedData = JSON.parse(cached);
            if (cachedData && Array.isArray(cachedData)) {
              console.log("Loading internalPlans from cache:", cachedData.length);
              setInternalPlans(cachedData);
            }
         } catch (e) {}
      } else if (internalPlans.length === 0) {
         console.log("Starting initial load...");
         if (isMounted) setIsLocalLoading(true);
         // Force stop loading after 3 seconds to prevent stuck skeleton
         setTimeout(() => {
           console.log("Forcing loading stop via timeout");
           setIsLocalLoading(false);
         }, 3000);
      }

      console.log("Fetching plans for workspace:", selectedWorkspaceId);
      try {
        const { data: planData, error } = await supabase
          .from('v2_agency_content_plans')
          .select('*')
          .eq('workspace_id', selectedWorkspaceId)
          .order('due_date', { ascending: true })
          .limit(300);
        
        if (error) {
          console.error("Supabase Error:", error);
          throw error;
        }
        
        console.log("Fetched plans count:", planData?.length || 0);
        
        if (planData) {
           console.log("CRITICAL: About to setInternalPlans with count:", planData.length);
           setInternalPlans(planData);
           sessionStorage.setItem(cacheKey, JSON.stringify(planData));
        }
      } catch (err) {
        console.error("ContentPlan Fetch Error:", err);
        // Reset ref jika error agar bisa coba lagi
        lastFetchedId.current = null;
      } finally {
        console.log("Fetch finished, forcing loading false");
        setIsLocalLoading(false);
      }
    };

    fetchPlans();

    // Event listener for manual refresh requests
    const handleManualRefresh = () => {
      lastFetchedId.current = null; // Reset ID track
      setRefreshCounter(prev => prev + 1); // Trigger useEffect re-run
    };
    window.addEventListener('aruneeka_refresh_content', handleManualRefresh);

    // REALTIME LISTENER
    if (selectedWorkspaceId && !(plans && plans.length > 0)) {
       const channel = supabase.channel(`content-plan-realtime-${selectedWorkspaceId}`)
         .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'v2_agency_content_plans', 
           filter: `workspace_id=eq.${selectedWorkspaceId}` 
         }, () => {
           // Untuk realtime, kita bypass check lastFetchedId agar data terupdate
           lastFetchedId.current = null;
           fetchPlans(); 
         })
         .subscribe();
       
       return () => {
         isMounted = false;
         window.removeEventListener('aruneeka_refresh_content', handleManualRefresh);
         supabase.removeChannel(channel);
       };
    }

    return () => { 
      isMounted = false; 
      window.removeEventListener('aruneeka_refresh_content', handleManualRefresh);
    };
  }, [selectedWorkspaceId, plans, refreshCounter]);

  const handleExecuteDelete = async () => {
    if (!isDeletingId) return;
    const cleanId = isDeletingId.trim();

    // 1. Update local state instantly (Instant Hide)
    setInternalPlans(prev => prev.filter(p => p.id !== cleanId));
    setLocalDeletedIds(prev => [...prev, cleanId]);
    
    // 2. Save to local "deleted" blacklist so it doesn't come back on refresh
    try {
      const deletedIds = JSON.parse(localStorage.getItem('aruneeka_locally_deleted_ids') || '[]');
      if (!deletedIds.includes(cleanId)) {
        deletedIds.push(cleanId);
        localStorage.setItem('aruneeka_locally_deleted_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {}

    setIsConfirmOpen(false);
    setIsDeletingId(null);
    sessionStorage.removeItem(`content_plans_${selectedWorkspaceId}`);

    // 3. Background delete attempt to database
    try {
      const { error, count } = await supabase
        .from('v2_agency_content_plans')
        .delete({ count: 'exact' })
        .eq('id', cleanId);
      
      if (!error && count && count > 0) {
        console.log("Successfully deleted from DB in background.");
        // Clear from local blacklist if successfully deleted from DB
        const deletedIds = JSON.parse(localStorage.getItem('aruneeka_locally_deleted_ids') || '[]');
        localStorage.setItem('aruneeka_locally_deleted_ids', JSON.stringify(deletedIds.filter((id: string) => id !== cleanId)));
      } else {
        console.warn("Background delete failed (likely RLS). Keeping in local hide list.");
      }
    } catch (err: any) {
      console.error("Background Delete Error:", err);
    }
  };

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
        const d = new Date(year, month, day);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
      }
    }
    
    // Fallback to standard JS Date
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
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

  const filteredPlans = displayPlans.filter((p: any) => {
    // Platform filter
    const platformMatch = filter === 'all' || p.platform?.toLowerCase() === filter.toLowerCase();
    
    // Date Range filter
    let dateMatch = true;
    if (filter === 'unscheduled') {
      return !p.due_date;
    }

    if (p.due_date) {
      const pDate = p.due_date.substring(0, 10);
      dateMatch = pDate >= dateRange.start && pDate <= dateRange.end;
    } else {
      dateMatch = true; 
    }

    // Account filter
    // Check both target_account and profile_id for compatibility
    const accountMatch = !selectedProfileId || 
                        selectedProfileId === 'all' || 
                        p.target_account === selectedProfileId || 
                        p.profile_id === selectedProfileId;

    const isMatch = platformMatch && dateMatch && accountMatch;
    
    if (!isMatch && displayPlans.length > 0) {
       // Only log if we actually have data but it's being filtered
       console.log("Plan filtered out:", { 
         title: p.title, 
         platformMatch, 
         dateMatch, 
         accountMatch,
         p_platform: p.platform,
         p_date: p.due_date,
         p_account: p.target_account,
         p_profile: p.profile_id,
         selectedProfileId,
         dateRange
       });
    }

    return isMatch;
  });

  const sortedPlans = [...filteredPlans].sort((a: any, b: any) => {
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
        const resultData = results.data as any[];
        // Data starts from Row 3 (index 2) according to user mention "A3 and B3"
        const rowsToImport = resultData.slice(2).filter((row: any) => {
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
        const userObj = userStr ? JSON.parse(userStr) : null;
        
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

        const payloads = rowsToImport.map((row: any) => ({
          workspace_id: workspaceId,
          user_id: userObj?.id,
          target_account: selectedProfileId || null, 
          author_name: row[4] || userObj?.full_name || 'Owner', // Col E (PIC)
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
          const isPowerUser = userObj?.role === 'Superuser' || userObj?.role === 'developer';
          if (subscriptionTier === 'free' && !isPowerUser) {
             const count = parseInt(localStorage.getItem(`usage_import_${userObj?.id}`) || '0');
             localStorage.setItem(`usage_import_${userObj?.id}`, (count + 1).toString());
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
      error: (err: any) => {
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
    const exportData = filteredPlans.map((p: any) => ({
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

  console.log("Rendering AruneekaContentPlan:", { 
    isLocalLoading, 
    propPlans: plans?.length || 0,
    internalPlans: internalPlans.length, 
    displayPlans: displayPlans.length, 
    plansCount: sortedPlans.length, 
    filter, 
    selectedProfileId, 
    view: currentView 
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-6">
         <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-amethyst-dark tracking-tight">Content Production Line</h2>
            <p className="text-sm text-slate-400 font-normal italic">Manage your content lifecycle from strategy to publishing.</p>
         </div>

         <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative">
                     <button id="tour-content-period" 
                        onClick={() => setIsRangeOpen(!isRangeOpen)}
                        className="flex items-center gap-2 md:gap-4 bg-white border border-amethyst-light rounded-2xl w-fit px-3 md:px-6 py-2.5 md:py-3 shadow-sm hover:border-amethyst-primary transition-all group"
                     >
                        <Calendar size={16} className="text-amethyst-primary shrink-0" />
                        <div className="flex items-center gap-1.5 md:gap-2">
                           <span className="text-[9px] md:text-[10px] font-black text-amethyst-dark tracking-wider">{new Date(dateRange.start + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                           <div className="w-3 md:w-4 h-px bg-slate-200" />
                           <span className="text-[9px] md:text-[10px] font-black text-amethyst-dark tracking-wider">{new Date(dateRange.end + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <ChevronDown size={14} className={`text-amethyst-primary transition-transform shrink-0 ${isRangeOpen ? 'rotate-180' : ''}`}/>
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
                  
                  <button 
                     onClick={() => onNewContent?.()}
                     className="md:hidden w-11 h-11 bg-amethyst-primary text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0"
                  >
                     <Plus size={20} />
                  </button>
               </div>
            </div>

            {/* View Switcher Tabs - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-3">
               <div id="tour-view-mode" className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 items-center relative z-[100]">
                  <button 
                    onClick={() => {
                      setLocalView('table');
                      onViewChange?.('table');
                    }}
                    className={`flex items-center gap-2 flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-[14px] text-[9px] md:text-[10px] whitespace-nowrap font-bold transition-all ${currentView === 'table' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={14} /> List
                  </button>
                  <button 
                    onClick={() => {
                       const isPwr = user?.role === 'Superuser' || user?.role === 'developer';
                       if (subscriptionTier === 'free' && !isPwr) {
                         setLockedFeature({ 
                           title: 'Kanban Visualizer', 
                           desc: 'Kelola alur kerja konten Anda dengan drag-and-drop Kanban board yang intuitif.',
                           icon: <Kanban size={32} />
                         });
                         setIsLockModalOpen(true);
                         setIsMoreOpen(false);
                         return;
                       }
                       setLocalView('kanban');
                       onViewChange?.('kanban');
                    }}
                    className={`flex items-center gap-2 flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-[14px] text-[9px] md:text-[10px] whitespace-nowrap font-bold transition-all ${currentView === 'kanban' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Kanban size={14} /> Kanban
                  </button>
                  <button 
                    onClick={() => {
                       const isPwr = user?.role === 'Superuser' || user?.role === 'developer';
                       if (subscriptionTier === 'free' && !isPwr) {
                         setLockedFeature({ 
                           title: 'Content Calendar', 
                           desc: 'Visualisasikan jadwal konten Anda dalam format kalender yang rapi.',
                           icon: <Calendar size={32} />
                         });
                         setIsLockModalOpen(true);
                         setIsMoreOpen(false);
                         return;
                       }
                       setLocalView('calendar');
                       onViewChange?.('calendar');
                    }}
                    className={`flex items-center gap-2 flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-[14px] text-[9px] md:text-[10px] whitespace-nowrap font-bold transition-all ${currentView === 'calendar' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Calendar size={14} /> Calendar
                  </button>
               </div>

               {!isPublic && (
                  <div className="flex items-center gap-2">
                     <button 
                        id="tour-create-content"
                        onClick={() => onNewContent?.()}
                        className="flex items-center gap-3 px-6 py-3 bg-amethyst-primary text-white rounded-[16px] font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all"
                     >
                        <Plus size={16}/> <span className="hidden lg:inline">New Content</span><span className="lg:hidden">New</span>
                     </button>

                     <div className="relative">
                        <button id="tour-content-actions" 
                           onClick={() => setIsMoreOpen(!isMoreOpen)}
                           className={`flex w-11 h-11 md:w-12 md:h-12 items-center justify-center bg-white border border-amethyst-light rounded-[16px] text-amethyst-primary hover:border-amethyst-primary transition-all shadow-sm ${isMoreOpen ? 'ring-2 ring-amethyst-light' : ''}`}
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
                                          
                                          const isPwr = user?.role === 'Superuser' || user?.role === 'developer';
                                          if (subscriptionTier === 'free' && !isPwr) {
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
                                          const isPwr = user?.role === 'Superuser' || user?.role === 'developer';
                                          if (subscriptionTier === 'free' && !isPwr) {
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

      <div className="space-y-8">
         {/* Platform Filter Pills */}
         <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            {platforms.map((p: any) => (
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

         <AnimatePresence mode="wait">
            {isLocalLoading ? (
               <div key="loading" className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[24px] p-6 border border-amethyst-light shadow-sm flex items-center justify-between gap-6 animate-pulse"
                     >
                        <div className="flex-1 space-y-2">
                           <div className="h-4 w-1/2 bg-slate-100 rounded-md animate-pulse" />
                           <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Memuat data strategi...</div>
                        </div>
                        <div className="w-8 h-8 bg-slate-50 rounded-lg" />
                        <div className="w-24 h-8 bg-slate-50 rounded-xl" />
                        <div className="w-20 h-4 bg-slate-50 rounded-md" />
                        <div className="flex gap-2">
                           <div className="w-20 h-8 bg-slate-50 rounded-lg" />
                           <div className="w-20 h-8 bg-slate-50 rounded-lg" />
                        </div>
                     </motion.div>
                  ))}
               </div>
            ) : (
               <div key="content" className="space-y-6">
                  {/* MOBILE CARD VIEW */}
                  <div className="md:hidden space-y-4">
                     {sortedPlans.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-[32px] border border-amethyst-light shadow-sm">
                           <div className="flex flex-col items-center justify-center text-gray-400">
                              <div className="mb-4 rounded-full bg-gray-50 p-4">
                                 <Calendar className="h-8 w-8" />
                              </div>
                              <p className="text-lg font-medium text-gray-600">Belum ada konten</p>
                           </div>
                        </div>
                     ) : (
                        sortedPlans.map((plan: any, i: number) => (
                           <motion.div 
                              key={plan.id || i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => onSelectContent?.(plan)}
                              className="bg-white rounded-[28px] p-6 border border-amethyst-light shadow-sm space-y-4 active:scale-[0.98] transition-all"
                           >
                              <div className="flex justify-between items-start gap-4">
                                 <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                       <span className="px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(plan.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-amethyst-dark leading-snug line-clamp-2">{plan.title}</h4>
                                 </div>
                                 <div className="flex flex-col items-end gap-2 shrink-0">
                                    <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl">
                                       {plan.platform ? (platformIcons[plan.platform.toLowerCase()] || <span className="text-[8px] font-bold uppercase text-slate-300">{plan.platform}</span>) : '-'}
                                    </div>
                                    {!isPublic && (
                                       <div className="flex flex-col items-end gap-1.5">
                                          {plan.status?.toLowerCase() === 'uploaded' && (
                                             <button 
                                                onClick={(e: any) => { e.stopPropagation(); onInsight?.(plan); }} 
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-[8px] font-black uppercase tracking-widest shadow-sm ${plan.metrics_updated ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-[#9333EA] text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'}`}
                                             >
                                                <TrendingUp size={10}/> {plan.metrics_updated ? 'Insights' : 'Metrics'}
                                             </button>
                                          )}
                                          <div className="flex items-center gap-1">
                                             <button 
                                                onClick={(e: any) => { e.stopPropagation(); onEditContent?.(plan); }} 
                                                className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-amethyst-primary/60 hover:text-amethyst-primary active:scale-90 transition-all"
                                             >
                                                <Pencil size={12} />
                                             </button>
                                             <button 
                                                onClick={(e: any) => { e.stopPropagation(); setIsDeletingId(plan.id); setIsConfirmOpen(true); }} 
                                                className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-amethyst-primary/60 hover:text-rose-500 active:scale-90 transition-all"
                                             >
                                                <Trash2 size={12} />
                                             </button>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                 <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-bold uppercase tracking-wider">{plan.content_format || 'Format'}</span>
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${plan.status?.toUpperCase() === 'UPLOADED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {plan.status || 'DRAFT'}
                                 </div>
                              </div>
                           </motion.div>
                        ))
                     )}
                  </div>

                  {/* DESKTOP VIEWS */}
                  <div className="hidden md:block">
                     {currentView === 'table' ? (
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
                                    <th className="text-left pb-6 px-4">Format</th>
                                    <th className="text-left pb-6 px-4">Phase</th>
                                    <th className="text-left pb-6 px-4">Pic</th>
                                    <th className="text-left pb-6 px-4 cursor-pointer hover:text-amethyst-primary transition-colors group/sort" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
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
                              <tbody className="divide-y divide-gray-100 bg-white">
                                 {sortedPlans.length === 0 ? (
                                    <tr>
                                       <td colSpan={isPublic ? 8 : 9} className="py-20 text-center">
                                          <div className="flex flex-col items-center justify-center text-gray-400">
                                             <div className="mb-4 rounded-full bg-gray-50 p-4">
                                                <Calendar className="h-8 w-8" />
                                             </div>
                                             <p className="text-lg font-medium text-gray-600">Tambahkan konten untuk mulai mengelola kontenmu</p>
                                          </div>
                                       </td>
                                    </tr>
                                 ) : (
                                    sortedPlans.map((plan: any, i: number) => (
                                       <tr key={plan.id || i} className={`group hover:bg-amethyst-light/10 transition-all cursor-pointer ${plan.status?.toLowerCase() === 'uploaded' ? 'opacity-60 hover:opacity-100' : ''}`} onClick={() => onSelectContent?.(plan)}>
                                          <td className="py-8 px-4">
                                             <div className="space-y-1">
                                                <h4 className={`text-sm font-bold text-amethyst-dark ${plan.status?.toLowerCase() === 'uploaded' ? 'line-through decoration-amethyst-primary/40' : ''}`}>{plan.title}</h4>
                                                <span className="inline-block px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                                             </div>
                                          </td>
                                          <td className="py-8 px-4">
                                             <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl">
                                                 {plan.platform ? (platformIcons[plan.platform.toLowerCase()] || <span className="text-[8px] font-bold uppercase text-slate-300">{plan.platform}</span>) : "-"}

                                             </div>
                                          </td>
                                          <td className="py-8 px-4">
                                             <span className="text-[10px] font-bold text-amethyst-dark/60 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 whitespace-nowrap">{plan.content_format || "-"}</span>
                                          </td>
                                          <td className="py-8 px-4" onClick={(e: any) => e.stopPropagation()}>
                                             <div className="relative">
                                                <button
                                                   onClick={(e: any) => {
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
                                          <td className="py-8 px-4" onClick={(e: any) => e.stopPropagation()}>
                                             <div className="flex items-center gap-3">
                                                {editingAsset?.id === plan.id && editingAsset?.type === 'script' ? (
                                                   <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                      <input autoFocus value={tempLink} onChange={(e: any) => setTempLink(e.target.value)} placeholder="Script URL..." className="w-32 h-9 bg-white border border-amethyst-primary/30 rounded-xl px-3 text-[9px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300 shadow-sm" />
                                                      <button onClick={() => { if (onInlineUpdate) onInlineUpdate(plan.id, 'script_link', tempLink); setEditingAsset(null); }} className="px-3 py-2 bg-amethyst-dark text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all">Save</button>
                                                      <button onClick={() => setEditingAsset(null)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><X size={12}/></button>
                                                   </div>
                                                ) : (
                                                   <button onClick={() => { if (isPublic && !plan.script_link) return; if (isPublic) { window.open(plan.script_link, '_blank'); return; } setEditingAsset({ id: plan.id, type: 'script' }); setTempLink(plan.script_link || ''); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all shadow-sm ${plan.script_link ? 'bg-amethyst-light text-amethyst-dark hover:bg-white border border-amethyst-light/50' : 'bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-amethyst-light'}`}>
                                                      <FileText size={12}/> {plan.script_link ? 'Lihat Script' : 'Input Script'}
                                                   </button>
                                                )}

                                                {editingAsset?.id === plan.id && editingAsset?.type === 'content' ? (
                                                   <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                      <input autoFocus value={tempLink} onChange={(e: any) => setTempLink(e.target.value)} placeholder="Content URL..." className="w-32 h-8 bg-white border border-amethyst-primary/30 rounded-xl px-3 text-[8px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300 shadow-sm" />
                                                      <button onClick={() => { if (onInlineUpdate) onInlineUpdate(plan.id, 'content_link', tempLink); setEditingAsset(null); }} className="px-3 py-1.5 bg-amethyst-primary text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all">Save</button>
                                                      <button onClick={() => setEditingAsset(null)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><X size={10}/></button>
                                                   </div>
                                                ) : (
                                                   <button onClick={() => { if (isPublic && !plan.content_link) return; if (isPublic) { window.open(plan.content_link, '_blank'); return; } setEditingAsset({ id: plan.id, type: 'content' }); setTempLink(plan.content_link || ''); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all shadow-sm ${plan.content_link ? 'bg-amethyst-mauve/20 text-amethyst-dark hover:bg-white border border-amethyst-mauve/30' : 'bg-amethyst-light/30 text-amethyst-primary hover:bg-white border border-transparent hover:border-amethyst-light'}`}>
                                                      <Video size={12}/> {plan.content_link ? 'Lihat Konten' : 'Input Konten'}
                                                   </button>
                                                )}
                                             </div>
                                          </td>
                                          <td className="py-8 px-4" onClick={(e: any) => e.stopPropagation()}>
                                             {(editingAsset?.id === plan.id && editingAsset?.type === 'post' && !isPublic) ? (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                   <input autoFocus value={tempLink} onChange={(e: any) => setTempLink(e.target.value)} placeholder="Paste link..." className="w-40 h-8 bg-slate-50 border border-amethyst-primary/30 rounded-xl px-3 text-[8px] font-bold text-amethyst-dark outline-none focus:border-amethyst-dark/30 transition-all placeholder:text-slate-300" />
                                                   <button onClick={() => { if (onInlineUpdate) onInlineUpdate(plan.id, 'post_link', tempLink); setEditingAsset(null); }} className="px-3 py-1.5 bg-amethyst-dark text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">Save</button>
                                                   <button onClick={() => setEditingAsset(null)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><X size={12}/></button>
                                                </div>
                                             ) : plan.post_link ? (
                                                <a href={plan.post_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-amethyst-light text-amethyst-dark rounded-lg text-[8px] font-bold uppercase border border-amethyst-light hover:bg-white transition-all w-fit"><ExternalLink size={12}/> View Post</a>
                                             ) : (
                                                <button onClick={() => { if (isPublic) return; setEditingAsset({ id: plan.id, type: 'post' }); setTempLink(''); }} className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-bold uppercase border border-transparent transition-all ${isPublic ? 'cursor-default' : 'hover:border-amethyst-light'}`}>
                                                   {isPublic ? 'N/A' : <><Plus size={12}/> Input Post Link</>}
                                                </button>
                                             )}
                                          </td>
                                          {!isPublic && (
                                             <td className="py-8 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1 text-slate-200">
                                                   {plan.status?.toLowerCase() === 'uploaded' && (
                                                      <button onClick={(e: any) => { e.stopPropagation(); onInsight?.(plan); }} className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest ${plan.metrics_updated ? 'bg-slate-50 text-slate-400 hover:bg-white border border-transparent hover:border-amethyst-light opacity-60 font-medium' : 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] hover:scale-105 active:scale-95'}`}>
                                                         <TrendingUp size={12}/> {plan.metrics_updated ? 'Insights' : 'Add Metrics'}
                                                         {!plan.metrics_updated && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[2px] border-white animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"/>}
                                                      </button>
                                                   )}
                                                   <button onClick={(e: any) => { e.stopPropagation(); onEditContent?.(plan); }} className="p-2 hover:text-amethyst-primary transition-colors text-amethyst-primary/60"><Pencil size={14}/></button>
                                                   <button onClick={(e: any) => { e.stopPropagation(); setIsDeletingId(plan.id); setIsConfirmOpen(true); }} className="p-2 hover:text-rose-500 transition-colors text-amethyst-primary/60"><Trash2 size={14}/></button>
                                                </div>
                                             </td>
                                          )}
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </motion.div>
                     ) : currentView === 'kanban' ? (
                        <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex gap-6 overflow-x-auto pb-8 no-scrollbar">
                           {['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded'].map((status: string) => (
                              <div key={status} className="flex-shrink-0 w-80 space-y-6">
                                 <div className="flex items-center justify-between px-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-amethyst-dark/40">{status}</h3>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${statusStyles[status.toLowerCase()] || 'bg-slate-100 text-slate-400'}`}>
                                       {sortedPlans.filter((p: any) => p.status?.toLowerCase() === status.toLowerCase()).length}
                                    </span>
                                 </div>
                                 <div className="space-y-4">
                                    {sortedPlans.filter((p: any) => p.status?.toLowerCase() === status.toLowerCase()).map((plan: any, i: number) => (
                                       <div key={plan.id || i} onClick={() => onSelectContent?.(plan)} className="bg-white p-6 rounded-[24px] border border-amethyst-light shadow-sm hover:scale-[1.02] transition-all cursor-pointer space-y-4 group">
                                          <div className="flex items-center justify-between">
                                             <span className="px-2 py-0.5 bg-amethyst-light text-amethyst-dark text-[8px] font-bold uppercase tracking-widest rounded-md">{plan.content_pillar || 'edu'}</span>
                                             <div className="flex items-center gap-2">
                                                {platformIcons[plan.platform?.toLowerCase()] || ''}
                                                <span className="text-[9px] font-normal text-amethyst-dark/20 uppercase truncate max-w-[60px]">{plan.platform}</span>
                                             </div>
                                          </div>
                                          <h4 className="text-sm font-bold text-amethyst-dark group-hover:text-amethyst-primary transition-colors">{plan.title}</h4>
                                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                             <div className="w-6 h-6 rounded-full bg-amethyst-light border border-white"/>
                                             <span className="text-[9px] font-normal text-amethyst-dark/40 italic">{new Date(plan.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                          </div>
                                       </div>
                                    ))}
                                    {sortedPlans.filter((p: any) => p.status?.toLowerCase() === status.toLowerCase()).length === 0 && (
                                       <div className="h-24 border-2 border-dashed border-slate-50 rounded-3xl flex items-center justify-center">
                                          <p className="text-[10px] font-bold text-slate-200 tracking-widest">No Tasks</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </motion.div>
                     ) : currentView === 'calendar' ? (
                        <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[32px] border border-amethyst-light shadow-sm overflow-hidden flex flex-col">
                           <div className="p-10 flex items-center justify-between border-b border-amethyst-light">
                              <div className="flex items-center gap-6">
                                 <div className="w-14 h-14 bg-amethyst-light text-amethyst-dark rounded-2xl flex items-center justify-center border border-amethyst-light/50"><Calendar size={24}/></div>
                                 <div>
                                    <h3 className="text-3xl font-bold text-amethyst-dark tracking-tight">{new Date(dateRange.start + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                                    <div className="text-xs font-normal text-amethyst-primary flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amethyst-primary rounded-full animate-pulse"/>{sortedPlans.length} Tasks in this range</div>
                                 </div>
                              </div>
                              <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                 <button onClick={() => { const s = new Date(dateRange.start + 'T00:00:00'); const e = new Date(dateRange.end + 'T00:00:00'); s.setMonth(s.getMonth() - 1); e.setMonth(e.getMonth() - 1); const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; setDateRange({ start: format(s), end: format(e) }); }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-amethyst-dark transition-all"><ChevronLeft size={20}/></button>
                                 <button onClick={() => { const now = new Date(); const s = new Date(now.getFullYear(), now.getMonth(), 1); const e = new Date(now.getFullYear(), now.getMonth() + 1, 0); const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; setDateRange({ start: format(s), end: format(e) }); }} className="px-6 py-2 bg-amethyst-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-xl mx-2 shadow-lg">This Month</button>
                                 <button onClick={() => { const s = new Date(dateRange.start + 'T00:00:00'); const e = new Date(dateRange.end + 'T00:00:00'); s.setMonth(s.getMonth() + 1); e.setMonth(e.getMonth() + 1); const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; setDateRange({ start: format(s), end: format(e) }); }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-amethyst-dark transition-all"><ChevronRight size={20}/></button>
                              </div>
                           </div>
                           <div className="grid grid-cols-7 border-b border-amethyst-light bg-slate-50/50">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (<div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst-primary/40">{day}</div>))}
                           </div>
                           <div className="grid grid-cols-7 grid-rows-5 h-[auto] min-h-[700px]">
                              {(() => {
                                 const startDateObj = new Date(dateRange.start + 'T00:00:00');
                                 const monthIndex = startDateObj.getMonth();
                                 const yearVal = startDateObj.getFullYear();
                                 const firstDay = new Date(yearVal, monthIndex, 1).getDay();
                                 const daysInMonth = new Date(yearVal, monthIndex + 1, 0).getDate();
                                 const totalCells = firstDay + daysInMonth > 35 ? 42 : 35;
                                 const cellIndices = Array.from({ length: totalCells }, ((_: any, i: number) => i));
                                 return cellIndices.map((cellIdx: number) => {
                                    const dayNum = cellIdx - firstDay + 1;
                                    const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                                    const now = new Date();
                                    const isToday = isValidDay && dayNum === now.getDate() && monthIndex === now.getMonth() && yearVal === now.getFullYear();
                                    const dayContent = filteredPlans.filter((p: any) => { if (!p.due_date) return false; const pDate = p.due_date.substring(0, 10); const cellDate = `${yearVal}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`; return pDate === cellDate; });
                                    return (
                                       <div key={cellIdx} className={`border-r border-b border-slate-50 p-4 transition-all hover:bg-amethyst-light/20 flex flex-col gap-2 min-h-[140px] ${!isValidDay ? 'bg-slate-50/10 text-transparent pointer-events-none' : ''}`}>
                                          {isValidDay && (
                                             <>
                                                <div className="flex items-center justify-between pointer-events-none mb-1">
                                                   <span className={`text-xs font-bold ${isToday ? 'w-7 h-7 bg-amethyst-dark text-white rounded-full flex items-center justify-center shadow-md' : 'text-slate-300'}`}>{dayNum}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 overflow-hidden">
                                                   {dayContent.map((plan: any, idx: number) => (
                                                      <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={plan.id || idx} onClick={(e: any) => { e.stopPropagation(); onSelectContent?.(plan); }} className="px-3 py-2 bg-white border border-amethyst-light rounded-xl shadow-sm cursor-pointer hover:border-amethyst-dark transition-all">
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
                  </div>
               </div>
            )}
         </AnimatePresence>
      </div>

      {/* Fixed-position Status Dropdown Portal */}
      <AnimatePresence>
         {openStatusId && statusDropPos && openPlan && (
            <div key="status-dropdown-portal">
               <div className="fixed inset-0 z-[200]" onClick={() => setOpenStatusId(null)}/>
               <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ position: 'fixed', top: statusDropPos.top, left: statusDropPos.left, zIndex: 201 }} className="w-44 bg-white rounded-2xl shadow-2xl border border-amethyst-light/20 overflow-hidden py-1.5">
                  {(['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded']).map((s: string) => (
                     <button key={s} onClick={() => { if (onStatusChange) onStatusChange(openPlan.id, s); openPlan.status = s; setOpenStatusId(null); }} className={`w-full px-4 py-3 text-left flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-slate-50 ${openPlan.status?.toLowerCase() === s.toLowerCase() ? 'bg-amethyst-light/30 text-amethyst-dark' : 'text-slate-400'}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s === 'Draft' ? 'bg-slate-400' : s === 'In Progress' ? 'bg-blue-400' : s === 'Review' ? 'bg-orange-400' : s === 'Approved' ? 'bg-emerald-600' : 'bg-amethyst-primary'}`}/>
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
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm rounded-[44px] shadow-2xl overflow-hidden border border-white/20 relative">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Zap size={120} /></div>
                  <div className="p-10 space-y-8 flex flex-col items-center text-center">
                     <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/20">{lockedFeature.icon}</div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-amber-100 flex items-center gap-1"><Sparkles size={10}/> Pro Feature</span></div>
                        <h3 className="text-2xl font-black text-amethyst-dark tracking-tight">{lockedFeature.title}</h3>
                        <p className="text-xs text-slate-400 font-bold leading-relaxed">{lockedFeature.desc}</p>
                     </div>
                     <div className="w-full space-y-3">
                        <button onClick={() => { setIsLockModalOpen(false); openUpgrade(); }} className="w-full py-4 rounded-2xl bg-amethyst-dark text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-[1.02] active:scale-95 transition-all">Upgrade to unlock</button>
                        <button onClick={() => setIsLockModalOpen(false)} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Mungkin Nanti</button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AruneekaConfirmModal
         isOpen={feedbackModal.isOpen}
         onClose={() => { const shouldReload = feedbackModal.type === 'success'; setFeedbackModal((prev: any) => ({ ...prev, isOpen: false })); if (shouldReload) setRefreshCounter(prev => prev + 1); }}
         onConfirm={() => { const shouldReload = feedbackModal.type === 'success'; setFeedbackModal((prev: any) => ({ ...prev, isOpen: false })); if (shouldReload) setRefreshCounter(prev => prev + 1); }}
         title={feedbackModal.title}
         message={feedbackModal.message}
         type={feedbackModal.type}
      />

      <AruneekaConfirmModal 
         isOpen={isConfirmOpen}
         onClose={() => setIsConfirmOpen(false)}
         onConfirm={handleExecuteDelete}
         title="Hapus Konten"
         message="Apakah Anda yakin ingin menghapus konten ini? Tindakan ini akan menghapus data secara permanen dari database."
         type="danger"
      />
    </div>
  );
};

export default AruneekaContentPlan;
