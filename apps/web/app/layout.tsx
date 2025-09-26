import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/globals.css';
import { Providers } from '@/_components/providers';
import Header from '@/_components/header';
import { RoleProvider } from '@/hooks/role-provider';

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <RoleProvider>
            <Header />
            <main className="pt-[calc(var(--header-h,64px)+12px)]">
              {children}
            </main>
          </RoleProvider>
        </Providers>
      </body>
    </html>
  );
}
