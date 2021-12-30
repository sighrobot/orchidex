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
import Link from "next/link";
import { useRouter } from "next/router";

import styles from "./style.module.scss";

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
  const router = useRouter();
  const speciesAncestry = useSpeciesAncestry(grex);

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  return (
    <Container
      fullWidth
      title={`${grex.genus} ${grex.epithet} | Orchidex`}
      description={description(grex)}
    >
      <GrexCard heading grex={grex} hideLink />

      <Link href={router.asPath.replace("/tree", "")}>
        <a style={{ display: "block", margin: "30px 0", fontSize: "14px" }}>
          &larr; Back to grex
        </a>
      </Link>

      <div className={styles.tree}>
        <AncestryViz grex={grex} maxDepth />

        {/* <List
          data={speciesAncestry}
          getFields={(sa) => [sa.grex.epithet]}
          renderField={({ grex: g = {} }) => <Name grex={g} shouldAbbreviate />}
          getCount={(d) => d.score}
          renderCount={(score) =>
            `${(Math.round(score * 1000) / 10).toFixed(1)} %`
          }
        /> */}
      </div>
    </Container>
  );
};

export default Grex;
