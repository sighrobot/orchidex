import { Grex } from 'lib/types';
import React from 'react';

type FetchFTSProps = { q: string; offset?: number };

function makeUrl({ q, offset }: FetchFTSProps = { q: '' }) {
  let url = `/api/fts/${encodeURIComponent(q)}`;

  if (offset) {
    url += `?offset=${offset}`;
  }
  return url;
}

export async function fetchFTS({ q, offset }: FetchFTSProps = { q: '' }) {
  const url = makeUrl({ q, offset });
  const fetched = await fetch(url);
  return fetched.json();
}

export function useFTS({ q, offset }: FetchFTSProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<Grex[]>([]);

  React.useEffect(() => {
    if (!q) {
      setIsLoading(false);
      setData([]);
      return;
    }
    setIsLoading(true);
    fetchFTS({ q, offset }).then((json) => {
      setData(json);
      setIsLoading(false);
    });
  }, [q, offset]);

  return { isLoading, data };
}
