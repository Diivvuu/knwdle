import { Geist, Geist_Mono } from 'next/font/google';
import '@workspace/ui/globals.css';

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="light"
      suppressHydrationWarning
      suppressContentEditableWarning
      style={{ colorScheme: 'light' }}
    >
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
        suppressContentEditableWarning
      >
        {children}
      </body>
    </html>
  );
}
