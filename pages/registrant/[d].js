import { orderBy, groupBy } from "lodash";

import { Container } from "components/container";
import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import { useRegistrant } from "lib/hooks/useRegistrant";
import { Grex } from "components/grex";

export const Registrant = () => {
  const router = useRouter();
  const { d = "" } = router.query;

  const onDate = useRegistrant({ name: d });
  const grouped = groupBy(onDate, "genus");

  return (
    <Container title={`${d} | Orchidex`}>
      <h2>{d}</h2>
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
                      return <Grex key={grexOnDate.id} grex={grexOnDate} />;
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

export default Registrant;
