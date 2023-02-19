import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UseDateProps = {
  d?: string;
  limit?: number;
};

export const useDate = ({ d, limit }: UseDateProps = { d: '' }) => {
  let url = '/api/date?';

  if (d) {
    url += `&d=${d}`;
  }

  if (limit) {
    url += `&limit=${limit}`;
  }

  const { data = [] } = useSWR(url, fetcher);

  return data;
};
