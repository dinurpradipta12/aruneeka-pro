'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/analytics');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-amethyst-primary/20 border-t-amethyst-primary rounded-full animate-spin" />
    </div>
  );
}
