'use client';

import { Container, Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { H3 } from 'components/layout';
import { SearchGrex } from 'components/search/grex';
import { SearchParentage } from 'components/search/parentage';
import { CROSS_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { useDate } from 'lib/hooks/useDate';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import style from '../pages/index.module.scss';
import { APP_DESCRIPTION } from './constants';

export default function HomePage() {
  const router = useRouter();
  const recent = useDate({ limit: 3 });
  const [simpleState, setSimpleState] = React.useState({});
  const [crossState, setCrossState] = React.useState({});

  const handleChangeSimple = (e) =>
    setSimpleState((s) => ({
      ...s,
      [e.target.name.replace(INPUT_NAME_SUFFIX, '')]: e.target.value,
    }));

  const handleChangeCross = (e) =>
    setCrossState((s) => ({
      ...s,
      [e.target.name.replace(INPUT_NAME_SUFFIX, '')]: e.target.value,
    }));

  const handleSubmitSimple = (s) => {
    let url = '/search';
    const params: string[] = [];

    SEARCH_FIELDS.forEach((f) => {
      if (s[f]) {
        params.push(`${f}=${s[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      router.push(url);
    }
  };

  const handleSubmitCross = () => {
    let url = '/search';
    const params: string[] = [];

    CROSS_FIELDS.forEach((f) => {
      if (crossState[f]) {
        params.push(`${f}=${crossState[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      router.push(url);
    }
  };

  return (
    <Container
      className={style.homeContainer}
      title='Orchidex: Discover orchids.'
    >
      <Padded className={style.homeHero}>
        <h1 className={style.heroTitle}>Discover orchids.</h1>
        <p className={style.heroDescription}>{APP_DESCRIPTION}</p>
      </Padded>

      <section className={style.columns}>
        <div className={style.search}>
          <H3>Search by name</H3>
          <SearchGrex
            onChange={handleChangeSimple}
            onSubmit={handleSubmitSimple}
            state={simpleState}
          />
          <H3>Search by parentage</H3>
          <SearchParentage
            onChange={handleChangeCross}
            onSubmit={handleSubmitCross}
            state={crossState}
          />
        </div>

        <div className={style.recent}>
          <H3>Recently registered</H3>
          {recent.slice(0, 3).map((r) => {
            return <GrexCard key={r.id} grex={r} />;
          })}
          <Link className={style.more} href='/recent'>
            View more recents &raquo;
          </Link>
        </div>
      </section>
    </Container>
  );
}