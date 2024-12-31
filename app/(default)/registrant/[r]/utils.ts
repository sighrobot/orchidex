import { isIntergeneric, isPrimary } from 'components/pills/pills';
import { Grex } from 'lib/types';

export type StatMap = {
  intergeneric: number;
  primary: number;
  numGenera: number;
  firstYear: number | null;
  registrations: Grex[];
  originations: Grex[];
};

export const createRegistrantStatMap = (name: string, rawData: Grex[]) => {
  const statMap: StatMap = {
    intergeneric: 0,
    primary: 0,
    firstYear: null,
    registrations: [],
    originations: [],
    numGenera: 0,
  };

  const genera = new Set();

  rawData.forEach((g) => {
    if (isPrimary(g)) {
      statMap.primary += 1;
    }

    if (isIntergeneric(g)) {
      statMap.intergeneric += 1;
    }

    genera.add(g.genus);

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

  statMap.numGenera = genera.size;

  return statMap;
};
