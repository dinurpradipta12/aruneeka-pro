'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Settings, 
  Trash2, 
  Camera, 
  Music, 
  Repeat, 
  Tv, 
  Users,
  Instagram,
  Youtube,
  Music2,
  Share2,
  ChevronDown,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import AruneekaConfirmModal from "./AruneekaConfirmModal";

interface SocialProfile {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: string;
  avatar?: string;
}

interface SocialProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (profile: SocialProfile) => void;
}

const platforms = [
  { id: 'tiktok', label: 'TikTok', icon: <Music size={16}/> },
  { id: 'instagram', label: 'Instagram', icon: <Camera size={16}/> },
  { id: 'threads', label: 'Threads', icon: <Repeat size={16}/> },
  { id: 'youtube', label: 'YouTube', icon: <Tv size={16}/> },
  { id: 'facebook', label: 'Facebook', icon: <Users size={16}/> },
];

const platformIcons: any = {
  tiktok: <img src="https://cdn.simpleicons.org/tiktok/916DD5" className="w-5 h-5" alt="TikTok" />,
  instagram: <img src="https://cdn.simpleicons.org/instagram/916DD5" className="w-5 h-5" alt="Instagram" />,
  threads: <img src="https://cdn.simpleicons.org/threads/916DD5" className="w-5 h-5" alt="Threads" />,
  youtube: <img src="https://cdn.simpleicons.org/youtube/916DD5" className="w-5 h-5" alt="YouTube" />,
  facebook: <img src="https://cdn.simpleicons.org/facebook/916DD5" className="w-5 h-5" alt="Facebook" />,
};

const SocialProfilesModal: React.FC<SocialProfilesModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ 
    isOpen: false, 
    id: null 
  });

  const [formData, setFormData] = useState({
    name: '',
    platform: 'tiktok',
    handle: '',
    followers: '0'
  });

  useEffect(() => {
    if (isOpen) {
       fetchProfiles();
       setView('list');
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    try {
      const storedUser = localStorage.getItem('aruneeka_user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const workspaceId = parsedUser.workspace_id || parsedUser.parent_user_id || parsedUser.id;
      
      setLoading(true);
      const { data } = await supabase
        .from('v2_agency_social_profiles')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      
      if (data) setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: SocialProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      platform: profile.platform,
      handle: profile.handle.replace('@', ''),
      followers: profile.followers ? profile.followers.replace(/,/g, '') : '0'
    });
    setView('form');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.handle) return;
    
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('aruneeka_user');
      const parsedUser = JSON.parse(storedUser!);
      const workspaceId = parsedUser.workspace_id || parsedUser.parent_user_id || parsedUser.id;

      const payload: any = {
        name: formData.name,
        platform: formData.platform,
        handle: formData.handle.startsWith('@') ? formData.handle : `@${formData.handle}`,
        followers: formData.followers ? parseInt(formData.followers).toLocaleString() : '0',
        workspace_id: workspaceId,
        user_id: parsedUser.id
      };

      if (editingId) {
        await supabase.from('v2_agency_social_profiles').update(payload).eq('id', editingId);
      } else {
        await supabase.from('v2_agency_social_profiles').insert([payload]);
      }
      
      fetchProfiles();
      setView('list');
      setEditingId(null);
      setFormData({ name: '', platform: 'tiktok', handle: '', followers: '0' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    await supabase.from('v2_agency_social_profiles').delete().eq('id', deleteModal.id);
    setDeleteModal({ isOpen: false, id: null });
    fetchProfiles();
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[50px] shadow-2xl overflow-hidden border border-white/20"
          >
             <div className="p-12 space-y-10">
                {/* Header Toggle */}
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                         {view === 'list' ? 'Switch Account' : editingId ? 'Edit Profile' : 'New Profile'}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400">
                         {view === 'list' ? `Active Workspace Hub (${profiles.length})` : 'Register social media identity'}
                      </p>
                   </div>
                   <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
                </div>

                <AnimatePresence mode="wait">
                   {view === 'list' ? (
                      <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                         <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {profiles.map(p => (
                               <div 
                                 key={p.id} 
                                 onClick={() => { if (onSelect) onSelect(p); onClose(); }}
                                 className="group relative p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-amethyst-primary hover:shadow-xl hover:shadow-amethyst-primary/5 transition-all cursor-pointer flex items-center justify-between"
                               >
                                  <div className="flex items-center gap-5">
                                     <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm flex items-center justify-center border border-slate-50">
                                        {platformIcons[p.platform] || <User size={24} className="text-slate-200" />}
                                     </div>
                                     <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-800 tracking-tight">{p.name}</h4>
                                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                           {p.platform} <span className="opacity-20">•</span> {p.handle}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-amethyst-primary border border-slate-50 shadow-sm whitespace-nowrap">
                                        {p.followers} FOLLOWERS
                                     </div>
                                     <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button onClick={(e) => handleEdit(p, e)} className="p-2 text-slate-300 hover:text-amethyst-primary transition-colors"><Settings size={18}/></button>
                                        <button onClick={(e) => handleDelete(p.id, e)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                                     </div>
                                  </div>
                               </div>
                            ))}

                            <button 
                              onClick={() => { setEditingId(null); setFormData({ name: '', platform: 'tiktok', handle: '', followers: '0' }); setView('form'); }}
                              className="w-full p-8 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-300 hover:border-amethyst-primary/30 hover:text-amethyst-primary hover:bg-amethyst-light/5 transition-all flex flex-col items-center gap-3"
                            >
                               <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-50"><Plus size={24}/></div>
                               <span className="text-[11px] font-black">Register new account profile</span>
                            </button>
                         </div>
                      </motion.div>
                   ) : (
                      <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3 pl-1">
                               <label className="text-[10px] font-black text-slate-400">Account identity</label>
                               <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. My Awesome Agency" className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" />
                            </div>
                            <div className="space-y-3 pl-1">
                               <label className="text-[10px] font-black text-slate-400">Target platform</label>
                               <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none cursor-pointer">
                                  {platforms.map(p => (<option key={p.id} value={p.id}>{p.label}</option>))}
                               </select>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3 pl-1">
                               <label className="text-[10px] font-black text-slate-400">Username @handle</label>
                               <input value={formData.handle} onChange={e => setFormData({...formData, handle: e.target.value})} placeholder="@username" className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" />
                            </div>
                            <div className="space-y-3 pl-1">
                               <label className="text-[10px] font-black text-slate-400">Followers saat ini</label>
                               <input type="number" value={formData.followers} onChange={e => setFormData({...formData, followers: e.target.value})} className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none" />
                            </div>
                         </div>
                         <div className="flex gap-4 pt-4">
                            <button onClick={() => setView('list')} className="flex-1 h-18 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-[11px] hover:bg-slate-100 transition-all">Back to list</button>
                            <button onClick={handleSave} disabled={loading} className="flex-[2] h-18 py-5 bg-amethyst-dark text-white rounded-[24px] font-black text-[11px] shadow-2xl shadow-amethyst-dark/20 hover:bg-black transition-all">
                               {loading ? 'Processing...' : editingId ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                            </button>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AruneekaConfirmModal 
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ isOpen: false, id: null })}
      onConfirm={confirmDelete}
      title="Hapus Profil"
      message="Apakah Anda yakin ingin menghapus profil sosial ini?"
      type="danger"
      confirmText="Hapus"
    />
    </>
  );
};

export default SocialProfilesModal;
