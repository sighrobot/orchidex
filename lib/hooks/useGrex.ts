import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (id: string) =>
  fetch(`${APP_URL}/api/grex?id=${encodeURIComponent(id)}`)
    .then((res) => res.json())
    .then((json) => json[0] ?? null);

export const fetchGrex = async (id): Promise<Grex> => {
  const grex = await fetcher(id);
  return grex;
};

export const useGrex = ({ id }) => {
  const { data = null } = useSWR(id, fetcher);

  return data;
};
