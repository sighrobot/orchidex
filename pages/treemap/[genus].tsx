import { Container } from "components/container";
import { useRouter } from "next/router";
import React from "react";
import { ResponsiveTreeMapCanvas } from "@nivo/treemap";
import { countBy, capitalize, orderBy } from "lodash";
import { APP_URL } from "lib/constants";
import { formatName } from "lib/string";
import { GrexCard } from "components/grex";
import { FixedSizeList as List } from "react-window";

const Treemap = () => {
  const router = useRouter();
  const { genus: rawGenus = "" } = router.query;
  const genus = capitalize(rawGenus as string);

  const [parent, setParent] = React.useState("seed");
  const [type, setType] = React.useState<"species" | "hybrid" | "all">("all");

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (genus) {
        const fetched = await fetch(`${APP_URL}/api/parentGenus/${genus}`);
        const json = await fetched.json();

        setData(json);
      }
    })();
  }, [genus]);

  // Show me [<genus> hybrids | hybrids with <genus> parentage] by progeny genus

  // const filtered = React.useMemo(
  //   () => data.filter((d) => d[`${parent}_parent_genus`].toLowerCase()),
  //   [parent, genus, data]
  // );

  const grouped = React.useMemo(
    () => countBy(data, (d) => d.genus),
    [data, parent]
  );

  const children = React.useMemo(
    () =>
      Object.keys(grouped)
        .map((g) => {
          return {
            name: g,
            value: grouped[g],
          };
        })
        .filter((g) => {
          const split = g.name.split(" ");
          const epithet = split.slice(1).join(" ");

          const isSpecies = epithet[0]?.toLowerCase() === epithet[0];
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
        labelTextColor="#16161d"
        data={{ children: children }}
        leavesOnly
        borderColor="transparent"
        innerPadding={10}
        labelSkipSize={30}
        colors={(d) =>
          `rgb(255, ${(1 - d.value / children[0]?.value ?? 1) * 255}, 128)`
        }
        label="id"
        identity="name"
        animate={false}
      />
    );
  }, [children]);

  const ddd = orderBy(
    data,
    ["date_of_registration", "genus", "epithet"],
    ["desc"]
  );

  const Row = ({ index, style }) => (
    <div style={style}>
      <GrexCard grex={ddd[index]} />
    </div>
  );

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

      <section>
        <List height={200} itemCount={ddd.length} itemSize={122} width={800}>
          {Row}
        </List>
      </section>
    </Container>
  );
};

export default Treemap;
