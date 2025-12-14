'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { AudienceSidebar } from './_components/audience-sidebar';

export default function AudienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId, audienceId } = useParams() as {
    orgId: string;
    audienceId: string;
  };
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (orgId && audienceId) {
      // dispatch(fetchAudienceDashboardConfig({ orgId, audienceId }));
    }
  }, [orgId, audienceId, dispatch]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AudienceSidebar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
