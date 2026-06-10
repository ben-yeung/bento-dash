import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Bento Dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
