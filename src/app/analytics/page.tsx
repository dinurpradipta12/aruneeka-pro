'use client';

import AruneekaShell from '@/components/AruneekaShell';
import AruneekaAnalytics from '@/components/AruneekaAnalytics';
import React from 'react';

export default function AnalyticsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  // Use React.use() to unwrap the promise in a client component
  const resolvedSearchParams = React.use(searchParams);
  const selectedProfileId = resolvedSearchParams.profileId;

  return (
    <AruneekaShell>
      <AruneekaAnalytics selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}
