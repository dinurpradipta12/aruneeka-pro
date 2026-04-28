'use client';

import React, { useState, useEffect } from 'react';
import ClientPage from './ClientPage';

export default function ClientPageWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return <ClientPage />;
}

