import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';

export const grexChildFetcher = (s: string, p: string) =>
  fetch(
    `${APP_URL}/api/grexChild?s=${encodeURIComponent(s)}&p=${encodeURIComponent(
      p
    )}`
  )
    .then((res) => res.json())
    .then((json) => json ?? null);

export const fetchGrexChild = async (s: string, p: string): Promise<Grex[]> => {
  const grex = await grexChildFetcher(s, p);
  return grex;
};
