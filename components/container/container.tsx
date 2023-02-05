import { Header } from 'components/header/header';
import Head from 'next/head';
import { Footer } from '../footer/footer';

import style from './style.module.scss';

type ContainerProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isFullWidth?: boolean;
  heading?: string;
};

export const Padded = ({ children, ...rest }) => (
  <section className={style.padded} {...rest}>
    {children}
  </section>
);

export const Container = ({
  title,
  children,
  description = '',
  isFullWidth = false,
  heading = '',
}: ContainerProps) => {
  return (
    <div className={style.container}>
      <Head>
        <title>{title}</title>

        <meta name='twitter:title' content={title} />
        <meta property='og:title' content={title} />

        <meta name='twitter:description' content={description} />
        <meta property='og:description' content={description} />
      </Head>

      <div className={style.wrap}>
        <Header />

        <main>
          {heading && (
            <Padded>
              <h2 className={style.heading}>{heading}</h2>
            </Padded>
          )}
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};
