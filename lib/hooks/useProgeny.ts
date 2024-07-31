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

export type GrexWithGen = Grex & { generations: number[] };

export const useProgenyAll = (grex: Grex, { level }: { level?: number }) => {
  let url = `/api/progeny/${grex.id}/by-progeny/1`;

  const { data } = useSWR<GrexWithGen[]>(url, fetcher);

  return { isLoading: !data, data };
};

export const useProgenyDepth = (grex: Grex) => {
  let url = `/api/progeny/${grex.id}/depth`;

  const { data } = useSWR<[{ deepest_generation: number }]>(url, fetcher);

  const deepest = data?.[0]?.deepest_generation;

  return { isLoading: !data, data: deepest ? deepest - 1 : 1 };
};
