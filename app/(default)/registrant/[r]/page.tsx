import React from 'react';
import { Grex } from 'lib/types';

import { isIntergeneric, isPrimary } from 'components/pills/pills';
import { fetchRegistrant } from './layout';
import RegistrantView from './view';

export type StatMap = {
  intergeneric: number;
  primary: number;
  genera: Set<string>;
  firstYear: number | null;
  registrations: Grex[];
  originations: Grex[];
};

export const createRegistrantStatMap = (name: string, rawData: Grex[]) => {
  const statMap: StatMap = {
    intergeneric: 0,
    primary: 0,
    genera: new Set(),
    firstYear: null,
    registrations: [],
    originations: [],
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

    if (g.registrant_name === name) {
      statMap.registrations.push(g);
    }

    if (g.originator_name === name) {
      statMap.originations.push(g);
    }
  });

  return statMap;
};

export default async function RegistrantPage({
  params: { r: rawR } = { r: '' },
} = {}) {
  const name = decodeURIComponent(rawR);
  const rawData = (await fetchRegistrant(name)) as Grex[];
  const statMap = createRegistrantStatMap(name, rawData);

  return (
    <>
      <RegistrantView name={name} rawData={rawData} statMap={statMap} />
    </>
  );
}
