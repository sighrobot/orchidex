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

      {Object.keys(grouped)
        .filter(
          (d, _, arr) =>
            new Date(`${arr[0]} 00:00:00`).getTime() -
              new Date(`${d} 00:00:00`).getTime() <=
            7 * 24 * 60 * 60 * 1000
        )
        .map((d, idx) => {
          return (
            <section key={d}>
              <details open={idx === 0}>
                <summary>
                  {new Date(`${d} 00:00:00`).toString().slice(0, 15)} (
                  {grouped[d].length.toLocaleString()})
                </summary>
                <p>
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
                </p>
              </details>
            </section>
          );
        })}
    </Container>
  );
}
