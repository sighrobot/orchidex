import React from "react";

export const useDescendants = (grex) => {
  const [descendants, setDescendants] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (grex && grex.genus && grex.epithet) {
        const fetched = await fetch(
          `/api/descendants?genus=${grex.genus}&epithet=${encodeURIComponent(
            grex.epithet
          )}`
        );
        const json = await fetched.json();
        setDescendants(json);
      }
    })();
  }, [grex, grex?.genus, grex?.epithet]);

  return descendants;
};
