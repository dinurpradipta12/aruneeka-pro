import AruneekaShell from '@/components/AruneekaShell';
import AruneekaAnalytics from '@/components/AruneekaAnalytics';

export default function AnalyticsPage({ selectedProfileId }: { selectedProfileId?: string }) {
  return (
    <AruneekaShell>
      <AruneekaAnalytics selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}
