import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useTreemap = ({
  genus,
  parentType,
}: {
  genus: string;
  parentType: 'seed' | 'pollen' | null;
}) => {
  let url = `/api/treemap/${encodeURIComponent(genus.toLowerCase())}`;

  if (parentType) {
    url += `?parentType=${parentType}`;
  }

  return useSWR(url, (url) => (genus ? fetcher(url) : []));
};
