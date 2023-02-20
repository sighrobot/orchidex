import { Grex, Stat } from 'lib/types';
import useSWR from 'swr';

const fetcher = (stat: Stat, grex: Grex) =>
  fetch(`/api/stat`, {
    method: 'POST',
    body: JSON.stringify({ stat, grex }),
  }).then((res) => res.json());

export const useStat = ({ stat, grex }: { stat: Stat; grex: Grex }) => {
  const { data = [], isLoading } = useSWR([stat, grex], () =>
    stat && (grex.id || grex.registrant_name) ? fetcher(stat, grex) : [],
  );

  return { data, loading: isLoading };
};
