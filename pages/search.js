import React from "react";
import Router, { useRouter } from "next/router";
import { groupBy, orderBy } from "lodash";
import Head from "next/head";

import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
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
  const [results, setResults] = React.useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let url = "/search";

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

  return (
    <Container>
      <Head>
        <title>Search | Orchidex</title>
      </Head>

      <h2>Search</h2>

      <form onSubmit={handleSubmit}>
        <div>
          Grex 1{" "}
          <input
            autoComplete="off"
            name="genus"
            onChange={handleChange}
            placeholder="Genus"
            style={{ fontStyle: "italic" }}
            type="search"
            value={value.genus}
          />
          <input
            autoComplete="off"
            name="epithet"
            onChange={handleChange}
            placeholder="epithet"
            type="search"
            value={value.epithet}
          />
        </div>
        <br />
        <div>
          Grex 2{" "}
          <input
            autoComplete="off"
            name="genus"
            onChange={handleChange2}
            placeholder="Genus"
            style={{ fontStyle: "italic" }}
            value={value2.genus}
            type="search"
          />
          <input
            autoComplete="off"
            name="epithet"
            onChange={handleChange2}
            placeholder="epithet"
            type="search"
            value={value2.epithet}
          />
          (optional)
        </div>
        <br />
        <button disabled={!value.genus && !value.epithet} type="submit">
          Search
        </button>
      </form>

      <section>
        <h3>
          Results ({results.length.toLocaleString()}
          {results.length === 1000 ? "+" : ""})
        </h3>

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
