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

  const size = 15;

  // console.log(species, primaries);

  return (
    // <Container title="Species Matrix | Orchidex">
    //   <h2>Matrix</h2>

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

          return (
            <>
              <text
                x={100}
                y={i * size + size + size / 4}
                textAnchor="end"
                style={{ fontSize: "12px" }}
              >
                {seed.species}
              </text>

              <line
                key={`${seed.taxon_name}-${i}`}
                stroke="rgba(0, 0, 0, 0.1)"
                x1={100 + size / 2}
                y1={i * size + size}
                y2={(species.length / 2) * size + i * size}
                x2={"95%"}
              />

              <line
                key={`${seed.taxon_name}-${i}`}
                stroke="rgba(0, 0, 0, 0.1)"
                x1={100 + size / 2}
                y1={i * size}
                y2={-(species.length / 2 - i) * size}
                x2={"95%"}
              />

              {/* <line
                key={`${seed.taxon_name}-${i}`}
                fill="black"
                x={0}
                y={i * 10}
                width="66.67%"
                height={1}
                transform="rotate(-45)"
              /> */}
            </>
            // y2={(i + 1) * 10}
            // strokeWidth={1}
            // width="5%"
            // height="5%"

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
    // </Container>
  );
};

export default Matrix;
