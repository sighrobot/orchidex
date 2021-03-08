import React from "react";
import Router, { useRouter } from "next/router";
import { orderBy } from "lodash";

import { Container } from "components/container";
import { Grex } from "components/grex";

export default function Index() {
  const router = useRouter();
  const { query } = router;
  const [value, setValue] = React.useState({
    genus: query.g1 || "",
    epithet: query.e1 || "",
  });
  const [value2, setValue2] = React.useState({
    genus: query.g2 || "",
    epithet: query.e2 || "",
  });
  const [results, setResults] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let url = "/";

    const params = [];

    if (value.genus) {
      params.push(`g1=${value.genus}`);
    }

    if (value.epithet) {
      params.push(`e1=${value.epithet}`);
    }

    if (value2.genus) {
      params.push(`g2=${value2.genus}`);
    }

    if (value2.epithet) {
      params.push(`e2=${value2.epithet}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;

      Router.replace(url);
    }
  };

  React.useEffect(() => {
    (async () => {
      if (Object.keys(query).length > 0) {
        const fetched = await fetch(
          `/api/search?g1=${query.g1 || ""}&e1=${query.e1 || ""}&g2=${
            query.g2 || ""
          }&e2=${query.e2 || ""}`
        );
        const json = await fetched.json();

        setResults(json);
        setValue({ genus: query.g1 || "", epithet: query.e1 || "" });
        setValue2({ genus: query.g2 || "", epithet: query.e2 || "" });
      }
    })();
  }, [query]);

  const handleChange = (e) => {
    setValue((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleChange2 = (e) => {
    setValue2((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const exp = (
    <>
      <em>{query.g1}</em> {query.e1}{" "}
      {(query.g2 || query.e2) && (query.g1 || query.e1) && "×"}{" "}
      <em>{query.g2}</em> {query.e2}
    </>
  );

  const stuff1 = [query.g1, query.e1].filter((s) => s);
  const stuff2 = [query.g2, query.e2].filter((s) => s);

  const strArr = [...stuff1];

  if (stuff1.length > 0 && stuff2.length > 0) {
    strArr.push("×");
  }

  strArr.push(...stuff2);

  const title = `${
    strArr.length > 0 ? `${strArr.join(" ")} | Search` : "Search"
  } |
  Orchidex`;

  return (
    <Container title={title}>
      <form onSubmit={handleSubmit}>
        <div>
          <span>
            <input
              autoCorrect="off"
              autoCapitalize="off"
              name="genus"
              onChange={handleChange}
              placeholder="Genus 1"
              style={{ fontStyle: "italic" }}
              type="search"
              value={value.genus}
              spellCheck={false}
            />
            <br />
            <input
              autoCorrect="off"
              autoCapitalize="off"
              name="epithet"
              onChange={handleChange}
              placeholder="epithet 1"
              type="search"
              value={value.epithet}
              spellCheck={false}
            />
          </span>
          <span>&times;</span>
          <span>
            <input
              autoCorrect="off"
              autoCapitalize="off"
              name="genus"
              // disabled={!value.genus && !value.epithet}
              onChange={handleChange2}
              placeholder="Genus 2"
              style={{ fontStyle: "italic" }}
              value={value2.genus}
              type="search"
              spellCheck={false}
            />
            <br />
            <input
              autoCorrect="off"
              autoCapitalize="off"
              // disabled={!value.genus && !value.epithet}
              name="epithet"
              onChange={handleChange2}
              placeholder="epithet 2"
              type="search"
              value={value2.epithet}
              spellCheck={false}
            />
          </span>
        </div>

        <button
          disabled={
            !value.genus && !value.epithet && !value2.genus && !value2.epithet
          }
          type="submit"
        >
          Search
        </button>
      </form>

      <section>
        {results !== null && (
          <h3>
            Results for {exp} ({results.length.toLocaleString()}
            {results.length === 1000 ? "+" : ""})
          </h3>
        )}

        {orderBy(
          results,
          ["date_of_registration", "genus", "epithet"],
          ["desc"]
        ).map((r) => {
          return <Grex key={r.id} grex={r} />;
        })}
      </section>
    </Container>
  );
}
