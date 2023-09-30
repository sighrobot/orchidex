import '../app/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { HeaderLayout } from 'components/layouts';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <>
      {process.env.NODE_ENV === 'production' && (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=G-QKTW85LHH3`}
          />
          <Script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-QKTW85LHH3');`,
            }}
          />
        </>
      )}
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp;
