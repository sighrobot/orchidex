import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Everything registered on the newest registration date in the registry.
export const useDate = () => {
  const { data } = useSWR('/api/date?latest=1', fetcher);

  return { isLoading: !data, data };
};
