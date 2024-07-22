import { Padded } from 'components/container/container';
import { H2, H3 } from 'components/layout';
import Link from 'next/link';
import { Metadata } from 'next';
import { APP_TITLE } from 'lib/constants';

import style from './style.module.scss';

const PAGES: { title: string; href: string; src: string }[] = [
  {
    title: 'Hybridizer tool',
    href: '/learn/hybridize',
    src: '/learn/hybridize.png',
  },
  {
    title: 'Explore genus parentage',
    href: '/learn/parentage/vanda',
    src: '/learn/parentage.png',
  },
  {
    title: 'Explore genus dominance',
    href: '/learn/genus-dominance',
    src: '/learn/genus-dominance.png',
  },
  {
    title: 'Explore registrant dominance',
    href: '/learn/registrant-dominance',
    src: '/learn/registrant-dominance.png',
  },
];

export const metadata: Metadata = {
  title: `Learn | ${APP_TITLE}`,
};

export default function Learn() {
  return (
    <>
      <Padded>
        <H2 className={style.heading}>Explore the data</H2>
      </Padded>

      <div className={style.learn}>
        <section className={style.grid}>
          {PAGES.map((page) => {
            return (
              <Link key={page.href} href={page.href}>
                <article className={style.cta}>
                  <H3>{page.title}</H3>
                  <figure>
                    <img alt={page.title} src={page.src} />
                  </figure>
                </article>
              </Link>
            );
          })}
        </section>
      </div>
    </>
  );
}
