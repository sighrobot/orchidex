import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';
import { Container } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { CROSS_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import { SearchParentage } from 'components/search/parentage';
import { SearchGrex } from 'components/search/grex';
import { APP_URL } from 'lib/constants';
import { ButtonSimple } from 'components/button-simple/button-simple';
import { H3 } from 'components/layout';

import { Grex } from 'lib/types';
import List from 'components/list';
import style from './style.module.scss';

export async function fetchSearch(params: string[] = []): Promise<Grex[]> {
  const fetched = await fetch(`${APP_URL}/api/search?${params.join('&')}`);
  return fetched.json();
}

export async function getServerSideProps(context) {
  const { query } = context;

  return {
    props: {
      initialState: query,
      initialSimple:
        CROSS_FIELDS.some((f) => query[f]) || Object.keys(query).length === 0,
    },
  };
}

export default function Search({ initialState = {}, initialSimple = true }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = React.useMemo(
    () => (searchParams ? Object.fromEntries(searchParams.entries()) : {}),
    [searchParams]
  );

  const [simple, setSimple] = React.useState(initialSimple);
  const [state, setState] = React.useState(initialState);
  const [results, setResults] = React.useState<Grex[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleChange = (e) =>
    setState((s) => ({
      ...s,
      [e.target.name.replace(INPUT_NAME_SUFFIX, '')]: e.target.value,
    }));

  const handleSubmit = (s) => {
    let url = '/search';
    const params: string[] = [];

    SEARCH_FIELDS.forEach((f) => {
      if (s[f]) {
        params.push(`${f}=${s[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      router.replace(url);
    }
  };

  const handleSubmitCross = () => {
    let url = '/search';
    const params: string[] = [];

    CROSS_FIELDS.forEach((f) => {
      if (state[f]) {
        params.push(`${f}=${state[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      router.replace(url);
    }
  };

  React.useEffect(() => {
    if (Object.keys(query).length > 0) {
      const nextState = {};
      const params: string[] = [];
      const nextSimple = CROSS_FIELDS.some((f) => query[f]);

      (nextSimple ? CROSS_FIELDS : SEARCH_FIELDS).forEach((f) => {
        if (query[f]) {
          params.push(`${f}=${query[f]}`);
          nextState[f] = query[f];
        }
      });

      setState(nextState);
      setSimple(nextSimple);
      setIsLoading(true);

      (async () => {
        const data = await fetchSearch(params);

        setResults(data);
        setIsLoading(false);
      })();
    } else {
      setResults(null);
      setState({});
      setSimple(true);
    }
  }, [query]);

  const exp = (
    <>
      <em>{query.g1}</em> {query.e1}{' '}
      {(query.g2 || query.e2) && (query.g1 || query.e1) && '×'}{' '}
      <em>{query.g2}</em> {query.e2}
    </>
  );

  const stuff1 = [query.g1, query.e1].filter((s) => s);
  const stuff2 = [query.g2, query.e2].filter((s) => s);

  const strArr = [...stuff1];

  if (stuff1.length > 0 && stuff2.length > 0) {
    strArr.push('×');
  }

  strArr.push(...stuff2);

  const title = `${
    strArr.length > 0 ? `${strArr.join(' ')} | Search` : 'Search'
  } |
  Orchidex`;

  return (
    <Container className={style.search} title={title} heading='Search'>
      <section>
        <div
          style={{ display: 'flex', marginBottom: '5px', maxWidth: '400px' }}
        >
          <ButtonSimple onClick={() => setSimple((s) => !s)}>
            {!simple ? 'search by parentage' : 'search by grex'}
          </ButtonSimple>
        </div>

        {simple ? (
          <SearchParentage
            onChange={handleChange}
            onSubmit={handleSubmitCross}
            state={state}
          />
        ) : (
          <SearchGrex
            onChange={handleChange}
            onSubmit={handleSubmit}
            state={state}
          />
        )}
      </section>

      <section>
        {results !== null && (
          <H3>
            Results {simple ? 'for' : ''} {exp} (
            {results.length.toLocaleString()}
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
    </Container>
  );
}
