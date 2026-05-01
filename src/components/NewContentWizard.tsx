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
  ChevronUp,
  Target,
  Sparkles,
  ClipboardCheck
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
  
  const platformFormats: any = {
    instagram: ['Carousel', 'Single Feeds', 'Reels', 'Story', 'Instagram Ads'],
    tiktok: ['Carousel', 'Tiktok Video', 'Tiktok Ads', 'Story'],
    threads: ['Long Threads', 'Single Threads'],
    linkedin: ['Linkedin Post', 'Linkedin Carousel'],
  };

  const defaultValues = {
    title: '',
    headline: '',
    description: '',
    platform: '',
    content_format: '',
    content_pillar: 'Education',
    target_account: '',
    status: 'Draft',
    due_date: '',
    script_link: '',
    content_link: '',
    post_link: ''
  };

  const [formData, setFormData] = useState(defaultValues);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isFormatCustom, setIsFormatCustom] = useState(false);

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
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editData && isOpen) {
      const platform = editData.platform?.toLowerCase() || '';
      const formats = platformFormats[platform] || [];
      const isCustom = editData.content_format && !formats.includes(editData.content_format);
      
      setIsFormatCustom(isCustom);
      setFormData({
        ...defaultValues,
        ...editData,
        title: editData.title || '',
        headline: editData.headline || editData.title || '',
        description: editData.description || '',
        content_format: editData.content_format || '',
        script_link: editData.script_link || '',
        content_link: editData.content_link || '',
        post_link: editData.post_link || '',
        due_date: editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : defaultValues.due_date
      });
    } else if (!editData && isOpen) {
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
        platform: initialPlatform,
        content_format: ''
      });
      setIsFormatCustom(false);
    }
  }, [editData, isOpen, selectedProfileId, profiles]);

  const handleAccountChange = (id: string) => {
    const selected = profiles.find(p => p.id === id);
    const newPlatform = selected?.platform?.toLowerCase() || '';
    setFormData({
      ...formData,
      target_account: id,
      platform: newPlatform,
      content_format: '' // Reset format when platform changes
    });
    setIsFormatCustom(false);
    setIsAccountOpen(false);
  };

  const selectedAccount = profiles.find(p => p.id === formData.target_account);
  const currentFormats = formData.platform ? (platformFormats[formData.platform.toLowerCase()] || []) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editData ? 'Edit Content Project' : 'New Strategic Content'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Phase: Pre-Production & Ideation</p>
           </div>
           <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
           <div className="grid grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Headline (Hook)</label>
                    <input 
                      autoFocus 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value, headline: e.target.value})} 
                      placeholder="Grab attention in 3 seconds..." 
                      className="w-full h-20 bg-slate-50 border-none rounded-2xl px-6 text-base font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Content Pillar</label>
                        <input 
                          type="text" 
                          value={formData.content_pillar} 
                          onChange={e => setFormData({...formData, content_pillar: e.target.value})} 
                          placeholder="Strategi Konten..." 
                          className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" 
                        />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status / Phase</label>
                       <select 
                         value={formData.status} 
                         onChange={e => setFormData({...formData, status: e.target.value})}
                         className="w-full h-16 bg-slate-50 rounded-2xl px-6 text-sm font-black outline-none appearance-none cursor-pointer"
                       >
                          {['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded'].map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Concept Brief / Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the visual flow and purpose of this content..." className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all resize-none" />
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Account</label>
                       <div className="relative">
                          <button onClick={() => setIsAccountOpen(!isAccountOpen)} className="w-full h-18 bg-slate-50 rounded-2xl px-6 flex items-center justify-between text-sm font-black group text-left">
                             <div className="flex items-center gap-3">
                                {selectedAccount ? platformIcons[selectedAccount.platform?.toLowerCase()] : <User size={14}/>}
                                <span className={selectedAccount ? 'text-slate-800' : 'text-slate-300'}>{selectedAccount ? selectedAccount.name : 'Select Profile'}</span>
                             </div>
                             <ChevronDown size={14} className={`text-slate-300 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                             {isAccountOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 top-20 left-0 w-full bg-white rounded-3xl shadow-2xl border border-slate-50 p-3 max-h-60 overflow-y-auto">
                                   {profiles.map((p: any) => (
                                      <button key={p.id} onClick={() => handleAccountChange(p.id)} className="w-full p-4 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-all text-left">
                                         <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">{platformIcons[p.platform?.toLowerCase()]}</div>
                                         <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800 leading-none">{p.name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-1">{p.platform}</span>
                                         </div>
                                      </button>
                                   ))}
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Execution Date</label>
                       <div className="relative">
                          <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full h-18 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all text-slate-800" />
                          <Calendar size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3 col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Content Format</label>
                          <div className="flex gap-4">
                             {isFormatCustom || currentFormats.length === 0 ? (
                                <div className="flex-1 relative group">
                                   <input 
                                     value={formData.content_format} 
                                     onChange={e => setFormData({...formData, content_format: e.target.value})} 
                                     placeholder="Custom format (e.g. Webinar, Blog...)" 
                                     className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-xs font-bold outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" 
                                   />
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm border border-slate-50 text-amethyst-primary"><Layers size={14}/></div>
                                   {currentFormats.length > 0 && (
                                      <button 
                                         onClick={() => { setIsFormatCustom(false); setFormData({...formData, content_format: ''}); }}
                                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-amethyst-primary uppercase tracking-widest hover:underline"
                                      >
                                         Use Preset
                                      </button>
                                   )}
                                </div>
                             ) : (
                                <div className="flex-1 relative">
                                   <select 
                                     value={formData.content_format} 
                                     onChange={e => {
                                        if (e.target.value === 'custom') {
                                           setIsFormatCustom(true);
                                           setFormData({...formData, content_format: ''});
                                        } else {
                                           setFormData({...formData, content_format: e.target.value});
                                        }
                                     }}
                                     className="w-full h-16 bg-slate-50 rounded-2xl pl-14 pr-12 text-sm font-black outline-none appearance-none cursor-pointer"
                                   >
                                      <option value="">Select Format</option>
                                      {currentFormats.map((f: string) => (
                                        <option key={f} value={f}>{f}</option>
                                      ))}
                                      <option value="custom">+ Lainnya (Custom)</option>
                                   </select>
                                   <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm border border-slate-50 text-amethyst-primary"><Layers size={14}/></div>
                                   <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {[{ id: 'script_link', label: 'Script Link', icon: <FileText size={14}/>, color: 'text-amber-500' },
                      { id: 'content_link', label: 'Production Link (RAW)', icon: <Video size={14}/>, color: 'text-blue-500' },
                      { id: 'post_link', label: 'Final URL (IG/TT)', icon: <LinkIcon size={14}/>, color: 'text-rose-500' }
                    ].map((field: any) => (
                       <div key={field.id} className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{field.label}</label>
                          <div className="relative group">
                             <input value={(formData as any)[field.id]} onChange={e => setFormData({...formData, [field.id]: e.target.value})} placeholder="https://..." className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-xs font-bold outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" />
                             <div className={`absolute left-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm border border-slate-50 ${field.color}`}>{field.icon}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-10 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amethyst-primary animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Ready for review</span>
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden md:block">Active Brand: {selectedWorkspaceId || 'Selected'}</div>
           </div>
           
           <div className="flex gap-4">
              <button onClick={onClose} className="px-10 py-5 bg-white text-slate-400 rounded-[28px] font-black text-[11px] hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={() => onSave(formData)} className="px-12 py-5 bg-amethyst-dark text-white rounded-[28px] font-black text-[11px] shadow-2xl shadow-amethyst-dark/20 hover:bg-black transition-all">
                {editData ? 'Update Strategic Content' : 'Launch New Content'}
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewContentWizard;
