'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Layout, 
  TrendingUp, 
  Calendar, 
  Target, 
  Users, 
  Plus, 
  ChevronDown, 
  LogOut,
  Bell,
  Settings,
  User as UserIcon,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MobileWorkspaceSelector from './MobileWorkspaceSelector';

// Mobile-specific Context
interface MobileWorkspaceContextType {
  selectedWorkspace: any;
  setSelectedWorkspace: (ws: any) => void;
  user: any;
  subscriptionTier: string;
}

export const MobileWorkspaceContext = createContext<MobileWorkspaceContextType>({
  selectedWorkspace: null,
  setSelectedWorkspace: () => {},
  user: null,
  subscriptionTier: 'free'
});

export const useMobileWorkspace = () => useContext(MobileWorkspaceContext);

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isWsSelectorOpen, setIsWsSelectorOpen] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const storedUser = localStorage.getItem('aruneeka_user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      const savedWs = localStorage.getItem('aruneeka_selected_workspace');
      if (savedWs) {
        setSelectedWorkspace(JSON.parse(savedWs));
      }

      // Fetch latest tier
      try {
        const { data: latestUser } = await supabase
          .from('v2_agency_users')
          .select('subscription_tier, role')
          .eq('id', parsed.id)
          .single();
        
        if (latestUser) {
          const isPowerUser = ['Superuser', 'developer'].includes(latestUser.role);
          setSubscriptionTier(isPowerUser ? 'agency' : (latestUser.subscription_tier || 'free'));
        }
      } catch (e) {}

      setLoading(false);
    };

    initSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amethyst-primary/20 border-t-amethyst-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleWorkspaceSelect = (ws: any) => {
    setSelectedWorkspace(ws);
    localStorage.setItem('aruneeka_selected_workspace', JSON.stringify(ws));
    window.dispatchEvent(new CustomEvent('aruneeka_refresh_content'));
  };

  return (
    <MobileWorkspaceContext.Provider value={{ 
      selectedWorkspace, 
      setSelectedWorkspace: handleWorkspaceSelect, 
      user, 
      subscriptionTier 
    }}>
      <div className="min-h-screen bg-[#FDFCFE] flex flex-col font-inter pb-24">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 active:scale-95 transition-all" onClick={() => setIsWsSelectorOpen(true)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amethyst-primary to-amethyst-dark flex items-center justify-center text-white shadow-lg shadow-amethyst-primary/20">
              <Layout size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Workspace</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-amethyst-dark truncate max-w-[120px]">
                  {selectedWorkspace?.name || 'Select Brand'}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Bell size={20} />
            </button>
            <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=916DD5&color=fff`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-5 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {React.Children.map(children, (child: any) => {
                if (child && child.props && child.props.tab === activeTab) return child;
                return null;
              })}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-6 py-4 flex items-center justify-between pb-8">
          <NavBtn 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<TrendingUp size={22} />} 
            label="Metrics" 
          />
          <NavBtn 
            active={activeTab === 'content'} 
            onClick={() => setActiveTab('content')} 
            icon={<Calendar size={22} />} 
            label="Plan" 
          />
          <div className="relative -top-8">
            <button className="w-14 h-14 rounded-[22px] bg-amethyst-dark text-white flex items-center justify-center shadow-2xl shadow-amethyst-dark/40 border-4 border-white active:scale-95 transition-all">
              <Plus size={28} />
            </button>
          </div>
          <NavBtn 
            active={activeTab === 'strategy'} 
            onClick={() => setActiveTab('strategy')} 
            icon={<Target size={22} />} 
            label="KPI" 
          />
          <NavBtn 
            active={activeTab === 'manage'} 
            onClick={() => setActiveTab('manage')} 
            icon={<Users size={22} />} 
            label="Team" 
          />
        </nav>
      </div>

      {/* Workspace Selector Modal */}
      <MobileWorkspaceSelector 
        isOpen={isWsSelectorOpen}
        onClose={() => setIsWsSelectorOpen(false)}
        onSelect={handleWorkspaceSelect}
        currentUser={user}
        selectedId={selectedWorkspace?.id}
      />
    </MobileWorkspaceContext.Provider>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-amethyst-primary' : 'text-slate-400'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className="w-1 h-1 rounded-full bg-amethyst-primary mt-0.5"
        />
      )}
    </button>
  );
}
