import { APP_URL } from 'lib/constants';
import React from 'react';

type FetchTimeseriesProps = { genus?: string };

function makeUrl({ genus }: FetchTimeseriesProps = {}) {
  let url = `${APP_URL}/api/data/timeseries/hybrids`;

  if (genus) {
    url += `?genus=${genus}`;
  }
  return url;
}

export async function fetchHybridsTimeseries({
  genus,
}: FetchTimeseriesProps = {}) {
  const url = makeUrl({ genus });
  const fetched = await fetch(url);
  return fetched.json();
}

export function useHybridsTimeseries({ genus }: FetchTimeseriesProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<{ d: string; c: number }[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    fetchHybridsTimeseries({ genus }).then((json) => {
      setData(json);
      setIsLoading(false);
    });
  }, [genus]);

  return { isLoading, data };
}
