import React from 'react';

export const useSql = ({ q }) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    (async () => {
      let url = '/api/sql';

      url += `?q=${encodeURIComponent(q)}`;

      const fetched = await fetch(url);
      const json = await fetched.json();
      setData(json);
      setLoading(false);
    })();
  }, [q]);

  return { data, loading };
};
