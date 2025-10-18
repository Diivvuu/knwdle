'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { useAdminOrg, useOrgMembers } from '@/hooks/use-admin-org';
import withOrgGuard from '@/app/_components/with-org-guard';
import DashboardShell from '@/app/_components/shell';
import OrgHero from '@/app/_components/org-hero';
import KpiDeck from '@/app/_components/kpi-deck';
import UnitsSnapshot from '@/app/_components/units-snapshot';
import FinanceSnapshot from '@/app/_components/finance-snapshot';
import AttendanceSnapshot from '@/app/_components/attendance-snapshot';
import MembersRecent from '@/app/_components/members-recent';
import AnnouncementsList from '@/app/_components/announcements-list';
import AiInsightsRow from '@/app/_components/ai-insights-row';
import ShortcutsRow from '@/app/_components/shortcuts-row';

function Page() {
  const params = useParams();
  const orgId = (params?.id as string) || '';

  // const { basic, summary, refresh } = useAdminOrg(orgId);
  const members = useOrgMembers({ orgId, limit: 10 });

  return (
    <DashboardShell>
      {/* <OrgHero
        orgId={orgId}
        basic={basic}
        onRefresh={() => {
          refresh.basic();
          refresh.summary();
          refresh.units();
        }}
      /> */}
      {/* <KpiDeck summary={summary} /> */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* <UnitsSnapshot orgId={orgId} units={units} /> */}
          {/* <FinanceSnapshot orgId={orgId} /> */}
          {/* <AttendanceSnapshot orgId={orgId} /> */}
        </div>
        <div className="lg:col-span-5 space-y-6">
          {/* <MembersRecent orgId={orgId} members={members} /> */}
          {/* <AnnouncementsList orgId={orgId} /> */}
        </div>
      </div>

      {/* <AiInsightsRow orgId={orgId} /> */}
      {/* <ShortcutsRow orgId={orgId} /> */}
    </DashboardShell>
  );
}

export default withOrgGuard(Page, { requireRoles: ['admin', 'staff'] });
