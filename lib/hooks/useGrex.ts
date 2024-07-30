import { grexFetcher } from 'lib/fetchers/grex';
import useSWR from 'swr';

export const useGrex = ({ id }) => {
  const { data = [] } = useSWR(id, grexFetcher);

  return data;
};
