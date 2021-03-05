import { orderBy } from "lodash";

import { Reg } from "components/reg";
import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { Grex as G } from "components/grex";
import { useGrex } from "lib/hooks/useGrex";
import { useDescendants } from "lib/hooks/useDescendants";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import Link from "next/link";
import Head from "next/head";

export const Grex = () => {
  const router = useRouter();
  const { id = "" } = router.query;

  const grex = useGrex({ id });
  const onDate = useDate({ d: grex?.date_of_registration });
  const descendants = useDescendants(grex);
  const grexKeys = grex ? Object.keys(grex) : [];

  const byRegistrant = onDate.filter(
    (f) => f.id !== id && f.registrant_name === grex?.registrant_name
  );

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  return (
    <Container>
      <Head>
        <title>
          {grex.genus} {grex.epithet} | Orchidex
        </title>
      </Head>
      <div>
        <h2>
          <Name link={false} grex={grex} />
        </h2>

        <h3>
          <Parentage grex={grex} />
        </h3>

        {grex && <Reg grex={grex} />}
      </div>

      <section>
        <details>
          <summary>Progeny ({descendants.length.toLocaleString()})</summary>
          <div>
            {orderBy(
              descendants.filter((d) => d.synonym_flag.includes("not")),
              ["date_of_registration", "genus", "epithet"],
              ["desc"]
            ).map((grexOnDate) => {
              return <G key={grexOnDate.id} grex={grexOnDate} />;
            })}
          </div>
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
            <p>
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
            </p>
          </details>
        </section>
      )}

      <table>
        <tbody>
          {grexKeys.map((k) => {
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
                href = `/search?g1=${field}`;
                break;
              case "epithet":
                href = `/search?e1=${field}`;
                break;
              case "date_of_registration":
                href = `/date/${field}`;
                break;
              case "seed_parent_genus":
                href = `/search?g1=${field}`;
                break;
              case "seed_parent_epithet":
                href = `/search?e1=${field}`;
                break;
              case "pollen_parent_genus":
                href = `/search?g1=${field}`;
                break;
              case "pollen_parent_epithet":
                href = `/search?e1=${field}`;
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
    </Container>
  );
};

export default Grex;
