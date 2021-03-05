import React from "react";

export const useDate = ({ d } = {}) => {
  const [grexes, setGrexes] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      let url = "/api/date";

      if (d) {
        url += `?d=${d}`;
      }

      const fetched = await fetch(url);
      const json = await fetched.json();
      setGrexes(json);
    })();
  }, [d]);

  return grexes;
};
