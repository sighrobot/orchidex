import { orderBy, groupBy, sortBy } from 'lodash';

import { Container } from 'components/container/container';

import { useRouter } from 'next/router';
import { useRegistrant } from 'lib/hooks/useRegistrant';
import { GrexCard } from 'components/grex/grex';
import { Hero } from 'components/hero';

import style from './style.module.scss';
import { isIntergeneric, isPrimary } from 'components/pills/pills';
import List from 'components/viz/list';
import { ButtonSimple } from 'components/button-simple/button-simple';
import React from 'react';

const thisYear = new Date().getFullYear();

export const Registrant = () => {
  const [genus, setGenus] = React.useState('All genera');
  const router = useRouter();
  const { d = '' } = router.query;

  const rawData = useRegistrant({ name: d });
  const onDate = rawData.filter(
    (g) => genus === 'All genera' || g.genus === genus,
  );
  const statMap = { intergeneric: 0, primary: 0, genera: new Set() };

  rawData.forEach((g) => {
    if (isPrimary(g)) {
      statMap.primary += 1;
    }

    if (isIntergeneric(g)) {
      statMap.intergeneric += 1;
    }

    statMap.genera = statMap.genera
      ? statMap.genera.add(g.genus)
      : new Set([g.genus]);
  });

  const groupedRaw = groupBy(rawData, 'genus');

  const handleFilterGenus = (genus) => setGenus(genus);

  return (
    <Container title={`${d} | Orchidex`}>
      <Hero subheading='Registrant' heading={d}>
        <div className={style.quickStats}>
          <span>
            <strong>{rawData.length.toLocaleString()}</strong>{' '}
            {rawData.length === 1 ? 'hybrid' : 'hybrids'} in{' '}
            <strong>{statMap.genera.size}</strong>{' '}
            {statMap.genera.size === 1 ? 'genus' : 'genera'}
          </span>
        </div>
      </Hero>

      <section className={style.columns}>
        <List
          activeId={genus}
          className={style.genusFacet}
          data={Object.keys(groupedRaw)
            .map((genus) => ({
              score: groupedRaw[genus].length,
              grex: groupedRaw[genus][0],
              id: genus,
            }))
            .concat([
              {
                score: rawData.length,
                grex: { genus: 'All genera', epithet: '' },
                id: 'All genera',
              },
            ])}
          renderField={({ grex: g = {} }) => (
            <ButtonSimple
              onClick={() => handleFilterGenus(g.genus)}
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'left',
                textDecoration: 'none',
              }}
            >
              {g.genus === 'All genera' ? g.genus : <em>{g.genus}</em>}
            </ButtonSimple>
          )}
          getCount={(d) => d.score}
          showBars={false}
        />
        <section className={style.list}>
          {orderBy(onDate, ['date_of_registration'], ['desc']).map(
            (grexOnDate, idx) => {
              return (
                <GrexCard key={`${grexOnDate.id}-${idx}`} grex={grexOnDate} />
              );
            },
          )}
        </section>

        <aside></aside>
      </section>
    </Container>
  );
};

export default Registrant;
