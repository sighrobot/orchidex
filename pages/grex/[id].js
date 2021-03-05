import { orderBy } from "lodash";

import { Reg } from "components/reg";
import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { useGrex } from "lib/hooks/useGrex";
import { useDescendants } from "lib/hooks/useDescendants";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import Link from "next/link";

export const Grex = () => {
  const router = useRouter();
  const { id = "" } = router.query;

  const grex = useGrex({ id });
  const onDate = useDate({ d: grex?.date_of_registration });
  const descendants = useDescendants(grex);
  const grexKeys = grex ? Object.keys(grex) : [];

  return (
    <Container>
      <section>
        <h2>
          <mark>
            <Name link={false} grex={grex} />
          </mark>
        </h2>

        <h3>
          <Parentage grex={grex} />
        </h3>

        <Reg grex={grex} />
      </section>

      <section>
        <details>
          <summary>
            Same-Date Registrations ({(onDate.length - 1).toLocaleString()})
          </summary>
          <p>
            {orderBy(
              onDate.filter((f) => f.id !== id),
              ["genus", "epithet"]
            ).map((grexOnDate) => {
              return (
                <article key={grexOnDate.id}>
                  <Name grex={grexOnDate} />
                  <br />
                  <Parentage grex={grexOnDate} />
                </article>
              );
            })}
          </p>
        </details>
      </section>

      <section>
        <details>
          <summary>Descendants ({descendants.length.toLocaleString()})</summary>
          <p>
            {orderBy(descendants, ["genus", "epithet"]).map((grexOnDate) => {
              return (
                <article key={grexOnDate.id}>
                  <Name grex={grexOnDate} />
                  <br />
                  <Parentage grex={grexOnDate} />
                </article>
              );
            })}
          </p>
        </details>
      </section>

      {grex && (
        <section>
          <details>
            <summary>Raw Data ({grexKeys.length.toLocaleString()})</summary>
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

                  console.log({ k, href, rel });
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
          </details>
        </section>
      )}
    </Container>
  );
};

export default Grex;
