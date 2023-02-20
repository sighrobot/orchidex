import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useRegistrant = ({ name }) => {
  const { data = [] } = useSWR(
    `/api/registrant/${encodeURIComponent(name)}`,
    (url) => (name ? fetcher(url) : []),
  );

  return data;
};
