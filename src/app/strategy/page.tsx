'use client';

import React from 'react';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaKPI from '@/components/AruneekaKPI';

export default function StrategyPage({ selectedProfileId }: { selectedProfileId?: string }) {
  return (
    <AruneekaShell>
      <AruneekaKPI selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}
