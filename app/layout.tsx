import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { IBM_Plex_Sans } from 'next/font/google';
import { Metadata } from 'next';
import { APP_DESCRIPTION, APP_TITLE, APP_URL } from './constants';

const ibmPlexSans = IBM_Plex_Sans({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['400', '500'],
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
      <body className={ibmPlexSans.className}>{children}</body>
      <Analytics />
    </html>
  );
}
