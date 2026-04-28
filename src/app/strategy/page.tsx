import AruneekaShell from '@/components/AruneekaShell';
import AruneekaKPI from '@/components/AruneekaKPI';
import React from 'react';

export const runtime = 'edge';

export default async function StrategyPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId } = await searchParams;

  return (
    <AruneekaShell>
      <AruneekaKPI selectedProfileId={profileId} />
    </AruneekaShell>
  );
}
