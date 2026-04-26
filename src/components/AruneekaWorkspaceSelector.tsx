import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, ArrowRight, Layout, Trash2, Settings, Users, Utensils, Shirt, Sparkles, Cpu, Briefcase, GraduationCap, User, ShieldCheck, Palette, Code2, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AruneekaUpgradeModal from './AruneekaUpgradeModal';

interface Workspace {
  id: string;
  name: string;
  category?: string;
  owner_id: string;
  member_count?: number;
  role?: string;
}

export const AruneekaWorkspaceSelector = ({ 
  onSelect, 
  currentUser 
}: { 
  onSelect: (workspace: Workspace) => void,
  currentUser: any
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState('F&B');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editBrandName, setEditBrandName] = useState('');

  const categories = ['F&B', 'Fashion', 'Beauty', 'Tech', 'Service', 'Education', 'Personal Branding', 'Other'];
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch workspaces where user is a member
      const { data: membershipData, error: memError } = await supabase
        .from('v2_agency_workspace_members')
        .select(`
          role,
          v2_agency_workspaces (
            *,
            v2_agency_workspace_members (count)
          )
        `)
        .eq('user_id', currentUser.id);

      if (memError) throw memError;

      const formatted = membershipData.map((m: any) => ({
        ...m.v2_agency_workspaces,
        role: m.role,
        member_count: m.v2_agency_workspaces.v2_agency_workspace_members[0]?.count || 0
      }));

      setWorkspaces(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'F&B': return <Utensils size={24} />;
      case 'Fashion': return <Shirt size={24} />;
      case 'Beauty': return <Sparkles size={24} />;
      case 'Tech': return <Cpu size={24} />;
      case 'Service': return <Briefcase size={24} />;
      case 'Education': return <GraduationCap size={24} />;
      case 'Personal Branding': return <User size={24} />;
      default: return <Building2 size={24} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'F&B': return 'from-emerald-400 to-teal-600';
      case 'Fashion': return 'from-rose-400 to-pink-600';
      case 'Beauty': return 'from-violet-400 to-purple-600';
      case 'Tech': return 'from-blue-400 to-indigo-600';
      case 'Other': return 'from-slate-400 to-slate-600';
      default: return 'from-amethyst-primary to-amethyst-dark';
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newBrandName.trim()) return;
    
    const isFreeLimit = workspaces.length >= 2 && currentUser?.subscription_tier === 'free';
    if (isFreeLimit && !(['Superuser', 'developer'].includes(currentUser?.role))) {
      setIsUpgradeOpen(true);
      return;
    }

    try {
      // 1. Create Workspace
      const { data: ws, error: wsError } = await supabase
        .from('v2_agency_workspaces')
        .insert([{ 
          name: newBrandName, 
          owner_id: currentUser.id,
          category: brandCategory === 'Other' ? customCategoryName : brandCategory 
        }])
        .select()
        .single();
      
      if (wsError) throw wsError;

      // 2. Add self as Admin
      await supabase.from('v2_agency_workspace_members').insert([
        { workspace_id: ws.id, user_id: currentUser.id, role: 'Admin' }
      ]);

      // 3. Initialize Template (Auto-Clone Strategy & KPI)
      const defaultStrategy = [
        { workspace_id: ws.id, task: 'Audience Research & Segmentation', status: 'pending' },
        { workspace_id: ws.id, task: 'Competitor Benchmarking', status: 'pending' },
        { workspace_id: ws.id, task: 'Content Pillar & Tone Formulation', status: 'pending' },
        { workspace_id: ws.id, task: 'Visual DNA & Aesthetic Guide', status: 'pending' },
        { workspace_id: ws.id, task: 'Social Media Profile Optimization', status: 'pending' }
      ];

      const defaultKPIs = [
        { workspace_id: ws.id, metric: 'Total Views', target_value: 10000, category: 'View' },
        { workspace_id: ws.id, metric: 'Engagement Rate', target_value: 3, category: 'Engagement' },
        { workspace_id: ws.id, metric: 'Follower Growth', target_value: 100, category: 'Growth' }
      ];

      await Promise.all([
        supabase.from('v2_agency_strategy_checklist').insert(defaultStrategy),
        supabase.from('v2_agency_kpi_targets').insert(defaultKPIs),
        supabase.from('v2_agency_settings').upsert({
          id: ws.id,
          agency_name: newBrandName,
          login_hero_bg_color: '#916DD5',
          login_page_bg_color: '#f8fafc',
          updated_at: new Date().toISOString()
        })
      ]);

      setNewBrandName('');
      setBrandCategory('F&B');
      setIsCreateOpen(false);
      fetchWorkspaces();
    } catch (e) {
      alert("Gagal membuat brand baru");
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Hapus brand ini? Semua data konten di dalamnya akan hilang permanen.")) return;
    try {
      const { error } = await supabase.from('v2_agency_workspaces').delete().eq('id', id);
      if (error) throw error;
      fetchWorkspaces();
    } catch (e) { alert("Gagal menghapus brand"); }
  };

  const handleRenameWorkspace = async (e: React.MouseEvent, ws: Workspace) => {
    e.stopPropagation();
    setEditingWorkspace(ws);
    setEditBrandName(ws.name);
    setBrandCategory(ws.category || 'F&B'); // Ganti kategori sementara untuk edit
    setIsEditOpen(true);
  };

  const handleUpdateWorkspace = async () => {
    if (!editBrandName.trim() || !editingWorkspace) return;
    try {
      const { error } = await supabase
        .from('v2_agency_workspaces')
        .update({ 
          name: editBrandName,
          category: brandCategory === 'Other' ? customCategoryName : brandCategory 
        })
        .eq('id', editingWorkspace.id);
      
      if (error) throw error;
      setIsEditOpen(false);
      fetchWorkspaces();
    } catch (e) {
      alert("Gagal memperbarui brand");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] flex flex-col items-center justify-center p-6 pb-20 relative overflow-hidden">
      {/* Mesh Gradients Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amethyst-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amethyst-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-white/40 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#916DD5 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-16 space-y-8">
          <div className="flex justify-center mb-6">
             <img src="/assets/aruneeka.png" alt="Aruneeka Logo" className="h-24 object-contain" />
          </div>
          <h1 className="text-5xl font-black text-amethyst-dark tracking-tighter">
            Welcome back, <span className="text-amethyst-primary">
              {((currentUser?.full_name || currentUser?.fullName || currentUser?.name || '')).split(' ')[0]}!
            </span>
          </h1>
          <p className="text-slate-400 font-medium">Select a brand workspace to start managing your production line.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workspaces.map((ws, idx) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelect(ws)}
              className="group relative bg-white rounded-[40px] p-10 text-left shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_80px_rgba(145,109,213,0.15)] transition-all duration-700 cursor-pointer border border-white min-h-[340px] flex flex-col justify-between"
            >
              {/* Decorative Geometric Shapes (INTERNALIZED CLIPPING) */}
              <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                   <div className="w-48 h-48 border-[25px] border-black rounded-full" />
                   <div className="absolute top-10 right-10 w-24 h-24 bg-black rounded-[40px] rotate-45" />
                   <div className="absolute bottom-10 left-10 w-16 h-16 border-[15px] border-black rounded-full" />
                </div>
              </div>

              {/* Top Icons & Badges */}
              <div className="relative z-10 flex flex-col items-start h-24">
                <h3 className="text-3xl font-black text-amethyst-dark tracking-tight leading-tight group-hover:text-amethyst-primary transition-colors pr-16 line-clamp-2">
                  {ws.name}
                </h3>
                
                {/* Floating Category Icon (Popping Outside) */}
                <div className={`absolute -top-14 -right-14 w-20 h-20 rounded-[28px] bg-gradient-to-br ${getCategoryColor(ws.category || '')} text-white flex items-center justify-center shadow-2xl shadow-black/10 group-hover:scale-110 group-hover:-translate-y-2 group-hover:translate-x-2 transition-all duration-500 z-30 border-4 border-white`}>
                   {React.cloneElement(getCategoryIcon(ws.category || '') as any, { size: 28 })}
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2 mb-6">
                <span className="px-3 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-slate-100">
                  {ws.category || 'Production'}
                </span>
                {ws.owner_id === currentUser.id && (
                  <span className="px-3 py-1.5 bg-amethyst-light/20 text-amethyst-primary text-[9px] font-black uppercase tracking-widest rounded-xl">
                    {ws.role}
                  </span>
                )}
              </div>

              {/* Stats & Members Info */}
              <div className="relative z-10 flex flex-col gap-4">
                 <div className="flex items-center gap-2 text-slate-400">
                    <Users size={14} className="opacity-50" />
                    <span className="text-[11px] font-bold tracking-tight">{ws.member_count} active members</span>
                 </div>
              </div>

              {/* Bottom Actions & Decor */}
              <div className="relative z-10 flex items-center justify-between mt-6">
                <div className="w-12 h-12 rounded-full bg-amethyst-dark text-white flex items-center justify-center group-hover:bg-amethyst-primary group-hover:shadow-lg group-hover:shadow-amethyst-primary/30 transition-all duration-500">
                  <ArrowRight size={20} />
                </div>

                {ws.owner_id === currentUser.id && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleRenameWorkspace(e, ws)}
                      className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-amethyst-light hover:text-amethyst-primary rounded-xl transition-all flex items-center justify-center"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                      className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add New Brand Card (Maching New Style) */}
          {(['Owner', 'Superuser', 'developer'].includes(currentUser?.role) || currentUser?.isAdmin === true) && currentUser?.status === 'Active' && (
            <>
               {(workspaces.length >= 2 && currentUser?.subscription_tier === 'free' && !(['Superuser', 'developer'].includes(currentUser?.role))) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-gradient-to-br from-amethyst-primary/5 to-white border border-amethyst-light/30 rounded-[40px] p-10 flex flex-col items-center justify-center text-center gap-4 transition-all duration-500 overflow-hidden min-h-[340px]"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-amber-400/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/10">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-700 tracking-tight">Upgrade Needed</h3>
                      <p className="text-[11px] text-slate-400 font-bold mt-2 leading-relaxed italic">
                        Kamu telah mencapai limit 2 brand.<br/>Upgrade ke Pro untuk tambah brand tak terbatas.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsUpgradeOpen(true)}
                      className="mt-4 px-8 py-4 bg-amethyst-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all">
                      Upgrade
                    </button>
                    {/* Decorative pattern */}
                    <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12">
                       <Layout size={120} />
                    </div>
                  </motion.div>
               ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: workspaces.length * 0.1 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="group relative border-2 border-dashed border-slate-200 rounded-[40px] p-10 flex flex-col items-center justify-center gap-6 hover:border-amethyst-primary hover:bg-amethyst-light/5 transition-all duration-500 cursor-pointer min-h-[340px]"
                  >
                    <div className="w-20 h-20 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-amethyst-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      <Plus size={40} />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-slate-800">Add new brand</h3>
                      <p className="text-xs text-slate-400 font-medium">Create a separate workspace</p>
                    </div>
                  </motion.div>
               )}
            </>
          )}
        </div>

        {/* System Administration / Developer Tools */}
        {(currentUser?.role === 'developer' || currentUser?.role === 'Superuser') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-left border-t border-slate-100 pt-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Code2 size={24} className="text-amethyst-primary" />
              <h3 className="text-2xl font-black text-amethyst-dark tracking-tight">System Administration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link prefetch={false} href="/admin/users" className="group flex items-center justify-between bg-white/60 backdrop-blur-sm border border-amethyst-light/30 rounded-[32px] p-6 hover:bg-white hover:border-amethyst-primary/40 hover:shadow-[0_15px_40px_rgba(145,109,213,0.15)] transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">User management</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Monitor and maintain system access</p>
                  </div>
                </div>
              </Link>

              <Link prefetch={false} href="/admin/appearance" className="group flex items-center justify-between bg-white/60 backdrop-blur-sm border border-amethyst-light/30 rounded-[32px] p-6 hover:bg-white hover:border-amethyst-primary/40 hover:shadow-[0_15px_40px_rgba(145,109,213,0.15)] transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/30 transition-all duration-300">
                    <Palette size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">System styling</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Configure interface and theme rules</p>
                  </div>
                </div>
              </Link>

              <Link prefetch={false} href="/admin/inbox" className="group flex items-center justify-between bg-white/60 backdrop-blur-sm border border-amethyst-light/30 rounded-[32px] p-6 hover:bg-white hover:border-amethyst-primary/40 hover:shadow-[0_15px_40px_rgba(145,109,213,0.15)] transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">Inbox center</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Subscription requests and support</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsCreateOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-amethyst-dark tracking-tight">Create Brand</h2>
                  <p className="text-sm text-slate-400">Launch a new production environment.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Brand Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="e.g. Aruneeka Fashion"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-amethyst-dark focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Business Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => {
                            setBrandCategory(cat);
                            setIsCustomCategory(cat === 'Other');
                          }}
                          className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all ${brandCategory === cat ? 'bg-amethyst-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isCustomCategory && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Custom Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Automotive, Real Estate"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-amethyst-dark focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleCreateWorkspace}
                    disabled={!newBrandName.trim()}
                    className="w-full py-5 bg-amethyst-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all disabled:opacity-50"
                  >
                    Launch Workspace
                  </button>
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amethyst-dark transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsEditOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-amethyst-dark tracking-tight">Rename Brand</h2>
                  <p className="text-sm text-slate-400">Update your workspace identity.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Brand Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Enter new brand name"
                      value={editBrandName}
                      onChange={(e) => setEditBrandName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-amethyst-dark focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Business Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => {
                            setBrandCategory(cat);
                            setIsCustomCategory(cat === 'Other');
                          }}
                          className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all ${brandCategory === cat ? 'bg-amethyst-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isCustomCategory && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 italic">Custom Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Automotive, Real Estate"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-amethyst-dark focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleUpdateWorkspace}
                    disabled={!editBrandName.trim() || editBrandName === editingWorkspace?.name}
                    className="w-full py-5 bg-amethyst-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditOpen(false)}
                    className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amethyst-dark transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AruneekaUpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        user={currentUser}
      />
    </div>
  );
};
