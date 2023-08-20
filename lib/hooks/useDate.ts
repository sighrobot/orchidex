import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UseDateProps = {
  limit?: number;
};

export const useDate = ({ limit }: UseDateProps = {}) => {
  let url = '/api/date';

  if (limit) {
    url += `?limit=${limit}`;
  }

  const { data } = useSWR(url, fetcher);

  return { isLoading: !data, data };
};
