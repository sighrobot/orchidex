import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useProgeny = (grex: Grex) => {
  let url = '/api/progeny';

  url += `?genus=${encodeURIComponent(grex.genus)}`;
  url += `&epithet=${encodeURIComponent(grex.epithet)}`;

  const { data } = useSWR(url, fetcher);

  return { isLoading: !data, data };
};
