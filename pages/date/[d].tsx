import { orderBy, groupBy } from "lodash";

import { Container } from "components/container";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import { GrexCard } from "components/grex";

export const RegisteredOnDate = () => {
  const router = useRouter();
  const d = (router.query || "") as string;

  const dateStr = new Date(`${d}T00:00:00`).toString().slice(3, 15);

  const onDate = useDate({ d });
  const grouped = groupBy(onDate, "genus");

  return (
    <Container title={`Registrations on ${dateStr} | Orchidex`}>
      <h2>Registered {dateStr}</h2>
      <section>
        {orderBy(Object.keys(grouped)).map((genus) => {
          return (
            <section key={genus}>
              <details>
                <summary>
                  <em>{genus}</em> ({grouped[genus].length.toLocaleString()})
                </summary>
                <div>
                  {orderBy(grouped[genus], ["genus", "epithet"]).map(
                    (grexOnDate) => {
                      return (
                        <GrexCard
                          key={grexOnDate.id}
                          grex={grexOnDate}
                          hideDate
                        />
                      );
                    }
                  )}
                </div>
              </details>
            </section>
          );
        })}
      </section>
    </Container>
  );
};

export default RegisteredOnDate;
