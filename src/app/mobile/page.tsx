'use client';

import React from 'react';
import MobileShell from '@/components/mobile/MobileShell';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import MobileContentPlan from '@/components/mobile/MobileContentPlan';
import MobileKPI from '@/components/mobile/MobileKPI';
import MobileTeam from '@/components/mobile/MobileTeam';

export const runtime = 'edge';

export default function MobilePage() {
  return (
    <MobileShell>
      {/* Each child has a 'tab' prop that matches the activeTab in MobileShell */}
      <div tab="dashboard">
        <MobileDashboard />
      </div>
      <div tab="content">
        <MobileContentPlan />
      </div>
      <div tab="strategy">
        <MobileKPI />
      </div>
      <div tab="manage">
        <MobileTeam />
      </div>
    </MobileShell>
  );
}
