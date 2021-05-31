import React from "react";

export const useProgeny = (grex) => {
  const [progeny, setProgeny] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (grex && grex.genus && grex.epithet) {
        const fetched = await fetch(
          `/api/progeny?genus=${grex.genus}&epithet=${encodeURIComponent(
            grex.epithet
          )}`
        );
        const json = await fetched.json();
        setProgeny(json);
      }
    })();
  }, [grex, grex?.genus, grex?.epithet]);

  return progeny;
};
