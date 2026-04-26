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
  const [userRole, setUserRole] = useState<string>('Member');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ platform: 'INSTAGRAM', metric: 'Reach', target: 0, category: 'growth' });
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  
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
      actual: getActualForMetric(t.platform, t.metric),
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

  useEffect(() => {
    const storedUser = localStorage.getItem('aruneeka_user');
    if (storedUser) {
       setUserRole(JSON.parse(storedUser).role || 'Member');
    }
    if (workspaceId) {
      fetchRealData();
      fetchChecklist();
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

      const { error } = await supabase
        .from('v2_agency_kpi_targets')
        .insert([{
          workspace_id: workspaceId,
          profile_id: selectedProfileId,
          platform: newGoal.platform,
          metric: newGoal.metric,
          target_value: newGoal.target,
          category: newGoal.category,
          user_id: userId
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

  const handleAutoSync = async () => {
    if (!workspaceId) return;
    setIsAutoSync(true);
    try {
      // Logic sync Placeholder
      setTimeout(() => setIsAutoSync(false), 2000);
    } catch (e) {
      console.error(e);
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
    if (kpis.length === 0) return "Belum ada data target.";
    const relevantKpis = kpis.filter(k => activePlatform === 'ALL' || k.platform === activePlatform);
    if (relevantKpis.length === 0) return "No data.";
    // Simple logic placeholder
    return "Terus pantau perkembangan strategi Anda.";
  }, [kpis, activePlatform]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-end justify-between">
         <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-amethyst-dark tracking-tight">KPI & Growth Targets</h2>
            <p className="text-sm text-slate-400 font-medium italic">Monthly report card.</p>
         </div>
         {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const firstPlat = 'INSTAGRAM';
                  setNewGoal({ platform: firstPlat, metric: platformMetrics[firstPlat][0], target: 0, category: 'growth' });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-amethyst-dark rounded-xl font-bold text-xs border"
              >
                <Plus size={14}/> Add new goal
              </button>
              <button onClick={handleAutoSync} disabled={isAutoSync} className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-xl font-bold text-xs border">
                {isAutoSync ? <RefreshCw size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Sync
              </button>
            </div>
         )}
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-fit">
        {['ALL', 'INSTAGRAM', 'TIKTOK', 'THREADS'].map((p) => (
          <button key={p} onClick={() => setActivePlatform(p as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold ${activePlatform === p ? 'bg-white shadow-sm' : 'text-slate-400'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredKpis.map((kpi) => (
                 <div key={kpi.id} className="bg-white rounded-[32px] p-8 border shadow-sm relative">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-2">
                          <PlatformIcon platform={kpi.platform} />
                          <span className="text-[10px] font-bold text-slate-300">{kpi.category}</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xl font-bold text-amethyst-dark">{kpi.metric}</h4>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-bold text-slate-300">Realization</p>
                             <div className="text-2xl font-black">{kpi.actual}</div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-300">Target</p>
                             <div className="text-xl font-bold text-amethyst-primary">{kpi.target}</div>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-10">
            <div className="bg-white rounded-[40px] border p-10 space-y-8">
               <h4 className="text-xl font-bold">Strategy Checklist</h4>
               <div className="space-y-4">
                  {checklist.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                       <div className="flex items-center gap-4">
                          <button onClick={() => toggleTask(task.id, task.status)}>
                             {task.status === 'completed' ? <CheckCircle2 size={22} className="text-emerald-500"/> : <Circle size={22} className="text-slate-300"/>}
                          </button>
                          <span className={task.status === 'completed' ? 'line-through text-slate-300' : ''}>{task.task}</span>
                       </div>
                       {(userRole === 'Owner' || userRole === 'Admin' || userRole === 'Superuser') && (
                          <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-rose-400"><Trash2 size={14}/></button>
                       )}
                    </div>
                  ))}
                  {isAddingTask ? (
                    <div className="flex gap-2 p-2">
                      <input autoFocus value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1 bg-white border p-2 rounded-lg text-sm"/>
                    </div>
                  ) : (
                    <button onClick={() => setIsAddingTask(true)} className="text-amethyst-primary font-bold text-xs uppercase px-4">+ Add Task</button>
                  )}
               </div>
            </div>
            <div className="bg-white rounded-[40px] p-10 border shadow-sm">
               <h4 className="text-xl font-bold mb-4">Gap Insight</h4>
               <p className="text-sm text-slate-500 italic">{gapInsight}</p>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-8">
               <h3 className="text-2xl font-bold">Add Goal</h3>
               <div className="space-y-6">
                 <select value={newGoal.platform} onChange={(e) => setNewGoal({...newGoal, platform: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-xl border">
                   {['INSTAGRAM', 'TIKTOK', 'THREADS'].map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <select value={newGoal.metric} onChange={(e) => setNewGoal({...newGoal, metric: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border">
                   {platformMetrics[newGoal.platform].map((m: string) => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <input type="number" placeholder="Target" onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-slate-50 rounded-xl border text-xl font-bold"/>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-50 rounded-2xl font-bold">Cancel</button>
                 <button onClick={handleAddGoal} className="flex-1 py-4 bg-amethyst-dark text-white rounded-2xl font-bold">Save</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6">
               <h3 className="text-xl font-bold">{popup.title}</h3>
               <p className="text-sm text-slate-400">{popup.message}</p>
               <div className="flex gap-3">
                  <button onClick={() => setPopup(p => ({ ...p, isOpen: false }))} className="flex-1 py-4 bg-slate-50 rounded-2xl font-bold">Batal</button>
                  <button onClick={popup.onConfirm} className={`flex-1 py-4 rounded-2xl text-white font-bold ${popup.type === 'danger' ? 'bg-rose-500' : 'bg-amethyst-dark'}`}>
                    {popup.confirmLabel || 'OK'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaKPI;
