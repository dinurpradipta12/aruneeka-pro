'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Kita gunakan dynamic import dengan ssr: false agar ClientPage 
// BENAR-BENAR tidak disentuh oleh server Edge Cloudflare.
const ClientPage = dynamic(() => import('./ClientPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-amethyst-primary/10 rounded-3xl flex items-center justify-center animate-bounce mb-6">
        <div className="w-8 h-8 bg-amethyst-primary rounded-full" />
      </div>
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
        Initializing Client Environment...
      </p>
    </div>
  )
});

export default function ClientPageWrapper({ slug }: { slug: string }) {
  return <ClientPage slug={slug} />;
}
