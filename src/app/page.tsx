'use client';

import React, { useState } from 'react';
import AruneekaShell from '@/components/AruneekaShell';
import DashboardHome from '@/components/DashboardHome';
import NewContentWizard from '@/components/NewContentWizard';

export default function Home({ selectedProfileId }: { selectedProfileId?: string }) {
  return (
    <AruneekaShell>
      <DashboardHome selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}
