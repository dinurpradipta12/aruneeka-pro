import AruneekaShell from '@/components/AruneekaShell';
import AruneekaAnalytics from '@/components/AruneekaAnalytics';
import React from 'react';

export const runtime = 'edge';

export default async function AnalyticsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  // Await the promise in the server component
  const { profileId } = await searchParams;

  return (
    <AruneekaShell>
      <AruneekaAnalytics selectedProfileId={profileId} />
    </AruneekaShell>
  );
}
