import { H2, H3 } from 'components/layout';
import Link from 'next/link';
import { Metadata } from 'next';
import { Padded } from 'components/container/container';
import { APP_TITLE } from 'lib/constants';

import style from './style.module.scss';

export const metadata: Metadata = {
  description: `Information about the data displayed on ${APP_TITLE}. Learn about its provenance, attribution, and quality, or find out how to report an issue.`,
  title: `About our data | ${APP_TITLE}`,
};

export default function Data() {
  return (
    <>
      <Padded>
        <H2>About our data</H2>
      </Padded>

      <article className={style.article}>
        <H3>Provenance</H3>
        <p>
          The primary data source is The International Orchid Register, as
          published by the Royal Horticultural Society. For species, this source
          is augmented by data from the World Checklist of Vascular Plants
          (WCVP).
        </p>
      </article>

      <article className={style.article}>
        <H3>Attribution</H3>
        <p>
          When possible, direct hyperlinks are provided from pages on this site
          to pages owned by the data publishers. In addition, a footer is
          rendered on every page acknowledging attribution and copyright.
        </p>
      </article>

      <article className={style.article}>
        <H3>Quality</H3>
        <p>
          Every effort has been made to present data as true to source as
          possible. Before raising a data quality issue,{' '}
          <em>
            please kindly verify that the representation of data on this site
            actually differs from that of the source.
          </em>
        </p>
      </article>

      <article className={style.article}>
        <H3>Report an issue</H3>
        <p>
          If you believe there is an error on this site with respect to the
          source data, please email{' '}
          <Link href='mailto:info@orchidex.org'>info@orchidex.org</Link> with a
          link to the specific page(s) and a brief description of the issue.
          Screenshots are highly encouraged!
        </p>
      </article>
    </>
  );
}
