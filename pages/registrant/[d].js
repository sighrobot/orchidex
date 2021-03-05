import { orderBy, groupBy } from "lodash";

import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";

export const Grex = () => {
  const router = useRouter();
  const { r = "" } = router.query;

  const onDate = useDate({ d });
  const grouped = groupBy(onDate, "genus");

  return (
    <Container>
      <h2>{r}</h2>
      <section>
        {orderBy(Object.keys(grouped)).map((genus) => {
          return (
            <section key={genus}>
              <details>
                <summary>
                  <em>{genus}</em> ({grouped[genus].length.toLocaleString()})
                </summary>
                <p>
                  {orderBy(grouped[genus], ["genus", "epithet"]).map(
                    (grexOnDate) => {
                      return (
                        <article key={grexOnDate.id}>
                          <Name grex={grexOnDate} />
                          <br />
                          <Parentage grex={grexOnDate} />
                        </article>
                      );
                    }
                  )}
                </p>
              </details>
            </section>
          );
        })}
      </section>
    </Container>
  );
};

export default Grex;
