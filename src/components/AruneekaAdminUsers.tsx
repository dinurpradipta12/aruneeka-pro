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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
  verification_status?: string; // Verified, Pending
  account_status?: string; // Active, Suspended
}

const AruneekaAdminUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();

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
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 font-black shadow-sm border border-amber-200">
                            {pUser.full_name?.[0] || 'U'}
                         </div>
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
            <button className="flex items-center gap-3 px-8 py-4 bg-amethyst-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-amethyst-dark/20">
               <UserPlus size={16} />
               Register New User
            </button>
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settings</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredUsers.map((user) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={user.id} 
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-amethyst-light/20 flex items-center justify-center text-amethyst-dark font-black text-lg border border-amethyst-light/10">
                              {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                           </div>
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
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                           <CheckCircle2 size={14} />
                           Verified
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</span>
                        </div>
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
               ))}
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
