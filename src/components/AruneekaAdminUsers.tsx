'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpDown,
  Filter,
  Clock,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface AppUser {
  id: string;
  full_name: string;
  username: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  subscription_expiry?: string;
  subscription_tier?: string;
  is_verified?: boolean;
}

interface AruneekaAdminUsersProps {
  subscriptionTier?: string;
}

const AruneekaAdminUsers = ({ subscriptionTier = 'free' }: AruneekaAdminUsersProps) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newExpiry, setNewExpiry] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateExpiry = async () => {
    if (!editingUser || !newExpiry) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('v2_agency_users')
        .update({ subscription_expiry: new Date(newExpiry).toISOString() })
        .eq('id', editingUser.id);

      if (error) throw error;
      fetchUsers();
      setEditingUser(null);
    } catch (e: any) {
      alert("Gagal update: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('v2_agency_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Pisahkan user Aktif dan Pending
        setUsers(data.filter(u => u.status !== 'Pending'));
        setPendingUsers(data.filter(u => u.status === 'Pending'));
      }
    } catch (e) {
      console.error("Fetch users error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    const userStr = localStorage.getItem('aruneeka_user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    // AKTIVASI REAL-TIME: Hemat Bandwidth & Instan
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v2_agency_users'
        },
        () => {
          // Re-fetch data hanya jika ada perubahan (Hemat Server)
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const { error } = await supabase
        .from('v2_agency_users')
        .update({ 
          status: 'Active', 
          is_verified: true 
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Optimistic UI update for snappiness
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      // fetchUsers() will still be called via real-time channel to sync everything
    } catch (e: any) {
      alert("Gagal menyetujui user: " + e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'Superuser': return 'bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest';
      case 'Admin': return 'bg-amethyst-primary/10 text-amethyst-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amethyst-primary/20';
      default: return 'bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-1">
            <div className="flex items-center gap-3 text-amethyst-primary">
               <ShieldCheck size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Administration</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">User Management</h2>
         </div>

         <div className="flex items-center gap-4">
            <div className="bg-white p-4 px-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Population</p>
                  <p className="text-2xl font-black text-slate-800">{users.length}</p>
               </div>
               <div className="w-px h-10 bg-slate-100" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Now</p>
                  <p className="text-2xl font-black text-emerald-500">{users.filter(u => u.role === 'Superuser' || u.full_name).length}</p>
               </div>
            </div>
         </div>
      </div>

      {/* WAITING LIST / APPROVAL QUEUE */}
      <AnimatePresence>
        {pendingUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
             <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-2 text-amber-500">
                   <Clock className="animate-pulse" size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Antrean Persetujuan ({pendingUsers.length})</span>
                </div>
                <div className="h-px bg-amber-100 flex-1 mx-6" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map((pUser) => (
                   <motion.div 
                     layout
                     key={pUser.id}
                     className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex flex-col justify-between gap-4 group hover:shadow-lg hover:shadow-amber-500/10 transition-all"
                   >
                      <div className="flex items-center gap-4">
                         {pUser.avatar_url ? (
                            <img src={pUser.avatar_url} alt={pUser.full_name} className="w-12 h-12 object-contain" />
                         ) : (
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 font-black shadow-sm border border-amber-200">
                               {pUser.full_name?.[0] || 'U'}
                            </div>
                         )}
                         <div>
                            <p className="font-black text-slate-800 text-sm tracking-tight">{pUser.full_name}</p>
                            <p className="text-[10px] text-amber-600 font-bold opacity-70 italic">@{pUser.username}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleApprove(pUser.id)}
                           disabled={approvingId === pUser.id}
                           className="flex-1 py-3 bg-white text-emerald-500 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                         >
                            {approvingId === pUser.id ? (
                              <>
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                >
                                  <Clock size={12} />
                                </motion.div>
                                Processing...
                              </>
                            ) : (
                              'Approve'
                            )}
                         </button>
                         <button className="px-4 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all">
                            Ignore
                         </button>
                      </div>
                   </motion.div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Expiry Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 space-y-8" 
            >
               <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-amethyst-primary/10 text-amethyst-primary rounded-[24px] flex items-center justify-center mx-auto mb-4">
                     <Calendar size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Adjust Expiry Date</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                     Manual override for {editingUser.full_name}
                  </p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Expiry Date</label>
                     <input 
                       type="date"
                       value={newExpiry}
                       onChange={(e) => setNewExpiry(e.target.value)}
                       className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/10 transition-all text-slate-800"
                     />
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleUpdateExpiry}
                    disabled={isUpdating}
                    className="w-full py-5 bg-amethyst-primary text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                     {isUpdating ? 'Updating...' : 'Apply Changes'}
                  </button>
                  <button onClick={() => setEditingUser(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                     Cancel
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
            />
         </div>

         <div className="flex items-center gap-3">
            <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
               <Filter size={18} />
            </button>
            {((users.length + pendingUsers.length) >= 2 && subscriptionTier === 'free' && !(currentUser?.role === 'Superuser' || currentUser?.role === 'developer')) ? (
              <button 
                onClick={() => alert("limit 2 users reached. upgrade to pro to invite more team members.")}
                className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold text-[10px] tracking-tight border border-slate-200 cursor-not-allowed"
              >
                 <ShieldCheck size={16} /> 
                 Upgrade to invite more
              </button>
            ) : (
              <button className="flex items-center gap-3 px-8 py-4 bg-amethyst-dark text-white rounded-2xl font-bold text-[10px] tracking-tight hover:bg-black transition-all shadow-lg shadow-amethyst-dark/20">
                 <UserPlus size={16} />
                 Register new user
              </button>
            )}
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-6 text-left">User Profile</th>
                  <th className="px-8 py-6 text-left">System Role</th>
                  <th className="px-8 py-6 text-left">Active Package</th>
                  <th className="px-8 py-6 text-left">Subscription Period</th>
                  <th className="px-8 py-6 text-left">Usage Health</th>
                  <th className="px-8 py-6 text-right">Settings</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredUsers.map((user) => {
                  // Calculate Days Left
                  const expiryDate = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
                  const startDate = user.created_at ? new Date(user.created_at) : null;
                  const now = new Date();
                  const diffTime = expiryDate ? expiryDate.getTime() - now.getTime() : 0;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const isExpired = expiryDate && diffDays <= 0;
                  const isNearExpiry = expiryDate && diffDays > 0 && diffDays <= 7;
                  const isUnlimited = user.role === 'Superuser' || user.role === 'developer';
                  const expiryStr = isUnlimited ? 'Never' : (expiryDate ? expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'None');

                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={user.id} 
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-12 h-12 object-contain" />
                             ) : (
                                <div className="w-12 h-12 rounded-2xl bg-amethyst-light/20 flex items-center justify-center text-amethyst-dark font-black text-lg border border-amethyst-light/10 shadow-inner">
                                   {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                                </div>
                             )}
                             <div className="space-y-0.5">
                                <p className="font-black text-slate-800 tracking-tight">{user.full_name || 'Anonymous User'}</p>
                                <p className="text-xs text-slate-400 font-bold tracking-tight">@{user.username}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className={getRoleStyle(user.role)}>{user.role}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                             user.subscription_tier === 'agency' ? 'bg-amethyst-primary/10 border-amethyst-primary/20 text-amethyst-primary' : 
                             user.subscription_tier === 'pro' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                             {user.subscription_tier === 'agency' ? <Sparkles size={12} className="animate-pulse" /> : user.subscription_tier === 'pro' ? <Zap size={12} /> : <Clock size={12} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">
                                {isUnlimited ? 'Developer Pro' : (user.subscription_tier || 'Free Starter')}
                             </span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="space-y-0.5 min-w-[80px]">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Started</p>
                                 <p className="text-[10px] font-black text-slate-700">
                                    {startDate ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                 </p>
                              </div>
                              <div className="w-4 h-px bg-slate-200" />
                              <div className="space-y-0.5 min-w-[80px]">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Expires</p>
                                 <button 
                                   onClick={() => {
                                      setEditingUser(user);
                                      setNewExpiry(user.subscription_expiry ? new Date(user.subscription_expiry).toISOString().split('T')[0] : '');
                                   }}
                                   className={`text-[10px] font-black text-left hover:text-amethyst-primary transition-all flex items-center gap-1 group ${isExpired ? 'text-rose-500' : 'text-slate-700'}`}
                                 >
                                    {expiryStr}
                                    <Calendar size={10} className="opacity-0 group-hover:opacity-100 transition-all text-amethyst-primary" />
                                 </button>
                              </div>
                           </div>
                       </td>
                       <td className="px-8 py-6">
                          {isUnlimited ? (
                            <div className="flex items-center gap-2 text-amethyst-primary">
                               <ShieldCheck size={14} className="opacity-60" />
                               <div className="space-y-0.5">
                                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Internal Account</p>
                                  <p className="text-[8px] font-bold text-slate-300 italic">No constraints</p>
                               </div>
                            </div>
                          ) : expiryDate ? (
                            <div className="space-y-2 min-w-[140px]">
                               <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    isExpired ? 'text-rose-500' : isNearExpiry ? 'text-amber-500' : 'text-emerald-500'
                                  }`}>
                                     {isExpired ? 'Expired' : isNearExpiry ? `${diffDays} days critical` : `${diffDays} days active`}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-300">
                                     {isExpired ? '0%' : `${Math.min(100, Math.ceil((diffDays / 30) * 100))}%`}
                                  </span>
                               </div>
                               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: isExpired ? '100%' : `${Math.min(100, (diffDays / 30) * 100)}%` }}
                                    className={`h-full ${isExpired ? 'bg-rose-500' : isNearExpiry ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  />
                               </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-300 italic opacity-50">
                               <AlertCircle size={12} />
                               <span className="text-[10px] font-bold">Pending Setup</span>
                            </div>
                          )}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-amethyst-primary hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                                <Edit3 size={14} />
                             </button>
                             <button className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-transparent">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </td>
                    </motion.tr>
                  );
               })}
            </tbody>
         </table>

         {filteredUsers.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center text-slate-300 space-y-4">
              <Users size={64} className="opacity-10" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Identity not found in database</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default AruneekaAdminUsers;
