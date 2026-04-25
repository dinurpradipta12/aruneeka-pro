'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
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
  AlertCircle
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

const AruneekaKPI = ({ 
  selectedProfileId 
}: { 
  selectedProfileId?: string 
}) => {
  const { selectedWorkspaceId } = useWorkspace();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'THREADS'>('ALL');
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [kpis, setKpis] = useState<KPIItem[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('Member');

  useEffect(() => {
    const storedUser = localStorage.getItem('aruneeka_user');
    if (storedUser) {
       setUserRole(JSON.parse(storedUser).role || 'Member');
    }
    if (selectedWorkspaceId) {
      fetchRealData();
      fetchChecklist();
    }
  }, [selectedProfileId, selectedWorkspaceId]);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      const workspaceId = selectedWorkspaceId;
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
        const formattedTargets = (targets || []).map(t => ({
          ...t,
          metric: t.metric_name, // Map for internal state
          target: t.target_value
        }));
        calculateKPIs(plans, formattedTargets);
      }
    } catch (e) {
      console.error("KPI Data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklist = async () => {
    try {
      const workspaceId = selectedWorkspaceId;
      if (!workspaceId) return;

      const { data } = await supabase
        .from('v2_agency_strategy_checklist')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      
      if (data) setChecklist(data);
    } catch (e) {
      console.error("Checklist fetch error:", e);
    }
  };

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
      actual: getActualForMetric(t.platform, t.metric),
      category: t.category as any
    }));

    // If no targets in DB, start with empty list
    setKpis(mergedKpis);
  };

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

    // 1. Kondisi: Sempurna (Semua Tercapai)
    if (below.length === 0) {
      return "Luar biasa! Seluruh target strategi Anda bulan ini tercapai. Aruneeka menyarankan Anda untuk menetapkan target yang lebih menantang (15-20% lebih tinggi) untuk bulan depan guna menjaga tren pertumbuhan.";
    }

    // 2. Kondisi: Ketimpangan Parah (Reached vs Critical)
    if (reached.length > 0 && critical.length > 0) {
        const top = reached[0];
        const low = critical[0];
        return `Meskipun ${top.metric} Anda tumbuh pesat, metrik ${low.metric} berada di bawah 30% target. Ada ketimpangan antara visibilitas dan konversi yang perlu segera Anda evaluasi ulang.`;
    }

    // 3. Kondisi: Jangkauan Luas tapi Followers Rendah (Conversion Gap)
    const reachKpi = relevantKpis.find(k => k.metric.includes('Reach') || k.metric.includes('Views'));
    const followKpi = relevantKpis.find(k => k.metric.includes('Followers'));
    if (reachKpi && followKpi && reachKpi.actual >= reachKpi.target && followKpi.actual < followKpi.target) {
        return `Jangkauan (Reach) Anda sudah melampaui target, namun konversi Followers masih tertahan. Ini menandakan profil Anda mungkin belum cukup 'inviting'. Coba optimasi bio dan berikan CTA (Call to Action) yang lebih kuat.`;
    }

    // 4. Kondisi: Produktif tapi Hasil Rendah (Efficiency Gap)
    const prodKpi = relevantKpis.find(k => k.metric === 'Content Uploaded');
    const resultKpi = relevantKpis.find(k => k.metric === 'Views' || k.metric === 'Reach');
    if (prodKpi && resultKpi && prodKpi.actual >= prodKpi.target && resultKpi.actual < resultKpi.target) {
        return `Anda sangat produktif dalam mengunggah konten, namun hasilnya belum sebanding. Fokuslah pada kualitas 'hook' dan pemilihan waktu tayang daripada sekadar mengejar kuantitas postingan.`;
    }

    // 5. Kondisi: Sedikit Lagi (Nearly There)
    if (nearly.length > 0) {
        const near = nearly[0];
        return `Sedikit lagi! Metrik ${near.metric} Anda sudah mencapai 90%+. Satu atau dua konten viral tambahan di sisa bulan ini akan membawa Anda menembus target utama. Terus bakar semangatnya!`;
    }

    // 6. Kondisi: Instagram - Interaksi Rendah
    if (activePlatform === 'INSTAGRAM' && below.some(k => k.metric === 'Engagement Rate')) {
        return "Insight Instagram: Engagement Rate Anda menurun. Coba bangun percakapan lebih intens melalui sticker interaktif di Story dan balas komentar di 1 jam pertama setelah posting.";
    }

    // 7. Kondisi: TikTok - Views Drop
    if (activePlatform === 'TIKTOK' && below.some(k => k.metric === 'Views')) {
        return "Insight TikTok: Views Anda sedang tersendat. Perhatikan 3 detik pertama konten Anda (Hook). Pastikan penonton tidak melakukan 'scroll-away' terlalu cepat dengan visual yang dinamis.";
    }

    // 8. Kondisi: Loyalitas Komunitas Tinggi (Interaction Focus)
    const engKpi = relevantKpis.find(k => k.metric.includes('Engagement') || k.metric.includes('Interaction'));
    if (engKpi && engKpi.actual >= engKpi.target) {
        return `Kekuatan utama Anda saat ini adalah ${engKpi.metric} yang tinggi. Komunitas Anda sangat loyal. Gunakan momentum ini untuk melakukan kampanye brand awareness atau soft-selling.`;
    }

    // 9. Kondisi: Semua di Bawah Harapan (Total Slump)
    if (reached.length === 0 && below.length > 2) {
        return "Bulan ini terasa cukup menantang. Hampir semua target masih berada di bawah harapan. Aruneeka menyarankan untuk meriset ulang tren yang sedang terjadi di niche Anda dan mencoba format konten baru.";
    }

    // 10. Kondisi: Default (General Evaluation)
    const biggestGap = below.sort((a, b) => (a.actual/a.target) - (b.actual/b.target))[0];
    const percent = biggestGap.target > 0 ? Math.round((biggestGap.actual / biggestGap.target) * 100) : 0;
    return `Evaluasi menunjukkan performa ${biggestGap.metric} baru mencapai ${percent}% dari target. Perlu penyesuaian strategi konten yang lebih agresif untuk mengejar ketertinggalan hingga akhir periode.`;
  }, [kpis, activePlatform]);

  const handleAutoSync = () => {
    setIsAutoSync(true);
    setTimeout(() => {
      setKpis(prev => prev.map(k => ({
        ...k,
        target: Math.round(k.actual * 1.25)
      })));
      setIsAutoSync(false);
    }, 800);
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ platform: 'INSTAGRAM', metric: 'Reach', target: 0, category: 'growth' });

  const handleAddGoal = async () => {
    try {
      const workspaceId = selectedWorkspaceId;
      if (!workspaceId) return;
      
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : { id: null };
      const userId = user.id;

      const payload = {
        profile_id: selectedProfileId || null,
        platform: newGoal.platform,
        metric_name: newGoal.metric,
        target_value: newGoal.target,
        category: newGoal.category,
        workspace_id: workspaceId,
        user_id: userId,
        month_year: new Date().toISOString().slice(0, 7)
      };

      const { error } = await supabase.from('v2_agency_kpi_targets').insert([payload]);
      
      if (error) throw error;
      
      fetchRealData(); // Refetch to get the latest targets from DB
      setIsAddModalOpen(false);
    } catch (e: any) {
      showPopup("Gagal menyimpan", e.message, () => setPopup(p => ({ ...p, isOpen: false })), 'danger', 'Tutup');
    }
  };

  const toggleTask = async (id: string, currentState: any) => {
    if (!id) return;
    
    // Konversi ke status string untuk DB
    const isCompleted = currentState === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    
    // Optimistic update
    setChecklist(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ));

    try {
      const { error } = await supabase
        .from('v2_agency_strategy_checklist')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      fetchChecklist();
    } catch (e) {
      console.error("Gagal update status checklist:", e);
      // Rollback
      setChecklist(prev => prev.map(t => 
        t.id === id ? { ...t, status: currentState } : t
      ));
    }
  };

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
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

  const showPopup = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'info', confirmLabel: string = 'Confirm') => {
    setPopup({ isOpen: true, title, message, onConfirm, type, confirmLabel });
  };

  const handleUpdateTask = async (id: string) => {
    if (!editingText.trim() || !id) return;
    
    let workspaceId = selectedWorkspaceId;
    if (!workspaceId) {
      const savedWs = localStorage.getItem('aruneeka_selected_workspace');
      if (savedWs) workspaceId = JSON.parse(savedWs).id;
    }
    
    setChecklist(prev => prev.map(t => t.id === id ? { ...t, task: editingText } : t));
    setEditingId(null);

    await supabase
      .from('v2_agency_strategy_checklist')
      .update({ task: editingText })
      .eq('id', id);
  };

  const handleDeleteTask = async (id: string) => {
    showPopup(
      'Hapus Strategi', 
      'Apakah Anda yakin ingin menghapus item strategi ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        setChecklist(prev => prev.filter(t => t.id !== id));
        setPopup(p => ({ ...p, isOpen: false }));
        
        if (id) {
          await supabase
            .from('v2_agency_strategy_checklist')
            .delete()
            .eq('id', id);
        }
      },
      'danger',
      'Hapus Item'
    );
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !selectedWorkspaceId) return;
    try {
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : { id: null };
      const workspaceId = selectedWorkspaceId;
      const userId = user.id;

      if (!userId) return;
      
      const { data, error } = await supabase
        .from('v2_agency_strategy_checklist')
        .insert([{ 
          task: newTaskText, 
          status: 'pending', 
          workspace_id: workspaceId,
          user_id: userId // Personality Lock
        }])
        .select();

      if (data) {
        setNewTaskText('');
        setIsAddingTask(false);
        fetchChecklist(); // Ambil ulang data lengkap dengan ID dari DB
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex items-end justify-between">
         <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-amethyst-dark tracking-tight">KPI & Growth Targets</h2>
            <p className="text-sm text-slate-400 font-medium italic">Monthly report card: Target goals vs real-time realizations.</p>
         </div>

          {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const firstPlat = 'INSTAGRAM';
                  setNewGoal({ platform: firstPlat, metric: platformMetrics[firstPlat][0], target: 0, category: 'growth' });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-amethyst-dark rounded-xl font-bold text-xs hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
              >
                <Plus size={14}/>
                Add new goal
              </button>
              <button 
                onClick={handleAutoSync}
                disabled={isAutoSync}
                className="flex items-center gap-2 px-6 py-3 bg-amethyst-light/30 text-amethyst-dark rounded-xl font-bold text-xs hover:bg-amethyst-light/50 transition-all border border-amethyst-light/20 disabled:opacity-50"
              >
                {isAutoSync ? <RefreshCw size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                Sync from last month
              </button>
            </div>
          )}
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
        {['ALL', 'INSTAGRAM', 'TIKTOK', 'THREADS'].map((p) => (
          <button
            key={p}
            onClick={() => setActivePlatform(p as any)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
              activePlatform === p ? 'bg-white text-amethyst-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* KPI Cards Grid */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredKpis.map((kpi) => (
                 <motion.div 
                   layoutId={kpi.id}
                   key={kpi.id} 
                   className="bg-white rounded-[32px] p-8 border border-slate-50 shadow-premium relative overflow-hidden group"
                 >
                    <div className="flex items-start justify-between mb-8">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                               kpi.platform === 'INSTAGRAM' ? 'bg-rose-50' :
                               kpi.platform === 'TIKTOK' ? 'bg-slate-50' :
                               'bg-indigo-50'
                             }`}>
                                <PlatformIcon platform={kpi.platform} />
                             </div>
                             <span className="text-[10px] font-bold text-slate-300">{kpi.category}</span>
                          </div>
                          <h4 className="text-xl font-bold text-amethyst-dark">{kpi.metric}</h4>
                       </div>
                       <div className={`p-2 rounded-xl ${kpi.actual >= (kpi.target || 1) ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          {kpi.actual >= (kpi.target || 1) ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-end justify-between">
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-slate-300">Realization</p>
                             <div className="text-3xl font-black text-amethyst-dark">
                                {kpi.metric?.includes('Rate') ? `${kpi.actual}%` : kpi.actual.toLocaleString()}
                             </div>
                          </div>
                          <div className="text-right space-y-1">
                             <p className="text-[10px] font-bold text-slate-300">Target goal</p>
                             <input 
                               type="number"
                               readOnly={!(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser')}
                               value={kpi.target}
                               onChange={(e) => {
                                 const val = parseFloat(e.target.value) || 0;
                                 setKpis(prev => prev.map(item => item.id === kpi.id ? { ...item, target: val } : item));
                               }}
                               onBlur={async (e) => {
                                 const val = parseFloat(e.target.value) || 0;
                                 if (userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') {
                                   await supabase.from('v2_agency_kpi_targets').update({ target_value: val }).eq('id', kpi.id);
                                 }
                               }}
                               className={`w-24 text-xl font-bold text-amethyst-primary bg-slate-50 border-none rounded-lg text-right focus:ring-2 ring-amethyst-light outline-none px-2 ${!(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') ? 'cursor-default opacity-50' : ''}`}
                             />
                          </div>
                       </div>

                       {/* Progress Bar */}
                       <div className="space-y-2">
                          <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min((kpi.actual / kpi.target) * 100, 100)}%` }}
                               className={`h-full rounded-full ${kpi.actual >= kpi.target ? 'bg-emerald-400' : 'bg-amethyst-primary'}`}
                             />
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400">
                                {((kpi.actual / (kpi.target || 1)) * 100).toFixed(1)}% completed
                             </span>
                             <span className={`text-[10px] font-bold ${kpi.actual >= (kpi.target || 1) ? 'text-emerald-500' : 'text-rose-400'}`}>
                                {kpi.actual >= (kpi.target || 1) ? 'Target met' : `${((kpi.target || 0) - kpi.actual).toLocaleString()} to go`}
                             </span>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               ))}
               
               {/* Removal of Placeholder Card */}
            </div>
         </div>

         {/* Sidebar: Strategy Checklist & Insights */}
         <div className="space-y-10">
            <div className="bg-white rounded-[40px] border border-slate-50 shadow-premium p-10 space-y-8">
               <div className="space-y-2">
                  <h4 className="text-xl font-bold text-amethyst-dark tracking-tight">Strategy Checklist</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Critical actions to hit monthly targets.</p>
               </div>

               <div className="space-y-4">
                  {checklist.map((task, idx) => (
                    <div 
                      key={task.id || `task-${idx}`}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                    >
                       <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.status); } }
                            className={`${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-200 hover:text-amethyst-light'} transition-colors`}
                          >
                             {task.status === 'completed' ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
                          </button>
                          
                          {editingId === task.id ? (
                            <input 
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => handleUpdateTask(task.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTask(task.id)}
                              className="flex-1 bg-white border border-amethyst-primary/30 rounded-lg px-2 py-1 text-sm outline-none"
                            />
                          ) : (
                            <span className={`text-sm font-semibold tracking-tight ${task.status === 'completed' ? 'text-slate-300 line-through' : 'text-amethyst-dark'}`}>
                                {task.task}
                            </span>
                          )}
                       </div>
                       
                       {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => {
                                 setEditingId(task.id);
                                 setEditingText(task.task);
                               }}
                               className="p-1.5 text-slate-300 hover:text-amethyst-primary transition-colors"
                             >
                                <Edit3 size={14}/>
                             </button>
                             <button 
                               onClick={() => handleDeleteTask(task.id)}
                               className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors"
                             >
                                <Trash2 size={14}/>
                             </button>
                          </div>
                       )}
                    </div>
                  ))}
                  
                  {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
                    <>
                       {isAddingTask ? (
                         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 p-4">
                           <input 
                             autoFocus
                             value={newTaskText}
                             onChange={(e) => setNewTaskText(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                             placeholder="Type task..."
                             className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 ring-amethyst-primary"
                           />
                           <button onClick={handleAddTask} className="p-2 bg-amethyst-dark text-white rounded-lg shadow-sm"><Check size={16}/></button>
                         </motion.div>
                       ) : (
                         <button 
                           onClick={() => setIsAddingTask(true)}
                           className="w-full mt-4 flex items-center gap-2 text-amethyst-primary font-bold text-[10px] uppercase tracking-widest px-4 hover:translate-x-1 transition-all"
                         >
                            <Plus size={14}/> Add Strategy Item
                         </button>
                       )}
                    </>
                  )}
               </div>
            </div>

            <div className="bg-white rounded-[48px] p-10 border-y border-r border-slate-100 border-l-[6px] border-l-slate-100 shadow-premium relative overflow-hidden group hover:border-l-amethyst-primary/30 transition-all duration-500">
               <div className="relative z-10 mb-4">
                  <h4 className="text-xl font-black tracking-tight text-amethyst-dark">Gap Insight</h4>
               </div>
               
               <p className="relative z-10 text-sm font-medium leading-relaxed text-slate-500 italic">
                  {gapInsight}
               </p>

               <div className="absolute bottom-0 right-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 text-slate-900 pointer-events-none">
                  <Monitor size={220} />
               </div>
            </div>
         </div>
      </div>
      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-amethyst-dark/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-amethyst-dark">Add Growth Goal</h3>
                <p className="text-sm text-slate-400">Select platform and metric to track.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400">Select platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['INSTAGRAM', 'TIKTOK', 'THREADS'].map(p => (
                      <button 
                        key={p}
                        onClick={() => {
                          setNewGoal({...newGoal, platform: p as any, metric: platformMetrics[p][0]});
                        }}
                        className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${newGoal.platform === p ? 'bg-amethyst-dark text-white border-amethyst-dark' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400">Select metric</label>
                  <select 
                    value={newGoal.metric}
                    onChange={(e) => setNewGoal({...newGoal, metric: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold text-amethyst-dark outline-none cursor-pointer"
                  >
                    {platformMetrics[newGoal.platform].map((m: string) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400">Target value</label>
                  <input 
                    type="number"
                    placeholder="Enter target e.g. 50000"
                    onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xl font-black text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 text-xs font-bold hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={handleAddGoal} className="flex-1 py-4 rounded-2xl bg-amethyst-dark text-white text-xs font-bold shadow-lg shadow-amethyst-dark/20 hover:shadow-xl transition-all">Set goal target</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Global Popup Modal */}
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-amethyst-dark/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
               <div className="p-8 space-y-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    popup.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amethyst-primary/10 text-amethyst-primary'
                  }`}>
                    {popup.type === 'danger' ? <Trash2 size={28}/> : <AlertCircle size={28}/>}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-amethyst-dark tracking-tight">{popup.title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{popup.message}</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setPopup(p => ({ ...p, isOpen: false }))}
                      className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black hover:bg-slate-100 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={popup.onConfirm}
                      className={`flex-1 py-4 rounded-2xl text-white text-[10px] font-black shadow-lg transition-all ${
                        popup.type === 'danger' ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' : 'bg-amethyst-dark shadow-amethyst-dark/20 hover:bg-black'
                      }`}
                    >
                      {popup.confirmLabel || 'Konfirmasi'}
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaKPI;
