import AruneekaShell from '@/components/AruneekaShell';
import AruneekaIdeaBox from '@/components/AruneekaIdeaBox';
import React from 'react';

export const runtime = 'edge';

export default function IdeasPage() {
  return (
    <AruneekaShell>
      <AruneekaIdeaBox />
    </AruneekaShell>
  );
}
