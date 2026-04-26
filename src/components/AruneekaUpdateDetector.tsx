'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AruneekaUpdateDetector = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch initial version
    const fetchInitialVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        const data = await res.json();
        setCurrentVersion(data.version);
      } catch (e) {
        console.error("UpdateDetector: Failed to fetch initial version", e);
      }
    };

    fetchInitialVersion();

    // 2. Poll for updates every 2 minutes
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        
        if (currentVersion && data.version !== currentVersion) {
            setHasUpdate(true);
            // Optional: prevent multiple popups or unnecessary intervals
            clearInterval(interval);
        }
      } catch (e) {
        // Silent error for polling
      }
    }, 120000); // 120 seconds

    return () => clearInterval(interval);
  }, [currentVersion]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div 
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          className="fixed bottom-8 left-8 z-[1000]"
        >
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-2 pr-6 shadow-2xl shadow-amethyst-primary/20 backdrop-blur-xl flex items-center gap-6 overflow-hidden">
             <div className="w-14 h-14 bg-amethyst-primary rounded-3xl flex items-center justify-center text-white relative flex-shrink-0 group">
                <Zap size={24} className="group-hover:scale-125 transition-transform" />
                <div className="absolute inset-0 bg-white/20 animate-ping rounded-3xl" />
             </div>
             
             <div className="space-y-0.5">
                <h4 className="text-sm font-black text-white tracking-tight">System Update</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap italic">Build v2.0.4 - Freshly Deployed</p>
             </div>

             <button 
               onClick={handleReload}
               className="h-12 px-6 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amethyst-primary hover:text-white transition-all flex items-center gap-2 active:scale-95"
             >
                <RefreshCw size={14} className="animate-spin-slow" />
                Reload
             </button>

             <button 
               onClick={() => setHasUpdate(false)}
               className="p-2 text-slate-500 hover:text-white transition-colors"
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
