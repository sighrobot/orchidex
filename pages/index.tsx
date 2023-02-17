import { Container, Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { SearchGrex } from 'components/search/grex';
import { SearchParentage } from 'components/search/parentage';
import { CROSS_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { useDate } from 'lib/hooks/useDate';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import style from './index.module.scss';

export default function Index() {
  const router = useRouter();
  const recent = useDate();
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
    const params = [];

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
    const params = [];

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
        <p className={style.heroDescription}>
          Orchidex is a new platform for exploring the world of orchid species
          and hybrids. Visualize their complex ancestries and learn about the
          people and organizations who grow and discover them.
        </p>
      </Padded>

      <section className={style.columns}>
        <div className={style.search}>
          <h3>Search for species or hybrids</h3>
          <SearchGrex
            onChange={handleChangeSimple}
            onSubmit={handleSubmitSimple}
            state={simpleState}
          />
          <h3>Search by parentage</h3>
          <SearchParentage
            onChange={handleChangeCross}
            onSubmit={handleSubmitCross}
            state={crossState}
          />
        </div>

        <div className={style.recent}>
          <h3>Recently registered</h3>
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
