'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Image as ImageIcon, 
  Save, 
  RefreshCcw, 
  Layout, 
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './AruneekaShell';

const AruneekaAdminAppearance = () => {
  const { selectedWorkspaceId } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [config, setConfig] = useState({
    login_hero_bg_color: '#916DD5',
    login_page_bg_color: '#f8fafc',
    login_hero_image: '',
    agency_name: 'Aruneeka Pro'
  });


  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const workspaceId = selectedWorkspaceId;
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('v2_agency_settings')
        .select('*')
        .eq('id', workspaceId)
        .maybeSingle();
      
      if (error) console.error("Fetch Settings Error:", error);
      
      if (data) {
        setConfig({
          login_hero_bg_color: data.login_hero_bg_color || '#916DD5',
          login_page_bg_color: data.login_page_bg_color || '#f8fafc',
          login_hero_image: data.login_hero_image || '',
          agency_name: data.agency_name || 'Aruneeka Pro'
        });
      }
    } catch (e) {
      console.error("Fetch settings exception:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWorkspaceId) fetchSettings();
  }, [selectedWorkspaceId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // 1. Dapatkan path gambar lama untuk dihapus
      if (config.login_hero_image && config.login_hero_image.includes('agency-assets')) {
        try {
          const oldPath = config.login_hero_image.split('agency-assets/').pop();
          if (oldPath) {
            await supabase.storage.from('agency-assets').remove([oldPath]);
          }
        } catch (e) {}
      }

      // 2. Upload gambar baru
      const fileExt = file.name.split('.').pop();
      const fileName = `hero_${Date.now()}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('agency-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(filePath);

      setConfig((prev) => ({ ...prev, login_hero_image: publicUrl }));
      setMessage({ text: 'Gambar berhasil diupload!', type: 'success' });
    } catch (err: any) {
      console.error("Upload Error:", err);
      setMessage({ text: `Gagal upload: ${err.message}`, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    const workspaceId = selectedWorkspaceId || JSON.parse(localStorage.getItem('aruneeka_selected_workspace') || '{}').id;
    
    if (!workspaceId) {
      alert("Akses ditolak: Sistem tidak bisa mengidentifikasi Brand aktif. Silakan pilih brand ulang di header.");
      return;
    }

    setIsSaving(true);
    console.log("Attempting to save branding for workspace:", workspaceId, config);
    try {

      const { error } = await supabase
        .from('v2_agency_settings')
        .upsert({
          id: workspaceId,
          ...config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Save Error:", error);
        throw error;
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (e: any) {
      setMessage({ text: `Gagal menyimpan: ${e.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-1">
         <div className="flex items-center gap-3 text-amethyst-primary">
            <Palette size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Design System Portal</span>
         </div>
         <h2 className="text-4xl font-black text-slate-800 tracking-tight">System Styling</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Controls */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
           <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-premium space-y-10">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Agency Brand Name</label>
                    <input 
                      value={config.agency_name}
                      onChange={(e) => setConfig({...config, agency_name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                      placeholder="e.g. Aruneeka Pro"
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Login Hero Asset</label>
                       <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <button 
                            onClick={() => setUploadMode('url')}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${uploadMode === 'url' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                          >
                             URL Link
                          </button>
                          <button 
                            onClick={() => setUploadMode('file')}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${uploadMode === 'file' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400'}`}
                          >
                             Upload File
                          </button>
                       </div>
                    </div>

                    {uploadMode === 'url' ? (
                       <div className="relative group">
                          <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            value={config.login_hero_image}
                            onChange={(e) => setConfig({...config, login_hero_image: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-14 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all placeholder:text-slate-200"
                            placeholder="https://images.unsplash.com/..."
                          />
                       </div>
                    ) : (
                       <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group overflow-hidden">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                             {isUploading ? (
                                <Loader2 className="w-8 h-8 text-amethyst-primary animate-spin" />
                             ) : (
                                <>
                                  <RefreshCcw className="w-8 h-8 text-slate-300 mb-2 group-hover:rotate-180 transition-transform duration-500" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik untuk Upload dari PC</p>
                                </>
                             )}
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                          {config.login_hero_image && uploadMode === 'file' && (
                             <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center">
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">File Ready</span>
                             </div>
                          )}
                       </label>
                    )}
                    <p className="text-[9px] text-slate-400 font-medium italic pl-1">Saran: Gunakan gambar dengan rasio 16:9 atau portrait untuk hasil terbaik.</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hero Card Color</label>
                        <div className="flex items-center gap-4">
                           <input 
                             type="color"
                             value={config.login_hero_bg_color}
                             onChange={(e) => setConfig({...config, login_hero_bg_color: e.target.value})}
                             className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                           />
                           <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black text-slate-400 uppercase">{config.login_hero_bg_color}</span>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Page Atmosphere</label>
                        <div className="flex items-center gap-4">
                           <input 
                             type="color"
                             value={config.login_page_bg_color}
                             onChange={(e) => setConfig({...config, login_page_bg_color: e.target.value})}
                             className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                           />
                           <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black text-slate-400 uppercase">{config.login_page_bg_color}</span>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <AnimatePresence>
                   {message && message.type === 'error' && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="flex items-center gap-3 p-4 rounded-2xl text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100"
                     >
                       <AlertCircle size={16} />
                       {message.text}
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="w-full py-5 bg-amethyst-dark text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-amethyst-dark/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                     <>
                       <Save size={18} />
                       Apply Global Branding
                     </>
                   )}
                 </button>
              </div>
           </div>
        </div>

        {/* Right Side: Identity Preview */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                 <Eye size={14} />
                 Live Identity Preview
              </div>
              <button onClick={fetchSettings} className="p-2 text-slate-300 hover:text-amethyst-primary transition-colors">
                <RefreshCcw size={14} />
              </button>
           </div>

           {/* Mini Scaled Preview of Login Card */}
           <div 
              className="rounded-[48px] p-8 aspect-video relative overflow-hidden flex items-center justify-center shadow-inner transition-colors duration-1000 group"
              style={{ backgroundColor: config.login_page_bg_color }}
           >
              {/* Animated Blur Background in Preview */}
              {config.login_hero_image && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-50 scale-105 transition-all duration-1000"
                  style={{ backgroundImage: `url(${config.login_hero_image})` }}
                />
              )}
              
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)] z-[1]" />
              
              {/* Scale Down Actual Structure */}
              <div className="w-[85%] h-[80%] bg-white/95 backdrop-blur-md rounded-[32px] overflow-hidden flex shadow-2xl scale-95 md:scale-100 transition-transform duration-500 group-hover:scale-[1.02] relative z-[2]">
                {/* Left Side Hero */}
                <div 
                  className="w-[45%] h-full relative transition-colors duration-700"
                  style={{ backgroundColor: config.login_hero_bg_color }}
                >
                   {config.login_hero_image && (
                     <div 
                        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
                        style={{ backgroundImage: `url(${config.login_hero_image})` }}
                     />
                   )}
                   <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="w-6 h-6 bg-white/20 rounded-lg" />
                      <div className="space-y-2">
                         <div className="w-12 h-1 bg-white/40 rounded-full" />
                         <div className="w-10 h-1 bg-white/20 rounded-full" />
                      </div>
                   </div>
                </div>
                {/* Right Side Form */}
                <div className="flex-1 bg-white p-8 flex flex-col justify-center gap-4">
                   <div className="space-y-1">
                      <div className="w-16 h-2 bg-slate-100 rounded-full" />
                      <div className="w-24 h-1 bg-slate-50 rounded-full" />
                   </div>
                   <div className="space-y-3 pt-4">
                      <div className="w-full h-8 bg-slate-50 rounded-xl" />
                      <div className="w-full h-8 bg-slate-50 rounded-xl" />
                   </div>
                   <div className="pt-4">
                      <div className="w-full h-10 bg-slate-800 rounded-xl" />
                   </div>
                </div>
              </div>
              
              <div className="absolute bottom-6 right-8 text-[8px] font-black uppercase tracking-widest text-white/20">
                Encrypted System Preview
              </div>
           </div>

           <div className="p-8 bg-amethyst-primary/5 rounded-[32px] border border-amethyst-primary/10">
              <div className="flex gap-4">
                 <AlertCircle className="text-amethyst-primary" size={20} />
                 <div className="space-y-1">
                    <p className="text-xs font-black text-amethyst-dark tracking-tight">Synchronized Deployment</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                      Perubahan warna dan gambar yang Anda lakukan di sini akan segera diterapkan pada sesi login berikutnya untuk setiap akun agensi di seluruh dunia. Pastikan gambar yang Anda pilih profesional dan mewakili identitas Aruneeka Pro.
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>

    {/* Success Modal Overlay */}
    <AnimatePresence>
      {showSuccess && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[50px] p-12 text-center max-w-sm w-full shadow-[0_32px_80px_rgba(0,0,0,0.15)] relative z-10 space-y-8"
          >
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-emerald-500 text-white rounded-[32px] flex items-center justify-center shadow-xl shadow-emerald-500/30 rotate-6">
                <CheckCircle2 size={40} className="fill-current" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Identity Synced!</h3>
              <p className="text-xs font-bold text-slate-400 leading-relaxed italic px-2">
                &quot;Seluruh sistem kini telah menggunakan identitas visual terbaru yang Anda tentukan.&quot;
              </p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-5 bg-amethyst-dark text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:scale-105 active:scale-95 transition-all"
            >
              Great, Continue
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default AruneekaAdminAppearance;
