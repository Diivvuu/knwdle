'use client';

import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '@workspace/ui/components/provider';
import { Provider as JotaiProvider } from 'jotai';
import AppInit from '@/providers/app-init';

import { ReduxWrapper } from '@/providers/store-provider';
import AdminShell from '@/app/_components/admin-shell';

import { Toaster } from '@workspace/ui/components/sonner';
import Modals from '@/features/modals';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function OrgScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxWrapper>
      <JotaiProvider>
        <Modals />
        <Toaster />
        <AppInit />
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </JotaiProvider>
    </ReduxWrapper>
  );
}
