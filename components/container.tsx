import { Header } from 'components/header/header';
import Head from 'next/head';
import { CSSProperties } from 'react';

type ContainerProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  fullWidth?: boolean;
};

export const Container = ({
  title,
  children,
  description = '',
  fullWidth,
}: ContainerProps) => {
  const style: Partial<CSSProperties> = {};

  if (fullWidth) {
    style.maxWidth = 'none';
  }

  return (
    <div className='container'>
      <Head>
        <title>{title}</title>

        <meta name='twitter:title' content={title} />
        <meta property='og:title' content={title} />

        <meta name='twitter:description' content={description} />
        <meta property='og:description' content={description} />
      </Head>
      <div>
        <div style={style}>
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};
