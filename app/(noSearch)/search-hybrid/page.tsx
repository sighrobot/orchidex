'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { CROSS_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import { SearchParentage } from 'components/search/parentage';
import { APP_URL } from 'lib/constants';
import { H2, H3 } from 'components/layout';
import { Grex } from 'lib/types';
import List from 'components/list';

import style from '../search/components/bar/style.module.scss';

export async function fetchSearch(params: string[] = []): Promise<Grex[]> {
  const fetched = await fetch(`${APP_URL}/api/search?${params.join('&')}`);
  return fetched.json();
}

function SearchHybridInner() {
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const query = React.useMemo(
    () => (rawSearchParams ? Object.fromEntries(rawSearchParams) : {}),
    [rawSearchParams]
  );
  const initialState = query;

  const [state, setState] = React.useState(initialState);
  const [results, setResults] = React.useState<Grex[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleChange = (e) =>
    setState((s) => ({
      ...s,
      [e.target.name.replace(INPUT_NAME_SUFFIX, '')]: e.target.value,
    }));

  const makeHandleSubmit = (fields) => (s) => {
    let url = '/search-hybrid';
    const params: string[] = [];

    fields.forEach((f) => {
      if (s[f]) {
        params.push(`${f}=${encodeURIComponent(s[f])}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      router.replace(url);
    }
  };

  const handleSubmitCross = makeHandleSubmit(CROSS_FIELDS);

  React.useEffect(() => {
    if (Object.keys(query).length > 0) {
      const nextState = {};
      const params: string[] = [];
      const nextSimple = CROSS_FIELDS.some((f) => query[f]);

      (nextSimple ? CROSS_FIELDS : SEARCH_FIELDS).forEach((f) => {
        if (query[f]) {
          params.push(`${f}=${encodeURIComponent(query[f])}`);
          nextState[f] = query[f];
        }
      });

      setState(nextState);
      setIsLoading(true);

      (async () => {
        const data = await fetchSearch(params);

        setResults(data);
        setIsLoading(false);
      })();
    } else {
      setResults(null);
      setState({});
    }
  }, [query]);

  const exp = (
    <>
      <em>{query.g1}</em> {query.e1}{' '}
      {(query.g2 || query.e2) && (query.g1 || query.e1) && '×'}{' '}
      <em>{query.g2}</em> {query.e2}
    </>
  );

  return (
    <>
      <Padded>
        <H2>Hybrid search</H2>

        <div className={style.backToSimple}>
          <Link href='/search'>Basic search</Link> &middot;{' '}
          <Link href='/search-advanced'>Advanced search</Link>
        </div>
      </Padded>

      <section>
        <SearchParentage
          onChange={handleChange}
          onSubmit={handleSubmitCross}
          state={state}
        />
      </section>

      <section>
        {results !== null && (
          <H3>
            Results for {exp} ({results.length.toLocaleString()}
            {results.length === 1000 ? '+' : ''})
          </H3>
        )}

        <List<Grex>
          isLoading={isLoading}
          itemMinHeight={72}
          items={orderBy(
            results,
            ['date_of_registration', 'genus', 'epithet'],
            ['desc']
          )}
          numItemsToLoad={10}
          renderItem={(item) => <GrexCard key={item.id} grex={item} />}
        />
      </section>
    </>
  );
}

// useSearchParams needs <Suspense />
export default function SearchHybrid() {
  return (
    <Suspense>
      <SearchHybridInner />
    </Suspense>
  );
}
