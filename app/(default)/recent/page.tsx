import { Metadata } from 'next';
import { groupBy, orderBy } from 'lodash';
import { GrexCard } from 'components/grex/card';
import { H2, H3 } from 'components/layout';
import { Padded } from 'components/container/container';
import { APP_TITLE } from 'lib/constants';
import { fetchRecent } from 'lib/fetchers/recent';

import List from 'components/list';
import { Grex } from 'lib/types';

import style from './style.module.scss';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'View a list of the most recent orchid hybrid registrations.',
  title: `Recent registrations - ${APP_TITLE}`,
};

export default async function Recent() {
  const recent = await fetchRecent();
  const grouped = groupBy(recent, 'date_of_registration');

  return (
    <div className={style.recent}>
      <Padded>
        <H2 className={style.heading}>Recent registrations</H2>
      </Padded>
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

              <List<Grex>
                items={orderBy(grouped[d], ['genus', 'epithet'])}
                itemMinHeight={72}
                renderItem={(item) => (
                  <GrexCard key={item.id} grex={item} hideDate />
                )}
              />
            </details>
          </section>
        );
      })}
    </div>
  );
}
