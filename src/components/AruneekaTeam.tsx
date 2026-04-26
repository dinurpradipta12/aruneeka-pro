'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Lock,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Sub Admin' | 'Member';
  status: 'Active' | 'Invited' | 'Inactive';
  avatar_url?: string;
  created_at: string;
}

const AruneekaTeam = ({ selectedWorkspaceId }: { selectedWorkspaceId?: string }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', displayRole: '', systemRole: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [regMember, setRegMember] = useState({ full_name: '', username: '', password: '', role: 'Member' as const });
  
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

  const showPopup = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'info', confirmLabel: string = 'Konfirmasi') => {
    setPopup({ isOpen: true, title, message, onConfirm, type, confirmLabel });
  };

  useEffect(() => { 
    if (selectedWorkspaceId) fetchMembers(); 
  }, [selectedWorkspaceId]);

  const fetchMembers = async () => {
    if (!selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('v2_agency_workspace_members')
        .select('role, v2_agency_users(*)')
        .eq('workspace_id', selectedWorkspaceId);
      
      if (data) {
         const processed = data.map(m => ({ 
            ...m.v2_agency_users, 
            role: m.role,
            ...parsePackedRole(m.v2_agency_users) 
         }));
         setMembers(processed);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const parsePackedRole = (u: any) => {
     const dbRole = u.role || 'Member';
     let title = '';
     if (u.theme_color && u.theme_color.includes('::')) {
        title = u.theme_color.split('::')[0];
     } else if (!['Superuser', 'Owner', 'Admin', 'Member'].includes(dbRole)) {
        title = dbRole;
     }
     return { systemRole: dbRole, displayRole: title || dbRole };
  };

  const handleOpenEdit = (member: any) => {
     setEditingMember(member);
     setEditForm({
        full_name: member.full_name || '',
        displayRole: member.displayRole || '',
        systemRole: member.role || 'Member'
     });
     setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
     if (!editingMember) return;
     setIsSaving(true);
     try {
        const originalColor = editingMember.theme_color?.includes('::') ? editingMember.theme_color.split('::')[1] : (editingMember.theme_color || '#916DD5');
        const packedColor = `${editForm.displayRole}::${originalColor}`;

        const { error } = await supabase
           .from('v2_agency_users')
           .update({
              full_name: editForm.full_name,
              role: editForm.systemRole,
              theme_color: packedColor
           })
           .eq('id', editingMember.id);

        if (error) throw error;
        
        setIsEditModalOpen(false);
        fetchMembers(); // Refresh list
     } catch (e: any) {
        alert("Gagal menyimpan: " + e.message);
     } finally {
        setIsSaving(false);
     }
  };

  const handleRegisterMember = async () => {
    if (isLimitReached) {
      openUpgrade();
      return;
    }
    if (!regMember.username || !regMember.full_name || !regMember.password) return;
    if (!selectedWorkspaceId) return;

    try {
      const userStr = localStorage.getItem('aruneeka_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const currentUserId = user?.id;
      
      const payload: any = {
        full_name: regMember.full_name,
        username: regMember.username.toLowerCase(),
        password: regMember.password,
        role: regMember.role,
        status: 'Active',
        parent_user_id: currentUserId,
        workspace_id: selectedWorkspaceId
      };

      const { data, error: userError } = await supabase.from('v2_agency_users').insert([payload]).select();
      
      if (userError) throw userError;
      if (data && data[0]) { 
         await supabase.from('v2_agency_workspace_members').insert([{
            user_id: data[0].id,
            workspace_id: selectedWorkspaceId,
            role: regMember.role
         }]);

         fetchMembers(); 
         setIsInviteModalOpen(false); 
         setRegMember({ full_name: '', username: '', password: '', role: 'Member' }); 
      }
    } catch (e: any) { showPopup("Gagal mendaftarkan", e.message, () => setPopup(p => ({ ...p, isOpen: false })), 'danger'); }
  };

  const handleDeleteMember = (id: string, name: string) => {
    const userStr = localStorage.getItem('aruneeka_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (id === currentUser?.id) { showPopup("Aksi Ditolak", "Anda tidak bisa menghapus diri sendiri!", () => {}, "danger", "Oke"); return; }
    showPopup('Hapus Personel', `Apakah Anda yakin ingin menghapus ${name}?`, async () => {
      try {
        setMembers(prev => prev.filter(m => m.id !== id));
        setPopup(p => ({ ...p, isOpen: false }));
        await supabase.from('v2_agency_users').delete().eq('id', id);
      } catch (e) { console.error(e); }
    }, 'danger');
  };

  const filteredMembers = members.filter(m => m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'Admin': return <ShieldCheck size={14} className="text-amethyst-primary" />;
      case 'Sub Admin': return <Shield size={14} className="text-blue-500" />;
      case 'Owner': return <ShieldCheck size={14} className="text-amber-500" />;
      default: return <Users size={14} className="text-slate-400" />;
    }
  };

  const { subscriptionTier, openUpgrade } = useWorkspace();
  const isLimitReached = subscriptionTier === 'free' && members.length >= 2;

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Controls */}
      <div className="flex items-end justify-between">
         <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-amethyst-dark tracking-tight leading-tight">Team Squad</h2>
            <p className="text-xs text-slate-400 font-bold italic">Manage personnel roles and access control.</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search squad..." className="pl-10 pr-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 ring-amethyst-light/30 outline-none transition-all w-64 shadow-sm" />
            </div>
            
            {isLimitReached ? (
               <button 
                  onClick={() => openUpgrade()}
                  className="flex items-center gap-3 px-6 py-3 bg-amber-400 text-white rounded-xl font-black text-[10px] uppercase tracking-[1px] shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all group"
               >
                  <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                     <ShieldCheck size={12} className="text-white fill-current" />
                  </div>
                  Squad Limit Reached
               </button>
            ) : (
               <button 
                  onClick={() => setIsInviteModalOpen(true)} 
                  className="flex items-center gap-2 px-6 py-3 bg-amethyst-dark text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-amethyst-dark/20"
               >
                  <UserPlus size={14}/> Invite Personnel
               </button>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <motion.div layout key={member.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-premium relative group overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${member.role === 'Admin' || member.role === 'Owner' ? 'bg-amethyst-primary/30' : member.role === 'Sub Admin' ? 'bg-blue-400/30' : 'bg-slate-100'}`} />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center text-xl font-black text-amethyst-dark overflow-hidden">
                  {member.avatar_url ? (
                     <img src={member.avatar_url} className="w-full h-full object-contain" />
                  ) : (
                     <div className="w-full h-full rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {member.full_name?.charAt(0) || 'U'}
                     </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-amethyst-dark tracking-tight">{member.full_name}</h4>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="text-[10px] font-bold text-slate-400">{member.displayRole || member.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleDeleteMember(member.id, member.full_name)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span>Account Status</span>
                <span className={member.status === 'Active' ? 'text-emerald-500' : 'text-orange-400'}>{member.status}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail size={12} className="text-slate-300" />
                  <span className="text-xs font-semibold text-slate-500 truncate">@{member.username}</span>
              </div>
            </div>
            <button onClick={() => handleOpenEdit(member)} className="w-full mt-6 py-3 rounded-xl border border-slate-100 text-[10px] font-bold text-amethyst-dark hover:bg-slate-50 transition-all">
               Role Settings
            </button>
          </motion.div>
        ))}
      </div>

      {/* Register Personnel Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 space-y-8 border border-slate-100">
               <div className="space-y-2"><h3 className="text-2xl font-black text-amethyst-dark">Register Personnel</h3><p className="text-sm text-slate-400 font-medium">Create a new login for your agency squad.</p></div>
               <div className="space-y-6">
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label><input value={regMember.full_name} onChange={(e) => setRegMember({...regMember, full_name: e.target.value})} placeholder="e.g. John Doe" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label><input value={regMember.username} onChange={(e) => setRegMember({...regMember, username: e.target.value})} placeholder="johndoe" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30" /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label><input type="password" value={regMember.password} onChange={(e) => setRegMember({...regMember, password: e.target.value})} placeholder="••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30" /></div>
                 </div>
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Squad Role</label><div className="grid grid-cols-3 gap-2">{['Admin', 'Sub Admin', 'Member'].map(r => (<button key={r} onClick={() => setRegMember({...regMember, role: r as any})} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${regMember.role === r ? 'bg-amethyst-dark text-white border-amethyst-dark' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>{r}</button>))}</div></div>
               </div>
               <div className="flex gap-3 pt-4"><button onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button><button onClick={handleRegisterMember} className="flex-1 py-4 rounded-2xl bg-amethyst-dark text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amethyst-dark/20 hover:shadow-xl transition-all">Register User</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ROLE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 space-y-8 border border-white/20">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-amethyst-light/20 rounded-[20px] flex items-center justify-center text-amethyst-dark">
                      <Settings size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Role Settings</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Update Personnel Identity</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Display Name</label>
                      <input value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Professional Title (Jabatan)</label>
                      <input value={editForm.displayRole} onChange={(e) => setEditForm({...editForm, displayRole: e.target.value})} placeholder="e.g. Social Media Specialist" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">System Authority</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['Admin', 'Sub Admin', 'Member'].map(r => (
                            <button key={r} onClick={() => setEditForm({...editForm, systemRole: r})} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${editForm.systemRole === r ? 'bg-amethyst-dark text-white border-amethyst-dark shadow-lg shadow-amethyst-dark/20' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{r}</button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                   <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 py-5 bg-amethyst-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all flex items-center justify-center gap-2">
                      {isSaving ? <Clock size={16} className="animate-spin" /> : 'Save Changes'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
               <div className="p-8 space-y-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${popup.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amethyst-primary/10 text-amethyst-primary'}`}>{popup.type === 'danger' ? <Trash2 size={28}/> : <AlertCircle size={28}/>}</div>
                  <div className="space-y-2"><h3 className="text-xl font-black text-amethyst-dark tracking-tight">{popup.title}</h3><p className="text-sm text-slate-400 font-medium leading-relaxed">{popup.message}</p></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPopup(p => ({ ...p, isOpen: false }))} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
                    <button onClick={popup.onConfirm} className={`flex-1 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${popup.type === 'danger' ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' : 'bg-amethyst-dark shadow-amethyst-dark/20 hover:bg-black'}`}>
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

export default AruneekaTeam;
