import React from "react";
import { orderBy } from "lodash";

import { Container } from "components/container";
import { Grex as G } from "components/grex";
import { fetchGrex } from "lib/hooks/useGrex";
import { useProgeny } from "lib/hooks/useProgeny";
import { useDate } from "lib/hooks/useDate";
import Link from "next/link";
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
  const onDate = useDate({ d: grex?.date_of_registration });
  const progeny = useProgeny(grex);
  const speciesAncestry = useSpeciesAncestry(grex);

  const byRegistrant = onDate.filter(
    (f) => f.id !== grex.id && f.registrant_name === grex?.registrant_name
  );

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  return (
    <Container
      title={`${grex.genus} ${grex.epithet} | Orchidex`}
      description={description(grex)}
    >
      <G heading grex={grex} hideLink />

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
              return <G key={grexOnDate.id} grex={grexOnDate} />;
            })}
          </div>
        </details>
      </section>

      <section>
        <details>
          <summary>Ancestry</summary>
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
                    <G
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

      <section>
        <details>
          <summary>Raw Data</summary>
          <div>
            <table>
              <tbody>
                {Object.keys(grex).map((k) => {
                  const field = grex[k];
                  let href;
                  let rel;
                  let target;

                  switch (k) {
                    case "id":
                      href = `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${field}`;
                      rel = "noopener noreferrer";
                      target = "_blank";
                      break;
                    case "genus":
                      href = `/?genus="${field}"`;
                      break;
                    case "epithet":
                      href = `/?epithet="${field}"`;
                      break;
                    case "registrant_name":
                      href = `/?registrant_name="${field}"`;
                      break;
                    case "date_of_registration":
                      href = `/date/${field}`;
                      break;
                    case "seed_parent_genus":
                      href = `/?seed_parent_genus="${field}"`;
                      break;
                    case "seed_parent_epithet":
                      href = `/?seed_parent_epithet="${field}"`;
                      break;
                    case "pollen_parent_genus":
                      href = `/?pollen_parent_genus="${field}"`;
                      break;
                    case "pollen_parent_epithet":
                      href = `/?pollen_parent_epithet="${field}"`;
                      break;
                    default:
                      break;
                  }

                  return (
                    <tr key={k}>
                      <th>{k.replace(/_/g, " ")}:</th>
                      <td>
                        {href ? (
                          <Link href={href}>
                            <a target={target} rel={rel}>
                              {grex[k]}
                            </a>
                          </Link>
                        ) : (
                          grex[k]
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </Container>
  );
};

export default Grex;
