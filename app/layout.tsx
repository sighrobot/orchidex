import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import cn from 'classnames';

import Disclaimer from 'components/disclaimer';
import { APP_DESCRIPTION, APP_TITLE, APP_URL } from 'lib/constants';
import { ibmPlexSans } from 'lib/utils';

import './globals.css';
import style from './style.module.scss';

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: APP_TITLE },
  description: APP_DESCRIPTION,
  icons: [
    { rel: 'icon', url: `${APP_URL}/favicon.ico` },
    { rel: 'apple-touch-icon', url: `${APP_URL}/kitsunelogo.png` },
  ],
  manifest: `${APP_URL}/manifest.json`,
  title: `${APP_TITLE}: Discover orchids.`,
  openGraph: { images: ['/orchidex-share.png'] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={style.html} lang='en'>
      <body className={cn(style.body, ibmPlexSans.className)}>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=G-QKTW85LHH3`}
            />
            <Script>
              {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QKTW85LHH3');`}
            </Script>
          </>
        )}

        <Script id='datadog-rum'>
          {`
             (function(h,o,u,n,d) {
               h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
               d=o.createElement(u);d.async=1;d.src=n
               n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
             })(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js','DD_RUM')
             window.DD_RUM.onReady(function() {
               window.DD_RUM.init({
                 clientToken: '${process.env.DD_RUM_CLIENT_TOKEN}',
                 applicationId: '${process.env.DD_RUM_APP_ID}',
                 site: 'datadoghq.com',
                 service: 'next-app-router-rum',
                 env: 'prod',
                 version: '${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)}',
                 sessionSampleRate: 100,
                 sessionReplaySampleRate: 100,
                 trackUserInteractions: true,
                 trackResources: true,
                 trackLongTasks: true,
                 defaultPrivacyLevel: 'allow',
               });
             })
           `}
        </Script>

        <div className={style.container}>
          {children}
          <Disclaimer />
        </div>
      </body>

      <Analytics />
    </html>
  );
}
