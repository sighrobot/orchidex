import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json[0] ?? null);

export const fetchGrex = async (id): Promise<Grex> => {
  const grex = await fetcher(`${APP_URL}/api/grex?id=${id}`);
  return grex;
};

export const useGrex = ({ id }) => {
  const { data = null } = useSWR(
    `/api/grex?id=${encodeURIComponent(id)}`,
    fetcher,
  );

  return data;
};
