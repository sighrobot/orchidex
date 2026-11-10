import Link from 'next/link';

import Donate from 'components/donate';

import style from './style.module.scss';

// Deliberately small: most pages are short, so the footer stays out of the way.
export default function Footer() {
  return (
    <footer className={style.footer}>
      <div className={style.inner}>
        <Donate />

        <p className={style.legal}>
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
        </p>
      </div>
    </footer>
  );
}
