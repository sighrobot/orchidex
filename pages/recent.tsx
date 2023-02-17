import { groupBy, orderBy } from 'lodash';

import { Container } from 'components/container/container';
import { useDate } from 'lib/hooks/useDate';
import { GrexCard } from 'components/grex/grex';

export default function Index() {
  const recent = useDate();
  const grouped = groupBy(recent, 'date_of_registration');

  return (
    <Container title='Recent - Orchidex' heading='Recently registered'>
      {Object.keys(grouped).map((d, idx) => {
        return (
          <section key={d}>
            <details open={idx === 0}>
              <summary>
                {new Date(`${d}T00:00:00`).toString().slice(0, 15)} (
                {grouped[d].length.toLocaleString()})
              </summary>
              <div>
                {orderBy(grouped[d], ['genus', 'epithet']).map((r) => {
                  return <GrexCard key={r.id} grex={r} hideDate />;
                })}
              </div>
            </details>
          </section>
        );
      })}
    </Container>
  );
}
