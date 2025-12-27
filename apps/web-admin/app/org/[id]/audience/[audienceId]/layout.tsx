'use client';

import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { AudienceSidebar } from './_components/audience-sidebar';

export default function AudienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AudienceSidebar />
        <main className="flex-1 flex flex-col bg-muted/30 border-l border-border/40 relative">
          <section className="flex-1 overflow-y-auto container mx-auto py-6 px-4 md:px-6 lg:px-8">
            {children}
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
