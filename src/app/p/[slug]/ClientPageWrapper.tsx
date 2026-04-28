'use client';

import dynamic from 'next/dynamic';

// Here we safely disable SSR strictly inside a Client Component wrapper context
const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false });

export default function ClientPageWrapper() {
  return <ClientPage />;
}
