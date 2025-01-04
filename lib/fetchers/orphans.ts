import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import React from 'react';

export async function fetchOrphans(): Promise<Grex[]> {
  const res = await fetch(`${APP_URL}/api/orphans`);
  return res.json();
}

export function useOrphans() {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<Grex[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    fetchOrphans().then((json) => {
      setData(json);
      setIsLoading(false);
    });
  }, []);

  return { isLoading, data };
}
