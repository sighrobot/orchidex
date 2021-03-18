import { groupBy, orderBy } from "lodash";

import { Container } from "components/container";
import { useDate } from "lib/hooks/useDate";
import { Grex } from "components/grex";

export default function Index() {
  const recent = useDate();
  const grouped = groupBy(recent, "date_of_registration");

  return (
    <Container title="Recent | Orchidex">
      <h2>Recently registered</h2>

      {orderBy(
        Object.keys(grouped).filter(
          (d, _, arr) =>
            new Date(`${arr[0]}T00:00:00`).getTime() -
              new Date(`${d}T00:00:00`).getTime() <=
            7 * 24 * 60 * 60 * 1000
        ),
        (d) => d,
        "desc"
      ).map((d, idx) => {
        return (
          <section key={d}>
            <details open={idx === 0}>
              <summary>
                {new Date(`${d}T00:00:00`).toString().slice(0, 15)} (
                {grouped[d].length.toLocaleString()})
              </summary>
              <div>
                {orderBy(grouped[d], ["genus", "epithet"]).map((r) => {
                  return <Grex key={r.id} grex={r} hideDate />;
                })}
              </div>
            </details>
          </section>
        );
      })}
    </Container>
  );
}
