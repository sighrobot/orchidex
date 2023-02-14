import { Grex, Stat } from 'lib/types';
import React from 'react';

export const useStat = ({ stat, grex }: { stat: Stat; grex: Grex }) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (stat && grex && grex.registrant_name) {
      setLoading(true);
      (async () => {
        const fetched = await fetch('/api/stat', {
          method: 'POST',
          body: JSON.stringify({ stat, grex }),
        });
        const json = await fetched.json();
        setData(json);
        setLoading(false);
      })();
    } else {
      setData([]);
    }
  }, [stat, JSON.stringify(grex)]);

  return { data, loading };
};
