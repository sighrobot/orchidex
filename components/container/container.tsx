import { Header } from 'components/header/header';
import Head from 'next/head';
import Link from 'next/link';
import cn from 'classnames';

import style from './style.module.scss';

type ContainerProps = {
  className?: string;
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

export const Padded = ({ className = '', children, ...rest }) => (
  <section className={cn(style.padded, className)} {...rest}>
    {children}
  </section>
);

export const Container = ({
  className,
  title,
  children,
  description = '',
  heading = '',
  renderSidebar,
}: ContainerProps) => {
  return (
    <div className={cn(style.container, className)}>
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

      <footer className={style.footer}>
        This site makes fair use of data for nonprofit educational purposes
        under{' '}
        <Link
          href='https://www.law.cornell.edu/uscode/text/17/107'
          target='_blank'
        >
          17 U.S.C. § 107
        </Link>
        . Data from{' '}
        <Link
          href='https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchidregister.asp'
          target='_blank'
        >
          The International Orchid Register
        </Link>{' '}
        &copy; The Royal Horticultural Society. Data from{' '}
        <Link
          href='https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30000046-2'
          target='_blank'
        >
          WCVP
        </Link>{' '}
        &copy; Royal Botanic Gardens, Kew.
      </footer>
    </div>
  );
};
