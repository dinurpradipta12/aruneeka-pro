import AruneekaShell from '@/components/AruneekaShell';
import AruneekaIntelligence from '@/components/AruneekaIntelligence';

export default function IntelligencePage() {
  return (
    <AruneekaShell>
      <div className="space-y-12">
        <div>
          <h2 className="text-4xl title-aggressive">Intelligence Hub</h2>
          <p className="text-purple-100 font-medium italic">The proprietary Aruneeka engine for strategic content production.</p>
        </div>
        
        <AruneekaIntelligence />
      </div>
    </AruneekaShell>
  );
}
