'use client';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaIntelligence from '@/components/AruneekaIntelligence';
import { useWorkspace } from '@/components/AruneekaShell';

export default function IntelligencePage() {
  const { selectedWorkspaceId } = useWorkspace();
  return (
    <AruneekaShell>
      <div className="space-y-12">
        <div>
          <h2 className="text-4xl title-aggressive">Intelligence Hub</h2>
          <p className="text-purple-100 font-medium italic">The proprietary Aruneeka engine for strategic content production.</p>
        </div>
        
        <AruneekaIntelligence selectedWorkspaceId={selectedWorkspaceId} />
      </div>
    </AruneekaShell>
  );
}
