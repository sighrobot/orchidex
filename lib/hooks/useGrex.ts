import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (id: string) =>
  fetch(`${APP_URL}/api/grex?id=${encodeURIComponent(id)}`)
    .then((res) => res.json())
    .then((json) => json ?? []);

export const fetchGrex = async (id: string): Promise<Grex[]> => {
  const grex = await fetcher(id);
  return grex;
};

export const useGrex = ({ id }) => {
  const { data = [] } = useSWR(id, fetcher);

  return data;
};
