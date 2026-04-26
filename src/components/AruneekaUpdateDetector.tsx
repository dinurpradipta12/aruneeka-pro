'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AruneekaUpdateDetector = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        const serverVersion = data.version?.toString();
        
        if (!serverVersion) return;

        // 1. Get previously matched version from storage
        const savedVersion = localStorage.getItem('aruneeka_app_version');
        
        console.log(`[Version Check] Server: ${serverVersion}, Local: ${savedVersion}`);

        // 2. Performance-safe comparison
        if (!savedVersion) {
            // Initial visit: establish baseline
            localStorage.setItem('aruneeka_app_version', serverVersion);
            setCurrentVersion(serverVersion);
        } else if (savedVersion !== serverVersion) {
            // Version mismatch detected!
            setHasUpdate(true);
            setCurrentVersion(serverVersion);
        } else {
            setCurrentVersion(serverVersion);
        }
      } catch (e) {
        console.error("[Version Check] Failed to fetch version.json", e);
      }
    };

    checkVersion();

    // 3. Performance Listeners: Check on focus + Polling
    window.addEventListener('focus', checkVersion);

    const interval = setInterval(checkVersion, 15000); // 15 seconds for aggressive tracking
    
    return () => {
      window.removeEventListener('focus', checkVersion);
      clearInterval(interval);
    };
  }, []);

  const handleReload = () => {
    if (currentVersion) {
      localStorage.setItem('aruneeka_app_version', currentVersion);
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div 
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          className="fixed bottom-8 left-8 z-[20000]"
        >
          <div className="bg-white/70 border border-white/60 rounded-[32px] p-2 pr-6 shadow-[0_20px_50px_rgba(145,109,213,0.3)] backdrop-blur-2xl flex items-center gap-6 overflow-hidden">
             <div className="w-14 h-14 bg-gradient-to-br from-amethyst-primary to-amethyst-dark rounded-3xl flex items-center justify-center text-white relative flex-shrink-0 group shadow-lg shadow-amethyst-primary/30">
                <Zap size={24} className="group-hover:scale-125 transition-transform" />
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-3xl" />
             </div>
             
             <div className="space-y-0.5">
                <h4 className="text-sm font-black text-amethyst-dark tracking-tight">System Update</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap italic">Build v{currentVersion || '...'} - Ready to Ship</p>
             </div>

             <button 
               onClick={handleReload}
               className="h-12 px-6 bg-amethyst-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amethyst-dark transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-amethyst-primary/20"
             >
                <RefreshCw size={14} className="animate-spin-slow" />
                Reload
             </button>

             <button 
               onClick={() => {
                 if (currentVersion) localStorage.setItem('aruneeka_app_version', currentVersion);
                 setHasUpdate(false);
               }}
               className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
             >
                <X size={16} />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AruneekaUpdateDetector;
