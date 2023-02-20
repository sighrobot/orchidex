import { Container } from 'components/container/container';
import { H3 } from 'components/layout';
import Link from 'next/link';
import style from './style.module.scss';

export default function About() {
  return (
    <Container className={style.about} title='About - Orchidex' heading='About'>
      <article>
        <H3>FAQ</H3>
        <dl>
          <dt>
            <H3>Where does the data come from?</H3>
          </dt>
          <dd>
            Please see the <Link href='/data'>Data page</Link> for details.
          </dd>
        </dl>
      </article>

      <article>
        <p>
          Orchidex is a project by{' '}
          <Link target='_blank' href='https://abe.sh'>
            Abe Rubenstein
          </Link>{' '}
          &amp; KT Paeth
        </p>
      </article>
    </Container>
  );
}
