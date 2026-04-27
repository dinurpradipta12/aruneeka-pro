'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronRight, ChevronLeft, Sparkles, ArrowRight, MousePointer2, Zap, Target, Box, Layout, Users, Edit3, Calendar, Grid, Plus, UserPlus } from 'lucide-react';

interface Step {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  isWorkspaceSelector?: boolean; // Special flag for when we're in the brand selector
}

const allSteps: Step[] = [
  // Halaman Workspace Selector (Route null/root)
  {
    id: 'ws-add',
    targetId: 'tour-add-workspace',
    title: 'Launch a New Brand',
    description: 'Aruneeka memungkinkan Anda mengelola banyak brand. Tambahkan bidang usaha baru di sini untuk memisahkan strategi dan tim.',
    icon: <Plus size={24} className="text-amethyst-primary" />
  },
  {
    id: 'ws-edit',
    targetId: 'tour-edit-workspace',
    title: 'Workspace Settings',
    description: 'Klik ikon ini untuk mengubah nama brand, kategori, atau menghapus workspace yang sudah tidak aktif.',
    icon: <Edit3 size={24} className="text-slate-500" />
  },
  {
    id: 'ws-invite',
    targetId: 'tour-invite-user',
    title: 'Invite Global Personnel',
    description: 'Daftarkan anggota tim baru Anda secara global. Mereka akan memiliki akses ke seluruh brand yang Anda izinkan.',
    icon: <UserPlus size={24} className="text-emerald-500" />
  },

  // Halaman Performance Dashboard
  {
    id: 'perf-profile',
    targetId: 'tour-profile-selector',
    route: '/analytics',
    title: 'Multi-Account Selector',
    description: 'Pilih akun sosial media atau beralih antar profil dengan mudah di sini untuk melihat data spesifik.',
    icon: <Users size={24} className="text-indigo-500" />
  },
  {
    id: 'perf-metrics',
    targetId: 'tour-metrics-cards',
    route: '/analytics',
    title: 'Performance Metrics',
    description: 'Pantau statistik utama seperti Views, Engagement, dan Pertumbuhan Followers secara real-time.',
    icon: <Zap size={24} className="text-amber-500" />
  },
  {
    id: 'perf-filter',
    targetId: 'tour-date-filter',
    route: '/analytics',
    title: 'Time Range Filter',
    description: 'Sesuaikan periode laporan untuk melihat perbandingan performa antar bulan atau rentang waktu khusus.',
    icon: <Calendar size={24} className="text-amethyst-primary" />
  },

  // Halaman Content Plan
  {
    id: 'content-new',
    targetId: 'tour-create-content',
    route: '/content',
    title: 'New Content Production',
    description: 'Mulai produksi konten baru Anda dari sini. Klik untuk membuka wizard persiapan konten yang cerdas.',
    icon: <Box size={24} className="text-emerald-500" />
  },
  {
    id: 'content-view',
    targetId: 'tour-view-mode',
    route: '/content',
    title: 'View Mode Switcher',
    description: 'Ganti tampilan antara List, Kanban, atau Kalender sesuai dengan metode kerja tim Anda.',
    icon: <Layout size={24} className="text-blue-500" />
  },
  {
    id: 'content-period',
    targetId: 'tour-content-period',
    route: '/content',
    title: 'Content Period Filter',
    description: 'Lihat rencana konten untuk minggu ini atau bulan depan dengan filter rentang tanggal yang presisi.',
    icon: <Calendar size={24} className="text-rose-500" />
  },
  {
    id: 'content-actions',
    targetId: 'tour-content-actions',
    route: '/content',
    title: 'Smart Import & Export',
    description: 'Gunakan menu ini untuk Import massal konten plan, Download template, atau Export data ke CSV.',
    icon: <Grid size={24} className="text-indigo-600" />
  },

  // Halaman KPI & Growth
  {
    id: 'kpi-add',
    targetId: 'tour-add-goal',
    route: '/strategy',
    title: 'Strategic Goals',
    description: 'Tetapkan target performa bulanan Anda. Aruneeka akan membantu memantau sejauh mana tim mencapai tujuan tersebut.',
    icon: <Target size={24} className="text-rose-600" />
  },
  {
    id: 'kpi-sync',
    targetId: 'tour-sync-kpi',
    route: '/strategy',
    title: 'Auto-Sync Targets',
    description: 'Sinkronkan target dari bulan sebelumnya secara otomatis agar strategi Anda tetap berkelanjutan.',
    icon: <Zap size={24} className="text-amber-500" />
  },
  {
    id: 'kpi-gap',
    targetId: 'tour-gap-insight',
    route: '/strategy',
    title: 'Intelligence Gap Insight',
    description: 'Dapatkan analisis cerdas tentang celah strategi Anda dan rekomendasi tindakan untuk pertumbuhan maksimal.',
    icon: <Sparkles size={24} className="text-amethyst-primary" />
  },

  // Halaman Team Squad
  {
    id: 'team-squad',
    targetId: 'tour-squad-list',
    route: '/manage',
    title: 'Team Squad Management',
    description: 'Lihat daftar tim yang bertugas di brand ini. Kelola peran dan akses setiap personil secara transparan.',
    icon: <Users size={24} className="text-emerald-600" />
  }
];

const AruneekaOnboarding = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // States
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Initial Check for Global Announcement
  useEffect(() => {
    const isAnnounced = localStorage.getItem('aruneeka_guide_announced');
    if (!isAnnounced) {
      const timer = setTimeout(() => setShowAnnouncement(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Memoize filtered steps based on actual DOM occupancy and pathname
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const selectorExists = document.getElementById('tour-add-workspace');
    const normalizedPath = pathname?.replace(/\/$/, '') || '/';
    
    let filtered;
    if (selectorExists) {
      filtered = allSteps.filter(s => !s.route || s.route === '/');
    } else {
      filtered = allSteps.filter(s => {
        const stepRoute = s.route?.replace(/\/$/, '');
        return stepRoute === normalizedPath;
      });
    }
    
    setActiveSteps(filtered);
    // Don't reset currentStep here if we're in the middle of a tour
  }, [pathname, isVisible]); 

  // Check if tour should start automatically for this page
  useEffect(() => {
    // Wait until announcement is dismissed
    if (showAnnouncement || activeSteps.length === 0) return;

    const isSelector = typeof document !== 'undefined' && !!document.getElementById('tour-add-workspace');
    const pageId = isSelector ? 'selector' : (pathname?.replace(/\//g, '_') || 'home');
    const hasCompletedTour = localStorage.getItem(`aruneeka_tour_completed_${pageId}`);
    
    if (!hasCompletedTour && !isVisible) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeSteps, pathname, showAnnouncement, isVisible]);

  const findTarget = useCallback(() => {
    if (activeSteps.length === 0) return false;
    const step = activeSteps[currentStep];
    if (!step) return false;

    const target = document.getElementById(step.targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      // Relaxed check: as long as it's in DOM and has some position
      setTargetRect(rect);
      setIsNavigating(false);
      return true;
    }
    return false;
  }, [currentStep, activeSteps]);

  // Update target rect
  useEffect(() => {
    if (!isVisible || activeSteps.length === 0) return;

    const updateRect = () => {
      const found = findTarget();
      if (!found && isVisible) {
        // Just wait
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 500);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isVisible, currentStep, activeSteps, findTarget]);

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    const isSelector = typeof document !== 'undefined' && !!document.getElementById('tour-add-workspace');
    const pageId = isSelector ? 'selector' : (pathname?.replace(/\//g, '_') || 'home');
    localStorage.setItem(`aruneeka_tour_completed_${pageId}`, 'true');
  };

  const dismissAnnouncement = () => {
    setShowAnnouncement(false);
    localStorage.setItem('aruneeka_guide_announced', 'true');
  };

  const startManualTour = () => {
    const pageId = (pathname === '/' || !pathname) ? 'selector' : pathname.replace(/\//g, '_');
    localStorage.removeItem(`aruneeka_tour_completed_${pageId}`);
    
    // Force reset states
    setTargetRect(null);
    setCurrentStep(0);
    setIsVisible(true);
    
    console.log('Manual tour started for:', pageId);
  };

  // Expose manual trigger to window for the test button
  useEffect(() => {
    (window as any).startAruneekaTour = startManualTour;
  }, [pathname, activeSteps]); // Added activeSteps to dependency

  if (!isVisible) return null;

  const step = activeSteps[currentStep];
  if (!step) return null;

  // Logic for smart positioning (Side, Top, or Bottom)
  const getTooltipPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const tooltipWidth = 350;
    const tooltipHeight = 400;
    const margin = 20;

    // Default: Check for space on the right
    if (targetRect.right + tooltipWidth + margin < window.innerWidth) {
      return {
        top: Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin, targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2))),
        left: targetRect.right + margin,
        side: 'right'
      };
    }
    
    // Check for space on the left
    if (targetRect.left - tooltipWidth - margin > 0) {
      return {
        top: Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin, targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2))),
        left: targetRect.left - tooltipWidth - margin,
        side: 'left'
      };
    }

    // Fallback to Bottom or Top if sides are blocked
    if (targetRect.bottom + tooltipHeight + margin < window.innerHeight) {
      return {
        top: targetRect.bottom + margin,
        left: Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2))),
        side: 'bottom'
      };
    }

    return {
      top: targetRect.top - tooltipHeight - margin,
      left: Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2))),
      side: 'top'
    };
  };
  const pos = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-[20000] pointer-events-none overflow-hidden">
      {/* 1. GLOBAL ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[20001] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center pointer-events-auto p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full bg-white rounded-[50px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-12 text-center relative overflow-hidden"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amethyst-primary via-indigo-400 to-rose-400" />
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-amethyst-light/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[35px] flex items-center justify-center shadow-inner relative group">
                    <Sparkles className="text-amethyst-primary group-hover:rotate-12 transition-transform duration-500" size={48} />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-amethyst-primary/20 rounded-full blur-xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                    Welcome to <span className="text-amethyst-primary">New Aruneeka</span>
                  </h2>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    Kami telah menambahkan <span className="font-bold text-slate-700">Interactive Mini Guides</span> untuk membantu Anda memaksimalkan setiap fitur di Aruneeka Pro. 
                  </p>
                </div>

                <div className="bg-slate-50/50 rounded-[30px] p-8 border border-slate-100/50">
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">What's New?</p>
                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amethyst-primary"><Zap size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-slate-700">Quick Tour</p>
                        <p className="text-[10px] text-slate-400 font-medium">Panduan singkat per halaman</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500"><Target size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-slate-700">Feature Insights</p>
                        <p className="text-[10px] text-slate-400 font-medium">Tips cerdas untuk strategi Anda</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={dismissAnnouncement}
                  className="w-full bg-amethyst-dark text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amethyst-dark/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                >
                  Explore New Features
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BACKGROUND OVERLAY (SPOTLIGHT) */}
      <AnimatePresence>
        {isVisible && targetRect && !isNavigating && !showAnnouncement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-auto"
            style={{
              clipPath: `polygon(
                0% 0%, 0% 100%, 
                ${targetRect.left - 15}px 100%, 
                ${targetRect.left - 15}px ${targetRect.top - 15}px, 
                ${targetRect.right + 15}px ${targetRect.top - 15}px, 
                ${targetRect.right + 15}px ${targetRect.bottom + 15}px, 
                ${targetRect.left - 15}px ${targetRect.bottom + 15}px, 
                ${targetRect.left - 15}px 100%, 
                100% 100%, 100% 0%
              )`
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. SEARCHING INDICATOR */}
      <AnimatePresence mode="wait">
        {isVisible && (isNavigating || !targetRect) && !showAnnouncement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-slate-950/20 backdrop-blur-[1px]"
          >
             <div className="flex flex-col items-center gap-6 bg-white/10 backdrop-blur-md p-10 rounded-[40px] border border-white/20 shadow-2xl">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-white/10 border-t-amethyst-primary rounded-full animate-spin" />
                   <Sparkles className="absolute inset-0 m-auto text-amethyst-primary" size={24} />
                </div>
                <div className="space-y-1 text-center">
                   <p className="text-white text-[12px] font-black uppercase tracking-[0.3em]">Aruneeka Intelligence</p>
                   <p className="text-white/60 text-[10px] font-medium italic">Searching for target feature...</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TOOLTIP CARD */}
      <AnimatePresence mode="wait">
        {isVisible && targetRect && !isNavigating && !showAnnouncement && (
          <motion.div 
            key={`${step.id}-${currentStep}`}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              top: pos.top,
              left: pos.left
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: pos.top,
              left: pos.left
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="absolute w-[350px] bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 pointer-events-auto border border-slate-100 flex flex-col gap-8 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amethyst-primary via-indigo-400 to-rose-400" />
            
            <div className="flex items-start justify-between relative z-10">
               <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center shadow-inner group">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                    {step.icon}
                  </motion.div>
               </div>
               <button onClick={completeTour} className="p-3 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="space-y-3 relative z-10">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amethyst-primary uppercase tracking-[0.2em] bg-amethyst-light/20 px-3 py-1 rounded-full">Part {currentStep + 1} of {activeSteps.length}</span>
                  <Sparkles size={12} className="text-amber-400" />
               </div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{step.title}</h3>
               <p className="text-[13px] font-medium text-slate-500 leading-relaxed italic">&quot;{step.description}&quot;</p>
            </div>

            <div className="flex items-center justify-between pt-2 relative z-10 border-t border-slate-50 mt-2">
               <div className="flex gap-2">
                  <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                     <motion.div 
                       className="h-full bg-amethyst-primary"
                       initial={{ width: 0 }}
                       animate={{ width: `${((currentStep + 1) / activeSteps.length) * 100}%` }}
                     />
                  </div>
               </div>
               <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button onClick={handlePrev} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-[20px] hover:text-amethyst-primary border border-transparent hover:border-amethyst-light transition-all text-xs font-bold font-mono tracking-tighter">
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <button onClick={handleNext} className="bg-amethyst-dark text-white px-8 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group">
                    {currentStep === activeSteps.length - 1 ? 'Finish Guide' : 'Unlock Next'}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>

            <div className={`absolute w-6 h-6 bg-white rotate-45 border-l border-t border-slate-50 transition-all duration-500
                ${(pos as any).side === 'right' ? '-left-3 top-1/2 -translate-y-1/2 -rotate-[45deg]' : ''}
                ${(pos as any).side === 'left' ? '-right-3 top-1/2 -translate-y-1/2 rotate-[135deg]' : ''}
                ${(pos as any).side === 'bottom' ? '-top-3 left-1/2 -translate-x-1/2 rotate-[45deg]' : ''}
                ${(pos as any).side === 'top' ? '-bottom-3 left-1/2 -translate-x-1/2 rotate-[225deg]' : ''}
            `} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AruneekaOnboarding;
