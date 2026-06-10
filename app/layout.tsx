import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Bento Dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('bento-settings')||'{}').state||{};if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.accent)document.documentElement.style.setProperty('--accent',s.accent);}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
