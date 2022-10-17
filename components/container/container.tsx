import { Header } from 'components/header/header';
import Head from 'next/head';
import { Footer } from '../footer/footer';

import styles from './style.module.scss';

type ContainerProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export const Container = ({
  title,
  children,
  description = '',
}: ContainerProps) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>

        <meta name='twitter:title' content={title} />
        <meta property='og:title' content={title} />

        <meta name='twitter:description' content={description} />
        <meta property='og:description' content={description} />
      </Head>
      <div>
        <div>
          <Header />
          <main>{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
};
