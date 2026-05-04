'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Layout,
  Check,
  Building2,
  Utensils,
  Shirt,
  Sparkles,
  Cpu,
  Briefcase,
  GraduationCap,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'F&B': return <Utensils size={20} />;
    case 'Fashion': return <Shirt size={20} />;
    case 'Beauty': return <Sparkles size={20} />;
    case 'Tech': return <Cpu size={20} />;
    case 'Service': return <Briefcase size={20} />;
    case 'Education': return <GraduationCap size={20} />;
    case 'Personal Branding': return <User size={20} />;
    default: return <Building2 size={20} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'F&B': return 'from-emerald-400 to-teal-600';
    case 'Fashion': return 'from-rose-400 to-pink-600';
    case 'Beauty': return 'from-violet-400 to-purple-600';
    case 'Tech': return 'from-blue-400 to-indigo-600';
    default: return 'from-amethyst-primary to-amethyst-dark';
  }
};

export default function MobileWorkspaceSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentUser,
  selectedId
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (ws: any) => void,
  currentUser: any,
  selectedId?: string
}) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const { data: userRecords } = await supabase
          .from('v2_agency_users')
          .select('id')
          .eq('username', currentUser.username);
          
        if (!userRecords) return;
        const userIds = userRecords.map((u: any) => u.id);

        const { data: membershipData } = await supabase
          .from('v2_agency_workspace_members')
          .select(`
            role,
            v2_agency_workspaces (*)
          `)
          .in('user_id', userIds);

        if (membershipData) {
          const formatted = membershipData.map((m: any) => ({
            ...m.v2_agency_workspaces,
            role: m.role
          }));
          setWorkspaces(formatted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchWorkspaces();
  }, [isOpen, currentUser]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white rounded-t-[48px] p-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-amethyst-dark tracking-tight">Select Workspace</h2>
                <p className="text-xs font-medium text-slate-400">Switch between your brand environments.</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {workspaces.map((ws) => (
                    <motion.div 
                      key={ws.id}
                      onClick={() => {
                        onSelect(ws);
                        onClose();
                      }}
                      className={`relative overflow-hidden p-4 rounded-3xl border-2 transition-all active:scale-[0.98] flex items-center justify-between ${selectedId === ws.id ? 'border-amethyst-primary bg-amethyst-light/5' : 'border-slate-50 bg-slate-50/50'}`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getCategoryColor(ws.category)} text-white flex items-center justify-center shadow-lg shadow-black/5`}>
                          {getCategoryIcon(ws.category)}
                        </div>
                        <div className="flex flex-col">
                          <h4 className="text-base font-black text-amethyst-dark tracking-tight leading-none mb-1">{ws.name}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{ws.category || 'Production'} • {ws.role}</span>
                        </div>
                      </div>
                      {selectedId === ws.id && (
                        <div className="w-8 h-8 rounded-full bg-amethyst-primary text-white flex items-center justify-center shadow-lg shadow-amethyst-primary/20 relative z-10">
                          <Check size={16} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  <button className="flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-amethyst-primary hover:text-amethyst-primary transition-all group">
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest">New Brand</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="h-10" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
