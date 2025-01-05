'use client';

import React from 'react';
import Link from 'next/link';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/card';
import { H2, H3 } from 'components/layout';
import { useDate } from 'lib/hooks/useDate';
import { Grex } from 'lib/types';
import List from 'components/list';
import { APP_DESCRIPTION } from 'lib/constants';

import Shirt, { SHIRT_TRACK_NAME } from 'components/shirt';
import ExternalLink from 'components/link/external';
import SearchBar, { AdvSearchCTA } from '../search/components/bar';

import style from './style.module.scss';

export default function IndexPage() {
  const { isLoading, data: recent = [] } = useDate({ limit: 3 });

  return (
    <>
      <Padded className={style.homeHero}>
        <H2 className={style.heroTitle}>Discover orchids.</H2>
        <p className={style.heroDescription}>{APP_DESCRIPTION}</p>
      </Padded>

      <SearchBar />
      <AdvSearchCTA />

      <section className={style.columns}>
        <div className={style.recent}>
          <H3>Recently registered</H3>

          <List<Grex>
            isLoading={isLoading}
            itemMinHeight={72}
            items={recent.slice(0, 3)}
            renderItem={(item) => <GrexCard key={item.id} grex={item} />}
          />

          <Link className={style.more} href='/recent'>
            View more recents &raquo;
          </Link>
        </div>

        <aside className={style.aside}>
          <H3>News &amp; updates</H3>

          <article className={style.cta}>
            <p>
              Two brand-new data visualizations,{' '}
              <Link href='/learn/genus-dominance'>genus dominance</Link> and{' '}
              <Link href='/learn/registrant-dominance'>
                registrant dominance
              </Link>
              , are available on the new <Link href='/learn'>Explore</Link>{' '}
              page.
            </p>
          </article>

          <hr />

          <article className={style.cta}>
            <p>
              The first Orchidex t-shirt has dropped. Get yours today from{' '}
              <ExternalLink
                href='https://charliaorchids.com/Orchidex-Merch'
                trackArgs={[SHIRT_TRACK_NAME, { type: 'text', page: '/' }]}
              >
                Charlia Orchids
              </ExternalLink>
              .
            </p>
            <Shirt page='/' />
          </article>

          {/* <hr /> */}

          {/* <article className={style.cta}>
            <p>
              Orchidex will be a guest at the{' '}
              <ExternalLink
                href='https://jlorchids.com/j-l-summer-sale/'
                trackArgs={['Click on J&L summer sale']}
              >
                J&L Orchids Summer Sale
              </ExternalLink>{' '}
              in Easton, CT, USA on July 26-28. If you're in the area, come say
              hello!
            </p>
          </article> */}
        </aside>
      </section>
    </>
  );
}
