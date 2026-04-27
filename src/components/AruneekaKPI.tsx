'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target as TargetIcon, 
  TrendingUp, 
  TrendingDown, 
  Layout, 
  Users, 
  Eye, 
  Activity, 
  CheckCircle2, 
  Circle,
  RefreshCw,
  Plus,
  Check,
  Edit3,
  Trash2,
  ArrowUpRight,
  Monitor,
  AlertCircle,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
  BarChart3,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

interface KPIItem {
  id: string;
  metric: string;
  target: number;
  actual: number;
  platform: string;
  category: 'growth' | 'engagement' | 'production';
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch(platform.toUpperCase()) {
    case 'INSTAGRAM':
      return <img src="https://cdn.simpleicons.org/instagram/E4405F" className="w-4 h-4" alt="IG" />;
    case 'TIKTOK':
      return <img src="https://cdn.simpleicons.org/tiktok/000000" className="w-4 h-4" alt="TT" />;
    case 'THREADS':
      return <img src="https://cdn.simpleicons.org/threads/000000" className="w-4 h-4" alt="TH" />;
    default:
      return <div className="w-4 h-4 bg-slate-200 rounded-full" />;
  }
};

const SmartCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalMiliseconds = 800;
    let timer = setInterval(() => {
      start += Math.ceil(end / 20);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 40);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const AruneekaKPI = ({ 
  selectedProfileId,
  selectedWorkspaceId: propWorkspaceId
}: { 
  selectedProfileId?: string,
  selectedWorkspaceId?: string
}) => {
  const { selectedWorkspaceId: contextWorkspaceId } = useWorkspace();
  const workspaceId = propWorkspaceId || contextWorkspaceId;
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'THREADS'>('ALL');
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [kpis, setKpis] = useState<KPIItem[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('Member');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ platform: 'INSTAGRAM', metric: 'Reach', target: 0, category: 'growth', profile_id: '' });
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editingTargetData, setEditingTargetData] = useState<{id: string, metric: string, value: number} | null>(null);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  
  const [popup, setPopup] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'info',
    confirmLabel?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // --- LOGIC FUNCTIONS ---

  const calculateKPIs = (plans: any[], targets: any[]) => {
    const getActualForMetric = (platform: string, metric: string) => {
      const filtered = plans.filter(p => p.platform?.toLowerCase() === platform.toLowerCase());
      
      if (metric === 'Views' || metric === 'Video Views') {
        return filtered.reduce((acc, curr) => acc + (Number(curr.metrics?.views) || Number(curr.metrics?.Views) || 0), 0);
      }
      if (metric === 'Reach' || metric === 'Account Reach') {
        return filtered.reduce((acc, curr) => acc + (Number(curr.metrics?.reach) || Number(curr.metrics?.Reach) || Number(curr.metrics?.views) || 0), 0);
      }
      if (metric === 'New Followers' || metric === 'Followers Growth') {
        return filtered.reduce((acc, curr) => acc + (Number(curr.metrics?.new_followers) || Number(curr.metrics?.follows) || 0), 0);
      }
      if (metric === 'Content Uploaded') {
        return filtered.length;
      }
      
      const totalViews = filtered.reduce((acc, curr) => acc + (Number(curr.metrics?.views) || 0), 0);
      const totalInteractions = filtered.reduce((acc, curr) => {
        const m = curr.metrics || {};
        return acc + (Number(m.likes) || 0) + (Number(m.comments) || Number(m.replies) || 0) + (Number(m.shares) || Number(m.reposts) || 0);
      }, 0);

      if (metric === 'Engagement Rate') {
        return totalViews > 0 ? parseFloat(((totalInteractions / totalViews) * 100).toFixed(2)) : 0;
      }
      if (metric === 'Total Interaction') {
        return totalInteractions;
      }

      return 0;
    };

    const mergedKpis: KPIItem[] = targets.map(t => ({
      id: t.id,
      platform: t.platform,
      metric: t.metric,
      target: t.target_value,
      actual: getActualForMetric(t.platform, t.metric), // Realization is ALWAYS automatic
      category: t.category as any
    }));

    setKpis(mergedKpis);
  };

  const fetchRealData = async () => {
    try {
      setIsLoading(true);
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      let plansQuery = supabase.from('v2_agency_content_plans')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      if (selectedProfileId) {
        plansQuery = plansQuery.eq('target_account', selectedProfileId);
      }
      const { data: plans } = await plansQuery;
      
      let targetsQuery = supabase.from('v2_agency_kpi_targets')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (selectedProfileId) {
        targetsQuery = targetsQuery.eq('profile_id', selectedProfileId);
      }
      const { data: targets } = await targetsQuery;

      if (plans) {
        setData(plans);
        calculateKPIs(plans, targets || []);
      }
    } catch (e) {
      console.error("KPI Data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklist = async () => {
    try {
      if (!workspaceId) return;

      const { data } = await supabase
        .from('v2_agency_strategy_checklist')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      
      if (data) setChecklist(data);
    } catch (e) {
      console.error('Error fetching checklist:', e);
    }
  };

  const fetchProfiles = async () => {
    try {
      if (!workspaceId) return;
      const { data } = await supabase
        .from('v2_agency_social_profiles')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (data) setProfiles(data);
    } catch (e) {
      console.error('Error profiles:', e);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('aruneeka_user');
    if (storedUser) {
       setUserRole(JSON.parse(storedUser).role || 'Member');
    }
    if (workspaceId) {
      fetchRealData();
      fetchChecklist();
      fetchProfiles();
    }
  }, [selectedProfileId, workspaceId]);

  // --- HANDLERS ---

  const showPopup = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'info', confirmLabel: string = 'Confirm') => {
    setPopup({ isOpen: true, title, message, onConfirm, type, confirmLabel });
  };

  const handleAddGoal = async () => {
    if (!workspaceId) return;
    setIsSavingGoal(true);
    try {
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : { id: null };
      const userId = user.id;

      if (!userId) return;

      const now = new Date();
      const currentMonthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const { error } = await supabase
        .from('v2_agency_kpi_targets')
        .insert([{
          workspace_id: workspaceId,
          profile_id: newGoal.profile_id || selectedProfileId,
          platform: newGoal.platform,
          metric: newGoal.metric,
          target_value: newGoal.target,
          category: newGoal.category,
          user_id: userId,
          month_year: currentMonthYear
        }]);

      if (error) throw error;
      setIsAddModalOpen(false);
      fetchRealData();
    } catch (e: any) {
      showPopup("Gagal menyimpan", e.message, () => setPopup(p => ({ ...p, isOpen: false })), 'danger', 'Tutup');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleUpdateTarget = async () => {
    if (!editingTargetData || !workspaceId) return;
    setIsSavingTarget(true);
    try {
      const { error } = await supabase
        .from('v2_agency_kpi_targets')
        .update({ target_value: editingTargetData.value })
        .eq('id', editingTargetData.id);

      if (error) throw error;
      setIsEditingTarget(false);
      fetchRealData();
    } catch (e: any) {
      alert("Gagal update target: " + e.message);
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleAutoSync = async () => {
    if (!workspaceId) return;
    setIsAutoSync(true);
    try {
      const now = new Date();
      const currentMonthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthYear = lastMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      // Fetch targets from last month
      const { data: prevTargets } = await supabase
        .from('v2_agency_kpi_targets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('month_year', lastMonthYear);

      if (prevTargets && prevTargets.length > 0) {
        const userStr = localStorage.getItem('aruneeka_user');
        const user = userStr ? JSON.parse(userStr) : { id: null };
        const userId = user.id;

        const newTargetRows = prevTargets.map(t => ({
          workspace_id: workspaceId,
          profile_id: t.profile_id,
          platform: t.platform,
          metric: t.metric,
          target_value: t.target_value, // Just copy for now, user can adjust manually
          category: t.category,
          user_id: userId,
          month_year: currentMonthYear
        }));

        const { error: insError } = await supabase
          .from('v2_agency_kpi_targets')
          .insert(newTargetRows);
        
        if (insError) throw insError;
        fetchRealData();
      } else {
        showPopup("Info", "Tidak ditemukan data target dari bulan sebelumnya untuk disinkronkan.", () => setPopup(p => ({...p, isOpen: false})));
      }
    } catch (e: any) {
      console.error(e);
      alert("Sync Gagal: " + e.message);
    } finally {
      setIsAutoSync(false);
    }
  };

  const handleUpdateTask = async (id: string) => {
    if (!editingText.trim() || !id) return;
    setChecklist(prev => prev.map(t => t.id === id ? { ...t, task: editingText } : t));
    setEditingId(null);
    await supabase.from('v2_agency_strategy_checklist').update({ task: editingText }).eq('id', id);
  };

  const handleDeleteTask = async (id: string) => {
    showPopup('Hapus Strategi', 'Apakah Anda yakin?', async () => {
      setChecklist(prev => prev.filter(t => t.id !== id));
      setPopup(p => ({ ...p, isOpen: false }));
      if (id) await supabase.from('v2_agency_strategy_checklist').delete().eq('id', id);
    }, 'danger', 'Hapus Item');
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !workspaceId) return;
    try {
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : { id: null };
      const userId = user.id;
      if (!userId) return;
      const { data } = await supabase.from('v2_agency_strategy_checklist').insert([{ 
        task: newTaskText, status: 'pending', workspace_id: workspaceId, user_id: userId
      }]).select();
      if (data) {
        setNewTaskText('');
        setIsAddingTask(false);
        fetchChecklist();
      }
    } catch (e) { console.error(e); }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    const newState = currentStatus === 'completed' ? 'pending' : 'completed';
    setChecklist(prev => prev.map(t => t.id === id ? { ...t, status: newState } : t));
    await supabase.from('v2_agency_strategy_checklist').update({ status: newState }).eq('id', id);
  };

  // --- MEMOS ---

  const filteredKpis = useMemo(() => {
    return kpis.filter(k => activePlatform === 'ALL' || k.platform === activePlatform);
  }, [kpis, activePlatform]);

  const platformMetrics: any = {
    INSTAGRAM: ['Reach', 'Views', 'Engagement Rate', 'Total Reposts', 'Content Uploaded', 'Total Interaction', 'New Followers'],
    TIKTOK: ['Views', 'Total Interaction', 'Avg Retention Rate', 'Engagement Rate', 'Content Uploaded', 'New Followers'],
    THREADS: ['Views', 'Total Interaction', 'Content Uploaded', 'Engagement Rate', 'Total Reposts', 'New Followers']
  };

  const gapInsight = useMemo(() => {
    if (kpis.length === 0) return "Belum ada data target. Silakan tetapkan KPI bulanan Anda agar Aruneeka dapat memberikan analisis mendalam.";
    
    const relevantKpis = kpis.filter(k => activePlatform === 'ALL' || k.platform === activePlatform);
    if (relevantKpis.length === 0) return `Belum ada data KPI untuk platform ${activePlatform} yang dapat dianalisis saat ini.`;

    const reached = relevantKpis.filter(k => k.actual >= k.target && k.target > 0);
    const below = relevantKpis.filter(k => k.actual < k.target);
    const critical = relevantKpis.filter(k => k.actual < (k.target * 0.3) && k.target > 0);
    const nearly = relevantKpis.filter(k => k.actual >= (k.target * 0.9) && k.actual < k.target);
    const midRange = relevantKpis.filter(k => k.actual >= (k.target * 0.5) && k.actual < (k.target * 0.9));
    
    const avgCompletion = relevantKpis.reduce((acc, k) => acc + (Math.min(k.actual / (k.target || 1), 1.5)), 0) / relevantKpis.length;

    // 1. ALL TARGETS REACHED
    if (below.length === 0) {
      return "Luar biasa! Seluruh target strategi Anda bulan ini tercapai. Aruneeka menyarankan Anda untuk menetapkan target yang lebih menantang (15-20% lebih tinggi) untuk bulan depan guna menjaga momentum pertumbuhan eksplosif.";
    }

    // 2. CRITICAL FAILURE (OVERALL)
    if (avgCompletion < 0.3) {
      return "Peringatan Strategi: Tingkat pencapaian target Anda secara keseluruhan berada di bawah 30%. Ada hambatan besar dalam distribusi atau fundamental konten. Disarankan untuk mengevaluasi ulang pilar konten dan riset tren audiens dari nol.";
    }

    // 3. IMBALANCE: REACH VS CONVERSION
    const reachKpi = relevantKpis.find(k => k.metric.includes('Reach') || k.metric.includes('Views'));
    const followKpi = relevantKpis.find(k => k.metric.includes('Followers'));
    if (reachKpi && followKpi && reachKpi.actual >= reachKpi.target && followKpi.actual < followKpi.target) {
        return "Insight Konversi: Jangkauan (Reach) Anda sudah luar biasa, namun konversi Followers tertahan. Ini menandakan profil Anda mungkin belum cukup 'inviting' atau landing page Instagram/TikTok Anda kurang meyakinkan. Optimasi Bio dan CTA sekarang.";
    }

    // 4. IMBALANCE: PRODUCTION VS RESULTS
    const prodKpi = relevantKpis.find(k => k.metric === 'Content Uploaded');
    const resultKpi = relevantKpis.find(k => k.metric === 'Views' || k.metric === 'Reach' || k.metric === 'Total Interaction');
    if (prodKpi && resultKpi && prodKpi.actual >= prodKpi.target && resultKpi.actual < (resultKpi.target * 0.6)) {
        return "Insight Efisiensi: Anda sangat produktif mengunggah konten, namun hasilnya belum sebanding. Kualitas 'hook' 3 detik pertama Anda mungkin lemah. Kurangi kuantitas, fokuslah pada riset 'opening' yang lebih memicu rasa penasaran.";
    }

    // 5. IMBALANCE: ENGAGEMENT VS REACH
    const engKpi = relevantKpis.find(k => k.metric.includes('Engagement') || k.metric.includes('Interaction'));
    if (engKpi && reachKpi && engKpi.actual >= engKpi.target && reachKpi.actual < (reachKpi.target * 0.7)) {
        return "Insight Audiens: Audiens lama Anda sangat loyal (Engagement tinggi), namun algoritma belum mendorong konten Anda ke luar lingkaran pengikut. Tambahkan strategi penggunaan Keyword (SEO) dan Audio Trending untuk menembus pasar baru.";
    }

    // 6. TIKTOK SPECIFIC: RETENTION BOOTSTRAP
    if (activePlatform === 'TIKTOK' && relevantKpis.some(k => k.metric.includes('Retention') && k.actual < (k.target * 0.8))) {
        return "Evaluasi TikTok: Angka Retention Rate Anda rendah. Penonton pergi sebelum video selesai. Pastikan tidak ada 'dead air' atau bagian yang membosankan di tengah video. Gunakan fast-cut editing untuk menjaga atensi.";
    }

    // 7. INSTAGRAM SPECIFIC: STORIES VS FEED
    if (activePlatform === 'INSTAGRAM' && engKpi && engKpi.actual < (engKpi.target * 0.5)) {
        return "Evaluasi Instagram: Interaksi sangat rendah. Gunakan fitur interaktif di Instagram Story (Poll, Quiz, Slider) setiap hari untuk memancing algoritma agar Feed Anda lebih sering dimunculkan ke audiens.";
    }

    // 8. THREADS SPECIFIC: CONVERSATION START
    if (activePlatform === 'THREADS' && engKpi && engKpi.actual < engKpi.target) {
        return "Insight Threads: Platform ini berbasis percakapan. Jika interaksi rendah, ubah gaya bahasa Anda menjadi lebih personal (POV) dan akhiri setiap thread dengan pertanyaan yang mengundang orang untuk membalas.";
    }

    // 9. CROSS-PLATFORM COMPARISON
    if (activePlatform === 'ALL') {
        const platformPerformance = {
            INSTAGRAM: relevantKpis.filter(k => k.platform === 'INSTAGRAM' && (k.actual / k.target) >= 0.8).length,
            TIKTOK: relevantKpis.filter(k => k.platform === 'TIKTOK' && (k.actual / k.target) >= 0.8).length,
        };
        if (platformPerformance.INSTAGRAM > platformPerformance.TIKTOK && platformPerformance.TIKTOK < 2) 
            return "Cross-Platform: Instagram Anda jauh lebih kuat. Coba 'repackage' video Reels terbaik Anda ke TikTok dengan mengganti audionya menggunakan suara yang sedang trending di TikTok untuk mengejar ketertinggalan.";
        if (platformPerformance.TIKTOK > platformPerformance.INSTAGRAM && platformPerformance.INSTAGRAM < 2)
            return "Cross-Platform: TikTok Anda mendominasi. Gaya konten yang 'raw' dan autentik di TikTok ternyata lebih disukai audiens Anda. Coba terapkan estetika yang sama pada konten Instagram Anda.";
    }

    // 10. NEARLY ACHIEVED (80-99%)
    if (nearly.length >= 2) {
      return `Target ${nearly[0].metric} dan ${nearly[1].metric} Anda sudah mencapai di atas 90%. Lakukan 'booster' melalui cross-promotion di platform lain atau ads kecil untuk menutup celah ini dalam 3-5 hari ke depan.`;
    }

    // 11. STAGNANT GROWTH (PRODUCTION LOW)
    if (prodKpi && prodKpi.actual < (prodKpi.target * 0.5)) {
        return "Masalah Konsistensi: Jumlah konten yang diunggah masih di bawah 50% target. Algoritma membutuhkan data postingan yang rutin untuk mulai merekomendasikan akun Anda. Prioritaskan jadwal produksi segera.";
    }

    // 12. VIRAL LUCK ALERT
    if (reachKpi && reachKpi.actual > (reachKpi.target * 1.5)) {
        return "Viral Alert: Jangkauan Anda meledak melampaui target! Manfaatkan momentum ini dengan segera mengunggah konten serupa (Part 2) agar audiens baru tetap bertahan dan mengikuti akun Anda.";
    }

    // 13. QUALITY OVER QUANTITY
    if (prodKpi && prodKpi.actual < (prodKpi.target * 0.8) && reachKpi && reachKpi.actual >= reachKpi.target) {
        return "Insight Kualitas: Anda memposting lebih sedikit dari target namun mendapatkan hasil views yang maksimal. Ini adalah efisiensi yang bagus! Pertahankan kualitas ini dan jangan terburu-buru menambah kuantitas jika belum siap.";
    }

    // 14. MID-RANGE STAGNATION (50-70%)
    if (midRange.length >= 3) {
        return "Mid-Range Alert: Sebagian besar metrik Anda tertahan di angka 60-70%. Strategi Anda 'cukup' tapi belum 'luar biasa'. Cobalah bereksperimen dengan pilar konten baru yang lebih kontroversial atau emosional untuk memicu lonjakan.";
    }

    // 15. FOLLOWER DROP / ZERO GROWTH
    if (followKpi && followKpi.actual === 0 && reachKpi && reachKpi.actual > 0) {
        return "Masalah Retensi Akun: Orang menonton konten Anda tapi tidak ada yang follow. Periksa kembali 'Value Proposition' di Bio Anda. Beritahu alasan kuat kenapa mereka harus mengikuti akun Anda.";
    }

    // 16. ENGAGEMENT RATE CRITICAL
    const erKpi = relevantKpis.find(k => k.metric === 'Engagement Rate');
    if (erKpi && erKpi.actual < (erKpi.target * 0.4)) {
        return "ER Critical: Tingkat keterlibatan sangat rendah. Mungkin konten Anda terlalu 'jualan' atau kaku. Coba buat konten yang lebih humanis, tunjukkan sisi di balik layar (BTS) untuk membangun kedekatan.";
    }

    // 17. CATEGORY SYNERGY (GROWTH VS PRODUCTION)
    const growthKpis = relevantKpis.filter(k => k.category === 'growth');
    const prodKpis = relevantKpis.filter(k => k.category === 'production');
    if (growthKpis.every(k => k.actual < k.target) && prodKpis.every(k => k.actual >= k.target)) {
        return "Mismatch Kategori: Produksi konten sudah maksimal tapi pertumbuhan (Growth) nol. Strategi distribusi Anda bermasalah. Coba evaluasi Hashtag, SEO keyword, dan lokasi tag yang digunakan.";
    }

    // 18. PLATFORM FATIGUE
    if (relevantKpis.length > 5 && critical.length > 3) {
        return "Platform Fatigue: Terlalu banyak target yang gagal. Aruneeka menyarankan Anda fokus hanya pada 2 metrik utama saja minggu ini (misal: Views & Engagement) daripada mencoba memperbaiki semuanya sekaligus.";
    }

    // 19. RECOVERY MODE
    if (reached.length === 1 && below.length > 3) {
        return `Kabar baiknya, ${reached[0].metric} Anda tercapai. Gunakan metrik ini sebagai lokomotif. Buatlah konten yang mengarahkan penonton dari ${reached[0].metric} menuju metrik lain yang masih tertinggal.`;
    }

    // 20. FALLBACK
    return reached.length > 0 ? 
      `Strategi bulan ini menunjukkan progres pada ${reached[0].metric}. Fokuslah untuk mempertahankan ritme ini sambil mulai memperbaiki sisa target lainnya secara bertahap.` :
      "Terus pantau perkembangan strategi Anda secara harian. Konsistensi dalam eksekusi dan evaluasi metrik adalah kunci utama untuk mencapai target besar yang telah Anda tetapkan.";
  }, [kpis, activePlatform]);

  return (
    <div className="space-y-12 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-2">
            <h2 className="text-4xl font-black text-amethyst-primary tracking-tight leading-none">KPI & Growth</h2>
            <p className="text-[13px] text-slate-400 font-medium italic leading-relaxed">Precision intelligence and monthly performance cycle.</p>
         </div>
         {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const firstPlat = 'INSTAGRAM';
                  const firstProfile = profiles.find(p => p.platform?.toUpperCase() === firstPlat)?.id || '';
                  setNewGoal({ platform: firstPlat, metric: platformMetrics[firstPlat][0], target: 0, category: 'growth', profile_id: firstProfile || (selectedProfileId || '') });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-3 px-8 py-4 bg-amethyst-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-primary/20"
              >
                <Plus size={16}/> <span id="tour-add-goal">Add new goal</span>
              </motion.button>
              <motion.button 
                id="tour-sync-kpi"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleAutoSync} disabled={isAutoSync} 
                className="flex items-center gap-2 px-8 py-4 bg-white text-amethyst-primary rounded-[24px] border border-amethyst-primary/20 font-black text-[10px] uppercase tracking-widest shadow-sm"
              >
                {isAutoSync ? <RefreshCw size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Sinkronisasi Target
              </motion.button>
            </div>
         )}
      </div>

      {/* PLATFORM FILTER */}
      <div className="flex items-center gap-2 bg-white border border-slate-100 p-2 rounded-[28px] w-fit shadow-sm">
        {['ALL', 'INSTAGRAM', 'TIKTOK', 'THREADS'].map((p) => (
          <button 
            key={p} 
            onClick={() => setActivePlatform(p as any)} 
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activePlatform === p ? 'bg-amethyst-primary text-white shadow-lg shadow-amethyst-primary/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* LEFT: KPI CARDS */}
         <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <AnimatePresence mode="popLayout">
               {filteredKpis.length > 0 ? filteredKpis.map((kpi, idx) => {
                 const progress = Math.min((kpi.actual / (kpi.target || 1)) * 100, 100);
                 const isDone = kpi.actual >= kpi.target && kpi.target > 0;
                 
                 return (
                   <motion.div 
                     key={kpi.id} 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amethyst-primary/5 transition-all group relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amethyst-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                     
                     <div className="flex items-start justify-between mb-10 relative">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                              <PlatformIcon platform={kpi.platform} />
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{kpi.category}</span>
                        </div>
                        {isDone && (
                          <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        )}
                     </div>

                     <div className="space-y-8 relative">
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{kpi.metric}</h4>
                        
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Realization (Auto)</p>
                              <div className="text-4xl font-black text-slate-800 tracking-tighter">
                                <SmartCounter value={kpi.actual} />
                              </div>
                           </div>
                           <div className="text-right space-y-1 group/target cursor-pointer" onClick={() => {
                              setEditingTargetData({ id: kpi.id, metric: kpi.metric, value: kpi.target });
                              setIsEditingTarget(true);
                           }}>
                              <div className="flex items-center justify-end gap-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target</p>
                                <Edit3 size={8} className="text-amethyst-primary opacity-0 group-hover/target:opacity-100 transition-all" />
                              </div>
                              <div className="text-2xl font-black text-amethyst-primary group-hover/target:scale-110 transition-transform origin-right">/ {kpi.target.toLocaleString()}</div>
                           </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                            <span className="text-[10px] font-black text-amethyst-primary">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amethyst-primary to-amethyst-dark'}`}
                            />
                          </div>
                        </div>
                     </div>
                   </motion.div>
                 );
               }) : (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center text-slate-300">
                      <Zap size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Intelligence Data</p>
                      <p className="text-xs text-slate-300 font-bold italic">Assign your first KPI to unlock smart tracking.</p>
                    </div>
                 </div>
               )}
               </AnimatePresence>
            </div>
         </div>

         {/* RIGHT: STRATEGY & INSIGHTS */}
         <div className="lg:col-span-4 space-y-10">
            {/* INSIGHT CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[48px] p-10 text-slate-800 border border-slate-100 shadow-sm relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-amethyst-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amethyst-primary/10 rounded-2xl flex items-center justify-center">
                      <Sparkles size={20} className="text-amethyst-primary" />
                    </div>
                    <h4 id="tour-gap-insight" className="text-xl font-black tracking-tight text-slate-800">Gap Insight</h4>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-slate-500 italic quote-mark">
                    &quot;{gapInsight}&quot;
                  </p>
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    <Zap size={12} /> Powered by Aruneeka Intelligence
                  </div>
               </div>
            </motion.div>

            {/* CHECKLIST CARD */}
            <div className="bg-white rounded-[48px] border border-slate-100 p-10 space-y-10 shadow-sm">
               <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-800 tracking-tight">Strategy Checklist</h4>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Layers size={18} />
                  </div>
               </div>
               
               <div className="space-y-4">
                  {checklist.length > 0 ? checklist.map((task, idx) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="group flex items-center justify-between p-6 rounded-[28px] bg-slate-50/50 border border-transparent hover:border-amethyst-primary/20 hover:bg-white transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggleTask(task.id, task.status)}
                          >
                             {task.status === 'completed' ? (
                               <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                  <Check size={14} strokeWidth={4} />
                               </div>
                             ) : (
                               <div className="w-8 h-8 border-2 border-slate-200 rounded-xl flex items-center justify-center bg-white group-hover:border-amethyst-primary/30 transition-all">
                                  <Circle size={14} className="text-transparent" />
                               </div>
                             )}
                          </motion.button>
                          <span className={`text-xs font-bold tracking-tight text-slate-600 ${task.status === 'completed' ? 'line-through opacity-30' : ''}`}>
                            {task.task}
                          </span>
                       </div>
                       {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
                          <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all">
                            <Trash2 size={14}/>
                          </button>
                       )}
                    </motion.div>
                  )) : (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Empty Roadmap</p>
                    </div>
                  )}

                  {isAddingTask ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                      <input 
                        autoFocus value={newTaskText} 
                        onChange={(e) => setNewTaskText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} 
                        placeholder="Define item..."
                        className="w-full px-6 py-4 bg-white border border-amethyst-primary/20 rounded-[24px] text-sm font-bold shadow-xl shadow-amethyst-primary/5 focus:outline-none focus:ring-2 ring-amethyst-primary/10"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddTask} className="flex-1 py-3 bg-amethyst-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirm</button>
                        <button onClick={() => setIsAddingTask(false)} className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                      </div>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingTask(true)} 
                      className="w-full py-5 border-2 border-dashed border-slate-100 hover:border-amethyst-primary hover:text-amethyst-primary rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add strategic item
                    </button>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* EDIT TARGET MODAL */}
      <AnimatePresence>
        {isEditingTarget && editingTargetData && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-sm rounded-[48px] p-10 space-y-8 shadow-2xl">
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Penyesuaian Target</h3>
               <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metrik: {editingTargetData.metric}</p>
                  <input 
                    type="number" 
                    autoFocus
                    value={editingTargetData.value} 
                    onChange={(e) => setEditingTargetData({...editingTargetData, value: parseFloat(e.target.value) || 0})}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTarget()}
                    className="w-full p-6 bg-slate-50 rounded-[28px] border border-slate-100 text-3xl font-black text-amethyst-primary focus:outline-none focus:ring-2 ring-amethyst-primary/10 transition-all"
                  />
               </div>
               <div className="flex gap-4">
                 <button onClick={() => setIsEditingTarget(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Batal</button>
                 <button onClick={handleUpdateTarget} disabled={isSavingTarget} className="flex-1 py-5 bg-amethyst-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/20">
                   {isSavingTarget ? 'Menyimpan...' : 'Update Target'}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD GOAL MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-lg rounded-[48px] p-12 space-y-10 shadow-2xl relative">
               <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"><XCircle size={24}/></button>
               
               <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Set Smart Goal</h3>
                 <p className="text-xs font-bold text-slate-400 italic">Define your growth trajectory.</p>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Target Account</label>
                    <select 
                      value={newGoal.profile_id} 
                      onChange={(e) => {
                        const profId = e.target.value;
                        const prof = profiles.find(p => p.id === profId);
                        if (prof) {
                          const plat = (prof.platform?.toUpperCase() || 'INSTAGRAM') as any;
                          setNewGoal({
                            ...newGoal, 
                            profile_id: profId, 
                            platform: plat,
                            metric: platformMetrics[plat] ? platformMetrics[plat][0] : 'Reach'
                          });
                        } else {
                          setNewGoal({...newGoal, profile_id: ''});
                        }
                      }} 
                      className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-bold text-sm focus:outline-none focus:ring-2 ring-amethyst-primary/10"
                    >
                      <option value="">— Select Account —</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} ({profile.platform?.toUpperCase() || 'General'})
                        </option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Platform</label>
                    <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-xs font-black text-amethyst-primary uppercase tracking-widest">
                      {newGoal.platform || 'Select an account first'}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Select Metric</label>
                    <select 
                      value={newGoal.metric} 
                      onChange={(e) => setNewGoal({...newGoal, metric: e.target.value})} 
                      className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-bold text-sm focus:outline-none focus:ring-2 ring-amethyst-primary/10"
                    >
                      {newGoal.platform && platformMetrics[newGoal.platform] ? (
                        platformMetrics[newGoal.platform].map((m: string) => <option key={m} value={m}>{m}</option>)
                      ) : (
                        <option>Please select account first</option>
                      )}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Target Value</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value) || 0})} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                      className="w-full p-6 bg-slate-50 rounded-[28px] border border-slate-100 text-3xl font-black text-amethyst-primary focus:outline-none focus:ring-2 ring-amethyst-primary/10 transition-all"
                    />
                 </div>
               </div>
               <div className="flex gap-4">
                 <button onClick={handleAddGoal} className="flex-1 py-6 bg-amethyst-primary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amethyst-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Establish Goal</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL */}
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center space-y-8 shadow-2xl">
               <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto ${popup.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amethyst-primary/10 text-amethyst-primary'}`}>
                  {popup.type === 'danger' ? <AlertCircle size={40} /> : <Zap size={40} />}
               </div>
               <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{popup.title}</h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">{popup.message}</p>
               </div>
               <div className="flex flex-col gap-3">
                  <button onClick={popup.onConfirm} className={`w-full py-5 rounded-[24px] text-white font-black text-[10px] uppercase tracking-widest shadow-lg ${popup.type === 'danger' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amethyst-primary shadow-amethyst-primary/20'}`}>
                    {popup.confirmLabel || 'OK'}
                  </button>
                  <button onClick={() => setPopup(p => ({ ...p, isOpen: false }))} className="w-full py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaKPI;
