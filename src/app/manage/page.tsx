'use client';

import AruneekaShell from '@/components/AruneekaShell';
import AruneekaTeam from '@/components/AruneekaTeam';

import { useWorkspace } from '@/components/AruneekaShell';

export default function TeamPage() {
  const { selectedWorkspaceId } = useWorkspace();
  return (
    <AruneekaShell>
      <AruneekaTeam selectedWorkspaceId={selectedWorkspaceId} />
    </AruneekaShell>
  );
}
