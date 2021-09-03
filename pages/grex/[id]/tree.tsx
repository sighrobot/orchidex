import React from "react";

import { Container } from "components/container";
import { GrexCard } from "components/grex";
import { fetchGrex } from "lib/hooks/useGrex";
import { Resources } from "components/resources";
import { description } from "lib/string";
import { AncestryViz } from "components/viz/ancestry";
import List from "components/viz/list";
import { useSpeciesAncestry } from "lib/hooks/useAncestry";
import { Name } from "components/name";

export async function getServerSideProps(context) {
  const data = await fetchGrex(context.query.id);

  if (!data) {
    return {
      notFound: true,
    };
  }

  return {
    props: { grex: data }, // will be passed to the page component as props
  };
}

export const Grex = ({ grex }) => {
  const speciesAncestry = useSpeciesAncestry(grex);

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  return (
    <Container
      title={`${grex.genus} ${grex.epithet} | Orchidex`}
      description={description(grex)}
    >
      <GrexCard heading grex={grex} hideLink />

      <Resources grex={grex} />

      <AncestryViz grex={grex} />

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

export default Grex;
