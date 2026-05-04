'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck,
  Mail,
  MoreVertical,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMobileWorkspace } from './MobileShell';

export default function MobileTeam() {
  const { selectedWorkspace } = useMobileWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v2_agency_workspace_members')
        .select(`
          role,
          v2_agency_users (
            id,
            full_name,
            username,
            avatar_url,
            status
          )
        `)
        .eq('workspace_id', selectedWorkspace.id);
      
      setMembers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedWorkspace]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-amethyst-dark tracking-tight leading-none">Team Members</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{members.length} Squad active</span>
          </div>
        </div>
        <button className="w-10 h-10 rounded-xl bg-amethyst-dark text-white flex items-center justify-center shadow-lg shadow-amethyst-dark/20">
          <UserPlus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {members.map((member, idx) => {
          const u = member.v2_agency_users;
          return (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm relative">
                  <img 
                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=916DD5&color=fff`} 
                    alt={u.full_name} 
                    className="w-full h-full object-cover"
                  />
                  {u.status === 'Active' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-none">{u.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">@{u.username}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-amethyst-primary">{member.role}</span>
                  </div>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center">
                <MoreVertical size={16} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Invite Hint */}
      <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-[32px] border border-slate-100 text-center space-y-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-amethyst-primary">
          <Mail size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-amethyst-dark uppercase tracking-widest">Need more hands?</p>
          <p className="text-[9px] text-slate-400 font-medium">Invite your squad to collaborate on this workspace.</p>
        </div>
      </div>
    </div>
  );
}
