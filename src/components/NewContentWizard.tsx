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
  const [activeTab, setActiveTab] = useState<'ideation' | 'production'>('ideation');

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-xl" 
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl z-[9999] p-4"
          >
            <div className="relative bg-white shadow-2xl overflow-hidden flex flex-col h-[72vh] md:h-auto w-full md:max-w-4xl rounded-[32px] md:rounded-[44px] md:max-h-[92vh] border border-white/20">
              
              {/* ── MOBILE TAB SWITCHER ── */}
              <div className="md:hidden flex items-center justify-between px-6 pt-5 pb-3 bg-white z-[30] border-b border-slate-50">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full mr-4">
                  <button 
                    onClick={() => setActiveTab('ideation')}
                    className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'ideation' ? 'bg-white shadow-xl shadow-amethyst-primary/10 text-amethyst-dark' : 'text-slate-400'}`}
                  >
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Ideation</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('production')}
                    className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'production' ? 'bg-white shadow-xl shadow-amethyst-primary/10 text-amethyst-dark' : 'text-slate-400'}`}
                  >
                    <ClipboardCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Production</span>
                  </button>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><X size={20}/></button>
              </div>

              {/* ── DESKTOP HEADER ── */}
              <div className="hidden md:flex p-10 border-b border-slate-50 items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editData ? 'Edit Content Project' : 'New Strategic Content'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Phase: Pre-Production & Ideation</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"><X size={24}/></button>
              </div>

              {/* ── SCROLLABLE BODY ── */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-32 md:pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  
                  {/* TAB 1: IDEATION (Always show on Desktop, Conditional on Mobile) */}
                  <div className={`space-y-8 ${activeTab === 'ideation' ? 'block' : 'hidden md:block'}`}>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Headline (Hook)</label>
                      <input 
                        autoFocus 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value, headline: e.target.value})} 
                        placeholder="Grab attention in 3 seconds..." 
                        className="w-full h-18 md:h-20 bg-slate-50 border-none rounded-2xl px-6 text-sm md:text-base font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Account</label>
                        <div className="relative">
                          <button onClick={() => setIsAccountOpen(!isAccountOpen)} className="w-full h-16 md:h-18 bg-slate-50 rounded-2xl px-4 md:px-6 flex items-center justify-between text-[11px] md:text-sm font-black group text-left">
                            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                              {selectedAccount ? platformIcons[selectedAccount.platform?.toLowerCase()] : <User size={14}/>}
                              <span className={`truncate ${selectedAccount ? 'text-slate-800' : 'text-slate-300'}`}>{selectedAccount ? selectedAccount.name : 'Select Profile'}</span>
                            </div>
                            <ChevronDown size={14} className={`text-slate-300 transition-transform flex-shrink-0 ${isAccountOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {isAccountOpen && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 top-18 md:top-20 left-0 w-full bg-white rounded-3xl shadow-2xl border border-slate-50 p-3 max-h-60 overflow-y-auto">
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
                          <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full h-16 md:h-18 bg-slate-50 border-none rounded-2xl px-4 md:px-6 text-[11px] md:text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all text-slate-800" />
                          <Calendar size={14} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Content Pillar</label>
                        <input 
                          type="text" 
                          value={formData.content_pillar} 
                          onChange={e => setFormData({...formData, content_pillar: e.target.value})} 
                          placeholder="Strategi..." 
                          className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all" 
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status / Phase</label>
                        <div className="relative">
                          <select 
                            value={formData.status} 
                            onChange={e => setFormData({...formData, status: e.target.value})}
                            className="w-full h-16 bg-slate-50 rounded-2xl px-6 text-sm font-black outline-none appearance-none cursor-pointer"
                          >
                            {['Draft', 'In Progress', 'Review', 'Approved', 'Uploaded'].map((s: string) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Concept Brief</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the visual flow..." className="w-full h-32 md:h-40 bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/5 transition-all resize-none" />
                    </div>
                  </div>

                  {/* TAB 2: PRODUCTION (Always show on Desktop, Conditional on Mobile) */}
                  <div className={`space-y-8 ${activeTab === 'production' ? 'block' : 'hidden md:block'}`}>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Content Format</label>
                      {isFormatCustom || currentFormats.length === 0 ? (
                        <div className="relative group">
                          <input 
                            value={formData.content_format} 
                            onChange={e => setFormData({...formData, content_format: e.target.value})} 
                            placeholder="Custom format..." 
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
                        <div className="relative">
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

              {/* ── STICKY FOOTER ── */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-white/95 backdrop-blur-xl border-t border-slate-50 flex items-center justify-between z-[40]">
                <div className="hidden md:flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amethyst-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Ready for review</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Workspace ID: {selectedWorkspaceId || 'Active'}</div>
                </div>
                
                <div className="flex gap-3 md:gap-4 w-full md:w-auto">
                  <button onClick={onClose} className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-5 bg-slate-50 text-slate-400 rounded-2xl md:rounded-[28px] font-black text-[10px] md:text-[11px] uppercase tracking-widest leading-none">Cancel</button>
                  <button onClick={() => onSave(formData)} className="flex-[2] md:flex-none px-8 md:px-12 py-4 md:py-5 bg-amethyst-dark text-white rounded-2xl md:rounded-[28px] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-2xl shadow-amethyst-dark/20 hover:bg-black transition-all leading-none">
                    {editData ? 'Update Content' : 'Launch Project'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewContentWizard;
