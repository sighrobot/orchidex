import React from "react";
import { Container } from "components/container";

const Matrix = () => {
  //   const [grex, setGrex] = React.useState(null);
  const [species, setSpecies] = React.useState([]);
  const [primaries, setPrimaries] = React.useState([]);
  //   const speciesAncestry = useSpeciesAncestry(grex);
  //   console.log(grex);

  const map = React.useMemo(() => {
    const m = {};

    primaries.forEach((p) => {
      if (m[p.seed_parent_epithet]) {
        m[p.seed_parent_epithet][p.pollen_parent_epithet] = p;
      } else {
        m[p.seed_parent_epithet] = { [p.pollen_parent_epithet]: p };
      }
    });

    return m;
  }, [primaries]);

  React.useEffect(() => {
    (async () => {
      const fetched = await fetch("/api/kew");
      const json = await fetched.json();

      setSpecies(json.species);
      setPrimaries(json.primaries);
    })();
  }, []);

  const size = 20;

  console.log(species, primaries);

  return (
    <Container title="Species Matrix | Orchidex">
      {/* <h2>Matrix</h2> */}
      <figure
        className="matrix"
        style={{ width: "100%", height: `${size * (species.length + 1)}px` }}
      >
        <svg
          style={{ width: "100%", height: `${size * (species.length + 1)}px` }}
        >
          {species.map((seed, i) => {
            // return species.map((pollen, j) => {
            // const seedEp = s.epithet;
            // const foundSeed =
            //   map[seed.species] && map[seed.species][pollen.species];
            // const foundPollen =
            //   map[pollen.species] && map[pollen.species][seed.species];
            // const special = foundSeed && foundPollen;
            const pad = size;
            const stroke = "rgba(0, 0, 0, 0.5)";
            const x1 = 100 + size / 2;
            const y1 = i * size + pad;
            const ab = Math.sqrt((species.length * size) ** 2 / 2);
            const x2 = ab;

            return (
              <>
                <text
                  x={100}
                  y={i * size + pad}
                  textAnchor="end"
                  style={{ fontSize: "10px" }}
                >
                  {seed.species}
                </text>

                <polygon
                  points={`${x1} ${pad}, ${x1} ${
                    species.length * size
                  }, ${ab} ${(species.length * size) / 2}`}
                  stroke="rgba(0, 0, 255, 0.1)"
                  strokeOpacity={0.1}
                  strokeWidth={10}
                  fill="none"
                />

                {i !== species.length - 1 && (
                  <line
                    key={`${seed.taxon_name}-${i}-down`}
                    stroke={stroke}
                    x1={x1}
                    y1={y1}
                    y2={(species.length / 2) * size + i * size}
                    x2={x2}
                  />
                )}

                {i !== 0 && (
                  <line
                    key={`${seed.taxon_name}-${i}-up`}
                    stroke={stroke}
                    x1={x1}
                    y1={y1}
                    y2={-(species.length / 2 - i) * size}
                    x2={x2}
                  />
                )}
              </>

              // style={{
              //   background:
              //     i === j
              //       ? "#bcebfb"
              //       : special
              //       ? "black"
              //       : foundSeed || foundPollen
              //       ? "black"
              //       : "rgba(255, 255, 255, 0.75)",
              //   borderLeft: "1px solid #bcebfb",
              //   borderTop: "1px solid #bcebfb",
              //   // transform: "rotate(45deg)",
              //   // transformOrigin: "0 0",
              //   width: `calc(100vw / ${species.length + 1})`,
              //   height: `calc(100vw / ${species.length + 1})`,
              //   flexShrink: 0,
              // }}
            );
          })}
        </svg>
      </figure>
    </Container>
  );
};

export default Matrix;
