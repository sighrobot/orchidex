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

  // console.log(species, primaries);

  return (
    // <Container title="Species Matrix | Orchidex">
    //   <h2>Matrix</h2>

    <figure className="matrix">
      {species.map((seed, i) => {
        return [
          <div
            key={seed.species}
            style={{
              // transform: "rotate(-45deg) translate(-60px, 5px)",
              height: `calc(100vw / ${species.length + 1})`,
              width: `calc(100% / ${species.length + 1})`,
              display: "flex",
              alignItems: "center",
              //   justifyContent: "flex-end",
              fontSize: "10px",
            }}
          >
            {seed.species}
            {/* <div
              style={{
                width: `${(66.7 / species.length) * (species.length - 1 - i)}%`,
                height: "1px",
                background: "black",
                position: "absolute",
                transform: `rotate(45deg)`,
                transformOrigin: "0 0",
                marginLeft: "30px",
                // top: 0,
              }}
            />
            <div
              style={{
                width: `${(66.7 / species.length) * (i - 1)}%`,
                height: "1px",
                background: "black",
                position: "absolute",
                transform: `rotate(-45deg)`,
                transformOrigin: "0 0",
                marginLeft: "30px",
                // top: 0,
              }}
            /> */}
          </div>,
        ].concat(
          species.map((pollen, j) => {
            // const seedEp = s.epithet;
            const foundSeed =
              map[seed.species] && map[seed.species][pollen.species];
            const foundPollen =
              map[pollen.species] && map[pollen.species][seed.species];
            const special = foundSeed && foundPollen;

            return (
              <div
                key={`${seed.taxon_name}-${i}-${j}`}
                style={{
                  // opacity:
                  //   foundSeed && foundSeed.date_of_registration
                  //     ? Math.max(
                  //         new Date(foundSeed.date_of_registration).getTime() /
                  //           (Date.now() - new Date("1880-01-01").getTime()),
                  //         0.33
                  //       )
                  //     : 1,
                  background:
                    i === j
                      ? "#bcebfb"
                      : special
                      ? "black"
                      : foundSeed || foundPollen
                      ? "black"
                      : "rgba(255, 255, 255, 0.75)",
                  borderLeft: "1px solid #bcebfb",
                  borderTop: "1px solid #bcebfb",
                  // transform: "rotate(45deg)",
                  // transformOrigin: "0 0",
                  width: `calc(100vw / ${species.length + 1})`,
                  height: `calc(100vw / ${species.length + 1})`,
                  flexShrink: 0,
                }}
                // style={{
                //   height: "1px",
                //   background: "black",
                //   width: "100%",
                // }}
              />
            );
          })
        );
      })}
    </figure>
    // </Container>
  );
};

export default Matrix;
