import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UseDateProps = {
  limit?: number;
  // Only the newest registration date's records (ignores `limit`).
  latest?: boolean;
};

export const useDate = ({ limit, latest }: UseDateProps = {}) => {
  let url = '/api/date';

  if (latest) {
    url += '?latest=1';
  } else if (limit) {
    url += `?limit=${limit}`;
  }

  const { data } = useSWR(url, fetcher);

  return { isLoading: !data, data };
};
