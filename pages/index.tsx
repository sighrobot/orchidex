import React from 'react';
import Router, { useRouter } from 'next/router';
import { orderBy } from 'lodash';
import { Container } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { CROSS_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import { SearchParentage } from 'components/search/parentage';
import { SearchGrex } from 'components/search/grex';
import { APP_URL } from 'lib/constants';
import { ButtonSimple } from 'components/button-simple/button-simple';

export async function fetchSearch(params = []) {
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

export default function Index({ initialState = {}, initialSimple = true }) {
  const router = useRouter();
  const { query } = router;
  const [simple, setSimple] = React.useState(initialSimple);
  const [state, setState] = React.useState(initialState);
  const [results, setResults] = React.useState(null);

  const handleChange = (e) =>
    setState((s) => ({
      ...s,
      [e.target.name.replace(INPUT_NAME_SUFFIX, '')]: e.target.value,
    }));

  const handleSubmit = (s) => {
    let url = '/';
    const params = [];

    SEARCH_FIELDS.forEach((f) => {
      if (s[f]) {
        params.push(`${f}=${s[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      Router.replace(url);
    }
  };

  const handleSubmitCross = () => {
    let url = '/';
    const params = [];

    CROSS_FIELDS.forEach((f) => {
      if (state[f]) {
        params.push(`${f}=${state[f]}`);
      }
    });

    if (params.length > 0) {
      url += `?${params.join('&')}`;

      Router.replace(url);
    }
  };

  React.useEffect(() => {
    if (Object.keys(query).length > 0) {
      const nextState = {};
      const params = [];
      const nextSimple = CROSS_FIELDS.some((f) => query[f]);

      (nextSimple ? CROSS_FIELDS : SEARCH_FIELDS).forEach((f) => {
        if (query[f]) {
          params.push(`${f}=${query[f]}`);
          nextState[f] = query[f];
        }
      });

      setState(nextState);
      setSimple(nextSimple);

      (async () => {
        const data = await fetchSearch(params);

        setResults(data);
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
    <Container title={title} heading='Search'>
      <div style={{ display: 'flex', marginBottom: '5px', maxWidth: '400px' }}>
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

      <section>
        {results !== null && (
          <h3>
            Results {simple ? 'for' : ''} {exp} (
            {results.length.toLocaleString()}
            {results.length === 1000 ? '+' : ''})
          </h3>
        )}

        {orderBy(
          results,
          ['date_of_registration', 'genus', 'epithet'],
          ['desc'],
        ).map((r) => {
          return <GrexCard key={r.id} grex={r} />;
        })}
      </section>
    </Container>
  );
}
