import { APP_URL } from 'app/constants';
import React from 'react';

type FetchRegistrantCountsProps = { genus?: string };

function makeUrl({ genus }: FetchRegistrantCountsProps = {}) {
  let url = `${APP_URL}/api/data/counts/registrant`;

  if (genus) {
    url += `?genus=${genus}`;
  }
  return url;
}

export async function fetchRegistrantCounts({
  genus,
}: FetchRegistrantCountsProps = {}) {
  const url = makeUrl({ genus });
  const fetched = await fetch(url);
  return fetched.json();
}

export function useRegistrantCounts({ genus }: FetchRegistrantCountsProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<{ r: string; c: number }[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    fetchRegistrantCounts({ genus }).then((json) => {
      setData(json);
      setIsLoading(false);
    });
  }, [genus]);

  return { isLoading, data };
}
