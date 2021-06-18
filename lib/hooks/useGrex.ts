import { APP_URL } from "lib/constants";
import React from "react";

export const fetchGrex = async (id) => {
  try {
    const fetched = await fetch(`${APP_URL}/api/grex?id=${id}`);
    const json = await fetched.json();
    return json;
  } catch (e) {
    return null;
  }
};

export const useGrex = ({ id }) => {
  const [grex, setGrex] = React.useState(null);

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