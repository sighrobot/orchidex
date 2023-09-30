import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import React from 'react';

export type FetchRecentProps = {
  genus?: string;
  limit?: number;
};

function makeUrl({ genus, limit }: FetchRecentProps = {}) {
  let url = `${APP_URL}/api/date`;

  if (genus || limit) {
    url += '?';

    if (genus) {
      url += `&genus=${genus}`;
    }

    if (limit) {
      url += `&limit=${limit}`;
    }
  }

  return url;
}

export async function fetchRecent({
  genus,
  limit,
}: FetchRecentProps = {}): Promise<Grex[]> {
  const url = makeUrl({ genus, limit });
  const res = await fetch(url);
  return res.json();
}

export function useRecent({ genus, limit }: FetchRecentProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<Grex[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    fetchRecent({ genus, limit }).then((json) => {
      setData(json);
      setIsLoading(false);
    });
  }, [genus, limit]);

  return { isLoading, data };
}
