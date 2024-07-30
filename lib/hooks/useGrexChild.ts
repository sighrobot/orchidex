import { grexChildFetcher } from 'lib/fetchers/grex-child';
import useSWR from 'swr';

export const useGrexChild = ({ s, p }) => {
  const { data = [] } = useSWR(`${s}-${p}`, () => grexChildFetcher(s, p));

  return data;
};
