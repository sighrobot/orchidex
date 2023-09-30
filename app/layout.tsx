import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { IBM_Plex_Sans } from 'next/font/google';
import { Metadata } from 'next';

import Disclaimer from 'components/disclaimer';
import { APP_DESCRIPTION, APP_TITLE, APP_URL } from 'lib/constants';

import './globals.css';
import style from './style.module.scss';

export const ibmPlexSans = IBM_Plex_Sans({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['300', '400'],
});

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: APP_TITLE },
  description: APP_DESCRIPTION,
  icons: [
    { rel: 'icon', url: `${APP_URL}/favicon.ico` },
    { rel: 'apple-touch-icon', url: `${APP_URL}/kitsunelogo.png` },
  ],
  manifest: `${APP_URL}/manifest.json`,
  title: `${APP_TITLE}: Discover orchids.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={ibmPlexSans.className}>
        <div className={style.container}>
          {children}
          <Disclaimer />
        </div>
      </body>
      <Analytics />
    </html>
  );
}
