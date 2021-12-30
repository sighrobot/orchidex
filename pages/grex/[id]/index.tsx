import React from "react";
import { orderBy } from "lodash";

import { Container } from "components/container";
import { GrexCard } from "components/grex";
import { fetchGrex } from "lib/hooks/useGrex";
import { useProgeny } from "lib/hooks/useProgeny";
import { useDate } from "lib/hooks/useDate";
import Link from "next/link";
import { Resources } from "components/resources";
import { description } from "lib/string";
import { AncestryViz } from "components/viz/ancestry";
import List from "components/viz/list";
import { fetchGrexByName, useSpeciesAncestry } from "lib/hooks/useAncestry";
import { Name } from "components/name";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const { id, g, e } = context.query;

  if (parseInt(id, 10)) {
    const data = await fetchGrex(id);

    if (data) {
      return { props: { grex: data } };
    }
  }

  if (g && e) {
    const data = await fetchGrexByName({ genus: g, epithet: e });

    if (data) {
      return { props: { grex: data } };
    }
  }

  return {
    notFound: true,
  };
}

export const Grex = ({ grex }) => {
  const router = useRouter();
  const onDate = useDate({ d: grex?.date_of_registration });
  const progeny = useProgeny(grex);
  const speciesAncestry = useSpeciesAncestry(grex);

  const byRegistrant = onDate.filter(
    (f) => f.id !== grex.id && f.registrant_name === grex?.registrant_name
  );

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  React.useEffect(() => {
    if (router.asPath.includes("/grex/s")) {
      router.replace(`/grex/${grex.id}`);
    }
  }, [router.asPath]);

  return (
    <Container
      title={`${grex.genus} ${grex.epithet} | Orchidex`}
      description={description(grex)}
    >
      <GrexCard heading grex={grex} hideLink />

      <Resources grex={grex} />

      <section>
        <details>
          <summary>Progeny ({progeny.length.toLocaleString()})</summary>
          <div>
            {orderBy(
              progeny.filter((d) => d.synonym_flag.includes("not")),
              ["date_of_registration", "genus", "epithet"],
              ["desc"]
            ).map((grexOnDate) => {
              return <GrexCard key={grexOnDate.id} grex={grexOnDate} />;
            })}
          </div>
        </details>
      </section>

      <section>
        <details>
          <summary>Ancestry</summary>

          <Link href={`${router.asPath}/tree`}>
            <a
              style={{ display: "block", textAlign: "right", fontSize: "14px" }}
            >
              View complete tree &rarr;
            </a>
          </Link>

          <AncestryViz grex={grex} />

          <List
            data={speciesAncestry}
            getFields={(sa) => [sa.grex.epithet]}
            renderField={({ grex: g = {} }) => (
              <Name grex={g} shouldAbbreviate />
            )}
            getCount={(d) => d.score}
            renderCount={(score) =>
              `${(Math.round(score * 1000) / 10).toFixed(1)} %`
            }
          />
        </details>
      </section>

      {grex?.date_of_registration && (
        <section>
          <details>
            <summary>
              Same-Date Registrations by{" "}
              <strong>{grex?.registrant_name}</strong> (
              {byRegistrant.length.toLocaleString()})
            </summary>
            <div>
              {orderBy(byRegistrant, ["genus", "epithet"]).map(
                (grexOnDate, idx) => {
                  return (
                    <GrexCard
                      key={`${idx}-${grexOnDate.id}`}
                      grex={grexOnDate}
                      hideReg
                    />
                  );
                }
              )}
            </div>
          </details>
        </section>
      )}
    </Container>
  );
};

export default Grex;
