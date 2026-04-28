import AruneekaShell from '@/components/AruneekaShell';
import AruneekaTeam from '@/components/AruneekaTeam';
import React from 'react';

export const runtime = 'edge';

export default function TeamPage() {
  return (
    <AruneekaShell>
      <AruneekaTeam />
    </AruneekaShell>
  );
}
