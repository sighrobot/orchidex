import React from "react";
import { Container } from "components/container";
import { GrexCard } from "components/grex";
import { Name } from "components/name";
import { SearchParentage } from "components/search/parentage";
import { AncestryViz } from "components/viz/ancestry";
import List from "components/viz/list";
import { useSpeciesAncestry } from "lib/hooks/useAncestry";
import { Grex } from "lib/types";

// const grex = {
//   id: "0123456789",
//   genus: "Phraglax",
//   epithet: "Ghost Berry",
//   seed_parent_genus: "Phragmipedium",
//   seed_parent_epithet: "Acker's Berry",
//   pollen_parent_genus: "Dendrophylax",
//   pollen_parent_epithet: "Gripp's Ghost",
//   hypothetical: true,
// };

const INITIAL_STATE = {
  id: "hypothetical",
  genus: "Hypothesis",
  epithet: "Grex",
  seed_parent_genus: "",
  seed_parent_epithet: "",
  pollen_parent_genus: "",
  pollen_parent_epithet: "",
  hypothetical: true,
};

const Hybridizer = () => {
  const [grex, setGrex] = React.useState(null);
  const [state, setState] = React.useState(INITIAL_STATE);
  const speciesAncestry = useSpeciesAncestry(grex);

  console.log(grex);

  const handleChange = (e) => {
    const field: Pick<
      Grex,
      | "seed_parent_genus"
      | "seed_parent_epithet"
      | "pollen_parent_genus"
      | "pollen_parent_epithet"
    > = {};

    switch (e.target.name) {
      case "g1":
        field.seed_parent_genus = e.target.value;
        break;
      case "e1":
        field.seed_parent_epithet = e.target.value;
        break;
      case "g2":
        field.pollen_parent_genus = e.target.value;
        break;
      case "e2":
        field.pollen_parent_epithet = e.target.value;
        break;
    }

    setState((s) => ({ ...s, ...field }));
  };

  const handleSubmit = () => setGrex(state);

  return (
    <Container title="Hybridizer | Orchidex">
      <h2>Hybridizer</h2>
      <br />

      <SearchParentage
        state={{
          g1: state.seed_parent_genus,
          e1: state.seed_parent_epithet,
          g2: state.pollen_parent_genus,
          e2: state.pollen_parent_epithet,
        }}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitText="Hybridize"
      />

      {/* {grex && <GrexCard grex={grex} hideLink />} */}

      {grex && <AncestryViz grex={grex} />}

      <List
        data={speciesAncestry}
        getFields={(sa) => [sa.grex.epithet]}
        renderField={({ grex: g = {} }) => <Name grex={g} shouldAbbreviate />}
        getCount={(d) => d.score}
        renderCount={(score) =>
          `${(Math.round(score * 1000) / 10).toFixed(1)} %`
        }
      />
    </Container>
  );
};

export default Hybridizer;
