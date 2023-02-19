import { Container } from 'components/container/container';
import { H2, H3 } from 'components/layout';
import Link from 'next/link';
import style from './style.module.scss';

export default function Data() {
  return (
    <Container className={style.data} title='Data - Orchidex'>
      <H2>Data</H2>

      <article>
        <H3>Provenance</H3>
        <p>
          The primary data source is The International Orchid Register, as
          published by the Royal Horticultural Society. For species, this source
          is augmented by data from the World Checklist of Vascular Plants
          (WCVP).
        </p>
      </article>

      <article>
        <H3>Quality</H3>
        <p>
          Every effort has been made to present data as true to source as
          possible. Before raising a data quality issue,{' '}
          <em>
            please kindly verify that our representation of the data actually
            differs from that of the source.
          </em>
        </p>
      </article>

      <article>
        <H3>Report an issue</H3>
        <p>
          If you believe there is an error on Orchidex that does not exist in
          the source data, please don't hesitate to email{' '}
          <Link href='mailto:info@orchidex.org'>info@orchidex.org</Link> with a
          link to the specific page(s) and a brief description of the issue.
        </p>
      </article>

      <article className={style.support}>
        <H3>Keep this platform free</H3>
        <p>
          The development, infrastructure, and human capital are not for profit
          and{' '}
        </p>
      </article>
    </Container>
  );
}
