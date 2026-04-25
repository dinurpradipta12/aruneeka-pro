'use client';

import AruneekaShell from '@/components/AruneekaShell';
import AruneekaAdminAppearance from '@/components/AruneekaAdminAppearance';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAppearancePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('aruneeka_user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'Superuser') {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) return null;

  return (
    <AruneekaShell>
      <AruneekaAdminAppearance />
    </AruneekaShell>
  );
}
