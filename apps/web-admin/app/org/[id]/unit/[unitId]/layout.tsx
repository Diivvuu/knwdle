'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { fetchUnitDashboardConfig } from '@workspace/state';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { UnitSidebar } from './_components/unit-sidebar';

export default function UnitLayout({ children }: { children: React.ReactNode }) {
  const { orgId, unitId } = useParams() as { orgId: string; unitId: string };
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (orgId && unitId) {
      dispatch(fetchUnitDashboardConfig({ orgId, unitId }));
    }
  }, [orgId, unitId, dispatch]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <UnitSidebar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}