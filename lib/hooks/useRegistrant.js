import React from "react";

export const useRegistrant = ({ name }) => {
  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (name) {
        const fetched = await fetch(
          `/api/registrant/${encodeURIComponent(name)}`
        );
        const json = await fetched.json();
        setResults(json);
      }
    })();
  }, [name]);

  return results;
};
