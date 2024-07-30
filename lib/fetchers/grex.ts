import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';

export const grexFetcher = (id: string) =>
  fetch(`${APP_URL}/api/grex?id=${encodeURIComponent(id)}`)
    .then((res) => res.json())
    .then((json) => json ?? []);

export const fetchGrex = async (id: string): Promise<Grex[]> => {
  const grex = await grexFetcher(id);
  return grex;
};
