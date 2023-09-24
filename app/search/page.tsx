'use client';

import React from 'react';

import { Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { H2, H3 } from 'components/layout';
import List from 'components/list';
import { useFTS } from 'lib/fetchers/fts';
import { Grex } from 'lib/types';
import SearchBar from './components/bar';

export default function SearchPage({ searchParams }) {
  const { q: qFromParams } = searchParams;
  const [q, setQ] = React.useState<string>(qFromParams);
  const [inputValue, setInputValue] = React.useState<string>('');

  React.useEffect(() => {
    setQ(qFromParams);
    setInputValue(qFromParams);
  }, [qFromParams]);

  const fts = useFTS({ q });
  const results = fts.data;

  return (
    <>
      <Padded>
        <H2>Search</H2>
      </Padded>

      <SearchBar value={inputValue} />

      <Padded>
        {!fts.isLoading && results.length > 0 && (
          <H3>
            {results.length.toLocaleString()}
            {results.length === 100 ? '+' : ''}{' '}
            {results.length === 1 ? 'result' : 'results'} for <em>{q}</em>
          </H3>
        )}

        {!fts.isLoading && q && results.length === 0 && (
          <H3>
            No results for <em>{q}</em>
          </H3>
        )}

        <List<Grex>
          isLoading={fts.isLoading}
          itemMinHeight={72}
          items={results}
          numItemsToLoad={10}
          renderItem={(item) => <GrexCard key={item.id} grex={item} />}
        />
      </Padded>
    </>
  );
}
