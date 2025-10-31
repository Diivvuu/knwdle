import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/globals.css';
import './globals.css';
import Header from '@/_components/header';
import { RoleProvider } from '@/providers/role-provider';
import { ReduxWrapper } from '@/providers/store-provider';
import AppInit from '@/providers/app-init';
import { Toaster } from '@workspace/ui/components/sonner';
import { Providers } from '@workspace/ui/components/provider';
import Modals from '@/features/modals';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="/k-light-favicon.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/k-dark-favicon.svg"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <html
        lang="en"
        className="light"
        suppressHydrationWarning
        suppressContentEditableWarning
      >
        <body
          className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
          suppressHydrationWarning
          suppressContentEditableWarning
        >
          <ReduxWrapper>
            <Toaster />
            <Modals />
            <AppInit />
            <Providers>
              <RoleProvider>
                <Header />
                <main className="pt-[calc(var(--header-h,64px)+12px)]">
                  {children}
                </main>
              </RoleProvider>
            </Providers>
          </ReduxWrapper>
        </body>
      </html>
    </>
  );
}
