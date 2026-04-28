'use client';

import React from 'react';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaKPI from '@/components/AruneekaKPI';
import { useWorkspace } from '@/components/AruneekaShell';

export default function StrategyPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  const resolvedSearchParams = React.use(searchParams);
  const selectedProfileId = resolvedSearchParams.profileId;
  const { selectedWorkspaceId } = useWorkspace();
  
  return (
    <AruneekaShell>
      <AruneekaKPI 
        selectedProfileId={selectedProfileId} 
        selectedWorkspaceId={selectedWorkspaceId} 
      />
    </AruneekaShell>
  );
}
