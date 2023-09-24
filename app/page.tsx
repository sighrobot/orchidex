'use client';

import React from 'react';
import Link from 'next/link';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { H3 } from 'components/layout';
import { useDate } from 'lib/hooks/useDate';
import { Grex } from 'lib/types';
import List from 'components/list';
import { APP_DESCRIPTION } from './constants';
import SearchBar from './search/components/bar';

import style from './index.module.scss';

export default function HomePage() {
  const { isLoading, data: recent = [] } = useDate({ limit: 3 });

  return (
    <>
      <Padded className={style.homeHero}>
        <h1 className={style.heroTitle}>Discover orchids.</h1>
        <p className={style.heroDescription}>{APP_DESCRIPTION}</p>
      </Padded>

      <SearchBar />

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
      </section>
    </>
  );
}
