import { isSpecies } from 'components/pills/pills';
import { Grex } from 'lib/types';
import React from 'react';

export const useWcvp = (grex: Grex) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isSpecies(grex)) {
      setLoading(true);
      (async () => {
        let url = '/api/wcvp';

        url += `?genus=${encodeURIComponent(grex.genus)}`;
        url += `&epithet=${encodeURIComponent(grex.epithet)}`;

        const fetched = await fetch(url);
        const json = await fetched.json();
        setData(json);
        setLoading(false);
      })();
    } else {
      setData([]);
    }
  }, [grex.genus, grex.epithet]);

  return { data, loading };
};
