'use client';

import AruneekaAdminUsers from '@/components/AruneekaAdminUsers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('aruneeka_user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'Superuser' && user.role !== 'developer') {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFE] pb-20">
      {/* Independent Admin Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                localStorage.removeItem('aruneeka_selected_workspace');
                router.push('/');
              }}
              className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-amethyst-dark hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Return to Workspace Selector"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <img src="/assets/aruneeka.png" alt="Aruneeka Logo" className="h-7 object-contain drop-shadow-sm" />
            <span className="text-[10px] font-black tracking-widest uppercase text-amethyst-dark bg-amethyst-light/40 border border-amethyst-light/50 px-3 py-1.5 rounded-xl">System Terminal</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-8 max-w-[1600px] mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AruneekaAdminUsers />
      </main>
    </div>
  );
}
