import { Container } from "components/container";
import { useRouter } from "next/router";
import React from "react";
import List from "components/viz/list";
import { formatName } from "lib/string";
import { ResponsiveTreeMap, ResponsiveTreeMapCanvas } from "@nivo/treemap";
import { groupBy } from "lodash";
import { countBy } from "lodash";
import { Grex } from "lib/types";

const Treemap = () => {
  const router = useRouter();
  const { genus = "" } = router.query;
  const [parent, setParent] = React.useState("seed");
  const [type, setType] = React.useState<"species" | "hybrid" | "all">("all");

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (genus) {
        const fetched = await fetch(`/api/parentGenus/${genus}`);
        const json = await fetched.json();

        setData(json);
      }
    })();
  }, [genus]);

  const filtered = React.useMemo(
    () => data.filter((d) => d[`${parent}_parent_genus`] === genus),
    [parent, genus, data]
  );

  const grouped = React.useMemo(
    () =>
      countBy(
        filtered,
        (d) => `${d[`${parent}_parent_genus`]} ${d[`${parent}_parent_epithet`]}`
      ),
    [filtered, parent]
  );

  const children = React.useMemo(
    () =>
      Object.keys(grouped)
        .map((g) => ({
          name: g.split(`${genus} `)[1],
          value: grouped[g],
        }))
        .filter((g) => {
          const isSpecies = g.name[0].toLowerCase() === g.name[0];
          if (type === "species") {
            return isSpecies;
          }

          if (type === "hybrid") {
            return !isSpecies;
          }

          return true;
        })
        .sort((a, b) => (a.value < b.value ? 1 : -1)),
    [grouped, genus, type]
  );

  const handleParent = React.useCallback(
    (e) => setParent(e.target.value),
    [setParent]
  );

  const handleType = React.useCallback(
    (e) => setType(e.target.name),
    [setType]
  );

  const map = React.useMemo(() => {
    return (
      <ResponsiveTreeMapCanvas
        labelTextColor="black"
        data={{ children: children }}
        leavesOnly
        borderColor="transparent"
        innerPadding={1}
        labelSkipSize={30}
        colors={(d) =>
          `rgb(128, ${(1 - d.value / children[0]?.value ?? 1) * 255}, 255)`
        }
        label="id"
        value="value"
        identity="name"
        animate={false}
      />
    );
  }, [children]);

  return (
    <Container title={`${genus} | Orchidex`}>
      <h2>{genus}</h2>

      <div>
        <label>
          <input
            onChange={handleType}
            type="radio"
            radioGroup="type"
            name="all"
            checked={type === "all"}
          />
          all
        </label>
        <label>
          <input
            onChange={handleType}
            type="radio"
            radioGroup="type"
            name="species"
            checked={type === "species"}
          />
          species
        </label>
        <label>
          <input
            onChange={handleType}
            type="radio"
            radioGroup="type"
            name="hybrid"
            checked={type === "hybrid"}
          />
          hybrid
        </label>
      </div>

      <div>
        Parent:{" "}
        <select onChange={handleParent} value={parent}>
          <option value="seed">Seed</option>
          <option value="pollen">Pollen</option>
        </select>
      </div>

      <div style={{ height: "800px" }}>{map}</div>

      {/* <section>
        <List
          title="foobar"
          data={data}
          getFields={(d) => [d.registrant_name]}
          // getFields={(d) => {
          //   const seedParent = formatName(
          //     { genus: d.seed_parent_genus, epithet: d.seed_parent_epithet },
          //     { shortenGenus: true, shortenEpithet: true }
          //   );
          //   const pollenParent = formatName(
          //     {
          //       genus: d.pollen_parent_genus,
          //       epithet: d.pollen_parent_epithet,
          //     },
          //     { shortenGenus: true, shortenEpithet: true }
          //   );
          //   return [
          //     `${seedParent.genus} ${seedParent.epithet}`,
          //     `${pollenParent.genus} ${pollenParent.epithet}`,
          //   ];
          // }}
          // getFields={(d) => [
          //   d.genus === genus ? "Intrageneric" : "INtergenrric",
          // ]}
          // renderField={(s) => s.replace(genus, "")}
          // limit={5}
        />
      </section> */}
    </Container>
  );
};

export default Treemap;
