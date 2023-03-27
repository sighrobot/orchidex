import { isSpecies } from 'components/pills/pills';
import { Grex } from 'lib/types';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useWcvp = (grex: Grex) => {
  let url = '/api/wcvp';

  url += `?genus=${encodeURIComponent(grex.genus)}`;

  if (grex.epithet) {
    url += `&epithet=${encodeURIComponent(grex.epithet)}`;
  }

  const { data = [], isLoading } = useSWR(url, (url) =>
    !grex.epithet || isSpecies(grex) ? fetcher(url) : [],
  );

  return { data, loading: isLoading };
};
