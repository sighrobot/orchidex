import { Grex } from 'lib/types';
import { debounce } from 'lodash';
import React from 'react';

type FetchFTSProps = {
  q: string;
  limit?: number;
  offset?: number;
  isDebounced?: boolean;
  signal?: AbortController['signal'];
};

function makeUrl({ q, limit, offset }: FetchFTSProps = { q: '' }) {
  let url = `/api/fts/${encodeURIComponent(q)}?`;

  if (limit) {
    url += `&limit=${limit}`;
  }

  if (offset) {
    url += `&offset=${offset}`;
  }
  return url;
}

export async function fetchFTS(
  { q, limit, offset, signal }: FetchFTSProps = { q: '' }
) {
  const url = makeUrl({ q, limit, offset });
  const fetched = await fetch(url, { signal });
  return fetched.json();
}

export function useFTS({
  q,
  limit,
  offset,
  isDebounced = false,
}: FetchFTSProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<Grex[]>([]);

  const controller = React.useRef<AbortController>();

  const debouncedChangeHandler = React.useMemo(
    () =>
      debounce(
        (q, limit, offset) => {
          controller.current?.abort();
          controller.current = new AbortController();

          fetchFTS({
            q,
            limit,
            offset,
            signal: controller.current.signal,
          }).then((json) => {
            setData(json);
            setIsLoading(false);
          });
        },
        isDebounced ? 200 : 0
      ),
    [isDebounced]
  );

  React.useEffect(() => {
    if (!q) {
      setIsLoading(false);
      setData([]);
      return;
    }
    setIsLoading(true);

    debouncedChangeHandler(q, limit, offset);
  }, [q, limit, offset, debouncedChangeHandler]);

  return { isLoading, data };
}
