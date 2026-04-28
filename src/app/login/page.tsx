'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  Check,
  ShieldCheck,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const LoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // REGISTRATION STATES
  const [regMode, setRegMode] = useState<'none' | 'tnc' | 'form'>('none');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // IDENTITY SETUP STATES
  const [showIdentitySetup, setShowIdentitySetup] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedColor, setSelectedColor] = useState('#916DD5');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const avatars = Array.from({ length: 12 }, (_, i) => `/assets/avatars/avatar${i + 1}.svg`);
  const colors = ['#916DD5', '#2DD4BF', '#F43F5E', '#3B82F6', '#10B981', '#F59E0B'];

  useEffect(() => {
    setIsMounted(true);
    const cachedBranding = localStorage.getItem('aruneeka_branding');
    if (cachedBranding) {
      setSettings(JSON.parse(cachedBranding));
    }
    
    fetchSettings();
    const user = localStorage.getItem('aruneeka_user');
    if (user) {
      router.push('/');
    }
  }, []);

  const saveIdentity = async () => {
    if (!selectedAvatar) {
       setError("Pilih avatar Anda terlebih dahulu!");
       return;
    }
    
    setIsLoading(true);
    try {
       const { error: patchError } = await supabase
         .from('v2_agency_users')
         .update({ 
           avatar_url: selectedAvatar,
           theme_color: selectedColor
         })
         .eq('id', loggedInUser.id);

       if (patchError) throw patchError;

       const updatedUser = { ...loggedInUser, avatar_url: selectedAvatar, theme_color: selectedColor };
       localStorage.setItem('aruneeka_user', JSON.stringify(updatedUser));
       
       // Hapus workspace lama HANYA JIKA sedang dalam proses onboarding/pilih avatar pertama kali
       localStorage.removeItem('aruneeka_selected_workspace'); 
       
       router.push('/');
    } catch (e: any) {
       setError(e.message);
    } finally {
       setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (regData.password.length < 6) {
      setError("Password minimal harus 6 karakter!");
      return;
    }
    
    if (regData.password !== regData.confirmPassword) {
      setError("Konfirmasi password tidak cocok!");
      return;
    }
    
    try {
      // GENERATE WORKSPACE ID UNIK UNTUK AGENSI BARU
      const newWorkspaceId = crypto.randomUUID();

      const { error: regError } = await supabase
        .from('v2_agency_users')
        .insert({
          full_name: regData.fullName,
          email: regData.email,
          username: regData.username.toLowerCase(),
          password: regData.password,
          role: 'Owner',
          status: 'Pending',
          workspace_id: newWorkspaceId
        });

      if (regError) throw regError;
      
      setRegMode('none');
      setError(null);
      setRegSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('v2_agency_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setSettings(data);
        localStorage.setItem('aruneeka_branding', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Login Page Branding Fetch Error:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: userRecords, error: dbError } = await supabase
        .from('v2_agency_users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password', password);

      if (dbError || !userRecords || userRecords.length === 0) {
        throw new Error('Kredensial tidak valid.');
      }

      // Pick the first record as the primary identity (for avatar/full_name)
      const data = userRecords[0];

      if (data.status === 'Disabled' || data.status === 'Blocked') {
         throw new Error('Akses akun Anda telah dicabut selamanya oleh Administrator.');
      }

      if (!data.avatar_url) {
         setLoggedInUser(data);
         setShowIdentitySetup(true);
         return;
      }

      localStorage.setItem('aruneeka_user', JSON.stringify(data));
      router.push('/');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-10 font-inter selection:bg-amethyst-primary selection:text-white relative overflow-hidden transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* ATMOSPHERIC BACKGROUND (BLURRED HERO) */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000"
        style={{ backgroundColor: settings?.login_page_bg_color || '#f8fafc' }}
      />
      
      {settings?.login_hero_image && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="fixed inset-0 z-1 bg-cover bg-center blur-[32px] scale-105"
          style={{ backgroundImage: `url(${settings.login_hero_image})` }}
        />
      )}

      {/* Subtle Mesh overlay */}
      <div className="fixed inset-0 z-2 bg-[radial-gradient(at_top_right,rgba(145,109,213,0.1),transparent)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-6xl min-h-[600px] bg-white/90 backdrop-blur-md rounded-[48px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col md:flex-row relative z-10 my-10"
      >
        
        {/* LEFT COLUMN: VISUAL HERO (FLAT AMETHYST) */}
        <div className="w-full md:w-[45%] relative overflow-hidden flex flex-col justify-between p-12 text-white">
          <div 
            className="absolute inset-0 transition-colors duration-1000"
            style={{ backgroundColor: settings?.login_hero_bg_color || '#916DD5' }}
          />
          
          {/* Hero Image Overlay (If exists) */}
          {settings?.login_hero_image && (
            <div 
              className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.login_hero_image})` }}
            />
          )}

          {/* Sisi kiri sekarang sengaja dikosongkan agar fokus pada gambar hero */}
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="flex-1 bg-white py-12 px-12 md:py-20 md:px-20 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full space-y-10">
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6 mb-10">
                 <img src="/assets/aruneeka.png" alt={settings?.agency_name || "Aruneeka Logo"} className="h-16 w-auto object-contain" />
                 <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                       {settings?.agency_name ? `Welcome to ${settings.agency_name}` : "Hallo, Welcome Back!"}
                    </h2>
                    <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                       {settings?.agency_name 
                         ? `Rencanakan strategi konten terbaik untuk ${settings.agency_name} di Aruneeka Pro.` 
                         : "Login untuk bisa menggunakan konten plan dan buat sistem konten yang lebih efektif"}
                    </p>
                 </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Squad Username</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-1 text-slate-300 group-focus-within:text-amethyst-primary transition-colors">
                        <User size={18} />
                      </div>
                      <input 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-slate-100 py-4 pl-8 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-amethyst-primary transition-all placeholder:text-slate-200"
                        placeholder="Username"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Security Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-1 text-slate-300 group-focus-within:text-amethyst-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-slate-100 py-4 pl-8 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-amethyst-primary transition-all placeholder:text-slate-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-600 rounded-lg text-[11px] font-bold"
                    >
                      <AlertCircle size={16} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 space-y-6">
                  <button 
                    disabled={isLoading}
                    className="w-full py-5 bg-amethyst-dark text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-amethyst-dark/20 hover:bg-black hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        Enter Dashboard
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-6 pt-6">
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Belum punya akun?</span>
                     <button 
                       type="button" 
                       onClick={() => setRegMode('tnc')}
                       className="text-amethyst-primary text-[11px] font-black uppercase tracking-[0.2em] hover:text-black transition-colors underline underline-offset-8 decoration-amethyst-light"
                     >
                        Daftar disini
                     </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* REGISTRATION OVERLAY SYSTEM */}
      <AnimatePresence>
        {regMode !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
          >
            {regMode === 'tnc' ? (
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 space-y-8 max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-black text-slate-800">Terms & Conditions</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aruneeka Pro Intelligence System</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-sm text-slate-600 leading-relaxed font-medium styled-scrollbar">
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">1. Cara Penggunaan</h4>
                      <p>Aplikasi Aruneeka Pro dirancang khusus untuk agensi untuk mengelola strategi konten dan analitik. Pengguna bertanggung jawab penuh atas data yang diinputkan ke dalam sistem.</p>
                   </div>
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">2. Hak Akses & Keamanan</h4>
                      <p>Akses diberikan secara personal dan dilarang membagikan kredensial login kepada pihak lain. Sistem kami memantau aktivitas untuk mencegah pelanggaran keamanan.</p>
                   </div>
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">3. Subscription & Pricing</h4>
                      <p>Aplikasi ini beroperasi dengan sistem langganan (Subscription). Harga langganan dapat berubah sewaktu-waktu sesuai dengan kebijakan pengembangan fitur dan kondisi pasar agensi global.</p>
                   </div>
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">4. Copyright</h4>
                      <p>Seluruh sistem, desain UI/UX, dan algoritma analitik Aruneeka Pro adalah hak milik intelektual pengembang dan dilindungi oleh undang-undang hak cipta.</p>
                   </div>
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">5. Penambahan Anggota Tim</h4>
                      <p>Pendaftaran anggota tim (Sub-user) harus dilakukan secara internal oleh Pemilik Agensi melalui menu Manajemen Tim di dalam dasbor. Anggota tim dilarang mendaftar secara mandiri melalui halaman pendaftaran publik untuk menjaga integritas data workspace.</p>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     onClick={() => setRegMode('none')}
                     className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                   >
                     Batalkan
                   </button>
                   <button 
                     onClick={() => setRegMode('form')}
                     className="flex-[2] py-4 bg-amethyst-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-amethyst-primary/30 hover:bg-black transition-all flex items-center justify-center gap-2"
                   >
                     Saya Setuju & Lanjut
                     <ChevronRight size={14} />
                   </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 space-y-8"
              >
                 <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Daftarkan Akun</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lengkapi data agensi Anda</p>
                 </div>

                 <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[60vh] pr-2 styled-scrollbar">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
                       <input 
                         value={regData.fullName}
                         onChange={(e) => setRegData({...regData, fullName: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                         placeholder="e.g. John Doe"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Aktif</label>
                       <input 
                         type="email"
                         value={regData.email}
                         onChange={(e) => setRegData({...regData, email: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                         placeholder="john@agency.com"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">ID Username</label>
                       <input 
                         value={regData.username}
                         onChange={(e) => setRegData({...regData, username: e.target.value})}
                         className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                         placeholder="pilih username unik"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                             Password <span className="text-amethyst-primary opacity-50">(min. 6)</span>
                          </label>
                          <input 
                            type="password"
                            value={regData.password}
                            onChange={(e) => setRegData({...regData, password: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                            placeholder="••••••"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Konfirmasi</label>
                          <input 
                            type="password"
                            value={regData.confirmPassword}
                            onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
                            placeholder="••••••"
                          />
                          {regData.confirmPassword && regData.password !== regData.confirmPassword && (
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest pl-1 animate-pulse">Password tidak cocok!</p>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-2">
                    <button 
                      onClick={() => setRegMode('tnc')}
                      className="p-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
                    >
                       <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={handleRegister}
                      disabled={
                        isLoading || 
                        !regData.fullName || 
                        !regData.email || 
                        !regData.username || 
                        regData.password.length < 6 || 
                        regData.password !== regData.confirmPassword
                      }
                      className="flex-1 py-4 bg-amethyst-dark text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                    >
                       {isLoading ? <Loader2 className="animate-spin" size={16} /> : (
                         <>
                           Kirim Pendaftaran
                           <CheckCircle2 size={16} />
                         </>
                       )}
                    </button>
                 </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* IDENTITY SETUP OVERLAY (FOR NEW USERS) */}
      <AnimatePresence>
        {showIdentitySetup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-amethyst-dark/40 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
            >
               {/* SISI KIRI: LIVE PREVIEW (CINEMATIC CARD FRAME) */}
               <div className="md:w-2/5 p-12 bg-slate-50 flex flex-col items-center justify-center relative border-r border-slate-100 min-h-[600px]">
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]" />
                  
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-10 relative z-10">
                     {/* THE 4:5 FRAME CARD */}
                     <motion.div 
                       initial={{ scale: 0.8, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       style={{ backgroundColor: selectedColor }}
                       className="w-full max-w-[280px] aspect-[4/5] rounded-[48px] shadow-[0_30px_70px_rgba(0,0,0,0.12)] relative overflow-hidden flex items-center justify-center border-[10px] border-white group"
                     >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <AnimatePresence mode="wait">
                           <motion.div 
                              key={selectedAvatar}
                              initial={{ opacity: 0, scale: 1.1, y: 10 }}
                              animate={{ opacity: 1, scale: 1.35, y: 15 }} 
                              exit={{ opacity: 0, scale: 1 }}
                              className="relative z-10 w-full h-full flex items-center justify-center p-6"
                           >
                              {selectedAvatar ? (
                                 <img src={selectedAvatar} alt="Preview" className="w-[85%] h-[85%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]" />
                              ) : (
                                 <div className="text-white/40"><Palette size={48} /></div>
                              )}
                           </motion.div>
                        </AnimatePresence>
                     </motion.div>

                     {/* IDENTITY LABEL (OUTSIDE BOX) */}
                     <div className="text-center space-y-1">
                        <h4 className="text-slate-800 font-black text-2xl tracking-tight capitalize">{loggedInUser?.full_name}</h4>
                        <div className="flex items-center justify-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Personal Identity</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* SISI KANAN: SELECTION CONTROLS */}
               <div className="flex-1 p-10 md:p-14 space-y-10 overflow-y-auto max-h-[85vh] styled-scrollbar">
                  <div className="space-y-2">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-amethyst-light/20 text-amethyst-primary rounded-full">
                        <ShieldCheck size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Initialization</span>
                     </div>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tight">Identity Studio</h3>
                     <p className="text-[13px] font-medium text-slate-400">Padukan avatar dan warna favorit Anda.</p>
                  </div>

                  <div className="space-y-8">
                     {/* Avatar Picker */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Avatar</span>
                           <span className="text-[10px] font-bold text-amethyst-primary">{avatars.length} Identitas</span>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-visible">
                           {avatars.map((url, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setSelectedAvatar(url)}
                                className={`relative aspect-square transition-all duration-300 flex items-center justify-center ${selectedAvatar === url ? 'ring-[4px] ring-amethyst-primary rounded-full scale-110 z-10' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                              >
                                 <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-contain p-1" />
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Color Picker */}
                     <div className="space-y-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Warna Background</span>
                        <div className="flex items-center gap-4">
                           {colors.map(color => (
                              <button 
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                style={{ backgroundColor: color }}
                                className={`w-8 h-8 rounded-full transition-all duration-300 ${selectedColor === color ? 'ring-4 ring-slate-100 ring-offset-2 scale-110 shadow-lg' : 'hover:scale-110'}`}
                              />
                           ))}
                           
                           {/* Custom Color Input */}
                           <div className="relative group">
                              <input 
                                 type="color" 
                                 value={selectedColor}
                                 onChange={(e) => setSelectedColor(e.target.value)}
                                 className="absolute inset-0 opacity-0 cursor-pointer z-20"
                              />
                              <button className={`w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-amethyst-primary group-hover:text-white transition-all ${!colors.includes(selectedColor) ? 'bg-amethyst-primary text-white border-transparent scale-110' : ''}`}>
                                 <Palette size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6">
                     <button 
                       onClick={saveIdentity}
                       disabled={isLoading || !selectedAvatar}
                       className="w-full py-4 bg-amethyst-dark text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                     >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                          <>
                            Selesaikan & Masuk Dashboard
                            <ChevronRight size={16} />
                          </>
                        )}
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REGISTRATION SUCCESS MODAL */}
      <AnimatePresence>
        {regSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 40 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-md bg-white rounded-[48px] shadow-2xl p-10 text-center space-y-8"
             >
                <div className="flex flex-col items-center space-y-6">
                   <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                      <CheckCircle2 size={48} strokeWidth={2.5} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight">Pendaftaran Berhasil!</h3>
                      <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                        Akun Anda sedang dalam antrean konfirmasi Superuser. Anda kini bisa login untuk eksplorasi awal.
                      </p>
                   </div>
                </div>

                <div className="pt-4">
                   <button 
                     onClick={() => setRegSuccess(false)}
                     className="w-full py-5 bg-amethyst-dark text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all"
                   >
                      Kembali ke Login
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
