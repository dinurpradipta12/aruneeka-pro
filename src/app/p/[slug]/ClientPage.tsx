'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  AlertCircle, 
  BarChart2, 
  Users,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AruneekaKPI from '@/components/AruneekaKPI';
import AruneekaContentPlan from '@/components/AruneekaContentPlan';
import AruneekaAnalytics from '@/components/AruneekaAnalytics';

export default function PublicPreviewPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    const fetchPublicWorkspace = async () => {
      if (!slug) return;
      try {
        // Fetch workspace with owner's subscription status
        const { data, error: wsError } = await supabase
          .from('v2_agency_workspaces')
          .select('*, owner:v2_agency_users!v2_agency_workspaces_owner_id_fkey(subscription_tier)')
          .eq('public_slug', slug)
          .eq('is_public', true)
          .single();

        if (wsError || !data) {
          setError('Insight Center ini bersifat privat atau tidak ditemukan.');
          return;
        }

        setWorkspace(data);
      } catch (err) {
        setError('Terjadi kesalahan saat memuat dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWorkspace();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amethyst-primary/10 rounded-3xl flex items-center justify-center animate-bounce mb-6">
          <Zap size={32} className="text-amethyst-primary" />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Aruneeka Intelligence is fetching insights...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-8 shadow-xl">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Akses Dibatasi</h1>
        <p className="max-w-md text-slate-400 font-bold leading-relaxed mb-10 text-sm">
          {error} Silakan hubungi pengelola brand untuk mendapatkan akses terbaru.
        </p>
        <a href="/" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
          Go to Aruneeka Pro <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  const ownerTier = (workspace?.owner as any)?.subscription_tier || 'free';
  

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-amethyst-dark font-inter antialiased pb-20">
      {/* 1. PUBLIC GUEST BANNER ... (no changes needed) */}
      <div className="bg-slate-950 text-white py-2.5 px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amethyst-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-amethyst-primary flex items-center justify-center">
              <ShieldCheck size={12} className="text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              Viewing as Guest • <span className="text-amethyst-primary">{workspace.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live Insights</span>
          </div>
        </div>
      </div>

      {/* 2. PUBLIC HEADER */}
      <header className="p-8 max-w-[1600px] mx-auto">
        <div className="rounded-[40px] p-10 text-white relative flex items-center justify-between border border-white/20 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #916DD5 0%, #AC8BEE 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/90">Preview Mode</span>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">{workspace.name}</h1>
            <p className="text-white/60 text-[11px] font-bold max-w-lg leading-relaxed">
              Selamat datang di dashboard laporan {workspace.name}. Di sini Anda bisa memantau performa konten, rencana tayang, dan target KPI secara langsung.
            </p>
          </div>

        </div>
      </header>

      {/* 3. NAVIGATION (LOCKED TABS) */}
      <div className="px-8 max-w-[1600px] mx-auto mt-4 mb-10 flex justify-center">
        <nav className="bg-white border border-slate-100 rounded-2xl p-1.5 inline-flex items-center shadow-xl">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'performance' ? 'bg-amethyst-dark text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Performance</span>
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-amethyst-dark text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Calendar size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Content Plan</span>
          </button>
          <button 
            onClick={() => setActiveTab('kpi')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'kpi' ? 'bg-amethyst-dark text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Target size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">KPI Section</span>
          </button>
        </nav>
      </div>

      {/* 4. CONTENT AREA */}
      <main className="px-8 max-w-[1600px] mx-auto min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'performance' && (
              <AruneekaAnalytics 
                isPublic={true} 
                selectedWorkspaceId={workspace.id} 
                subscriptionTier={ownerTier} 
              />
            )}
            {activeTab === 'content' && (
              <AruneekaContentPlan 
                isPublic={true} 
                selectedWorkspaceId={workspace.id} 
                subscriptionTier={ownerTier}
                plans={[]} // Need to handle plans fetch if needed, but ContentPlan usually fetches itself if workspaceId is provided
              />
            )}
            {activeTab === 'kpi' && (
              <AruneekaKPI 
                isPublic={true} 
                selectedWorkspaceId={workspace.id} 
                subscriptionTier={ownerTier}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. FOOTER */}
      <footer className="mt-20 text-center pb-10">
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Powered by</p>
          <div className="px-4 py-2 bg-slate-100 rounded-xl">
             <span className="text-[12px] font-black text-slate-400 tracking-tighter">aruneeka</span>
             <span className="text-[12px] font-black text-amethyst-primary tracking-tighter">.pro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
