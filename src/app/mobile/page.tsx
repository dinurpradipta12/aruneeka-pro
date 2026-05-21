'use client';

import React from 'react';
import MobileShell from '@/components/mobile/MobileShell';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import MobileContentPlan from '@/components/mobile/MobileContentPlan';
import MobileKPI from '@/components/mobile/MobileKPI';
import MobileTeam from '@/components/mobile/MobileTeam';
import AruneekaIdeaBox from '@/components/AruneekaIdeaBox';

export const runtime = 'edge';

export default function MobilePage() {
  return (
    <MobileShell>
      {/* Each child has a 'data-tab' prop that matches the activeTab in MobileShell */}
      <div data-tab="dashboard">
        <MobileDashboard />
      </div>
      <div data-tab="ideas">
        <AruneekaIdeaBox />
      </div>
      <div data-tab="content">
        <MobileContentPlan />
      </div>
      <div data-tab="strategy">
        <MobileKPI />
      </div>
      <div data-tab="manage">
        <MobileTeam />
      </div>
    </MobileShell>
  );
}
