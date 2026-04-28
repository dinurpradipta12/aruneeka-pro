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
   Terminal,
   Sparkles,
   Megaphone,
   RefreshCcw,
   Activity,
   Monitor
 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NewContentWizard from './NewContentWizard';
import SocialProfilesModal from './SocialProfilesModal';
import { AruneekaWorkspaceSelector } from './AruneekaWorkspaceSelector';
import AruneekaUpgradeModal from './AruneekaUpgradeModal';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const AruneekaOnboarding = dynamic(() => import('./AruneekaOnboarding'), { ssr: false });

// --- SUB-COMPONENTS (Optimized to prevent Shell re-renders) ---

const MotivationBubble = memo(({ forceHide }: { forceHide?: boolean }) => {
   const [showBubble, setShowBubble] = useState(false);
   const [bubbleType, setBubbleType] = useState<"motivation" | "subscribe" | "tutorial">("motivation");
   const [currentMessage, setCurrentMessage] = useState("");
   const { subscriptionTier, openUpgrade, user } = useWorkspace();

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
         const isPowerUser = user?.role === 'developer' || user?.role === 'Superuser';
         
         if (cycle === 1 && subscriptionTier === "free" && !isPowerUser) {
            setBubbleType("subscribe");
            setCurrentMessage("Mau akses penuh aplikasi ini? Segera subscribe biar hasilnya bisa maksimal");
         } else if (cycle === 3) {
            setBubbleType("tutorial");
            setCurrentMessage("Bingung mulai dari mana? Klik profil kamu dan pilih 'Tutorial Singkat' untuk panduan di setiap halaman.");
         } else {
            setBubbleType("motivation");
            setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
         }

         setShowBubble(true);
         setTimeout(() => setShowBubble(false), 10000); 
      };

      const timer = setInterval(handleDisplay, 60000); 
      const initial = setTimeout(handleDisplay, 10000); 

      // REALTIME LISTENER: Detect Subscription Approval & Status Changes
      const userChannel = supabase
        .channel(`user-sync-${user?.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'v2_agency_users', filter: `id=eq.${user?.id}` },
          (payload) => {
             const updatedUser = payload.new as any;
             console.log("Realtime Profile Update:", updatedUser);

             // If tier changed to something higher than free, show celebration!
             if (user?.subscription_tier === 'free' && updatedUser.subscription_tier !== 'free') {
                // Note: This assumes the parent component handles the celebration state
             }

             // Auto-sync with local state & storage
             localStorage.setItem('aruneeka_user', JSON.stringify(updatedUser));
          }
        )
        .subscribe();

      return () => {
         clearInterval(timer);
         clearTimeout(initial);
         supabase.removeChannel(userChannel);
      };
   }, [subscriptionTier, user]);

   return (
      <AnimatePresence>
         {showBubble && !forceHide && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.5, y: 20, x: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} 
               exit={{ opacity: 0, scale: 0.5, y: 10, x: 10 }} 
               className={`absolute bottom-6 right-28 w-56 p-5 rounded-[32px] shadow-2xl border backdrop-blur-xl ${bubbleType !== "motivation" ? "bg-gradient-to-br from-[#916DD5] to-[#AC8BEE] text-white border-white/20" : "bg-white/90 text-slate-700 border-white/40"}`}
            >
               {bubbleType !== "motivation" && (
                  <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-bounce ${bubbleType === "subscribe" ? "bg-amber-400" : "bg-emerald-400"}`}>
                     {bubbleType === "subscribe" ? <Zap size={18} className="fill-current text-white" /> : <Sparkles size={18} className="text-white" />}
                  </div>
               )}
               <p className={`text-[11px] font-black leading-relaxed ${bubbleType !== "motivation" ? "text-white" : "text-slate-700"}`}>
                  {currentMessage}
               </p>
               {bubbleType === "subscribe" && (
                  <button 
                    onClick={() => { setShowBubble(false); openUpgrade(); }}
                    className="mt-4 w-full py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                  >
                     Upgrade Now
                  </button>
               )}
               {bubbleType === "tutorial" && (
                  <div className="mt-2 text-[8px] font-bold text-white/60 italic">
                    Tips: Klik avatar di pojok kanan bawah
                  </div>
               )}
               {/* Side Tail pointing to avatar */}
               <div 
                  className={`absolute top-[65%] -right-2.5 w-6 h-6 ${bubbleType !== "motivation" ? "bg-[#AC8BEE]" : "bg-white/90"} -z-10`}
                  style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
               />
            </motion.div>
         )}
      </AnimatePresence>
   );
});
MotivationBubble.displayName = 'MotivationBubble';


const navItems = [
   { label: 'Performance Dashboard', icon: <TrendingUp size={16} />, href: '/analytics' },
   { label: 'Content Plan', icon: <Calendar size={16} />, href: '/content' },
   { label: 'KPI Section', icon: <Target size={16} />, href: '/strategy' },
   { label: 'Team Squad', icon: <Users size={16} />, href: '/manage' },
];

const adminItems = [
   { label: 'User Management', icon: <ShieldCheck size={16} />, href: '/admin/users' },
   { label: 'System Styling', icon: <Palette size={16} />, href: '/admin/appearance' },
   { label: 'Inbox Center', icon: <Inbox size={16} />, href: '/admin/inbox' },
];

// Multi-Tenant Context for global access
interface WorkspaceContextType {
  selectedWorkspaceId?: string;
  selectedWorkspace?: any;
  setSelectedWorkspace: (ws: any) => void;
  subscriptionTier?: string;
  openUpgrade: () => void;
  user?: any;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
  selectedWorkspaceId: undefined,
  selectedWorkspace: null,
  setSelectedWorkspace: () => {},
  subscriptionTier: 'free',
  openUpgrade: () => {},
  user: null
});

export const useWorkspace = () => React.useContext(WorkspaceContext);

// --- MAIN SHELL ---

const AruneekaShell = ({ children, onNewStrategy }: { children: React.ReactNode, onNewStrategy?: () => void }) => {
   const pathname = usePathname();
   const [isWizardOpen, setIsWizardOpen] = useState(false);
   const [isProfilesOpen, setIsProfilesOpen] = useState(false);
   const [user, setUser] = useState<any>(() => {
      if (typeof window !== 'undefined') {
         const saved = localStorage.getItem('aruneeka_user');
         return saved ? JSON.parse(saved) : null;
      }
      return null;
   });
   const [initializing, setInitializing] = useState(true);
   const [teamCount, setTeamCount] = useState(0);
   const [selectedWorkspace, setSelectedWorkspace] = useState<any>(() => {
      if (typeof window !== 'undefined') {
         const saved = localStorage.getItem('aruneeka_selected_workspace');
         return saved ? JSON.parse(saved) : null;
      }
      return null;
   });
   const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
   const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
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

   // Administrative Realtime States
   const [pendingUsersCount, setPendingUsersCount] = useState(0);
   const [pendingInboxCount, setPendingInboxCount] = useState(0);
   const [lastNotification, setLastNotification] = useState<{ type: 'user' | 'inbox' | 'success' | 'error', message: string } | null>(null);
   const [showDynamicIsland, setShowDynamicIsland] = useState(false);

   const showToast = (message: string, type: any = 'success') => { setLastNotification({ type, message }); setShowDynamicIsland(true); setTimeout(() => setShowDynamicIsland(false), 4000); };
   const [systemConfig, setSystemConfig] = useState<any>(null);
   const [isDismissed, setIsDismissed] = useState(false);

   const avatars = Array.from({ length: 12 }, (_, i) => `/assets/avatars/avatar${i + 1}.svg`);

   const parseRoles = (u: any) => {
      const dbRole = u.role || 'Member';
      let title = '';
      if (u.theme_color && u.theme_color.includes('::')) {
         const parts = u.theme_color.split('::');
         title = parts[0];
      } else if (!['Superuser', 'Owner', 'Admin', 'Member', 'developer'].includes(dbRole)) {
         title = dbRole;
      }
      return {
         systemRole: ['Superuser', 'Owner', 'Admin', 'Member', 'developer'].includes(dbRole) ? dbRole : 'Owner',
         displayRole: title || dbRole
      };
   };
   useEffect(() => {
      const initSession = async () => {
         const storedUser = localStorage.getItem('aruneeka_user');
         if (!storedUser) {
            if (pathname !== '/login') window.location.href = '/login';
            return;
         }

         const parsed = JSON.parse(storedUser);
         
         // Fix: Fetch latest user record from DB to ensure parent_user_id is up to date
         const { data: latestUser } = await supabase.from('v2_agency_users').select('*').eq('id', parsed.id).single();
         const activeUser = latestUser || parsed;
         
         // Universal Override for Master Developer Account
         if (activeUser.username === 'arunika') {
            activeUser.role = 'developer';
            localStorage.setItem('aruneeka_user', JSON.stringify(activeUser));
         }
         
         const { systemRole, displayRole } = parseRoles(activeUser);
         setUser(activeUser);
         setEditForm({
            fullName: activeUser.full_name || '',
            password: activeUser.password || '',
            email: activeUser.email || activeUser.username + '@aruneeka.pro',
            avatar: activeUser.avatar_url || '',
            systemRole,
            displayRole
         });

         // Combine initial data syncs
         const savedWsStr = localStorage.getItem('aruneeka_selected_workspace');
         const ws = savedWsStr ? JSON.parse(savedWsStr) : null;
         
         if (ws) {
            setSelectedWorkspace(ws);
            const savedProfStr = localStorage.getItem(`aruneeka_selected_profile_${ws.id}`);
            if (savedProfStr) setSelectedProfile(JSON.parse(savedProfStr));

            // Determine whose subscription to track (Owner vs Self)
            const trackingUserId = activeUser.parent_user_id || activeUser.id;

            // Parallel fetch remaining metadata
            Promise.all([
               supabase.from('v2_agency_users').select('role, subscription_tier, subscription_expiry').eq('id', trackingUserId).single(),
               supabase.from('v2_agency_social_profiles').select('*').eq('workspace_id', ws.id).order('name'),
               supabase.from('v2_agency_workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id)
            ]).then(([subRes, profRes, memberRes]) => {
               if (subRes.data) {
                  // If the tracked user (owner) is a Developer/Superuser, give them 'agency' access automatically
                  const isPowerUser = ['Superuser', 'developer'].includes(subRes.data.role);
                  setSubscriptionTier(isPowerUser ? 'agency' : (subRes.data.subscription_tier || 'free'));
                  setSubscriptionExpiry(subRes.data.subscription_expiry);
               }
               if (profRes.data) setProfiles(profRes.data);
               if (memberRes.count !== null) setTeamCount(memberRes.count);
            });
         }
         
         setInitializing(false);
      };

      initSession();
   }, []);

   useEffect(() => {
      const fetchGlobalSettings = async () => {
         const { data } = await supabase
            .from('v2_agency_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

         if (data) {
            setSystemConfig(data);
            const dismissed = localStorage.getItem('aruneeka_dismissed_announcement');
            if (dismissed === data.banner_message) {
               setIsDismissed(true);
            }
         }
      };
      fetchGlobalSettings();
   }, []);

   useEffect(() => {
      if (user) {
         // Determine whose subscription to track (Owner vs Self)
         const trackingUserId = user.parent_user_id || user.id;

         const channel = supabase
           .channel(`subscription-sync-${trackingUserId}`)
           .on(
             "postgres_changes",
             {
               event: "UPDATE",
               schema: "public",
               table: "v2_agency_users",
               filter: `id=eq.${trackingUserId}`
             },
             (payload) => {
               const oldTier = subscriptionTier;
               const newTier = payload.new.subscription_tier;
               
               if (payload.new.subscription_expiry) {
                  setSubscriptionExpiry(payload.new.subscription_expiry);
               }

               // Update local tier
               const isPowerUser = ['Superuser', 'developer'].includes(payload.new.role);
               const resolvedTier = isPowerUser ? 'agency' : (newTier || 'free');

               if (resolvedTier !== oldTier) {
                  setSubscriptionTier(resolvedTier);
                  
                  // Show success only if it's an upgrade
                  if ((resolvedTier === "pro" || resolvedTier === "agency") && oldTier === "free") {
                     setIsUpgradeModalOpen(false);
                     setShowRealtimeSuccess(true);
                  }
               }
             }
           )
           .subscribe();

         // Administrative Realtime Listeners (Superuser / Developer Only)
         let adminChannel: any = null;
         if (['Superuser', 'developer'].includes(user.role)) {
            // 1. Initial Fetch for counts
            const fetchAdminCounts = async () => {
               const { count: uCount } = await supabase.from('v2_agency_users').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
               const { count: iCount } = await supabase.from('v2_agency_inbox').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
               setPendingUsersCount(uCount || 0);
               setPendingInboxCount(iCount || 0);
            };
            fetchAdminCounts();

            // 2. Setup Realtime
            adminChannel = supabase.channel('system-admin-alerts')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_users' }, (payload) => {
                 if (payload.eventType === 'INSERT' && (payload.new as any).status === 'Pending') {
                    setPendingUsersCount(prev => prev + 1);
                    setLastNotification({ type: 'user', message: 'Ada User baru butuh verifikasi!' });
                    setShowDynamicIsland(true);
                 } else if (payload.eventType === 'UPDATE') {
                    fetchAdminCounts(); // Refresh on updates to be sure
                 }
              })
              .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_agency_inbox' }, (payload) => {
                 if (payload.eventType === 'INSERT' && (payload.new as any).status === 'Pending') {
                    setPendingInboxCount(prev => prev + 1);
                    setLastNotification({ type: 'inbox', message: 'Permintaan perpanjangan / upgrade baru!' });
                    setShowDynamicIsland(true);
                 } else if (payload.eventType === 'UPDATE') {
                    fetchAdminCounts();
                 }
              })
              .subscribe();
            
            // Auto hide dynamic island
            let timer: any;
            if (showDynamicIsland) {
              timer = setTimeout(() => setShowDynamicIsland(false), 8000);
            }
         }

         return () => {
           supabase.removeChannel(channel);
           if (adminChannel) supabase.removeChannel(adminChannel);
         };
      }
   }, [user, subscriptionTier, showDynamicIsland]);
   const fetchTeamCount = async () => {
      try {
         const wsId = selectedWorkspace?.id;
         if (!wsId) return;

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
            showToast("Sesi berakhir, silakan login kembali.", 'error');
            return;
          }
          const currentUser = JSON.parse(userStr);
          
          let workspaceId = selectedWorkspace?.id;
          if (!workspaceId) {
            const savedWsStr = localStorage.getItem('aruneeka_selected_workspace');
            if (savedWsStr) {
              const savedWs = JSON.parse(savedWsStr);
              workspaceId = savedWs.id;
            }
          }
          
          if (!workspaceId) {
            showToast("Sistem tidak menemukan Brand yang aktif.", 'error');
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
            showToast("Gagal simpan: " + error.message, 'error');
          } else {
            setIsWizardOpen(false);
            if (pathname === '/content') {
              window.location.reload();
            } else {
              window.location.href = '/content';
            }
          }
       } catch (err: any) { 
         console.error("Runtime Error:", err);
         showToast("Terjadi kesalahan sistem.", 'error'); 
       }
    };

   // --- NEW: PUBLIC SHARING LOGIC ---
   const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
   const [isPublic, setIsPublic] = useState(false);
   const [publicSlug, setPublicSlug] = useState('');
   const [isSavingShare, setIsSavingShare] = useState(false);

   useEffect(() => {
     if (selectedWorkspace) {
        setIsPublic(!!selectedWorkspace.is_public);
        setPublicSlug(selectedWorkspace.public_slug || '');
     }
   }, [selectedWorkspace]);

   const togglePublicLink = async () => {
      if (!selectedWorkspace) return;
      setIsSavingShare(true);
      try {
         const newStatus = !isPublic;
         let newSlug = publicSlug;
         
         if (newStatus && !newSlug) {
            newSlug = Math.random().toString(36).substring(2, 12);
         }

         const { error } = await supabase
            .from('v2_agency_workspaces')
            .update({ is_public: newStatus, public_slug: newSlug })
            .eq('id', selectedWorkspace.id);

         if (error) throw error;
         
         setIsPublic(newStatus);
         setPublicSlug(newSlug);
         
         // Sync local selected workspace
         const updatedWs = { ...selectedWorkspace, is_public: newStatus, public_slug: newSlug };
         setSelectedWorkspace(updatedWs);
         localStorage.setItem('aruneeka_selected_workspace', JSON.stringify(updatedWs));
      } catch (e: any) {
         showToast("Gagal merubah status: " + e.message, 'error');
      } finally {
         setIsSavingShare(false);
      }
   };

   const resetPublicLink = async () => {
      if (!selectedWorkspace || !confirm("Generating a new link will break the old one. Continue?")) return;
      setIsSavingShare(true);
      try {
         const newSlug = Math.random().toString(36).substring(2, 12);
         const { error } = await supabase
            .from('v2_agency_workspaces')
            .update({ public_slug: newSlug })
            .eq('id', selectedWorkspace.id);

         if (error) throw error;
         
         setPublicSlug(newSlug);
         const updatedWs = { ...selectedWorkspace, public_slug: newSlug };
         setSelectedWorkspace(updatedWs);
         localStorage.setItem('aruneeka_selected_workspace', JSON.stringify(updatedWs));
      } catch (e: any) {
         showToast("Gagal reset link: " + e.message, 'error');
      } finally {
         setIsSavingShare(false);
      }
   };

   const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${publicSlug}` : '';

   return (
      <WorkspaceContext.Provider value={{ 
        selectedWorkspaceId: selectedWorkspace?.id, 
        selectedWorkspace,
        setSelectedWorkspace,
        subscriptionTier,
        openUpgrade: () => setIsUpgradeModalOpen(true),
        user
      }}>

          <div className="min-h-screen bg-[#FDFCFE] text-amethyst-dark pb-20 font-inter relative antialiased">
             {initializing && !selectedWorkspace ? (
                null 
             ) : !selectedWorkspace ? (
               <AruneekaWorkspaceSelector 
                 onSelect={(ws: any) => {
                   setSelectedWorkspace(ws);
                   localStorage.setItem('aruneeka_selected_workspace', JSON.stringify(ws));
                 }}
                 currentUser={user}
               />
             ) : (
               <>
                 {/* 0. SYSTEM ANNOUNCEMENT BANNER (BROADCAST) */}
             <AnimatePresence>
                {systemConfig?.is_banner_active && systemConfig?.banner_message && !isDismissed && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="relative z-[10001] overflow-hidden"
                   >
                      {/* PREMIUM VIBRANT GRADIENT BACKGROUND */}
                      <div className="bg-gradient-to-r from-[#916DD5] via-[#AC8BEE] to-[#916DD5] animate-gradient-x text-white border-b border-white/20 shadow-xl relative overflow-hidden">
                         {/* SUBTLE GLOW EFFECT */}
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.4),transparent)] pointer-events-none" />
                         
                         <div className="max-w-[1600px] mx-auto px-8 py-3.5 flex items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4 flex-1 justify-center">
                               <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-lg">
                                     <Megaphone size={14} className="text-white animate-pulse" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/90 whitespace-nowrap">Pengumuman!</span>
                               </div>
                               
                               <div className="h-4 w-px bg-white/20 mx-1" />
                               
                               <p className="text-[11px] font-black tracking-tight drop-shadow-md">
                                  {systemConfig?.banner_message}
                                </p>
                            </div>

                            <button 
                              onClick={() => {
                                setIsDismissed(true);
                                if (systemConfig?.banner_message) {
                                  localStorage.setItem('aruneeka_dismissed_announcement', systemConfig.banner_message);
                                }
                              }}
                              className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-90"
                            >
                               Oke, Mengerti
                            </button>
                         </div>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

             {/* DYNAMIC ISLAND SYSTEM NOTIFICATION */}
             <AnimatePresence>
                {showDynamicIsland && lastNotification && (
                   <motion.div 
                      layoutId="dynamic-island"
                      initial={{ y: -80, x: '-50%', opacity: 0 }}
                      animate={{ y: 0, x: '-50%', opacity: 1 }}
                      exit={{ y: -80, x: '-50%', opacity: 0 }}
                      className="fixed top-12 left-1/2 z-[11000] flex justify-center"
                   >
                      {['user', 'inbox'].includes(lastNotification.type) ? (
                         <Link 
                            href={lastNotification.type === 'user' ? '/admin/users' : '/admin/inbox'}
                            onClick={() => setShowDynamicIsland(false)}
                            className="bg-white/80 backdrop-blur-2xl border border-slate-200/50 rounded-[40px] p-2 flex items-center gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.1)] group hover:scale-[1.02] transition-all w-[90vw] md:min-w-[320px] md:w-auto"
                         >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${lastNotification.type === 'user' ? 'bg-amethyst-primary text-white shadow-amethyst-primary/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                               {lastNotification.type === 'user' ? <ShieldCheck size={20} /> : <Inbox size={20} />}
                            </div>
                            <div className="flex-1 pr-6 py-2">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Admin Update</p>
                               <p className="text-[11px] font-bold text-slate-800 tracking-tight">{lastNotification.message}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mr-2 group-hover:bg-slate-200 group-hover:text-slate-500 transition-colors">
                               <ChevronRight size={16} />
                            </div>
                         </Link>
                      ) : (
                         <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/50 rounded-full px-6 md:px-8 py-3 md:py-4 flex items-center gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.1)] w-[90vw] md:min-w-[280px] md:w-auto">
                            <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${lastNotification.type === 'error' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`} />
                            <div className="flex-1 whitespace-nowrap">
                               <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">{lastNotification.message}</p>
                            </div>
                         </div>
                      )}
                   </motion.div>
                )}
             </AnimatePresence>

            <AnimatePresence>
               {user?.status === 'Pending' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4">
                     <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-center space-y-6 w-full max-w-[90vw] md:max-w-lg shadow-2xl">
                        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto"><Clock size={32} className="animate-spin-slow" /></div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Akun menunggu verifikasi</h3>
                        <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Sabar ya, Superuser sedang memeriksa akun Anda. Anda akan segera bisa mengeksplorasi Aruneeka Pro!</p>
                        <button onClick={() => { localStorage.removeItem('aruneeka_user'); window.location.href = '/login'; }} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] hover:bg-rose-50 hover:text-rose-500 transition-all">Keluar</button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <header className="p-4 md:p-8 max-w-[1600px] mx-auto">
               <div className="rounded-[32px] md:rounded-[48px] p-6 md:p-12 text-white relative flex items-center justify-between border border-white/20 shadow-2xl overflow-visible group" style={{ background: 'linear-gradient(135deg, #916DD5 0%, #AC8BEE 100%)' }}>
                  {/* DYNAMIC BACKGROUND ELEMENTS */}
                  <div className="absolute inset-0 pointer-events-none rounded-[48px] overflow-hidden">
                     {/* Soft Ambient Light Glows */}
                     
                     {/* 2. Floating Glass Orbs */}
                     <motion.div 
                        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[100px]" 
                     />
                     <motion.div 
                        animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px]" 
                     />
                     
                     {/* 3. Subtle Grain / Noise Overlay (Using robust inline SVG) */}
                     <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none mix-blend-overlay">
                        <filter id="noiseFilter">
                           <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                     </svg>

                     {/* 4. Radial Shine */}
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
                  </div>

                  <div className="relative z-10 space-y-4 md:space-y-6">
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSelectedWorkspace(null);
                            localStorage.removeItem('aruneeka_selected_workspace');
                          }}
                          className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                           <ArrowLeft size={18} />
                        </button>
                        
                        <div id="tour-profile-selector" className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all group" onClick={() => setIsProfilesOpen(true)}>
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
                        <h1 id="tour-workspace-selector" className="text-4xl font-black tracking-tight drop-shadow-sm">
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
                  <div className="relative z-50 flex flex-col items-end gap-10">
                     <div className="relative">
                        <motion.button 
                          id="tour-share-highlights" 
                          whileHover={{ scale: 1.02, y: -2 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)} 
                          className={`px-10 py-5 rounded-2xl flex items-center gap-3 shadow-xl font-black transition-all ${isShareDropdownOpen ? 'bg-amethyst-primary text-white' : 'bg-white text-amethyst-dark'}`}
                        >
                           <Share2 size={18} /> <span className="text-[11px]">Share Highlights</span>
                        </motion.button>

                        {/* SHARE SETTINGS DROPDOWN */}
                        <AnimatePresence>
                           {isShareDropdownOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-[240px] bg-white rounded-[24px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100 z-[100] overflow-hidden"
                              >
                                 <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amethyst-primary to-indigo-500" />
                                 
                                 <div className="text-left space-y-2 mb-6">
                                    <h3 className="text-base font-black text-slate-800 tracking-tight">Public Share</h3>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                       Dashboard view-only
                                    </p>
                                 </div>

                                 <div className="space-y-5">
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                       <div>
                                          <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Public Access</p>
                                          <p className="text-[7px] text-slate-400 font-bold">{isPublic ? 'Aktif' : 'Nonaktif'}</p>
                                       </div>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); togglePublicLink(); }}
                                         disabled={isSavingShare}
                                         className={`w-9 h-4.5 rounded-full relative transition-all ${isPublic ? 'bg-amethyst-primary' : 'bg-slate-300'}`}
                                       >
                                          <motion.div 
                                            animate={{ x: isPublic ? 18 : 4 }}
                                            className="absolute top-0.5 left-0 w-3.5 h-3.5 bg-white rounded-full shadow-md"
                                          />
                                       </button>
                                    </div>

                                    {isPublic && (
                                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                          <div className="space-y-2">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sharing Link</label>
                                             <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                                                <input 
                                                  readOnly 
                                                  value={shareUrl} 
                                                  className="flex-1 bg-transparent border-none text-[9px] font-bold text-slate-600 outline-none px-2"
                                                />
                                                <button 
                                                  onClick={(e) => {
                                                     e.stopPropagation();
                                                     navigator.clipboard.writeText(shareUrl);
                                                     showToast("Link disalin!", 'success');
                                                  }}
                                                  className="p-1.5 bg-amethyst-primary text-white rounded-lg hover:bg-amethyst-dark transition-all"
                                                >
                                                   <Check size={12} />
                                                </button>
                                             </div>
                                          </div>

                                          <button 
                                            onClick={(e) => { e.stopPropagation(); resetPublicLink(); }}
                                            disabled={isSavingShare}
                                            className="w-full py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all flex items-center justify-center gap-2 bg-slate-50 rounded-xl"
                                          >
                                             <RefreshCcw size={10} /> Reset Link
                                          </button>
                                       </motion.div>
                                    )}
                                 </div>

                                 <button onClick={() => setIsShareDropdownOpen(false)} className="mt-6 w-full py-3.5 bg-amethyst-primary/10 text-amethyst-primary rounded-[18px] font-black text-[8px] uppercase tracking-widest hover:bg-amethyst-primary/20 transition-all">
                                    Tutup Menu
                                 </button>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>
            </header>

             <div className="px-6 md:px-8 max-w-[1600px] mx-auto mt-4 relative z-20 hidden md:flex flex-col md:flex-row items-center justify-center gap-6">
                <nav className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-1.5 inline-flex items-center shadow-xl shadow-amethyst-primary/5">
                   <div className="flex items-center gap-1">
                      {navItems.map((item) => (
                         <Link 
                           key={item.href} 
                           href={item.href} 
                           id={`tour-nav-${item.href.replace('/', '')}`}
                           className={`px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all ${pathname === item.href ? 'bg-amethyst-dark text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:text-amethyst-primary hover:bg-slate-50'}`}
                        >
                           {item.icon} <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                      ))}
                   </div>
                </nav>

                {/* Administrative Fast Actions / Alerts */}
                {['Superuser', 'developer'].includes(user?.role) && (
                   <nav className="bg-slate-900/5 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-1.5 inline-flex items-center">
                      <div className="flex items-center gap-1">
                         {adminItems.map((item) => {
                            const isUserAdmin = item.href === '/admin/users';
                            const isStyling = item.href === '/admin/appearance';
                            const count = isUserAdmin ? pendingUsersCount : (isStyling ? 0 : pendingInboxCount);
                            
                            const isDeveloper = ['developer', 'Superuser'].includes(user?.role) || user?.username === 'arunika';
                            
                            // Specific restriction: System Styling ONLY for dev/superuser
                            if (isStyling && !isDeveloper) return null;

                            return (
                               <Link key={item.href} href={item.href} className={`relative px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all ${pathname === item.href ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white hover:text-amethyst-primary shadow-sm'}`}>
                                  {item.icon} 
                                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                  {count > 0 && (
                                     <motion.div 
                                       animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                                       transition={{ repeat: Infinity, duration: 2 }}
                                       className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                                     >
                                        {count}
                                     </motion.div>
                                  )}
                               </Link>
                            );
                         })}
                      </div>
                   </nav>
                )}
             </div>

             {/* MOBILE BOTTOM NAVIGATION */}
             <div className="md:hidden fixed bottom-6 left-6 right-6 z-[5000]">
                <nav className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-2 flex items-center justify-around shadow-2xl shadow-amethyst-primary/20 text-slate-400">
                   <Link 
                     href="/analytics" 
                     className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${pathname === '/analytics' ? 'bg-amethyst-primary text-white shadow-lg' : 'hover:text-amethyst-primary'}`}
                   >
                      <Activity size={20} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Performance</span>
                   </Link>
                   <Link 
                     href="/content" 
                     className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${pathname === '/content' ? 'bg-amethyst-primary text-white shadow-lg' : 'hover:text-amethyst-primary'}`}
                   >
                      <Calendar size={20} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Plan</span>
                   </Link>
                   <Link 
                     href="/kpi" 
                     className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${pathname === '/kpi' ? 'bg-amethyst-primary text-white shadow-lg' : 'hover:text-amethyst-primary'}`}
                   >
                      <Target size={20} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">KPI</span>
                   </Link>
                   {['Superuser', 'developer'].includes(user?.role) && (
                      <Link 
                        href="/admin/users"
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${pathname.startsWith('/admin') ? 'bg-slate-900 text-white shadow-lg' : 'hover:text-slate-600'}`}
                      >
                         <Monitor size={20} />
                         <span className="text-[8px] font-black uppercase tracking-tighter">Admin</span>
                      </Link>
                   )}
                </nav>
             </div>

            <main className="px-4 md:px-8 max-w-[1600px] mx-auto mt-6 md:mt-10 pb-32 md:pb-0">
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
                  <MotivationBubble forceHide={isProfilePopupOpen} />
                  <AnimatePresence>
                     {isProfilePopupOpen && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-32 right-0 w-80 bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden p-3 space-y-2">
                           <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[30px] mb-1">
                              <div className="w-24 h-24 mb-4 drop-shadow-xl"><img src={user?.avatar_url || '/assets/avatars/avatar1.svg'} alt="Identity" className="w-full h-full object-contain" /></div>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight">{user?.full_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[9px] font-black text-amethyst-primary">{editForm.displayRole}</span>
                                 <span className="text-[8px] opacity-20 text-slate-400">•</span>
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${subscriptionTier === 'free' ? 'text-slate-400' : 'text-emerald-500'}`}>
                                    {subscriptionTier === 'free' ? 'Free Tier' : 'Subscribed Member'}
                                 </span>
                              </div>
                           </div>

                           {/* ACCOUNT HEALTH / STATUS SECTION */}
                           <div className="px-6 py-5 bg-slate-50/50 rounded-[30px] mb-2 space-y-4">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</span>
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    subscriptionTier === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'
                                 }`}>
                                    {subscriptionTier === 'free' ? 'Standard' : 'Subscribed'}
                                 </span>
                              </div>
                              
                              {(() => {
                                 if (subscriptionTier === 'free') {
                                    return (
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                             <Sparkles size={18} />
                                          </div>
                                          <div>
                                             <p className="text-[11px] font-black text-slate-700">Unlimited Usage</p>
                                             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter italic">Lifetime Access</p>
                                          </div>
                                       </div>
                                    );
                                 }
                                 
                                 const now = new Date();
                                 const exp = subscriptionExpiry ? new Date(subscriptionExpiry) : now;
                                 const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                 const percent = Math.max(0, Math.min(100, (diffDays / 30) * 100));
                                 
                                 return (
                                    <div className="space-y-3">
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                                                <Zap size={18} />
                                             </div>
                                             <div>
                                                <p className="text-[11px] font-black text-slate-700">{diffDays > 0 ? `${diffDays} Days Left` : 'Expired'}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter italic">Subscription Health</p>
                                             </div>
                                          </div>
                                          <span className="text-xs font-black text-slate-400">{Math.ceil(percent)}%</span>
                                       </div>
                                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            className={`h-full ${diffDays <= 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                          />
                                       </div>
                                    </div>
                                 );
                              })()}
                           </div>

                           {/* SUBSCRIPTION EXPIRY ALERT */}
                           {(() => {
                              if (subscriptionTier === 'free' || !subscriptionExpiry) return null;
                              const now = new Date();
                              const exp = new Date(subscriptionExpiry);
                              const diffTime = exp.getTime() - now.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                              if (diffDays > 5) return null;

                              let colorClass = "bg-amber-50 text-amber-600 border-amber-100";
                              let iconClass = "bg-amber-100 text-amber-600";
                              let message = `Langganan tersisa ${diffDays} hari lagi.`;

                              if (diffDays <= 0) {
                                 colorClass = "bg-rose-50 text-rose-600 border-rose-100";
                                 iconClass = "bg-rose-100 text-rose-600";
                                 message = "Langganan berakhir HARI INI!";
                              } else if (diffDays <= 3) {
                                 colorClass = "bg-orange-50 text-orange-600 border-orange-100";
                                 iconClass = "bg-orange-100 text-orange-600";
                              }

                              return (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                   className={`w-full p-4 rounded-[28px] border ${colorClass} flex flex-col gap-4 mb-2 shadow-sm relative overflow-hidden group`}
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center shrink-0`}>
                                          <AlertCircle size={18} />
                                       </div>
                                       <div className="space-y-0.5 text-left">
                                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Peringatan Akun</p>
                                          <p className="text-[11px] font-bold tracking-tight">{message}</p>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => { setIsUpgradeModalOpen(true); setIsProfilePopupOpen(false); }}
                                      className="w-full py-3 bg-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                                    >
                                       Perpanjang Sekarang
                                   </button>
                                 </motion.div>
                              );
                           })()}

                           <button onClick={() => { setIsEditorOpen(true); setIsProfilePopupOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-slate-50 transition-all text-slate-400 hover:text-amethyst-primary">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Settings size={18} /></div>
                              <div className="text-left"><div className="text-sm font-black text-slate-700">Identity studio</div><div className="text-[9px] font-bold opacity-50">Persona setup</div></div>
                           </button>
                           <button onClick={() => { localStorage.removeItem('aruneeka_user'); window.location.href = '/login'; }} className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-rose-50 transition-all text-slate-300 hover:text-rose-500">
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><LogOut size={18} /></div>
                              <div className="text-left"><div className="text-sm font-black text-rose-600">Terminate account</div><div className="text-[9px] font-bold opacity-50">Logout session</div></div>
                           </button>

                           <div className="h-px bg-slate-100 mx-4 my-2 opacity-50" />

                           <button 
                             onClick={() => { 
                               setIsProfilePopupOpen(false); 
                               if ((window as any).startAruneekaTour) (window as any).startAruneekaTour(); 
                             }} 
                             className="w-full flex items-center gap-4 p-4 rounded-[24px] bg-amethyst-primary/5 hover:bg-amethyst-primary/10 transition-all text-amethyst-primary group"
                           >
                              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles size={18} /></div>
                              <div className="text-left">
                                <div className="text-sm font-black">Tutorial singkat</div>
                                <div className="text-[9px] font-bold opacity-70 italic">Pelajari fitur (Panduan menyesuaikan tiap halaman)</div>
                              </div>
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 5 }} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} 
                    className="w-24 h-24 overflow-hidden drop-shadow-2xl hover:drop-shadow-amethyst transition-all relative"
                  >
                     <img src={user?.avatar_url || '/assets/avatars/avatar1.svg'} alt="Profile" className="w-full h-full object-contain" />
                     
                     {/* Floating Alert Badge */}
                     {(() => {
                        if (subscriptionTier === 'free' || !subscriptionExpiry) return null;
                        const now = new Date();
                        const exp = new Date(subscriptionExpiry);
                        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays > 5) return null;
                        
                        return (
                           <div className="absolute top-2 right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
                              <AlertCircle size={10} strokeWidth={4} />
                           </div>
                        );
                     })()}
                  </motion.button>
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
               subscriptionTier={subscriptionTier}
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

            {/* Interactive Onboarding Guide */}
            <AruneekaOnboarding />

            {/* Global Realtime Success Celebration */}
            <AnimatePresence>
               {showRealtimeSuccess && (
                  <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6">
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                     />
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.9, y: 20 }}
                       className="bg-white w-full max-w-[90vw] md:max-w-sm rounded-[32px] md:rounded-[48px] p-6 md:p-10 text-center shadow-2xl relative z-10 space-y-8" 
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
                              &quot;Pembayaran Anda telah dikonfirmasi, selamat menggunakan aplikasi!&quot;
                           </p>
                        </div>
                        <button onClick={() => setShowRealtimeSuccess(false)} className="w-full py-5 bg-amethyst-primary text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all">
                           Ayo Mulai!
                        </button>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>
                </>
             )}
         </div>
      </WorkspaceContext.Provider>
   );
};

export default memo(AruneekaShell);
