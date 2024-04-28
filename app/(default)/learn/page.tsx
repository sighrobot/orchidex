import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { H2, H3 } from 'components/layout';
import { Padded } from 'components/container/container';
import { APP_TITLE } from 'lib/constants';
import { capitalize } from 'lib/utils';

import style from './style.module.scss';

export function ParentageCTA({ genus = '' }: { genus?: string }) {
  const capitalizedGenus = capitalize(genus);
  return (
    <Link href={genus ? `/learn/parentage/${genus}` : '/learn/parentage'}>
      <article className={style.cta}>
        <H3>
          <em>{genus && `${capitalizedGenus} `}</em>
          {genus ? 'parentage' : 'Parentage'} map
        </H3>
        <figure>
          <Image
            alt='Image of parentage visualization'
            src='/learn/parentage.png'
            fill
          />
        </figure>
        <p>
          Visualize the frequency with which all {<em>{capitalizedGenus} </em>}
          orchids
          {!genus && ' of a given genus'} are used in creating new hybrids.
        </p>
      </article>
    </Link>
  );
}

export const metadata: Metadata = {
  description:
    'A library of learning tools to explore orchids, orchid hybrids, and the people who grow them.',
  title: `Learn - ${APP_TITLE}`,
};

export default async function Learn() {
  return (
    <div className={style.learn}>
      <Padded>
        <H2>Learn</H2>
        <p>
          Explore the world of orchids using these tools, visualizations, and
          articles.
        </p>
      </Padded>

      <Padded>
        <section className={style.grid}>
          <ParentageCTA />

          <Link href='/learn/hybridize'>
            <article className={style.cta}>
              <H3>Hybridizer</H3>
              <figure>
                <Image
                  alt='Image of Hybridizer interface'
                  src='/learn/hybridize.png'
                  fill
                />
              </figure>
              <p>
                Discover the ancestry of never-before-crossed hybrids and share
                your ideas with others!
              </p>
            </article>
          </Link>
        </section>
      </Padded>
    </div>
  );
}
