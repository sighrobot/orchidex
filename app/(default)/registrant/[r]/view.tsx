'use client';

import React from 'react';
import { orderBy, groupBy } from 'lodash';

import { GrexCard } from 'components/grex/grex';
import VizList from 'components/viz/list';
import { ButtonSimple } from 'components/button-simple/button-simple';
import { StatCard } from 'components/stat/stat';
import { Grex } from 'lib/types';
import { Tabs } from 'components/tabs/tabs';
import List from 'components/list';
import { H2 } from 'components/layout';
import { Padded } from 'components/container/container';
import { createRegistrantStatMap } from './utils';

import style from './style.module.scss';

type RegistrantViewProps = {
  name: string;
  rawData: Grex[];
};

export default function RegistrantView({ name, rawData }: RegistrantViewProps) {
  const statMap = createRegistrantStatMap(name, rawData);
  const { registrations, originations } = statMap;

  return (
    <>
      <Padded>
        <H2>{name}</H2>

        <div className={style.quickStats}>
          <span>
            <strong>{rawData.length.toLocaleString()}</strong>{' '}
            {rawData.length === 1 ? 'record' : 'records'} across{' '}
            <strong>{statMap.numGenera}</strong>{' '}
            {statMap.numGenera === 1 ? 'genus' : 'genera'}
          </span>
        </div>
        <div className={style.quickStats}>
          First registered in <strong>{statMap.firstYear}</strong>
        </div>
      </Padded>

      <Tabs
        renderToSide={
          <aside className={style.sidebar}>
            <StatCard
              activeId={name}
              stat='seed_parent_registrants'
              grex={{ registrant_name: name } as Grex}
            />
            <StatCard
              activeId={name}
              stat='seed_parent_originators'
              grex={{ registrant_name: name } as Grex}
            />
            <StatCard
              activeId={name}
              stat='pollen_parent_registrants'
              grex={{ registrant_name: name } as Grex}
            />
            <StatCard
              activeId={name}
              stat='pollen_parent_originators'
              grex={{ registrant_name: name } as Grex}
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
                (g) => genus === 'All genera' || g.genus === genus
              );

              const groupedRaw = groupBy(registrations, 'genus');
              return (
                <section className={style.columns}>
                  <VizList
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
                    <List<Grex>
                      itemMinHeight={72}
                      items={orderBy(
                        onDate,
                        ['date_of_registration'],
                        ['desc']
                      )}
                      renderItem={(item) => (
                        <GrexCard grex={item} activeRegId={name} />
                      )}
                    />
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
                (g) => genus === 'All genera' || g.genus === genus
              );

              const groupedRaw = groupBy(originations, 'genus');
              return (
                <section className={style.columns}>
                  <VizList
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
                    <List<Grex>
                      itemMinHeight={72}
                      items={orderBy(
                        onDate,
                        ['date_of_registration'],
                        ['desc']
                      )}
                      renderItem={(item) => (
                        <GrexCard grex={item} activeRegId={name} />
                      )}
                    />
                  </section>
                </section>
              );
            },
          },
        ]}
      />
    </>
  );
}
