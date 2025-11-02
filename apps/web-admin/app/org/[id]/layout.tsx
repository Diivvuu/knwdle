'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { Provider as JotaiProvider } from 'jotai';
import AppInit from '@/providers/app-init';
import { ReduxWrapper } from '@/providers/store-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import Modals from '@/features/modals';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { OrgSidebar } from './_components/org-sidebar';
import { SidebarToggleButton } from '@workspace/ui/components/sidebar-toggle-button';
import { useEffect, useState } from 'react';

export default function OrgScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <ReduxWrapper>
      <JotaiProvider>
        <AppInit />
        <Modals />
        <Toaster />

        <SidebarProvider>
          <div className="flex min-h-screen w-full relative">
            {/* Sidebar */}
            <OrgSidebar />

            {/* Main content area */}
            <main className="flex-1 flex flex-col bg-muted/30 border-l border-border/40 relative">
              <section className="flex-1 overflow-y-auto container mx-auto py-6 px-4 md:px-6 lg:px-8">
                {children}
              </section>
            </main>
          </div>
        </SidebarProvider>
      </JotaiProvider>
    </ReduxWrapper>
  );
}
