import { orderBy, groupBy } from 'lodash';

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
import { StatCard } from 'components/stat/stat';
import { Grex } from 'lib/types';
import { Tabs } from 'components/tabs/tabs';

export const Registrant = () => {
  const router = useRouter();
  const d = (router.query.d as string) ?? '';

  const rawData = useRegistrant({ name: d });

  const statMap = {
    intergeneric: 0,
    primary: 0,
    genera: new Set(),
    firstYear: null,
  };

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

    const year = parseInt(g.date_of_registration.slice(0, 4), 10);

    if (year) {
      statMap.firstYear =
        statMap.firstYear === null ? year : Math.min(statMap.firstYear, year);
    }
  });

  const registrations = rawData.filter((g) => g.registrant_name === d);
  const originations = rawData.filter((g) => g.originator_name === d);

  return (
    <Container title={`${d} | Orchidex`}>
      <Hero heading={d}>
        <div className={style.quickStats}>
          <span>
            <strong>{rawData.length.toLocaleString()}</strong>{' '}
            {rawData.length === 1 ? 'record' : 'records'} across{' '}
            <strong>{statMap.genera.size}</strong>{' '}
            {statMap.genera.size === 1 ? 'genus' : 'genera'}
          </span>
        </div>
        <div className={style.quickStats}>
          First registered in <strong>{statMap.firstYear}</strong>
        </div>
      </Hero>

      <Tabs
        renderToSide={
          <aside className={style.sidebar}>
            <StatCard
              activeId={d}
              stat='seed_parent_registrants'
              grex={{ registrant_name: d } as Grex}
            />
            <StatCard
              activeId={d}
              stat='seed_parent_originators'
              grex={{ registrant_name: d } as Grex}
            />
            <StatCard
              activeId={d}
              stat='pollen_parent_registrants'
              grex={{ registrant_name: d } as Grex}
            />
            <StatCard
              activeId={d}
              stat='pollen_parent_originators'
              grex={{ registrant_name: d } as Grex}
            />
          </aside>
        }
        config={[
          {
            label: 'Registrant',
            count: registrations.length,
            disabled: registrations.length === 0,
            component: () => {
              const [genus, setGenus] = React.useState('All genera');
              const handleFilterGenus = (genus) => setGenus(genus);
              const onDate = registrations.filter(
                (g) => genus === 'All genera' || g.genus === genus,
              );

              const groupedRaw = groupBy(registrations, 'genus');
              return (
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
                          score: registrations.length,
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
                        {g.genus === 'All genera' ? (
                          g.genus
                        ) : (
                          <em>{g.genus}</em>
                        )}
                      </ButtonSimple>
                    )}
                    getCount={(d) => d.score}
                    showBars={false}
                  />
                  <section className={style.list}>
                    {orderBy(onDate, ['date_of_registration'], ['desc']).map(
                      (grexOnDate, idx) => {
                        return (
                          <GrexCard
                            key={`${grexOnDate.id}-${idx}`}
                            grex={grexOnDate}
                            activeRegId={d}
                          />
                        );
                      },
                    )}
                  </section>
                </section>
              );
            },
          },
          {
            label: `Originator`,
            count: originations.length,
            disabled: originations.length === 0,
            component: () => {
              const [genus, setGenus] = React.useState('All genera');
              const handleFilterGenus = (genus) => setGenus(genus);
              const onDate = originations.filter(
                (g) => genus === 'All genera' || g.genus === genus,
              );

              const groupedRaw = groupBy(originations, 'genus');
              return (
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
                          score: originations.length,
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
                        {g.genus === 'All genera' ? (
                          g.genus
                        ) : (
                          <em>{g.genus}</em>
                        )}
                      </ButtonSimple>
                    )}
                    getCount={(d) => d.score}
                    showBars={false}
                  />
                  <section className={style.list}>
                    {orderBy(onDate, ['date_of_registration'], ['desc']).map(
                      (grexOnDate, idx) => {
                        return (
                          <GrexCard
                            key={`${grexOnDate.id}-${idx}`}
                            grex={grexOnDate}
                            activeRegId={d}
                          />
                        );
                      },
                    )}
                  </section>
                </section>
              );
            },
          },
        ]}
      />
    </Container>
  );
};

export default Registrant;
