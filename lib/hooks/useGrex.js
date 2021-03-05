import React from "react";

export const useGrex = ({ id }) => {
  const [grex, setGrex] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      if (id) {
        const fetched = await fetch(`/api/grex?id=${id}`);
        const json = await fetched.json();
        setGrex(json);
      }
    })();
  }, [id]);

  return grex;
};
