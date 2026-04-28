import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, ArrowRight, Layout, Trash2, Settings, Users, Utensils, Shirt, Sparkles, Cpu, Briefcase, GraduationCap, User, ShieldCheck, Palette, Code2, Mail, Lock, UserPlus, Share2, AlertCircle, Inbox } from 'lucide-react';
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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', username: '', password: '' });
  const [isInviting, setIsInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [lastInvitedUser, setLastInvitedUser] = useState<any>(null);
  const [userDeleting, setUserDeleting] = useState<any>(null);

  // Administrative Realtime States
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [pendingInboxCount, setPendingInboxCount] = useState(0);

  const categories = ['F&B', 'Fashion', 'Beauty', 'Tech', 'Service', 'Education', 'Personal Branding', 'Other'];
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const fetchWorkspaces = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);

      // Administrative Realtime Initial Data (Superuser / Developer Only)
      if (['Superuser', 'developer'].includes(currentUser?.role) || currentUser?.username === 'arunika') {
         const { count: uCount } = await supabase.from('v2_agency_users').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
         const { count: iCount } = await supabase.from('v2_agency_inbox').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
         setPendingUsersCount(uCount || 0);
         setPendingInboxCount(iCount || 0);
      }
      
      // 1. Find all user records with the same username
      const { data: userRecords } = await supabase
        .from('v2_agency_users')
        .select('id')
        .eq('username', currentUser.username);
        
      if (!userRecords) return;
      const userIds = userRecords.map((u: any) => u.id);

      // 2. Fetch workspaces where any of these IDs is a member
      const { data: membershipData, error: memError } = await supabase
        .from('v2_agency_workspace_members')
        .select(`
          role,
          v2_agency_workspaces (
            *,
            v2_agency_workspace_members (count)
          )
        `)
        .in('user_id', userIds);

      if (memError) throw memError;

      const formatted = membershipData.map((m: any) => ({
        ...m.v2_agency_workspaces,
        role: m.role,
        member_count: m.v2_agency_workspaces.v2_agency_workspace_members[0]?.count || 0
      }));

      setWorkspaces(formatted);

      // 3. Fetch Global Team Members
      const { data: team } = await supabase
        .from('v2_agency_users')
        .select('*')
        .eq('parent_user_id', currentUser.id);
      
      if (team) setTeamMembers(team);
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
    if (currentUser) {
      fetchWorkspaces();
    }
  }, [currentUser]);

  // Separate Realtime Listener for Admin Tasks
  useEffect(() => {
     const isDeveloper = ['Superuser', 'developer'].includes(currentUser?.role) || currentUser?.username === 'arunika';
     if (!isDeveloper) return;

     const channel = supabase.channel('admin-selector-realtime-' + Math.random().toString(36).substr(2, 9))
       .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_users' }, (payload: any) => {
          supabase.from('v2_agency_users').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
            .then(({ count }: any) => setPendingUsersCount(count || 0));
       })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_inbox' }, (payload: any) => {
          supabase.from('v2_agency_inbox').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
            .then(({ count }: any) => setPendingInboxCount(count || 0));
       })
       .subscribe();

     return () => {
        supabase.removeChannel(channel);
     };
  }, [currentUser]);

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

  const handleGlobalInvite = async () => {
    if (!inviteForm.fullName || !inviteForm.username || !inviteForm.password) return;
    setIsInviting(true);
    try {
      // 0. Check Limit for FREE Users
      if (currentUser?.subscription_tier === 'free' && !(['Superuser', 'developer'].includes(currentUser?.role))) {
        const { count, error: countError } = await supabase
          .from('v2_agency_users')
          .select('*', { count: 'exact', head: true })
          .eq('parent_user_id', currentUser.id);
        
        if (countError) throw countError;
        if (count && count >= 2) {
          setIsInviteOpen(false);
          setIsUpgradeOpen(true);
          return;
        }
      }

      // 1. Create the User Record
      const { data: newUser, error: userError } = await supabase
        .from('v2_agency_users')
        .insert([{
          full_name: inviteForm.fullName,
          username: inviteForm.username,
          password: inviteForm.password,
          role: 'Member',
          status: 'Active',
          is_verified: true,
          parent_user_id: currentUser.id // Link to owner
        }])
        .select()
        .single();
      
      if (userError) throw userError;

      // 2. Add to ALL existing workspaces
      if (workspaces.length > 0) {
        const memberships = workspaces.map((ws: any) => ({
          workspace_id: ws.id,
          user_id: newUser.id,
          role: 'Member'
        }));
        await supabase.from('v2_agency_workspace_members').insert(memberships);
      }

      setLastInvitedUser({
        fullName: inviteForm.fullName,
        username: inviteForm.username,
        password: inviteForm.password
      });
      setIsInviteOpen(false);
      setInviteForm({ fullName: '', username: '', password: '' });
      setShowInviteSuccess(true);
      fetchWorkspaces();
    } catch (e: any) {
      alert("Gagal mengundang: " + e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userDeleting) return;
    try {
      const { error } = await supabase.from('v2_agency_users').delete().eq('id', userDeleting.id);
      if (error) throw error;
      setUserDeleting(null);
      fetchWorkspaces();
    } catch (e: any) { alert("Gagal menghapus: " + e.message); }
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
    <div className="h-screen bg-[#FDFCFE] flex flex-col items-center justify-start pt-28 pb-12 px-6 relative overflow-hidden overscroll-none">
      {/* Mesh Gradients Background - Fixed to viewport */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amethyst-primary/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amethyst-primary/8 rounded-full blur-[130px]" />
      </div>
      
      {/* Seamless Fixed Dot Pattern */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#916DD5 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-12 space-y-8">
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
          {workspaces.map((ws: any, idx: number) => (
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
                    <button id="tour-edit-workspace" 
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
                  <div id="tour-add-workspace">
                    <motion.div 
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
                </div>
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
              <Link prefetch={false} href="/admin/users" className="group relative flex items-center justify-between bg-white/60 backdrop-blur-sm border border-amethyst-light/30 rounded-[32px] p-6 hover:bg-white hover:border-amethyst-primary/40 hover:shadow-[0_15px_40px_rgba(145,109,213,0.15)] transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">User management</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Monitor and maintain system access</p>
                  </div>
                </div>
                {pendingUsersCount > 0 && (
                   <motion.div 
                     animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                     transition={{ repeat: Infinity, duration: 2.5 }}
                     className="px-4 py-1.5 bg-rose-500 text-white rounded-full flex items-center gap-2 shadow-lg shadow-rose-500/20"
                   >
                      <AlertCircle size={10} />
                      <span className="text-[10px] font-black">{pendingUsersCount} Pending</span>
                   </motion.div>
                )}
              </Link>

              {(() => {
                const isDeveloper = ['developer', 'Superuser'].includes(currentUser?.role) || currentUser?.username === 'arunika';
                
                if (!isDeveloper) return null;

                return (
                  <>
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

                    <Link prefetch={false} href="/admin/inbox" className="group relative flex items-center justify-between bg-white/60 backdrop-blur-sm border border-amethyst-light/30 rounded-[32px] p-6 hover:bg-white hover:border-amethyst-primary/40 hover:shadow-[0_15px_40_rgba(145,109,213,0.15)] transition-all duration-300">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                          <Inbox size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 tracking-tight">Inbox center</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Subscription requests and support</p>
                        </div>
                      </div>
                      {pendingInboxCount > 0 && (
                         <motion.div 
                           animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                           transition={{ repeat: Infinity, duration: 2.5 }}
                           className="px-4 py-1.5 bg-emerald-500 text-white rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                         >
                            <Inbox size={10} />
                            <span className="text-[10px] font-black">{pendingInboxCount} Requests</span>
                         </motion.div>
                      )}
                    </Link>
                  </>
                );
              })()}
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
                      {categories.map((cat: string) => (
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
                      {categories.map((cat: string) => (
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


      {/* Floating Action Button (FAB) for Personnel with Bubble & Popover */}
      {(['Owner', 'Superuser', 'developer'].includes(currentUser?.role)) && (
        <div className="fixed bottom-10 right-10 z-[200]">
          <AnimatePresence>
            {!isInviteOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="absolute bottom-[calc(100%+10px)] right-0 whitespace-nowrap bg-amethyst-dark text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 pointer-events-none"
              >
                <span>Invite user lain</span>
                <div className="absolute top-full right-8 w-3 h-3 bg-amethyst-dark rotate-45 -translate-y-1.5" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isInviteOpen && (
              <>
                {/* Backdrop for click-outside-to-close */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsInviteOpen(false)}
                  className="fixed inset-0 z-[205] bg-slate-900/5 backdrop-blur-[2px]"
                />
                
                <div className="absolute bottom-full right-0 mb-6 z-[210]">
                   <motion.div 
                     initial={{ opacity: 0, y: 20, scale: 0.9, originY: 'bottom', originX: 'right' }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.9 }}
                     className="bg-white w-[400px] rounded-[40px] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col border border-slate-100"
                   >
                    <div className="space-y-6 flex-1 flex flex-col">
                      <div className="text-center space-y-1">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Team Management</h2>
                        <div className="flex flex-col items-center gap-1.5">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                             {isAddingNew ? 'Invite New Personnel' : `${teamMembers.length} Global Members`}
                           </p>
                           <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em] shadow-sm ${
                              currentUser?.subscription_tier === 'free' ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
                           }`}>
                              {currentUser?.subscription_tier === 'free' ? 'Standard Tier' : 'Subscribed Account'}
                           </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        {!isAddingNew ? (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                            {teamMembers.length > 0 ? teamMembers.map((member: any, i: number) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={member.id} 
                                className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center text-amethyst-primary font-black text-xs overflow-hidden">
                                       {member.avatar_url ? (
                                         <img src={member.avatar_url} className="w-full h-full object-contain" />
                                       ) : (
                                         <div className="bg-slate-50 w-full h-full rounded-xl flex items-center justify-center text-[10px]">
                                            {member.full_name?.[0]}
                                         </div>
                                       )}
                                    </div>
                                    <div>
                                       <p className="font-bold text-slate-800 text-xs">{member.full_name}</p>
                                       <p className="text-[9px] font-bold text-slate-400">@{member.username}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => setUserDeleting(member)}
                                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-lg"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                 </div>
                              </motion.div>
                            )) : (
                              <div className="py-10 text-center space-y-3 opacity-30 grayscale">
                                 <Users className="mx-auto" size={40} />
                                 <p className="text-[9px] font-black uppercase tracking-widest">No team members</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 py-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Full Name</label>
                              <input 
                                type="text" placeholder="e.g. John Doe"
                                value={inviteForm.fullName}
                                onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-xs font-bold text-slate-800 focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Username</label>
                              <input 
                                type="text" placeholder="e.g. johndoe"
                                value={inviteForm.username}
                                onChange={(e) => setInviteForm({...inviteForm, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-xs font-bold text-slate-800 focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Password</label>
                              <input 
                                type="password" placeholder="••••••••"
                                value={inviteForm.password}
                                onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-xs font-bold text-slate-800 focus:ring-2 ring-amethyst-primary/20 transition-all outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                        {isAddingNew ? (
                          <button 
                            onClick={async () => {
                              await handleGlobalInvite();
                              fetchWorkspaces();
                            }}
                            disabled={isInviting || !inviteForm.fullName || !inviteForm.username || !inviteForm.password}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                          >
                            {isInviting ? 'Inviting...' : 'Confirm Invitation'}
                          </button>
                        ) : (() => {
                          const isLimitReached = (currentUser?.subscription_tier === 'free' || !currentUser?.subscription_tier) && 
                                                teamMembers.length >= 2 && 
                                                !(['Superuser', 'developer'].includes(currentUser?.role));
                          
                          if (isLimitReached) {
                            return (
                              <button 
                                onClick={() => setIsUpgradeOpen(true)}
                                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                              >
                                <Lock size={12} /> Limit Reached — Upgrade Langganan
                              </button>
                            );
                          }

                          return (
                            <button 
                              onClick={() => setIsAddingNew(true)}
                              className="w-full py-4 bg-amethyst-primary text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amethyst-primary/20 hover:bg-amethyst-dark transition-all"
                            >
                              Invite new personnel
                            </button>
                          );
                        })()}
                        <button 
                          onClick={() => isAddingNew ? setIsAddingNew(false) : setIsInviteOpen(false)} 
                          className="w-full py-3 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-all"
                        >
                          {isAddingNew ? 'Back to list' : 'Close Menu'}
                        </button>
                      </div>
                    </div>
                 </motion.div>
              </div>
            </>
          )}
          </AnimatePresence>

          <motion.button id="tour-invite-user" 
             initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsAddingNew(false);
              setIsInviteOpen(!isInviteOpen);
            }}
            className="flex items-center justify-center p-2 relative"
          >
            <img src="/join.png?v=2" className="w-20 h-20 object-contain" />
            {teamMembers.length > 0 && (
               <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white">
                  {teamMembers.length}
               </div>
            )}
          </motion.button>
        </div>
      )}

      <AruneekaUpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        user={currentUser}
      />

      {/* Invite Success Modal */}
      <AnimatePresence>
        {showInviteSuccess && lastInvitedUser && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white w-full max-w-md rounded-[50px] shadow-2xl p-10 text-center space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                
                <div className="space-y-3">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Berhasil Diundang!</h3>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
                      Akun untuk <b>{lastInvitedUser.fullName}</b> telah aktif dan terdaftar di semua brand Anda.
                    </p>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100 text-left">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Username</p>
                      <p className="text-sm font-black text-amethyst-dark">{lastInvitedUser.username}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Initial Password</p>
                      <p className="text-sm font-black text-amethyst-dark">{lastInvitedUser.password}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        const text = `Halo ${lastInvitedUser.fullName}!\n\nSelamat bergabung di tim! Ini adalah akses untuk masuk ke Aruneeka Pro Anda:\n\nLogin Area: https://aruneeka.my.id/login\nUsername: *${lastInvitedUser.username}*\nPassword: *${lastInvitedUser.password}*\n\nSilakan login dan selamat berkolaborasi! 🚀`;
                        navigator.clipboard.writeText(text);
                        alert("Pesan berhasil disalin! Silakan paste di WhatsApp.");
                      }}
                      className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                    >
                      <Share2 size={16} /> Copy for WhatsApp
                    </button>
                    <button 
                      onClick={() => setShowInviteSuccess(false)}
                      className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-all"
                    >
                      Done & Close
                    </button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Warning Modal */}
      <AnimatePresence>
        {userDeleting && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10 text-center space-y-8 relative overflow-hidden"
             >
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <AlertCircle size={40} />
                </div>
                
                <div className="space-y-3">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Hapus Akses Personel?</h3>
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed px-4">
                      Tindakan ini akan membuat <b>{userDeleting.full_name}</b> tidak bisa login kembali selamanya dan harus didaftarkan ulang nantinya.
                   </p>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleConfirmDeleteUser}
                     className="w-full py-5 bg-rose-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[2px] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                   >
                      Ya, Hapus Akses
                   </button>
                   <button 
                     onClick={() => setUserDeleting(null)}
                     className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-all"
                   >
                      Batalkan
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaWorkspaceSelector;
