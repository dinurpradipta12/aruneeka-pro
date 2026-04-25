'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  ShieldCheck,
  Search,
  Filter,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminInbox = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('v2_agency_users')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (e) {
      console.error("Fetch pending error:", e);
    } finally {
      setIsLoading(true); // Wait, should be false
      setIsLoading(false);
    }
  };

  const handleAction = async (userId: string, newStatus: 'Active' | 'Rejected') => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('v2_agency_users')
        .update({ status: newStatus, is_verified: newStatus === 'Active' })
        .eq('id', userId);

      if (error) throw error;
      
      // Remove from local list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error("Approval error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-1">
         <div className="flex items-center gap-3 text-amethyst-primary">
            <Inbox size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Registration Queue</span>
         </div>
         <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
           Inbox Approval
           {pendingUsers.length > 0 && (
             <span className="px-3 py-1 bg-amethyst-primary text-white text-[10px] rounded-full animate-pulse">
               {pendingUsers.length} Pending
             </span>
           )}
         </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Pending List */}
        <div className="lg:col-span-2 space-y-6">
           <AnimatePresence mode="wait">
             {isLoading ? (
               <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-slate-100 italic text-slate-400">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  Memuat data pendaftaran...
               </div>
             ) : pendingUsers.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-slate-100 text-center"
               >
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                     <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Queue is Clear!</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-xs mt-2">
                    Semua pendaftaran telah diproses. Tidak ada permintaan tertunda saat ini.
                  </p>
               </motion.div>
             ) : (
               <div className="space-y-4">
                 {pendingUsers.map((user, idx) => (
                   <motion.div 
                     key={user.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-premium flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-amethyst-light/30 transition-all"
                   >
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 text-amethyst-primary rounded-2xl flex items-center justify-center font-black text-xl border border-slate-100 group-hover:bg-amethyst-primary group-hover:text-white transition-all">
                           {user.full_name?.[0] || 'U'}
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-lg font-black text-slate-800">{user.full_name}</h4>
                           <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 italic">
                                 <Mail size={12} />
                                 {user.email}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 italic">
                                 <User size={12} />
                                 @{user.username}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
                                 <Clock size={12} />
                                 {new Date(user.created_at).toLocaleDateString()}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => handleAction(user.id, 'Rejected')}
                          disabled={actionLoading === user.id}
                          className="flex-1 md:flex-none px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                           Reject
                        </button>
                        <button 
                          onClick={() => handleAction(user.id, 'Active')}
                          disabled={actionLoading === user.id}
                          className="flex-1 md:flex-none px-6 py-3 bg-amethyst-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/20 hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                           {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                           Approve
                        </button>
                     </div>
                   </motion.div>
                 ))}
               </div>
             )}
           </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amethyst-primary/20 blur-[60px]" />
              <div className="relative z-10 space-y-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amethyst-light">Guidelines</span>
                 <h4 className="text-xl font-black">Proses Verifikasi</h4>
              </div>
              <ul className="relative z-10 space-y-4 text-xs font-medium text-slate-300 leading-relaxed list-disc pl-4">
                 <li>Pastikan format email user adalah valid</li>
                 <li>Periksa apakah username mengandung unsur SARA/Kasar</li>
                 <li>Konfirmasi pembayaran subscription secara manual jika diperlukan sebelum melakukan Approve</li>
                 <li>User yang di-Approve akan langsung mendapatkan akses Dashboard Aruneeka Pro</li>
              </ul>
           </div>

           <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-premium space-y-6">
              <div className="space-y-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Activity Stats</span>
                 <h4 className="text-xl font-black text-slate-800">Quick Recap</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending</span>
                    <span className="text-2xl font-black text-amethyst-primary">{pendingUsers.length}</span>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Approved</span>
                    <span className="text-2xl font-black text-slate-800">--</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
