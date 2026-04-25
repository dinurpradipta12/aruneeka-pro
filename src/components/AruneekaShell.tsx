'use client';

import React, { useState, useEffect, memo, createContext } from 'react';
import {
   BarChart2,
   Settings,
   ChevronLeft,
   Calendar,
   Target,
   Layout,
   TrendingUp,
   Zap,
   Users,
   Plus,
   ChevronDown,
   Check,
   Share2,
   ShieldCheck,
   LogOut,
   Bell,
   Palette,
   Inbox,
   AlertCircle,
   ChevronRight,
   Clock,
   User,
   Eye,
   EyeOff,
   ArrowLeft,
   Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NewContentWizard from './NewContentWizard';
import SocialProfilesModal from './SocialProfilesModal';
import { AruneekaWorkspaceSelector } from './AruneekaWorkspaceSelector';
import AruneekaUpgradeModal from './AruneekaUpgradeModal';
import { supabase } from '@/lib/supabase';

// --- SUB-COMPONENTS (Optimized to prevent Shell re-renders) ---

const MotivationBubble = memo(() => {
   const [showBubble, setShowBubble] = useState(false);
   const [bubbleType, setBubbleType] = useState<"motivation" | "subscribe">("motivation");
   const [currentMessage, setCurrentMessage] = useState("");
   const { subscriptionTier, openUpgrade } = useWorkspace();

   const messages = [
      "Eh, udah cek hook Reels hari ini belum? 👀",
      "Ide brilian itu suka kabur, mending catat sekarang sebelum lupa!",
      "Analitik lagi naik? Yes! Saatnya gas konten berkualitas 🚀",
      "Engagement lagi sepi? Coba dulu nyapa audiens di kolom komentar~",
      "Satu postingan lagi, kamu! Konsistensi itu yang bikin beda.",
      "Yuk bikin skrip yang bikin audiens lupa mau skip 🎬",
      "Visual yang estetik itu seperti senyum pertama — langsung bikin betah",
      "Sudah kepoin hashtag trending hari ini? Jangan sampai ketinggalan!",
      "KPI tercapai? Serius, kamu keren banget! 🎉",
      "Draft kamu udah nongkrong lama nih, kapan giliran diproduksi? 😄",
      "Ayo squad, target bulan ini udah keliatan ujungnya! 💪"
   ];

   useEffect(() => {
      let cycle = 0; 

      const handleDisplay = () => {
         cycle = (cycle + 1) % 4; 
         const isSubscribeCycle = cycle % 2 === 0;
         
         if (isSubscribeCycle && subscriptionTier === "free") {
            setBubbleType("subscribe");
            setCurrentMessage("Mau akses penuh aplikasi ini? Segera subscribe biar hasilnya bisa maksimal");
         } else {
            setBubbleType("motivation");
            setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
         }

         setShowBubble(true);
         setTimeout(() => setShowBubble(false), 10000); 
      };

      const timer = setInterval(handleDisplay, 60000); 
      const initial = setTimeout(handleDisplay, 10000); 

      return () => {
         clearInterval(timer);
         clearTimeout(initial);
      };
   }, [subscriptionTier]);

   return (
      <AnimatePresence>
         {showBubble && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.5, y: 20, x: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} 
               exit={{ opacity: 0, scale: 0.5, y: 10, x: 10 }} 
               className={`absolute bottom-6 right-28 w-56 p-5 rounded-[32px] shadow-2xl border backdrop-blur-xl ${bubbleType === "subscribe" ? "bg-amethyst-primary text-white border-white/20" : "bg-white/90 text-slate-700 border-white/40"}`}
            >
               {bubbleType === "subscribe" && (
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                     <Zap size={18} className="fill-current" />
                  </div>
               )}
               <p className={`text-[11px] font-black leading-relaxed ${bubbleType === "subscribe" ? "text-white" : "text-slate-700"}`}>
                  {currentMessage}
               </p>
               {bubbleType === "subscribe" && (
                  <button 
                    onClick={() => { setShowBubble(false); openUpgrade(); }}
                    className="mt-4 w-full py-2.5 bg-white text-amethyst-primary rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                  >
                     Upgrade Now
                  </button>
               )}
               <div className={`absolute -bottom-2 -right-2 w-6 h-6 rotate-45 border-r border-b ${bubbleType === "subscribe" ? "bg-amethyst-primary border-white/20" : "bg-white/90 border-white/40"}`} />
            </motion.div>
         )}
      </AnimatePresence>
   );
});


const navItems = [
   { label: 'Dashboard', icon: <Layout size={16} />, href: '/' },
   { label: 'KPI Section', icon: <Target size={16} />, href: '/strategy' },
   { label: 'Content Plan', icon: <Calendar size={16} />, href: '/content' },
   { label: 'Performance', icon: <TrendingUp size={16} />, href: '/analytics' },
   { label: 'Team Squad', icon: <Users size={16} />, href: '/manage' },
];

const adminItems = [
   { label: 'User Management', icon: <ShieldCheck size={16} />, href: '/admin/users' },
   { label: 'System Styling', icon: <Palette size={16} />, href: '/admin/appearance' },
];

// Multi-Tenant Context for global access
interface WorkspaceContextType {
  selectedWorkspaceId?: string;
  selectedWorkspace?: any;
  setSelectedWorkspace: (ws: any) => void;
  subscriptionTier?: string;
  openUpgrade: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
  setSelectedWorkspace: () => {},
  subscriptionTier: 'free',
  openUpgrade: () => {}
});

export const useWorkspace = () => React.useContext(WorkspaceContext);

// --- MAIN SHELL ---

const AruneekaShell = ({ children, onNewStrategy }: { children: React.ReactNode, onNewStrategy?: () => void }) => {
   const pathname = usePathname();
   const [isWizardOpen, setIsWizardOpen] = useState(false);
   const [isProfilesOpen, setIsProfilesOpen] = useState(false);
   const [user, setUser] = useState<any>(null);
   const [initializing, setInitializing] = useState(true);
   const [teamCount, setTeamCount] = useState(0);
   const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
   const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
   const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
   const [isWsSelectorOpen, setIsWsSelectorOpen] = useState(false);
   const [workspaces, setWorkspaces] = useState<any[]>([]);

   const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
   const [isEditorOpen, setIsEditorOpen] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
   
   const [editForm, setEditForm] = useState({ fullName: '', password: '', email: '', avatar: '', systemRole: '', displayRole: '' });
   const [isSavingProfile, setIsSavingProfile] = useState(false);
   const [profiles, setProfiles] = useState<any[]>([]);
   const [selectedProfile, setSelectedProfile] = useState<any>(null);
   const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
   const [showRealtimeSuccess, setShowRealtimeSuccess] = useState(false);
   const [currentTier, setCurrentTier] = useState<string>('free');

   const avatars = Array.from({ length: 12 }, (_, i) => `/assets/avatars/avatar${i + 1}.svg`);

   const parseRoles = (u: any) => {
      const dbRole = u.role || 'Member';
      let title = '';
      if (u.theme_color && u.theme_color.includes('::')) {
         const parts = u.theme_color.split('::');
         title = parts[0];
      } else if (!['Superuser', 'Owner', 'Admin', 'Member'].includes(dbRole)) {
         title = dbRole;
      }
      return {
         systemRole: ['Superuser', 'Owner', 'Admin', 'Member'].includes(dbRole) ? dbRole : 'Owner',
         displayRole: title || dbRole
      };
   };

   useEffect(() => {
      const storedUser = localStorage.getItem('aruneeka_user');
      if (!storedUser && pathname !== '/login') {
         window.location.href = '/login';
         return;
      }
      if (storedUser) {
         const parsed = JSON.parse(storedUser);
         const { systemRole, displayRole } = parseRoles(parsed);
         setUser(parsed);
         setEditForm({
            fullName: parsed.full_name || '',
            password: parsed.password || '',
            email: parsed.email || parsed.username + '@aruneeka.pro',
            avatar: parsed.avatar_url || '',
            systemRole,
            displayRole
         });

         // Ambil data langganan terbaru
         const syncSub = async () => {
            const { data } = await supabase
              .from('v2_agency_users')
              .select('subscription_tier')
              .eq('id', parsed.id)
              .single();
            if (data) setSubscriptionTier(data.subscription_tier || 'free');
         };
         syncSub();

         const savedWsStr = localStorage.getItem('aruneeka_selected_workspace');
         if (savedWsStr) {
            const ws = JSON.parse(savedWsStr);
            setSelectedWorkspace(ws);
            
            // Pulihkan profil spesifik untuk brand ini
            const savedProfStr = localStorage.getItem(`aruneeka_selected_profile_${ws.id}`);
            if (savedProfStr) {
               setSelectedProfile(JSON.parse(savedProfStr));
            }
         }
         
         fetchProfiles();
         fetchTeamCount();
      }
      setInitializing(false);
   }, []);

    const fetchTeamCount = async () => {
       try {
          const wsId = selectedWorkspace?.id;
          if (!wsId) return;

   useEffect(() => {
      if (user) {
         const channel = supabase
           .channel(`global-user-sync-${user.id}`)
           .on(
             "postgres_changes",
             {
               event: "UPDATE",
               schema: "public",
               table: "v2_agency_users",
               filter: `id=eq.${user.id}`
             },
             (payload) => {
               const oldTier = subscriptionTier;
               const newTier = payload.new.subscription_tier;
               if (newTier !== oldTier && (newTier === "pro" || newTier === "agency")) {
                  setSubscriptionTier(newTier);
                  localStorage.setItem("aruneeka_user", JSON.stringify(payload.new));
                  setIsUpgradeModalOpen(false);
                  setShowRealtimeSuccess(true);
               }
             }
           )
           .subscribe();
         return () => {
           supabase.removeChannel(channel);
         };
      }
   }, [user, subscriptionTier]);

          
          const { count } = await supabase
            .from('v2_agency_workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', wsId);
          
          setTeamCount(count || 0);
       } catch (e) { console.error(e); }
    };

   useEffect(() => {
      if (profiles.length > 0) {
         const cachedProfileId = localStorage.getItem("aruneeka_selected_profile_id");
         if (cachedProfileId) {
            const found = profiles.find(p => p.id === cachedProfileId);
            if (found) setSelectedProfile(found);
         }
      }
   }, [profiles]);

    const fetchProfiles = async () => {
       try {
          const workspaceId = selectedWorkspace?.id;
           if (!workspaceId) return;
          const { data } = await supabase.from('v2_agency_social_profiles').select('*').eq('workspace_id', workspaceId).order('name');
          if (data) setProfiles(data);
       } catch (e) { console.error(e); }
    };

    const handleSaveContent = async (data: any) => {
       try {
          const userStr = localStorage.getItem('aruneeka_user');
          if (!userStr) {
            alert("Sesi berakhir, silakan login kembali.");
            return;
          }
          const currentUser = JSON.parse(userStr);
          
          // Ambil dari state, jika kosong ambil langsung dari localStorage (lebih akurat)
          let workspaceId = selectedWorkspace?.id;
          if (!workspaceId) {
            const savedWsStr = localStorage.getItem('aruneeka_selected_workspace');
            if (savedWsStr) {
              const savedWs = JSON.parse(savedWsStr);
              workspaceId = savedWs.id;
            }
          }
          
          if (!workspaceId) {
            alert("Sistem tidak menemukan Brand yang aktif. Silakan pilih brand ulang.");
            return;
          }

          const payload = {
            workspace_id: workspaceId,
            user_id: currentUser.id,
            author_name: currentUser.full_name || "Team Member",
            title: data.headline || data.title || "Untitled Task",
            description: data.description || null,
            platform: data.platform || null,
            content_pillar: data.content_pillar || null,
            target_account: data.target_account || null,
            status: data.status || 'Draft',
            due_date: data.due_date || null,
            script_link: data.script_link || null,
            content_link: data.content_link || null,
            post_link: data.post_link || null,
            metrics_updated: false,
            metrics: {}
          };

          const { error } = await supabase.from('v2_agency_content_plans').insert([payload]);
          
          if (error) {
            console.error("Save Error:", error);
            alert("Gagal simpan: " + error.message);
          } else {
            // Success
            setIsWizardOpen(false);
            if (pathname === '/content') {
              // Jika di halaman konten, biarkan halaman me-refresh datanya (biasanya lewat reload atau state)
              window.location.reload();
            } else {
              window.location.href = '/content';
            }
          }
       } catch (err: any) { 
         console.error("Runtime Error:", err);
         alert("Terjadi kesalahan sistem."); 
       }
    };

   const handleSaveProfile = async () => {
      if (!editForm.fullName || !editForm.password) return;
      setIsSavingProfile(true);
      try {
         const originalColor = user?.theme_color?.includes('::') ? user.theme_color.split('::')[1] : (user?.theme_color || '#916DD5');
         const packedColor = `${editForm.displayRole}::${originalColor}`;
         const { error } = await supabase.from('v2_agency_users').update({
            full_name: editForm.fullName, password: editForm.password, email: editForm.email,
            avatar_url: editForm.avatar, role: editForm.systemRole, theme_color: packedColor
         }).eq('id', user.id);
         if (error) throw error;
         const newUser = { ...user, full_name: editForm.fullName, password: editForm.password, email: editForm.email, avatar_url: editForm.avatar, role: editForm.systemRole, theme_color: packedColor };
         setUser(newUser);
         localStorage.setItem('aruneeka_user', JSON.stringify(newUser));
         setIsEditorOpen(false);
      } catch (e: any) { alert("Failed: " + e.message); } finally { setIsSavingProfile(false); }
   };

    const handleWorkspaceSelect = (ws: any) => {
       setSelectedWorkspace(ws);
       
       // Coba pulihkan profil terakhir untuk brand ini
       const savedProfStr = localStorage.getItem(`aruneeka_selected_profile_${ws.id}`);
       if (savedProfStr) {
          setSelectedProfile(JSON.parse(savedProfStr));
       } else {
          setSelectedProfile(null);
       }

       localStorage.setItem('aruneeka_selected_workspace', JSON.stringify(ws));
       setIsWsSelectorOpen(false);
       fetchProfiles();
       fetchTeamCount();
    };

   if (initializing) {
      return (
        <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center">
           <motion.div 
             animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="w-20 h-20"
           >
              <img src="/assets/aruneeka.png" className="w-full h-full object-contain grayscale opacity-20" />
           </motion.div>
        </div>
      );
    }

   if (!selectedWorkspace && user) {
      return (
         <AruneekaWorkspaceSelector 
            currentUser={user} 
            onSelect={handleWorkspaceSelect} 
         />
      );
   }

   return (
      <WorkspaceContext.Provider value={{ 
        selectedWorkspaceId: selectedWorkspace?.id, 
        selectedWorkspace,
        setSelectedWorkspace,
        subscriptionTier,
        openUpgrade: () => setIsUpgradeModalOpen(true)
      }}>
         <div className="min-h-screen bg-[#FDFCFE] text-amethyst-dark pb-20 font-inter relative antialiased">
            <AnimatePresence>
               {user?.status === 'Pending' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4">
                     <div className="bg-white rounded-[40px] p-10 text-center space-y-6 w-full max-w-lg shadow-2xl">
                        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto"><Clock size={32} className="animate-spin-slow" /></div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Akun menunggu verifikasi</h3>
                        <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Sabar ya, Superuser sedang memeriksa akun Anda. Anda akan segera bisa mengeksplorasi Aruneeka Pro!</p>
                        <button onClick={() => { localStorage.removeItem('aruneeka_user'); window.location.href = '/login'; }} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] hover:bg-rose-50 hover:text-rose-500 transition-all">Keluar</button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <header className="p-8 max-w-[1600px] mx-auto">
               <div className="rounded-[32px] p-10 text-white relative flex items-center justify-between border border-white/10 shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #916DD5 0%, #AC8BEE 100%)' }}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                   <div className="relative z-10 space-y-5">
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSelectedWorkspace(null)}
                          className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                           <ArrowLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all group" onClick={() => setIsProfilesOpen(true)}>
                           <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">
                              {selectedProfile ? (
                                 selectedProfile.avatar ? (
                                    <img src={selectedProfile.avatar} className="w-full h-full object-cover rounded-lg" />
                                 ) : (() => {
                                    const p = selectedProfile.platform?.toLowerCase() || '';
                                    if (p.includes('instagram')) return <img src="https://cdn.simpleicons.org/instagram/white" className="w-3 h-3" alt="IG" />;
                                    if (p.includes('tiktok')) return <img src="https://cdn.simpleicons.org/tiktok/white" className="w-3 h-3" alt="TT" />;
                                    if (p.includes('threads')) return <img src="https://cdn.simpleicons.org/threads/white" className="w-3 h-3" alt="TH" />;
                                    if (p.includes('youtube')) return <img src="https://cdn.simpleicons.org/youtube/white" className="w-3 h-3" alt="YT" />;
                                    if (p.includes('facebook')) return <img src="https://cdn.simpleicons.org/facebook/white" className="w-3 h-3" alt="FB" />;
                                    return <span className="text-white opacity-80">{selectedProfile.name.charAt(0)}</span>;
                                 })()
                              ) : <Share2 size={12} />}
                           </div>
                           <span className="text-[10px] font-black">
                              {selectedProfile ? selectedProfile.name : 'Pilih akun'}
                           </span>
                           <ChevronRight size={12} className="opacity-40 group-hover:translate-x-1 transition-all" />
                        </div>
                     </div>
                     
                     <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">
                           {selectedWorkspace?.name || 'Aruneeka Pro Intelligence'}
                        </h1>
                        <div className="flex items-center gap-6 text-white/80 text-[10px] font-black tracking-[0.05em]">
                           <div className="flex items-center gap-2">
                              <Users size={12} className="text-white/60" /> 
                              {teamCount} Personel di Workspace
                           </div>
                           <div className="flex items-center gap-2 text-white/20">•</div>
                           <div className="flex items-center gap-2 text-white/60">
                              <BarChart2 size={12} className="text-white/60" /> 
                              Persona — {editForm.fullName}
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-end gap-10">
                     <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setIsWizardOpen(true)} className="bg-white text-amethyst-dark px-10 py-5 rounded-2xl flex items-center gap-3 shadow-xl font-black transition-all">
                        <Plus size={18} /> <span className="text-[11px]">Persiapkan konten</span>
                     </motion.button>
                  </div>
               </div>
            </header>

            <div className="px-8 max-w-[1600px] mx-auto mt-4 relative z-20">
               <nav className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-1.5 inline-flex items-center shadow-xl shadow-amethyst-primary/5">
                  <div className="flex items-center gap-1">
                     {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className={`px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all ${pathname === item.href ? 'bg-amethyst-dark text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-amethyst-primary hover:bg-slate-50'}`}>
                           {item.icon} <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                     ))}
                  </div>
               </nav>
            </div>

            <main className="px-8 max-w-[1600px] mx-auto mt-10">
               {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as any, { 
                  selectedProfileId: selectedProfile?.id, 
                  selectedWorkspaceId: selectedWorkspace?.id,
                  subscriptionTier
               }) : child)}
            </main>

            <AnimatePresence>
               {isEditorOpen && (
                  <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-4xl rounded-[50px] shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-black/20">
                        <div className="md:w-1/3 p-10 bg-slate-50 border-r border-slate-100 flex flex-col gap-10">
                           <div className="space-y-4"><h3 className="text-2xl font-black tracking-tight">Identity studio</h3><p className="text-[10px] text-slate-400 font-bold">Select persona</p></div>
                           <div className="grid grid-cols-3 gap-3">{avatars.map(url => (<button key={url} onClick={() => setEditForm(prev => ({ ...prev, avatar: url }))} className={`aspect-square rounded-2xl p-2 transition-all ${editForm.avatar === url ? 'bg-amethyst-primary ring-4 ring-amethyst-light/30' : 'bg-white hover:bg-slate-100'}`}><img src={url} alt="Avatar" className="w-full h-full object-contain" /></button>))}</div>
                        </div>
                        <div className="flex-1 p-12 space-y-8 overflow-y-auto max-h-[85vh]">
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 pl-1">Full name</label><input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/10 transition-all" /></div>
                              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 pl-1">Display title</label><input value={editForm.displayRole} onChange={e => setEditForm(p => ({ ...p, displayRole: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/10 transition-all" /></div>
                           </div>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between px-1"><label className="text-[10px] font-black text-slate-400">Security password</label><button onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-black text-amethyst-primary">{showPassword ? 'Hide' : 'Show'}</button></div>
                              <input type={showPassword ? 'text' : 'password'} value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/10 transition-all" />
                           </div>
                           <div className="flex gap-4 pt-6"><button onClick={() => setIsEditorOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] hover:bg-slate-100 transition-all">Cancel</button><button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-[2] py-5 bg-amethyst-dark text-white rounded-2xl font-black text-[11px] shadow-xl shadow-amethyst-dark/20 hover:bg-black transition-all">{isSavingProfile ? 'Saving...' : 'Update persona'}</button></div>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>

            {user && (
               <div className="fixed bottom-10 right-10 z-[1000]">
                  <MotivationBubble />
                  <AnimatePresence>
                     {isProfilePopupOpen && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-32 right-0 w-80 bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden p-3 space-y-2">
                           <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[30px] mb-1">
                              <div className="w-24 h-24 mb-4 drop-shadow-xl"><img src={user?.avatar_url || '/assets/avatars/avatar1.svg'} alt="Identity" className="w-full h-full object-contain" /></div>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight">{user?.full_name}</h4>
                              <span className="text-[9px] font-black text-amethyst-primary mt-1">{editForm.displayRole}</span>
                           </div>
                           <button onClick={() => { setIsEditorOpen(true); setIsProfilePopupOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-slate-50 transition-all text-slate-400 hover:text-amethyst-primary">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Settings size={18} /></div>
                              <div className="text-left"><div className="text-sm font-black text-slate-700">Identity studio</div><div className="text-[9px] font-bold opacity-50">Persona setup</div></div>
                           </button>
                           <button onClick={() => { localStorage.removeItem('aruneeka_user'); window.location.href = '/login'; }} className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-rose-50 transition-all text-slate-300 hover:text-rose-500">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><LogOut size={18} /></div>
                              <div className="text-left"><div className="text-sm font-black text-rose-600">Terminate account</div><div className="text-[9px] font-bold opacity-50">Logout session</div></div>
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>
                  <motion.button whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} className="w-24 h-24 overflow-hidden drop-shadow-2xl hover:drop-shadow-amethyst transition-all"><img src={user?.avatar_url || '/assets/avatars/avatar1.svg'} alt="Profile" className="w-full h-full object-contain" /></motion.button>
               </div>
            )}

            <NewContentWizard 
              isOpen={isWizardOpen} 
              onClose={() => setIsWizardOpen(false)} 
              onSave={handleSaveContent} 
              selectedWorkspaceId={selectedWorkspace?.id}
              selectedProfileId={selectedProfile?.id}
            />
            <SocialProfilesModal 
               isOpen={isProfilesOpen} 
               onClose={() => setIsProfilesOpen(false)} 
               selectedWorkspaceId={selectedWorkspace?.id}
                onSelect={(p) => { 
                  setSelectedProfile(p); 
                  if (selectedWorkspace?.id) {
                    localStorage.setItem(`aruneeka_selected_profile_${selectedWorkspace.id}`, JSON.stringify(p)); 
                  }
                }} 
            />
            <AruneekaUpgradeModal 
               isOpen={isUpgradeModalOpen} 
               onClose={() => setIsUpgradeModalOpen(false)} 
               user={user}
            />

            {/* Global Realtime Success Celebration */}
            <AnimatePresence>
              {showRealtimeSuccess && (
                 <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-amethyst-dark/40 backdrop-blur-md" 
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl relative z-10 space-y-8" 
                    >
                       <div className="relative">
                          <div className="absolute inset-0 bg-amethyst-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                          <div className="w-24 h-24 bg-gradient-to-br from-amethyst-primary to-amethyst-dark text-white rounded-[40px] flex items-center justify-center mx-auto relative shadow-2xl shadow-amethyst-primary/40 rotate-12">
                             <Zap size={40} className="fill-current" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Upgrade Successful!</h3>
                          <p className="text-xs font-bold text-slate-400 leading-relaxed italic px-4">
                             "Pembayaran Anda telah dikonfirmasi, selamat menggunakan aplikasi!"
                          </p>
                       </div>
                       <button onClick={() => setShowRealtimeSuccess(false)} className="w-full py-5 bg-amethyst-primary text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all">
                          Ayo Mulai!
                       </button>
                    </motion.div>
                 </div>
              )}
            </AnimatePresence>
         </div>
      </WorkspaceContext.Provider>
   );
};

export default memo(AruneekaShell);
