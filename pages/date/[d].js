import { orderBy, groupBy } from "lodash";

import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import Head from "next/head";
import { Grex } from "components/grex";

export const RegisteredOnDate = () => {
  const router = useRouter();
  const { d = "" } = router.query;

  const dateStr = new Date(`${d}T00:00:00`).toString().slice(3, 15);

  const onDate = useDate({ d });
  const grouped = groupBy(onDate, "genus");

  return (
    <Container>
      <Head>
        <title>Registrations on {dateStr} | Orchidex</title>
      </Head>
      <h2>Registered {dateStr}</h2>
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
                        <Grex key={grexOnDate.id} grex={grexOnDate} hideDate />
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

export default RegisteredOnDate;
