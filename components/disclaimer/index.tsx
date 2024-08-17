import React from 'react';
import Link from 'next/link';
import Donate from 'components/donate';

import style from './style.module.scss';

export default function Disclaimer() {
  return (
    <footer className={style.disclaimer}>
      <Donate />

      <section>
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
      </section>
    </footer>
  );
}
