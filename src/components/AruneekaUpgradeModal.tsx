'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Package, 
  Check, 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AruneekaUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const AruneekaUpgradeModal = ({ isOpen, onClose, user }: AruneekaUpgradeModalProps) => {
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment'>('select');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPkgs = async () => {
        const { data } = await supabase.from('v2_agency_packages').select('*').order('monthly_price', { ascending: true });
        if (data) setAvailablePackages(data);
      };
      fetchPkgs();
    } else {
      // Reset state on close
      setPaymentStep('select');
      setSelectedPkg(null);
      setProofFile(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySubscription = async () => {
    if (!proofFile) {
        alert("Mohon unggah bukti pembayaran terlebih dahulu.");
        return;
    }
    setIsSubmitting(true);
    try {
        const { error } = await supabase.from('v2_agency_inbox').insert([{
            user_id: user?.id,
            message: `Permintaan upgrade ke paket ${selectedPkg.name}`,
            status: 'pending',
            payload: {
                tier: selectedPkg.name,
                package_id: selectedPkg.id,
                proof: proofFile, // Using optimized Base64
                type: selectedPkg.type
            }
        }]);

        if (error) {
           console.error("Submission error:", error.message);
           alert("Gagal mengirim permintaan. Pastikan koneksi stabil dan coba lagi.");
           return;
        }

        setIsSuccess(true);
        setTimeout(() => {
            onClose();
        }, 3000);
    } catch (e: any) {
        console.error("Critical submission error:", e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => !isSubmitting && onClose()} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden relative z-10 flex flex-col h-auto max-h-[95vh]"
          >
            <div className="flex-1 bg-white p-8 md:p-10 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${paymentStep === 'select' ? 'bg-amethyst-primary' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {paymentStep === 'select' ? '1. Select Tier' : '2. Complete Payment'}
                    </span>
                  </div>
                  <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">✕</button>
                </div>

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10 scale-125 mb-4">
                        <CheckCircle2 size={40} strokeWidth={3} className="animate-bounce" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight">Payment Proof Received!</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">Tim kami akan memverifikasi pembayaran Anda dalam waktu maksimal 24 jam. Terima kasih telah berlangganan!</p>
                    </motion.div>
                  ) : paymentStep === 'select' ? (
                    <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {availablePackages.map((pkg) => (
                          <div 
                            key={pkg.id} 
                            onClick={() => setSelectedPkg(pkg)}
                            className={`p-8 rounded-[40px] border-2 cursor-pointer transition-all relative overflow-hidden group ${selectedPkg?.id === pkg.id ? 'border-amethyst-primary bg-amethyst-primary/5 shadow-2xl shadow-amethyst-primary/10' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'}`}
                          >
                            {pkg.type === 'Team' && <div className="absolute top-4 right-4 px-2 py-1 bg-amber-100 text-amber-600 text-[8px] font-black rounded-md uppercase">Team Only</div>}
                            <div className="space-y-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedPkg?.id === pkg.id ? 'bg-amethyst-primary text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                                <Package size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pkg.type}</p>
                                <h4 className="text-xl font-bold text-slate-800 tracking-tight mt-1">{pkg.name}</h4>
                              </div>
                              
                              <div className="space-y-2.5 border-t border-slate-50 pt-5 text-left">
                                {(() => {
                                  let list = [];
                                  try {
                                    if (typeof pkg.features === 'string' && pkg.features.trim().startsWith('[')) {
                                      list = JSON.parse(pkg.features);
                                    } else if (Array.isArray(pkg.features)) {
                                      list = pkg.features;
                                    } else if (typeof pkg.features === 'string') {
                                      list = pkg.features.split(',').map(f => f.trim());
                                    }
                                  } catch (e) {
                                    list = [];
                                  }
                                  return list.slice(0, 5).map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                      <div className="mt-1 w-3.5 h-3.5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check size={8} strokeWidth={4}/>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500 leading-tight">{feature}</span>
                                    </div>
                                  ));
                                })()}
                              </div>

                              <p className="text-2xl font-black text-amethyst-dark tracking-tighter pt-2">
                                Rp{Number(pkg.monthly_price).toLocaleString()}
                                <span className="text-[10px] font-bold text-slate-400">/{pkg.type === 'Team' ? 'person/mo' : 'mo'}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        disabled={!selectedPkg}
                        onClick={() => setPaymentStep('payment')}
                        className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] transition-all shadow-xl ${selectedPkg ? 'bg-amethyst-primary text-white shadow-amethyst-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        Continue to payment
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-left">
                      <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-200/50 pb-6">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amethyst-primary shadow-sm border border-slate-100"><CreditCard size={24} /></div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Transfer Target</p>
                            <p className="text-lg font-black text-slate-800">{selectedPkg?.bank_name || 'BCA (Manual)'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                            <p className="text-xl font-black text-amethyst-primary tracking-tight mt-1">{selectedPkg?.bank_account_number || '000-000-000'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Holder</p>
                            <p className="text-xs font-bold text-slate-700 tracking-tight mt-1 leading-tight">{selectedPkg?.bank_account_name || 'Aruneeka Planner Sys'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Payment Proof</p>
                          {proofFile && (
                            <button 
                              onClick={() => {
                                 const link = document.createElement("a");
                                 link.href = proofFile;
                                 link.download = "aruneeka-payment-proof.png";
                                 link.click();
                              }}
                              className="text-[9px] font-black text-amethyst-primary hover:underline transition-all"
                            >
                               Download for Archive
                            </button>
                          )}
                        </div>

                        <label className={`block w-full border-2 border-dashed rounded-[32px] p-10 text-center cursor-pointer transition-all hover:bg-slate-50 ${proofFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          {proofFile ? (
                            <div className="flex flex-col items-center gap-3">
                               <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Check size={24} strokeWidth={4} /></div>
                               <div>
                                  <p className="text-[11px] font-bold text-emerald-600">File proof uploaded!</p>
                                  <p className="text-[9px] text-emerald-500/60 font-medium">Click to change file</p>
                               </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                               <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"><ArrowLeft size={20} className="rotate-90" /></div>
                               <p className="text-[11px] font-bold text-slate-500">Pilih screenshot bukti transfer</p>
                               <p className="text-[9px] text-slate-300 font-medium uppercase tracking-widest">Max 5MB (JPG/PNG)</p>
                            </div>
                          )}
                        </label>
                      </div>

                      <div className="p-5 bg-amber-50 rounded-[32px] border border-amber-100/50 flex gap-4">
                        <div className="w-8 h-8 bg-amber-400 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-400/20">
                           <ShieldCheck size={18} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-amber-700 leading-tight uppercase tracking-wider">Optimasi Penyimpanan & Privasi</p>
                           <p className="text-[9px] font-bold text-amber-600/70 leading-relaxed italic">
                              Demi menjaga performa sistem, bukti pembayaran akan <span className="text-amber-700 underline underline-offset-2">otomatis dihapus</span> dari server kami setelah diverifikasi oleh tim pengembang. Harap simpan bukti ini untuk arsip pribadi Anda.
                           </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setPaymentStep('select')} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Back</button>
                        <button 
                          onClick={handleApplySubscription}
                          disabled={!proofFile || isSubmitting}
                          className={`flex-[2] py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] transition-all shadow-xl ${proofFile && !isSubmitting ? 'bg-amethyst-primary text-white shadow-amethyst-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                           {isSubmitting ? 'Sending Request...' : 'Confirm Payment'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <p className="text-[9px] text-center text-slate-300 font-medium mt-10">
                Secured by Aruneeka Encryption. Payments are manually verified by our team.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AruneekaUpgradeModal;
