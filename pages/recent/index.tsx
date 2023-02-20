import { groupBy, orderBy } from 'lodash';

import { Container } from 'components/container/container';
import { useDate } from 'lib/hooks/useDate';
import { GrexCard } from 'components/grex/grex';

import style from './style.module.scss';
import { H3 } from 'components/layout';

export default function Index() {
  const recent = useDate();
  const grouped = groupBy(recent, 'date_of_registration');

  return (
    <Container
      className={style.recent}
      title='Recent - Orchidex'
      heading='Recently registered'
    >
      {Object.keys(grouped).map((d, idx) => {
        return (
          <section key={d}>
            <details open={idx === 0}>
              <summary>
                <H3>
                  {new Date(`${d}T00:00:00`).toString().slice(0, 15)} (
                  {grouped[d].length.toLocaleString()})
                </H3>
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
