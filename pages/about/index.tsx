import { Container } from 'components/container/container';
import { H3 } from 'components/layout';
import Link from 'next/link';
import style from './style.module.scss';

export default function About() {
  return (
    <Container className={style.about} title='About - Orchidex'>
      {/* <article className={style.article}>
        <h4>Abe Rubenstein</h4>
        <p>
          A software engineer and educator whose work involves data
          visualization and data science applications, he previously served as
          technical lead of Enigma Public, a search and discovery platform for
          public data, and taught programming and design courses at NYU, RISD,
          and The New School.
        </p>
      </article> */}

      <article>
        <p>
          Orchidex is a project by{' '}
          <Link href='https://abe.sh'>Abe Rubenstein</Link> &amp; KT Paeth
        </p>
      </article>

      <article className={style.support}>
        <H3>Keep this platform free</H3>
        <p>
          Contribute to the human effort and infrastructure that makes this
          platform possible.
        </p>
      </article>
    </Container>
  );
}
