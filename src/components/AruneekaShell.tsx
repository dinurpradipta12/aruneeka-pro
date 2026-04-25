'use client';

import React, { useState, useEffect, memo } from 'react';
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
   Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NewContentWizard from './NewContentWizard';
import SocialProfilesModal from './SocialProfilesModal';
import { supabase } from '@/lib/supabase';

// --- SUB-COMPONENTS (Optimized to prevent Shell re-renders) ---

const MotivationBubble = memo(() => {
   const [showBubble, setShowBubble] = useState(false);
   const [currentMessage, setCurrentMessage] = useState('');

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
      const showRandom = () => {
         setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
         setShowBubble(true);
         setTimeout(() => setShowBubble(false), 8000); // Reduced duration
      };

      const timer = setInterval(showRandom, 35000); // Increased interval
      const initial = setTimeout(showRandom, 5000);

      return () => {
         clearInterval(timer);
         clearTimeout(initial);
      };
   }, []);

   return (
      <AnimatePresence>
         {showBubble && (
            <motion.div 
               initial={{ opacity: 0, x: 30, scale: 0.9 }} 
               animate={{ opacity: 1, x: 0, scale: 1 }} 
               exit={{ opacity: 0, x: 20, scale: 0.9 }} 
               className="absolute bottom-6 right-28 w-48 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/40 text-center"
            >
               <p className="text-[11px] font-black leading-tight text-slate-700">{currentMessage}</p>
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

// --- MAIN SHELL ---

const AruneekaShell = ({ children }: { children: React.ReactNode }) => {
   const pathname = usePathname();
   const [isWizardOpen, setIsWizardOpen] = useState(false);
   const [isProfilesOpen, setIsProfilesOpen] = useState(false);
   const [user, setUser] = useState<any>(null);
   const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

   const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
   const [isEditorOpen, setIsEditorOpen] = useState(false);
   const [showPassword, setShowPassword] = useState(false);
   const [isEmailEditable, setIsEmailEditable] = useState(false);
   const [isPasswordEditable, setIsPasswordEditable] = useState(false);
   
   const [editForm, setEditForm] = useState({ fullName: '', password: '', email: '', avatar: '', systemRole: '', displayRole: '' });
   const [isSavingProfile, setIsSavingProfile] = useState(false);
   const [profiles, setProfiles] = useState<any[]>([]);
   const [selectedProfile, setSelectedProfile] = useState<any>(null);

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
         fetchProfiles();
      }
   }, []);

   useEffect(() => {
      if (profiles.length > 0) {
         const cachedProfileId = localStorage.getItem("aruneeka_selected_profile_id");
         if (cachedProfileId) {
            const found = profiles.find(p => p.id === cachedProfileId);
            if (found) setSelectedProfile(found);
         }
         if (user && !user.workspace_id && !user.parent_user_id) {
             const discoveredWorkspaceId = profiles[0].workspace_id;
             if (discoveredWorkspaceId) {
                 const updatedUser = { ...user, workspace_id: discoveredWorkspaceId };
                 setUser(updatedUser);
                 localStorage.setItem("aruneeka_user", JSON.stringify(updatedUser));
             }
         }
      }
   }, [profiles, user?.id]);


    const fetchProfiles = async () => {
       try {
          const userStr = localStorage.getItem('aruneeka_user');
          if (!userStr) return;
          const currentUser = JSON.parse(userStr);
          const workspaceId = currentUser.workspace_id || currentUser.parent_user_id || currentUser.id;
          const { data } = await supabase.from('v2_agency_social_profiles').select('*').eq('workspace_id', workspaceId).order('name');
          if (data) setProfiles(data);
       } catch (e) { console.error(e); }
    };

    const handleSaveContent = async (data: any) => {
       try {
          const userStr = localStorage.getItem('aruneeka_user');
          if (!userStr) return;
          const currentUser = JSON.parse(userStr);
          const workspaceId = currentUser.workspace_id || currentUser.parent_user_id || currentUser.id;
          const { error } = await supabase.from('v2_agency_content_plans').insert([{
             workspace_id: workspaceId,
             user_id: currentUser.id, author_name: currentUser.full_name || "Team Member",
             title: data.title || data.headline || null,
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
          }]);
          if (error) alert("Gagal: " + error.message);
          else window.location.reload();
       } catch (err: any) { alert("Error: " + err.message); }
       setIsWizardOpen(false);
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

   const isSuperuser = user?.username === 'arunika';

   return (
      <div className="min-h-screen bg-[#fdfcff] text-amethyst-dark pb-20 font-inter relative antialiased">
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
                     <button className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"><ChevronLeft size={18} /></button>
                     
                     <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all group" onClick={() => setIsProfilesOpen(true)}>
                        <div className="w-6 h-6 rounded-lg bg-amethyst-primary flex items-center justify-center text-[10px] font-black">
                           {selectedProfile ? (
                              selectedProfile.avatar ? <img src={selectedProfile.avatar} className="w-full h-full object-cover rounded-lg" /> : selectedProfile.name.charAt(0)
                           ) : <Share2 size={12} />}
                        </div>
                        <span className="text-[10px] font-black">
                           {selectedProfile ? selectedProfile.name : 'Pilih akun'}
                        </span>
                        <ChevronRight size={12} className="opacity-40 group-hover:translate-x-1 transition-all" />
                     </div>
                  </div>
                  
                  <div className="space-y-1">
                     <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">Aruneeka Pro Intelligence</h1>
                     <div className="flex items-center gap-6 text-white/80 text-[10px] font-black">
                        <div className="flex items-center gap-2"><Users size={12} /> {editForm.displayRole || 'Squad member'}</div>
                        <div className="flex items-center gap-2 text-white/40">•</div>
                        <div className="flex items-center gap-2"><BarChart2 size={12} /> {editForm.systemRole} Instance</div>
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
                        {item.icon} <span className="text-[10px] font-black">{item.label}</span>
                     </Link>
                  ))}
                  {isSuperuser && (
                     <>
                        <div className="w-px h-6 bg-slate-100 mx-3" />
                        <div className="flex items-center gap-1">
                           {adminItems.map((item) => (
                              <Link key={item.href} href={item.href} className={`px-5 py-3.5 rounded-xl flex items-center gap-2.5 transition-all ${pathname === item.href ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:text-amethyst-primary hover:bg-slate-50'}`}>
                                 {item.icon} <span className="text-[10px] font-black">{item.label}</span>
                              </Link>
                           ))}
                        </div>
                     </>
                  )}
               </div>
            </nav>
         </div>

         <main className="px-8 max-w-[1600px] mx-auto mt-10">
            {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as any, { selectedProfileId: selectedProfile?.id }) : child)}
         </main>

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

         <NewContentWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onSave={handleSaveContent} />
         <SocialProfilesModal isOpen={isProfilesOpen} onClose={() => setIsProfilesOpen(false)} onSelect={(p) => { setSelectedProfile(p); localStorage.setItem("aruneeka_selected_profile_id", p.id); }} />
      </div>
   );
};

export default memo(AruneekaShell);
