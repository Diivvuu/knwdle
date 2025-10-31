import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/globals.css';
import { Providers } from '@workspace/ui/components/provider';

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
      <html suppressHydrationWarning suppressContentEditableWarning>
        <body
          className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
          suppressHydrationWarning
          suppressContentEditableWarning
        >
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </>
  );
}
