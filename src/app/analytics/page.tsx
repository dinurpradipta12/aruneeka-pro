'use client';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaAnalytics from '@/components/AruneekaAnalytics';
import { useWorkspace } from '@/components/AruneekaShell';

export default function AnalyticsPage({ 
  selectedProfileId
}: { 
  selectedProfileId?: string
}) {
  return (
    <AruneekaShell>
      <AruneekaAnalytics selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}
