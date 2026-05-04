'use client';

import React, { useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  Eye, 
  Sparkles,
  Save,
  Zap,
  MessageSquare,
  Share2,
  Bookmark,
  Repeat,
  UserPlus,
  Clock,
  Target,
  Quote,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AruneekaMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, metrics: any) => Promise<any>;
  content: any;
}

const AruneekaMetricsModal: React.FC<AruneekaMetricsModalProps> = ({ isOpen, onClose, onSave, content }) => {
  const platform = useMemo(() => content?.platform?.toLowerCase() || 'instagram', [content]);
  const [metrics, setMetrics] = React.useState<any>({});
  const [warningDismissed, setWarningDismissed] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMetrics(content?.metrics || {});
      setWarningDismissed(false); // Reset dismissal state every time modal opens
    }
  }, [content, isOpen]);

  const showWarning = isOpen && !content?.metrics_updated && !warningDismissed;

  const engagementRate = useMemo(() => {
    const v = parseInt(metrics.views) || 0;
    if (v === 0) return 0;

    if (platform === 'threads') {
      const likes = parseInt(metrics.likes) || 0;
      const replies = parseInt(metrics.replies) || 0;
      return ((likes + replies) / v) * 100;
    } else if (platform === 'tiktok' || platform === 'instagram') {
      const likes = parseInt(metrics.likes) || 0;
      const comments = parseInt(metrics.comments) || 0;
      const shares = parseInt(metrics.shares) || 0;
      const saves = parseInt(metrics.saves) || 0;
      return ((likes + comments + shares + saves) / v) * 100;
    }
    
    return 0;
  }, [metrics, platform]);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const error = await onSave(content.id, { ...metrics, engagementRate });
    setIsSaving(false);
    if (!error) {
      onClose();
    }
  };

  const renderInput = (key: string, label: string, icon: React.ReactNode, placeholder = '0') => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
         {icon} {label}
      </label>
      <input 
         type="number"
         value={metrics[key] || ''}
         onChange={e => setMetrics({...metrics, [key]: e.target.value})}
         placeholder={placeholder}
         className="w-full h-14 bg-amethyst-light/10 rounded-2xl px-6 font-black text-amethyst-dark border border-slate-100 outline-none focus:border-amethyst-primary focus:bg-white transition-all shadow-sm"
      />
    </div>
  );

  const platformFields = () => {
    switch (platform) {
      case 'tiktok':
        return (
          <div className="grid grid-cols-4 gap-6">
            {renderInput('views', 'Views', <Eye size={12}/>)}
            {renderInput('likes', 'Likes', <Sparkles size={12}/>)}
            {renderInput('comments', 'Comments', <MessageSquare size={12}/>)}
            {renderInput('saves', 'Saves', <Bookmark size={12}/>)}
            {renderInput('shares', 'Share', <Share2 size={12}/>)}
            {renderInput('avg_watch', 'Avg Watch Time (s)', <Clock size={12}/>)}
            {renderInput('new_followers', 'New Followers', <UserPlus size={12}/>)}
          </div>
        );
      case 'threads':
        return (
          <div className="grid grid-cols-4 gap-6">
            {renderInput('views', 'Views', <Eye size={12}/>)}
            {renderInput('likes', 'Likes', <Sparkles size={12}/>)}
            {renderInput('replies', 'Replies', <MessageSquare size={12}/>)}
            {renderInput('quotes', 'Quotes', <Quote size={12}/>)}
            {renderInput('reposts', 'Repost', <Repeat size={12}/>)}
            {renderInput('follows', 'Follows', <UserPlus size={12}/>)}
          </div>
        );
      default: // Instagram
        return (
          <div className="grid grid-cols-4 gap-6">
            {renderInput('reach', 'Reach', <Target size={12}/>)}
            {renderInput('views', 'Views', <Eye size={12}/>)}
            {renderInput('likes', 'Like', <Sparkles size={12}/>)}
            {renderInput('comments', 'Comment', <MessageSquare size={12}/>)}
            {renderInput('shares', 'Share', <Share2 size={12}/>)}
            {renderInput('saves', 'Save', <Bookmark size={12}/>)}
            {renderInput('reposts', 'Repost', <Repeat size={12}/>)}
            {renderInput('profile_visit', 'Profile Visit', <UserPlus size={12}/>)}
            {renderInput('follows', 'Follows', <UserPlus size={12}/>)}
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onClick={showWarning ? () => { onClose(); setWarningDismissed(false); } : onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
          />
          <AnimatePresence>
            {showWarning ? (
              <motion.div 
                key="warning"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[9999] p-4"
              >
                <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-amethyst-light/20 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <AlertCircle size={28}/>
                  </div>
                  <h3 className="text-sm font-black text-amethyst-dark mb-3 uppercase tracking-widest">Konfirmasi Evaluasi</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed mb-8">
                    Pastikan untuk menginput data konten <strong>minimal di H+7</strong> setelah konten diunggah agar data analitik efektivitas konten dapat terbaca secara optimal.
                  </p>
                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => { onClose(); setWarningDismissed(false); }}
                      className="flex-1 py-3.5 bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[9px] rounded-2xl hover:bg-slate-100 transition-colors"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={() => setWarningDismissed(true)}
                      className="flex-1 py-3.5 bg-amethyst-primary text-white font-bold uppercase tracking-widest text-[9px] rounded-2xl hover:bg-amethyst-dark transition-colors shadow-lg shadow-amethyst-primary/20"
                    >
                      Oke
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl z-[9999] p-4"
              >
                <div className="bg-white rounded-[60px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
               {/* Header */}
               <div className="p-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-amethyst-dark text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-amethyst-primary/20">
                        <Zap size={28}/>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-amethyst-primary uppercase tracking-[0.2em] mb-1">Metric Tracker</p>
                        <h3 className="text-3xl font-black text-amethyst-dark tracking-tight">Stats: {content?.title}</h3>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="bg-amethyst-light/30 border border-amethyst-light/50 rounded-3xl px-8 py-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <TrendingUp size={18} className="text-amethyst-primary"/>
                           <span className="text-[11px] font-bold text-slate-400">Engagement Rate:</span>
                        </div>
                        <span className="text-xl font-black text-amethyst-primary">{engagementRate.toFixed(2)}%</span>
                     </div>
                     <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all border border-slate-100">
                       <X size={24}/>
                     </button>
                  </div>
               </div>

               {/* Metrics Inputs */}
               <div className="px-10 py-10 bg-amethyst-light/20 border-y border-slate-50">
                  <div className="mb-8 flex items-center justify-between px-2">
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Input Achievement Data</h4>
                     <div className="px-4 py-1.5 bg-amethyst-light/50 text-amethyst-primary rounded-full text-[9px] font-black uppercase tracking-widest italic border border-amethyst-primary/10">
                        Live calculation enabled
                     </div>
                  </div>
                  {platformFields()}
               </div>

               {/* Footer */}
               <div className="p-10 flex items-center gap-4">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-6 bg-slate-50 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Tutup
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex-[2] py-6 bg-amethyst-dark text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center gap-3">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Menyimpan...
                      </div>
                    ) : 'Simpan Statistik Performa'}
                  </button>
               </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </>
  );
};

export default AruneekaMetricsModal;
