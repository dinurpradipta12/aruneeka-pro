'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  User, 
  Search, 
  ChevronRight, 
  X, 
  BookOpen, 
  Flame, 
  TrendingUp, 
  Loader2, 
  Edit3,
  CheckCircle2,
  Bookmark,
  Layers,
  RefreshCw,
  Key,
  Wand2,
  Send,
  AlertCircle,
  Eye,
  EyeOff,
  Bot,
  LayoutGrid,
  List,
  Star,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

const platforms = [
  { id: 'tiktok', label: 'TikTok', color: '#fe2c55', icon: 'https://cdn.simpleicons.org/tiktok/FE2C55' },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', icon: 'https://cdn.simpleicons.org/instagram/E1306C' },
  { id: 'threads', label: 'Threads', color: '#000000', icon: 'https://cdn.simpleicons.org/threads/000000' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', icon: 'https://cdn.simpleicons.org/youtube/FF0000' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', icon: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
];

const pillars = ['Edukasi', 'Hiburan', 'Promosi', 'Tren', 'Behind The Scenes', 'Tips & Trik'];

const viralFormulas = [
  {
    title: '3 Kesalahan Fatal',
    platform: 'tiktok',
    pillar: 'Edukasi',
    headline: '3 Kesalahan Fatal dalam [Topik] yang Bikin Kamu Rugi Waktu!',
    description: 'Bongkar kesalahan umum yang sering dilewatkan audiens dan berikan solusi instan di akhir video. Hook kuat di 3 detik pertama.',
  },
  {
    title: 'Cara Termudah Meraih Hasil',
    platform: 'instagram',
    pillar: 'Tips & Trik',
    headline: 'Cara termudah untuk [Hasil Impian] tanpa harus [Kesulitan Utama]!',
    description: 'Strategi praktis step-by-step dalam bentuk korsel atau reels pendek. Tunjukkan bukti nyata/metrik di slide awal.',
  },
  {
    title: 'Mengapa Saya Berhenti Melakukan X',
    platform: 'threads',
    pillar: 'Behind The Scenes',
    headline: 'Mengapa saya berhenti [Kebiasaan Lama] untuk fokus pada [Kebiasaan Baru]...',
    description: 'Teks personal, otentik, dan reflektif yang mengundang diskusi dan opini dari para profesional di jejaring sosial.',
  },
  {
    title: 'Rahasia Sukses Agensi',
    platform: 'linkedin',
    pillar: 'Promosi',
    headline: 'Bagaimana kami membantu Klien A menaikkan [Metrik] sebesar X% dalam 30 hari.',
    description: 'Studi kasus transparan mengenai taktik, proses eksekusi agensi, dan pembelajaran berharga yang bisa diduplikasi audiens.',
  },
];

export default function AruneekaIdeaBox({ 
  selectedWorkspaceId: propWorkspaceId, 
  user: propUser,
  isPublic = false 
}: { 
  selectedWorkspaceId?: string; 
  user?: any;
  isPublic?: boolean;
} = {}) {
  let wsContext: any = null;
  try {
    wsContext = useWorkspace();
  } catch (e) {}

  const workspaceId = propWorkspaceId || wsContext?.selectedWorkspaceId;
  const user = propUser || wsContext?.user;
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedPillar, setSelectedPillar] = useState('all');
  
  // Quick Note State
  const [quickTitle, setQuickTitle] = useState('');
  
  // Add Idea Modal / Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    platform: 'TikTok',
    content_pillar: 'Edukasi',
    content_format: 'Video',
  });

  // Promote Idea Modal State
  const [promotingIdea, setPromotingIdea] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    authorName: user?.full_name || 'Team Member',
  });

  // AI Suggestion Drawer/Modal State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMode, setAiMode] = useState<'static' | 'ai'>('static');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiError, setAiError] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [aiForm, setAiForm] = useState({
    platform: 'TikTok',
    pillar: 'Edukasi',
    topic: '',
    agencyContext: '',
  });
  const [displayedFormulas, setDisplayedFormulas] = useState(viralFormulas);

  // Detail Modal State
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('aruneeka_gemini_key');
    if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);
    const savedOpenaiKey = localStorage.getItem('aruneeka_openai_key');
    if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
    const savedProvider = localStorage.getItem('aruneeka_ai_provider');
    if (savedProvider === 'openai' || savedProvider === 'gemini') {
      setAiProvider(savedProvider);
    }
    const savedLayout = localStorage.getItem('aruneeka_idea_layout');
    if (savedLayout === 'grid' || savedLayout === 'list') {
      setLayout(savedLayout);
    }
  }, []);

  // Fetch Ideas
  const fetchIdeas = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v2_agency_content_plans')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'Idea')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (e) {
      console.error('Error fetching ideas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();

    // Realtime Listener
    if (workspaceId) {
      const channel = supabase.channel(`ideas-realtime-${workspaceId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'v2_agency_content_plans', 
          filter: `workspace_id=eq.${workspaceId}` 
        }, () => {
          fetchIdeas();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [workspaceId]);

  // Insert Quick Raw Idea
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .insert({
          workspace_id: workspaceId,
          user_id: user?.id,
          author_name: user?.full_name || 'Owner',
          title: quickTitle.trim(),
          status: 'Idea',
          platform: 'TikTok',
          content_pillar: 'Edukasi',
          description: 'Coretan ide mentah cepat dari Jot Down panel.',
        });

      if (error) throw error;
      setQuickTitle('');
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  // Insert Custom Full Idea
  const handleAddIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.title.trim() || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .insert({
          workspace_id: workspaceId,
          user_id: user?.id,
          author_name: user?.full_name || 'Owner',
          title: newIdea.title.trim(),
          description: newIdea.description || null,
          platform: newIdea.platform,
          content_pillar: newIdea.content_pillar,
          content_format: newIdea.content_format,
          status: 'Idea',
        });

      if (error) throw error;
      setIsAddOpen(false);
      setNewIdea({
        title: '',
        description: '',
        platform: 'TikTok',
        content_pillar: 'Edukasi',
        content_format: 'Video',
      });
      fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Idea
  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setIdeas(prev => prev.filter(item => item.id !== id));
      if (selectedIdea?.id === id) setSelectedIdea(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Promote Idea to active Content Plan
  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingIdea || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .update({
          status: scheduleData.status,
          due_date: new Date(scheduleData.dueDate).toISOString(),
          author_name: scheduleData.authorName,
        })
        .eq('id', promotingIdea.id);

      if (error) throw error;
      
      // Remove from local list instantly
      setIdeas(prev => prev.filter(i => i.id !== promotingIdea.id));
      setPromotingIdea(null);
      
      // Trigger update event for dashboard / content plan
      window.dispatchEvent(new Event('aruneeka_refresh_content'));
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Client Pick (mark idea as liked/picked by client)
  const handleToggleClientPick = async (ideaId: string, currentMetrics: any) => {
    try {
      const updatedMetrics = { 
        ...(currentMetrics || {}), 
        client_picked: !(currentMetrics?.client_picked) 
      };
      
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .update({ metrics: updatedMetrics })
        .eq('id', ideaId);

      if (error) throw error;

      // Update local state for immediate visual feedback
      setIdeas(prev => prev.map(item => {
        if (item.id === ideaId) {
          return { ...item, metrics: updatedMetrics };
        }
        return item;
      }));
    } catch (err) {
      console.error('Error toggling client pick:', err);
    }
  };

  // AI Idea Selection (apply static formula)
  const applyFormula = (formula: any) => {
    setIsGenerating(true);
    setTimeout(() => {
      setNewIdea({
        title: formula.headline,
        description: formula.description,
        platform: (formula.platform.charAt(0).toUpperCase() + formula.platform.slice(1)),
        content_pillar: formula.pillar,
        content_format: 'Video',
      });
      setIsGenerating(false);
      setIsAiOpen(false);
      setIsAddOpen(true);
    }, 800);
  };

  // Shuffle static formulas (randomize display order)
  const handleShuffle = () => {
    setDisplayedFormulas(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  // Call AI (Gemini or OpenAI) to generate ideas
  const handleAiGenerate = async () => {
    const currentApiKey = aiProvider === 'openai' ? openaiApiKey : geminiApiKey;
    if (!currentApiKey.trim()) {
      setAiError(`Masukkan API Key ${aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} Anda terlebih dahulu.`);
      return;
    }
    setAiError('');
    setIsGenerating(true);
    setGeneratedIdeas([]);
    
    // Save to localStorage
    if (aiProvider === 'openai') {
      localStorage.setItem('aruneeka_openai_key', openaiApiKey.trim());
    } else {
      localStorage.setItem('aruneeka_gemini_key', geminiApiKey.trim());
    }
    localStorage.setItem('aruneeka_ai_provider', aiProvider);

    try {
      const res = await fetch('/api/ai-idea/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: currentApiKey.trim(),
          platform: aiForm.platform,
          pillar: aiForm.pillar,
          topic: aiForm.topic,
          agencyContext: aiForm.agencyContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal generate ide.');
      setGeneratedIdeas(data.ideas || []);
    } catch (err: any) {
      setAiError(err.message || 'Gagal menghubungi AI. Cek API Key dan koneksi internet Anda.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter & Sort Ideas (Client Picked first, then newest first)
  const filteredIdeas = ideas
    .filter(item => {
      const searchMatch = item.title?.toLowerCase().includes(search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(search.toLowerCase());
      const platformMatch = selectedPlatform === 'all' || item.platform?.toLowerCase() === selectedPlatform.toLowerCase();
      const pillarMatch = selectedPillar === 'all' || item.content_pillar?.toLowerCase() === selectedPillar.toLowerCase();

      return searchMatch && platformMatch && pillarMatch;
    })
    .sort((a, b) => {
      const aPicked = a.metrics?.client_picked ? 1 : 0;
      const bPicked = b.metrics?.client_picked ? 1 : 0;
      if (aPicked !== bPicked) {
        return bPicked - aPicked; // 1 (picked) goes before 0 (not picked)
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-light/20 text-amethyst-primary rounded-full">
            <Lightbulb size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">Brainstorming Lab</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-amethyst-dark tracking-tight">Idea Box</h2>
          <p className="text-sm text-slate-400 font-medium italic">Tampung inspirasi liar agensi Anda, lalu konversikan langsung ke lini produksi konten.</p>
        </div>

        {!isPublic && (
          <div className="flex items-center gap-3">
            {/* AI suggestion sparkles button */}
            <button 
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 via-amethyst-primary to-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all group"
            >
              <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
              AI Suggest Ideas
            </button>
            
            <button 
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-amethyst-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-black shadow-xl shadow-amethyst-dark/20 transition-all"
            >
              <Plus size={16} />
              Add Idea
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN GRID LAYOUT ── */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* LEFT COLUMN: FILTERS & CARD GRID */}
        <div className="flex-1 space-y-6">
          
          {/* Search & Filter Toolbar */}
          <div className="bg-white/70 backdrop-blur-md p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-300 pointer-events-none">
                <Search size={16} />
              </span>
              <input 
                type="text"
                placeholder="Cari ide konten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 border-none rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-amethyst-dark outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Platform Filter dropdown */}
              <div className="flex items-center bg-slate-50 rounded-xl p-1">
                <button 
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedPlatform === 'all' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                >
                  All
                </button>
                {platforms.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedPlatform === p.id ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Pillar Filter select */}
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none focus:ring-2 ring-amethyst-light/30"
              >
                <option value="all">Pilar: Semua</option>
                {pillars.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* Layout Switcher */}
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100/50">
                <button
                  onClick={() => {
                    setLayout('grid');
                    localStorage.setItem('aruneeka_idea_layout', 'grid');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${layout === 'grid' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => {
                    setLayout('list');
                    localStorage.setItem('aruneeka_idea_layout', 'list');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${layout === 'list' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid / List View */}
          {loading ? (
            layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 bg-slate-100 rounded-[32px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            )
          ) : filteredIdeas.length > 0 ? (
            layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredIdeas.map((idea, idx) => {
                  const plt = idea.platform?.toLowerCase() || 'tiktok';
                  const matchedPlatform = platforms.find(p => p.id === plt) || platforms[0];
                  
                  return (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-white/95 rounded-[32px] p-6 flex flex-col justify-between hover:shadow-2xl hover:translate-y-[-4px] active:translate-y-[0px] transition-all relative overflow-hidden group min-h-[190px] border ${
                        idea.metrics?.client_picked 
                          ? 'border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.06)] bg-gradient-to-br from-amber-50/5 to-white' 
                          : 'border-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)]'
                      }`}
                    >
                      {/* Glowing platform boundary top indicator */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300"
                        style={{ backgroundColor: matchedPlatform.color }}
                      />

                      <div className="space-y-4">
                        {/* Top bar info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center p-0.5 border border-slate-100">
                              <img src={matchedPlatform.icon} alt={idea.platform} className="w-4 h-4 object-contain" />
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{idea.platform}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {idea.metrics?.client_picked && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                <Star size={8} className="fill-amber-500" />
                                Klien Memilih
                              </span>
                            )}
                            {idea.content_pillar && (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                                {idea.content_pillar}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Headline / Title */}
                        <div className="space-y-1">
                          <h4 
                            onClick={() => setSelectedIdea(idea)}
                            className="text-base font-black text-amethyst-dark tracking-tight leading-tight hover:text-amethyst-primary cursor-pointer line-clamp-2"
                          >
                            {idea.title}
                          </h4>
                          {idea.description && (
                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                              {idea.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Toolbar & Promote Action */}
                      {!isPublic ? (
                        <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setPromotingIdea(idea);
                                setScheduleData(prev => ({ ...prev, authorName: user?.full_name || 'Team Member' }));
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amethyst-light/30 hover:bg-amethyst-primary hover:text-white text-amethyst-primary rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all"
                            >
                              <Calendar size={10} />
                              Plan Content
                            </button>

                            <button 
                              onClick={() => handleToggleClientPick(idea.id, idea.metrics)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                idea.metrics?.client_picked 
                                  ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' 
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                              title={idea.metrics?.client_picked ? "Hapus Tanda Klien" : "Tandai Pilihan Klien"}
                            >
                              <Star size={12} className={idea.metrics?.client_picked ? 'fill-amber-500' : ''} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setNewIdea({
                                  title: idea.title,
                                  description: idea.description || '',
                                  platform: idea.platform || 'TikTok',
                                  content_pillar: idea.content_pillar || 'Edukasi',
                                  content_format: idea.content_format || 'Video',
                                });
                                handleDeleteIdea(idea.id);
                                setIsAddOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all"
                              title="Edit Idea"
                            >
                              <Edit3 size={12} />
                            </button>

                            <button 
                              onClick={() => handleDeleteIdea(idea.id)}
                              className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4">
                          <button 
                            onClick={() => handleToggleClientPick(idea.id, idea.metrics)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                              idea.metrics?.client_picked 
                                ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 hover:bg-amber-600'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <Star size={10} className={idea.metrics?.client_picked ? 'fill-white' : ''} />
                            {idea.metrics?.client_picked ? 'Pilihan Kami (Ditandai)' : 'Pilih Ide Ini'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIdeas.map((idea, idx) => {
                  const plt = idea.platform?.toLowerCase() || 'tiktok';
                  const matchedPlatform = platforms.find(p => p.id === plt) || platforms[0];

                  return (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`bg-white/95 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all relative overflow-hidden group pl-7 border ${
                        idea.metrics?.client_picked 
                          ? 'border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.04)] bg-gradient-to-r from-amber-50/5 to-white' 
                          : 'border-slate-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Left border indicator */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                        style={{ backgroundColor: matchedPlatform.color }}
                      />
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100/50">
                            <img src={matchedPlatform.icon} alt={idea.platform} className="w-3.5 h-3.5 object-contain" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{idea.platform}</span>
                          </div>
                          {idea.metrics?.client_picked && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider animate-pulse">
                              <Star size={8} className="fill-amber-500" />
                              Klien Memilih
                            </span>
                          )}
                          {idea.content_pillar && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                              {idea.content_pillar}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <h4 
                            onClick={() => setSelectedIdea(idea)}
                            className="text-sm font-black text-amethyst-dark tracking-tight leading-snug hover:text-amethyst-primary cursor-pointer truncate"
                          >
                            {idea.title}
                          </h4>
                          {idea.description && (
                            <p className="text-xs text-slate-400 font-medium line-clamp-1 leading-relaxed">
                              {idea.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isPublic ? (
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                          <button 
                            onClick={() => {
                              setPromotingIdea(idea);
                              setScheduleData(prev => ({ ...prev, authorName: user?.full_name || 'Team Member' }));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amethyst-light/30 hover:bg-amethyst-primary hover:text-white text-amethyst-primary rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all"
                          >
                            <Calendar size={10} />
                            Plan Content
                          </button>

                          <button 
                            onClick={() => handleToggleClientPick(idea.id, idea.metrics)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              idea.metrics?.client_picked 
                                ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                            title={idea.metrics?.client_picked ? "Hapus Tanda Klien" : "Tandai Pilihan Klien"}
                          >
                            <Star size={12} className={idea.metrics?.client_picked ? 'fill-amber-500' : ''} />
                          </button>

                          <button 
                            onClick={() => {
                              setNewIdea({
                                title: idea.title,
                                description: idea.description || '',
                                platform: idea.platform || 'TikTok',
                                content_pillar: idea.content_pillar || 'Edukasi',
                                content_format: idea.content_format || 'Video',
                              });
                              handleDeleteIdea(idea.id);
                              setIsAddOpen(true);
                            }}
                            className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all"
                            title="Edit Idea"
                          >
                            <Edit3 size={12} />
                          </button>

                          <button 
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                          <button 
                            onClick={() => handleToggleClientPick(idea.id, idea.metrics)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                              idea.metrics?.client_picked 
                                ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 hover:bg-amber-600'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <Star size={10} className={idea.metrics?.client_picked ? 'fill-white' : ''} />
                            {idea.metrics?.client_picked ? 'Pilihan Kami (Ditandai)' : 'Pilih Ide Ini'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[48px] border border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Lightbulb size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Kotak Ide Kosong</p>
                <p className="text-xs text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">Belum ada ide yang dicatat. Ketik ide cepat di panel samping atau gunakan AI Generator!</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUICK JOT DOWN (STICKY NOTES PANEL) */}
        {!isPublic && (
          <div className="w-full xl:w-80 shrink-0">
            <div className="bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white/20 shadow-xl space-y-6 sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark size={16} className="text-amethyst-primary" />
                  <h4 className="text-[11px] font-black text-amethyst-dark uppercase tracking-widest">Jot Down (Coretan Cepat)</h4>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div className="space-y-2">
                  <textarea
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Ketik ide konten cepat di sini... (tekan Enter untuk menyimpan)"
                    className="w-full h-32 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amethyst-primary focus:ring-2 ring-amethyst-light/10 transition-all resize-none styled-scrollbar"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleQuickAdd(e);
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="w-full py-3 bg-amethyst-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/20 hover:bg-amethyst-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus size={12} />
                  Simpan Ide Cepat
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Tips Brainstorming</span>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Gunakan panel Jot Down ini untuk mencatat ide kilat di rapat atau saat inspirasi melintas. Ide akan disimpan sebagai draf TikTok berstatus 'Idea'.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: CUSTOM ADD IDEA ── */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-800">Catat Ide Konten Baru</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Ide Konten Agensi</p>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddIdeaSubmit} className="p-8 space-y-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul / Hook Ide</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: 3 Kesalahan Mengelola Instagram Agensi..."
                    value={newIdea.title}
                    onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi Ide / Konsep</label>
                  <textarea
                    placeholder="Tuliskan detail konsep konten, referensi visual, outline, atau poin pembahasan utama..."
                    value={newIdea.description}
                    onChange={(e) => setNewIdea({...newIdea, description: e.target.value})}
                    className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 ring-amethyst-light/30 transition-all resize-none styled-scrollbar"
                  />
                </div>

                {/* Grid controls */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Platform */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Platform Sosial</label>
                    <select
                      value={newIdea.platform}
                      onChange={(e) => setNewIdea({...newIdea, platform: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                    >
                      {platforms.map(p => (
                        <option key={p.id} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Content Pillar */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilar Konten</label>
                    <select
                      value={newIdea.content_pillar}
                      onChange={(e) => setNewIdea({...newIdea, content_pillar: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                    >
                      {pillars.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3.5 bg-amethyst-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/30 hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    Simpan ke Kotak Ide
                    <CheckCircle2 size={14} />
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: PROMOTE TO CONTENT PLAN ── */}
      <AnimatePresence>
        {promotingIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-800">Plan Content</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jadwalkan Ide Konten Anda</p>
                </div>
                <button 
                  onClick={() => setPromotingIdea(null)}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePromoteSubmit} className="p-8 space-y-6">
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amethyst-light/30 text-amethyst-primary text-[8px] font-black uppercase tracking-widest">{promotingIdea.platform}</span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{promotingIdea.content_pillar}</span>
                  </div>
                  <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-tight line-clamp-2">
                    {promotingIdea.title}
                  </h4>
                </div>

                {/* Due Date picker */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tanggal Rencana Posting</label>
                  <input
                    required
                    type="date"
                    value={scheduleData.dueDate}
                    onChange={(e) => setScheduleData({...scheduleData, dueDate: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                  />
                </div>

                {/* Initial Phase */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tahap Produksi Konten</label>
                  <select
                    value={scheduleData.status}
                    onChange={(e) => setScheduleData({...scheduleData, status: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
                    <option value="Review">Review (Perlu Persetujuan)</option>
                  </select>
                </div>

                {/* Author PIC name */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Penanggung Jawab (PIC)</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama PIC Konten"
                    value={scheduleData.authorName}
                    onChange={(e) => setScheduleData({...scheduleData, authorName: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => setPromotingIdea(null)}
                    className="flex-1 py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3.5 bg-amethyst-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    Promosikan Ide
                    <CheckCircle2 size={14} />
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DRAWER/MODAL: AI IDEAS SUGGESTION ── */}
      <AnimatePresence>
        {isAiOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between"
            >
              
              {/* Header */}
              <div className="p-8 border-b border-slate-50 flex flex-col gap-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-amethyst-primary">
                      <Sparkles size={16} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Formula Viral Generator</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800">AI Prompt Suggestions</h3>
                  </div>
                  <button 
                    onClick={() => setIsAiOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100/50">
                  <button
                    onClick={() => setAiMode('static')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      aiMode === 'static' 
                        ? 'bg-white text-amethyst-primary shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Layers size={12} />
                    Static Formulas
                  </button>
                  <button
                    onClick={() => setAiMode('ai')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      aiMode === 'ai' 
                        ? 'bg-white text-amethyst-primary shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Bot size={12} />
                    Gemini Live AI
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 styled-scrollbar">
                
                {/* ── STATIC FORMULA MODE ── */}
                {aiMode === 'static' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daftar Formula Terbukti Viral</span>
                      <button
                        onClick={handleShuffle}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold text-[9px] uppercase tracking-wider border border-slate-100/80 transition-all"
                      >
                        <RefreshCw size={10} />
                        Shuffle Formulas
                      </button>
                    </div>

                    {displayedFormulas.map((f, index) => {
                      const matchedPlatform = platforms.find(p => p.id === f.platform) || platforms[0];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-50/50 hover:bg-white rounded-3xl border border-slate-100 hover:border-amethyst-light/30 p-6 space-y-4 transition-all shadow-sm hover:shadow-xl group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center p-0.5 border border-slate-100">
                                <img src={matchedPlatform.icon} alt={f.platform} className="w-3.5 h-3.5 object-contain" />
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{f.platform}</span>
                            </div>
                            
                            <span className="px-2 py-0.5 rounded bg-white text-[7px] font-black uppercase text-slate-400 tracking-wider">
                              {f.pillar}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-tight line-clamp-2">
                              {f.headline}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                              {f.description}
                            </p>
                          </div>

                          <button
                            onClick={() => applyFormula(f)}
                            className="flex items-center gap-2 text-amethyst-primary hover:text-black text-[9px] font-black uppercase tracking-widest"
                          >
                            Gunakan Formula Ini
                            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ── GEMINI LIVE AI MODE ── */}
                {aiMode === 'ai' && (
                  <div className="space-y-6">
                    
                    {/* AI Provider Config */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                      {/* Provider Tabs */}
                      <div className="flex bg-white p-1 rounded-xl border border-slate-100">
                        <button
                          onClick={() => setAiProvider('gemini')}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            aiProvider === 'gemini' 
                              ? 'bg-amethyst-primary text-white shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Gemini 2.0
                        </button>
                        <button
                          onClick={() => setAiProvider('openai')}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            aiProvider === 'openai' 
                              ? 'bg-slate-800 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          OpenAI GPT-4o
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Key size={10} className="text-amethyst-primary" />
                          Personal {aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API Key
                        </label>
                        <a 
                          href={aiProvider === 'openai' ? 'https://platform.openai.com/api-keys' : 'https://aistudio.google.com/'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[9px] font-bold text-amethyst-primary hover:underline"
                        >
                          Dapatkan Key
                        </a>
                      </div>

                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder={aiProvider === 'openai' ? 'sk-proj-...' : 'Masukkan AI Studio API Key...'}
                          value={aiProvider === 'openai' ? openaiApiKey : geminiApiKey}
                          onChange={(e) => aiProvider === 'openai' ? setOpenaiApiKey(e.target.value) : setGeminiApiKey(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-xl pl-4 pr-12 py-3 text-xs font-bold text-slate-800 outline-none focus:border-amethyst-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Generator Settings Form */}
                    <div className="space-y-4 pt-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kustomisasi Target AI</span>
                      
                      {/* Topic Input */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Fokus Topik / Niche</label>
                        <input
                          type="text"
                          placeholder="Contoh: Digital marketing agensi, tips keuangan pribadi..."
                          value={aiForm.topic}
                          onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                        />
                      </div>

                      {/* Context Input */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Konteks Agensi / Brand (Opsional)</label>
                        <textarea
                          placeholder="Contoh: Agensi berfokus pada klien kuliner lokal dengan gaya humor santai..."
                          value={aiForm.agencyContext}
                          onChange={(e) => setAiForm({ ...aiForm, agencyContext: e.target.value })}
                          className="w-full h-20 bg-slate-50 border-none rounded-xl p-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all resize-none styled-scrollbar"
                        />
                      </div>

                      {/* Select controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Platform</label>
                          <select
                            value={aiForm.platform}
                            onChange={(e) => setAiForm({ ...aiForm, platform: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                          >
                            {platforms.map(p => (
                              <option key={p.id} value={p.label}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilar Konten</label>
                          <select
                            value={aiForm.pillar}
                            onChange={(e) => setAiForm({ ...aiForm, pillar: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                          >
                            {pillars.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Error message */}
                      {aiError && (
                        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl text-[10px] font-bold">
                          <AlertCircle size={14} className="shrink-0" />
                          {aiError}
                        </div>
                      )}

                      {/* Generate button */}
                      <button
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 via-amethyst-primary to-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Generating Creative Ideas...
                          </>
                        ) : (
                          <>
                            <Wand2 size={14} />
                            Generate Ideas via {aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Results list */}
                    {generatedIdeas.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hasil Ide Buatan AI</span>
                        
                        {generatedIdeas.map((idea, idx) => {
                          const matchedPlatform = platforms.find(p => p.id === (idea.platform?.toLowerCase() || 'tiktok')) || platforms[0];
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-white rounded-3xl border border-slate-100 hover:border-amethyst-light/30 p-5 space-y-3 transition-all hover:shadow-lg group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center p-0.5 border border-slate-100">
                                    <img src={matchedPlatform.icon} alt={idea.platform} className="w-3.5 h-3.5 object-contain" />
                                  </div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{idea.platform}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-slate-50 text-[7px] font-black uppercase text-slate-400 tracking-wider">
                                  {idea.pillar}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-black text-amethyst-dark tracking-tight leading-tight">
                                  {idea.headline}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                  {idea.description}
                                </p>
                              </div>

                              <button
                                onClick={() => applyFormula({
                                  headline: idea.headline,
                                  description: idea.description,
                                  platform: idea.platform,
                                  pillar: idea.pillar
                                })}
                                className="flex items-center gap-1.5 text-amethyst-primary hover:text-black text-[9px] font-black uppercase tracking-widest"
                              >
                                Gunakan Ide Ini
                                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Bottom Info bar */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">💡 Sistem Fleksibilitas</span>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                  API Key disimpan di peramban lokal Anda sendiri, menjamin keamanan data agensi secara penuh.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: IDEA DETAILS ── */}
      <AnimatePresence>
        {selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-8 space-y-6 relative overflow-hidden"
            >
              {/* Glowing header line */}
              <div 
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: (platforms.find(p => p.id === selectedIdea.platform?.toLowerCase()) || platforms[0]).color }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center p-0.5 border border-slate-100">
                    <img 
                      src={(platforms.find(p => p.id === selectedIdea.platform?.toLowerCase()) || platforms[0]).icon} 
                      alt={selectedIdea.platform} 
                      className="w-4 h-4 object-contain" 
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{selectedIdea.platform}</span>
                </div>
                <button 
                  onClick={() => setSelectedIdea(null)}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amethyst-light/20 text-amethyst-primary text-[8px] font-black uppercase tracking-widest inline-block">
                    {selectedIdea.content_pillar || 'Ide Konten'}
                  </span>
                  <h3 className="text-xl font-black text-amethyst-dark tracking-tight leading-tight">
                    {selectedIdea.title}
                  </h3>
                </div>

                <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedIdea.description || 'Tidak ada deskripsi detail untuk ide ini.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => {
                    const idea = selectedIdea;
                    setSelectedIdea(null);
                    setPromotingIdea(idea);
                  }}
                  className="flex-1 py-3.5 bg-amethyst-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/30 hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  Jadwalkan ke Konten Plan
                </button>
                
                <button 
                  onClick={() => {
                    const id = selectedIdea.id;
                    setSelectedIdea(null);
                    handleDeleteIdea(id);
                  }}
                  className="px-6 py-3.5 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] hover:bg-rose-100 transition-all flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
