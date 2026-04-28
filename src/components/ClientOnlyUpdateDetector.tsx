'use client';

import dynamic from 'next/dynamic';

// Di sini ssr: false aman digunakan karena kita sudah berada di lingkup Client Component
const AruneekaUpdateDetector = dynamic(() => import("./AruneekaUpdateDetector"), { ssr: false });

export default function ClientOnlyUpdateDetector() {
  return <AruneekaUpdateDetector />;
}
