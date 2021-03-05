import { groupBy, orderBy } from "lodash";
import Head from "next/head";

import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { useDate } from "lib/hooks/useDate";

export default function Index() {
  const recent = useDate();
  const grouped = groupBy(recent, "date_of_registration");

  return (
    <Container>
      <Head>
        <title>Home | Orchidex</title>
      </Head>

      <h2>Recently registered</h2>

      {Object.keys(grouped).map((d) => {
        return (
          <section>
            <h3>
              {new Date(d).toUTCString().split("00:00:00")[0].trim()} (
              {grouped[d].length.toLocaleString()})
            </h3>

            {orderBy(grouped[d], ["genus", "epithet"]).map((r) => {
              return (
                <article key={r.id}>
                  <div>
                    <Name grex={r} />
                  </div>
                  <div>
                    <Parentage grex={r} />
                  </div>
                </article>
              );
            })}
          </section>
        );
      })}
    </Container>
  );
}
