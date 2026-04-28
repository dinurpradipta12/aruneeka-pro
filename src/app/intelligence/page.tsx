import AruneekaShell from '@/components/AruneekaShell';
import AruneekaIntelligence from '@/components/AruneekaIntelligence';
import React from 'react';

export const runtime = 'edge';

export default function IntelligencePage() {
  return (
    <AruneekaShell>
      <AruneekaIntelligence />
    </AruneekaShell>
  );
}
