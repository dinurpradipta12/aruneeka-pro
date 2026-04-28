'use client';

import dynamic from 'next/dynamic';

// next/dynamic + ssr:false VALID di Client Component (bukan Server Component)
// Edge server hanya render null → browser yang load seluruh UI
const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false });

export default function ClientPageWrapper() {
  return <ClientPage />;
}
