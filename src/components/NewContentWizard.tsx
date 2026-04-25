'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar,
  Link as LinkIcon,
  Video,
  FileText,
  User,
  Layout,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface NewContentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  selectedWorkspaceId?: string;
  selectedProfileId?: string;
}

const platformIcons: any = {
  tiktok: <img src="https://cdn.simpleicons.org/tiktok/916DD5" className="w-3 h-3" alt="TikTok" />,
  instagram: <img src="https://cdn.simpleicons.org/instagram/916DD5" className="w-3 h-3" alt="Instagram" />,
  threads: <img src="https://cdn.simpleicons.org/threads/916DD5" className="w-3 h-3" alt="Threads" />,
  youtube: <img src="https://cdn.simpleicons.org/youtube/916DD5" className="w-3 h-3" alt="YouTube" />,
  facebook: <img src="https://cdn.simpleicons.org/facebook/916DD5" className="w-3 h-3" alt="Facebook" />,
};

const NewContentWizard: React.FC<NewContentWizardProps> = ({ isOpen, onClose, onSave, editData, selectedWorkspaceId, selectedProfileId }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  
  const defaultValues = {
    title: '',
    headline: '',
    description: '',
    platform: '',
    content_pillar: '',
    target_account: '',
    status: '',
    due_date: '',
    script_link: '',
    content_link: '',
    post_link: ''
  };

  const [formData, setFormData] = useState(defaultValues);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const selectedAccount = profiles.find(p => p.id === formData.target_account);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    try {
      let workspaceId = selectedWorkspaceId;
      
      if (!workspaceId) {
        const userStr = localStorage.getItem('aruneeka_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        workspaceId = user.workspace_id || user.parent_user_id || user.id;
      }

      const { data } = await supabase
        .from('v2_agency_social_profiles')
        .select('*').eq('workspace_id', workspaceId)
        .order('name');
        
      if (data) {
        setProfiles(data);
      }
    } catch (e) {
      console.error("Failed to fetch profiles in wizard", e);
    }
  };

  useEffect(() => {
    if (editData && isOpen) {
      setFormData({
        ...defaultValues,
        ...editData,
        due_date: editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : defaultValues.due_date
      });
    } else if (!editData && isOpen) {
      // Saat form baru dibuka, cek apakah ada profil yang sedang aktif di Shell
      let initialTarget = '';
      let initialPlatform = '';
      
      if (selectedProfileId && profiles.length > 0) {
        const matchingProfile = profiles.find(p => p.id === selectedProfileId);
        if (matchingProfile) {
          initialTarget = matchingProfile.id;
          initialPlatform = matchingProfile.platform;
        }
      }

      setFormData({
        ...defaultValues,
        target_account: initialTarget,
        platform: initialPlatform
      });
    }
  }, [editData, isOpen, selectedProfileId, profiles]);

  const handleAccountChange = (id: string) => {
    const selected = profiles.find(p => p.id === id);
    setFormData({
      ...formData,
      target_account: id,
      platform: selected?.platform || formData.platform
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[720px] z-[100] p-4"
          >
            <div className="bg-white rounded-[48px] shadow-2xl border border-amethyst-light/20 overflow-hidden flex flex-col p-10">
               <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-[9px] font-bold text-amethyst-primary uppercase tracking-[0.2em] mb-1">Production Workflow</p>
                    <h2 className="text-3xl font-bold text-amethyst-dark tracking-tight">New Content Task</h2>
                  </div>
                  <button onClick={onClose} className="w-10 h-10 bg-amethyst-light/10 hover:bg-amethyst-light/30 rounded-full flex items-center justify-center text-amethyst-primary transition-all">
                    <X size={20}/>
                  </button>
               </div>

               <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 no-scrollbar text-amethyst-dark">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Content Headline</label>
                     <input 
                        value={formData.headline || formData.title || ''}
                        onChange={e => setFormData({...formData, headline: e.target.value, title: e.target.value})}
                        placeholder="E.g. Tips and tricks for Instagram marketing"
                        className="w-full h-14 bg-amethyst-light/10 rounded-2xl px-6 text-xs font-bold text-amethyst-dark border border-transparent focus:border-amethyst-primary/20 transition-all outline-none placeholder:text-slate-200"
                     />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Pillar</label>
                        <input 
                          value={formData.content_pillar || ''}
                          onChange={e => setFormData({...formData, content_pillar: e.target.value})}
                          placeholder="E.g. Educational"
                          className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none focus:border-amethyst-primary/20 transition-all placeholder:text-slate-200"
                        />
                     </div>
                      <div className="space-y-1.5 relative">
                         <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Account</label>
                         <div className="relative">
                            <button 
                              onClick={() => setIsAccountOpen(!isAccountOpen)}
                              className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none flex items-center justify-between hover:bg-amethyst-light/20 transition-all pointer-events-auto"
                            >
                               <div className="flex items-center gap-2">
                                  {selectedAccount ? (
                                    <>
                                      <div className="opacity-60">{platformIcons[selectedAccount.platform?.toLowerCase()] || <User size={12}/>}</div>
                                      <span>{selectedAccount.name}</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-300">Select target account...</span>
                                  )}
                               </div>
                               {isAccountOpen ? <ChevronUp size={12} className="text-slate-300"/> : <ChevronDown size={12} className="text-slate-300"/>}
                            </button>

                            <AnimatePresence>
                               {isAccountOpen && (
                                 <>
                                   <div className="fixed inset-0 z-[110]" onClick={() => setIsAccountOpen(false)}/>
                                   <motion.div 
                                     initial={{ opacity: 0, y: -10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     exit={{ opacity: 0, y: -10 }}
                                     className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-amethyst-light/20 overflow-hidden z-[111] py-1.5"
                                   >
                                      <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                         {profiles.map(p => (
                                           <button
                                             key={p.id}
                                             onClick={() => { handleAccountChange(p.id); setIsAccountOpen(false); }}
                                             className={`w-full px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest flex items-center justify-between transition-all ${formData.target_account === p.id ? 'bg-amethyst-light/30 text-amethyst-dark' : 'text-slate-400 hover:bg-slate-50'}`}
                                           >
                                              <div className="flex items-center gap-3">
                                                 <div className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-50 shadow-sm">
                                                    {platformIcons[p.platform?.toLowerCase()] || <User size={10}/>}
                                                 </div>
                                                 <span className="truncate max-w-[120px]">{p.name}</span>
                                              </div>
                                           </button>
                                         ))}
                                         {profiles.length === 0 && <div className="p-4 text-[10px] text-slate-300 italic text-center">No profiles found</div>}
                                      </div>
                                   </motion.div>
                                 </>
                               )}
                            </AnimatePresence>
                         </div>
                      </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Platform</label>
                         <input 
                           value={formData.platform || ''}
                           readOnly
                           placeholder="Auto-detected from account..."
                           className="w-full h-12 bg-amethyst-light/5 rounded-xl px-4 text-xs font-bold text-slate-300 border border-transparent outline-none select-none italic placeholder:text-slate-200"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Due Date</label>
                        <input 
                          type="date"
                          value={formData.due_date || ''}
                          onChange={e => setFormData({...formData, due_date: e.target.value})}
                          className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Script Link</label>
                        <input 
                          value={formData.script_link || ''}
                          onChange={e => setFormData({...formData, script_link: e.target.value})}
                          placeholder="Docs/Notion link"
                          className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none placeholder:text-slate-200"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">File Link</label>
                        <input 
                          value={formData.content_link || ''}
                          onChange={e => setFormData({...formData, content_link: e.target.value})}
                          placeholder="Drive/Dropbox link"
                          className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none placeholder:text-slate-200"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Live Link</label>
                        <input 
                          value={formData.post_link || ''}
                          onChange={e => setFormData({...formData, post_link: e.target.value})}
                          placeholder="Instagram/TikTok URL"
                          className="w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold text-amethyst-dark border border-transparent outline-none placeholder:text-slate-200"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Status</label>
                        <select 
                          value={formData.status || ''}
                          onChange={e => setFormData({...formData, status: e.target.value})}
                          className={`w-full h-12 bg-amethyst-light/10 rounded-xl px-4 text-xs font-bold ${formData.status ? 'text-amethyst-dark' : 'text-slate-300'} border border-transparent outline-none appearance-none cursor-pointer`}
                        >
                           <option value="" disabled>Select status...</option>
                           <option value="Draft">Draft</option>
                           <option value="In Progress">In Progress</option>
                           <option value="Review">Review</option>
                           <option value="Approved">Approved</option>
                           <option value="Uploaded">Uploaded</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 italic">Content Description</label>
                     <textarea 
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        rows={4}
                        placeholder="Detailed brief for the content creator..."
                        className="w-full bg-amethyst-light/10 rounded-2xl p-6 text-xs font-bold text-amethyst-dark border border-transparent focus:border-amethyst-primary/20 transition-all outline-none resize-none placeholder:text-slate-200"
                     />
                  </div>
               </div>

               <motion.button 
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleSave}
                  className="mt-10 w-full h-16 bg-amethyst-dark text-white rounded-3xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:bg-amethyst-primary transition-all"
               >
                  Create Content Task
               </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewContentWizard;
