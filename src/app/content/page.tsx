import AruneekaShell from '@/components/AruneekaShell';
import AruneekaContentPlan from '@/components/AruneekaContentPlan';
import React from 'react';

export const runtime = 'edge';

export default async function ContentPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId } = await searchParams;

  return (
    <AruneekaShell>
      <AruneekaContentPlan selectedProfileId={profileId} />
    </AruneekaShell>
  );
}
