import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import React from 'react';

export const fetchGrex = async (id): Promise<Grex> => {
  try {
    const fetched = await fetch(`${APP_URL}/api/grex?id=${id}`);
    const json = await fetched.json();
    return json;
  } catch (e) {
    return null;
  }
};

export const useGrex = ({ id }) => {
  const [grex, setGrex] = React.useState<Grex | null>(null);

  React.useEffect(() => {
    (async () => {
      if (id) {
        const json = await fetchGrex(id);
        setGrex(json);
      }
    })();
  }, [id]);

  return grex;
};
