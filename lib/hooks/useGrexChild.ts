import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (s: string, p: string) =>
  fetch(
    `${APP_URL}/api/grexChild?s=${encodeURIComponent(s)}&p=${encodeURIComponent(
      p
    )}`
  )
    .then((res) => res.json())
    .then((json) => json ?? null);

export const fetchGrexChild = async (s: string, p: string): Promise<Grex[]> => {
  const grex = await fetcher(s, p);
  return grex;
};

export const useGrexChild = ({ s, p }) => {
  const { data = [] } = useSWR(`${s}-${p}`, () => fetcher(s, p));

  return data;
};
