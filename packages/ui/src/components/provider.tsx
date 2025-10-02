'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system" // 👈 matches <html className="light">
      enableSystem // you can keep this on
      disableTransitionOnChange
      enableColorScheme // client will set color-scheme; we pre-set style on server
      storageKey="knwdle-theme" // optional: persist choice
      themes={['light', 'dark']} // optional: explicitly list themes
    >
      {children}
    </NextThemesProvider>
  );
}
