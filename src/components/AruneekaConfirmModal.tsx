'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, X } from 'lucide-react';

interface AruneekaConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

const AruneekaConfirmModal: React.FC<AruneekaConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="bg-white w-full max-w-sm rounded-[44px] shadow-2xl overflow-hidden border border-white/20"
          >
             <div className="p-10 space-y-8">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${
                  type === 'danger' ? 'bg-rose-50 text-rose-500' : 
                  type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                  'bg-amethyst-light/30 text-amethyst-primary'
                }`}>
                  {type === 'danger' ? <Trash2 size={32}/> : <AlertCircle size={32}/>}
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-amethyst-dark tracking-tight leading-none">{title}</h3>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-4 pt-2">
                   <button 
                    onClick={onClose} 
                    className="flex-1 py-5 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                   >
                     {cancelText}
                   </button>
                   <button 
                    onClick={() => { onConfirm(); onClose(); }} 
                    className={`flex-1 py-5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${
                      type === 'danger' ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' : 
                      'bg-amethyst-dark shadow-amethyst-dark/20 hover:bg-black'
                    }`}
                   >
                     {confirmText}
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AruneekaConfirmModal;
