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
  renderSidebar?: () => React.ReactNode;
};

export const Section = ({ children, heading }) => (
  <section className={style.section}>
    <h4>{heading}</h4>
    <div className={style.scrollable}>{children}</div>
  </section>
);

export const Padded = ({ children, ...rest }) => (
  <section className={style.padded} {...rest}>
    {children}
  </section>
);

export const Container = ({
  title,
  children,
  description = '',
  heading = '',
  renderSidebar,
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

        {renderSidebar && (
          <aside className={style.sidebar}>{renderSidebar()}</aside>
        )}
      </div>

      <Footer />
    </div>
  );
};
