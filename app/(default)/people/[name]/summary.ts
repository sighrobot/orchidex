import { countBy, orderBy } from 'lodash';

import { Grex, PersonCount } from 'lib/types';

export type PersonSummary = {
  total: number;
  registered: number;
  originated: number;
  numGenera: number;
  topGenera: PersonCount[];
  firstYear: number | null;
  lastYear: number | null;
  // The people on the other side of their records: originators of what they
  // registered, and registrants of what they originated.
  collaborators: PersonCount[];
};

const year = (g: Grex) => parseInt(g.date_of_registration?.slice(0, 4), 10);

const isRealPerson = (name: string | undefined, self: string) =>
  !!name && name !== self && name !== 'O/U' && !name.includes('natural hybrid');

const top = (counts: Record<string, number>, n: number): PersonCount[] =>
  orderBy(
    Object.entries(counts).map(([name, count]) => ({ name, count })),
    ['count', 'name'],
    ['desc', 'asc']
  ).slice(0, n);

export function summarizePerson(name: string, grexes: Grex[]): PersonSummary {
  const years = grexes.map(year).filter((y) => !Number.isNaN(y));
  const genera = countBy(grexes, 'genus');

  const others: Record<string, number> = {};
  grexes.forEach((g) => {
    const other =
      g.registrant_name === name ? g.originator_name : g.registrant_name;
    if (isRealPerson(other, name)) others[other] = (others[other] ?? 0) + 1;
  });

  return {
    total: grexes.length,
    registered: grexes.filter((g) => g.registrant_name === name).length,
    originated: grexes.filter((g) => g.originator_name === name).length,
    numGenera: Object.keys(genera).length,
    topGenera: top(genera, 3),
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
    collaborators: top(others, 5),
  };
}

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

// "Registered 120 and originated 98 hybrids in 12 genera, 1985–2024."
export function describePerson(s: PersonSummary): string {
  const hybrids = (n: number) => plural(n, 'hybrid', 'hybrids');

  const what =
    s.registered && s.originated
      ? `Registered ${s.registered.toLocaleString()} and originated ${hybrids(
          s.originated
        )}`
      : s.registered
      ? `Registered ${hybrids(s.registered)}`
      : `Originated ${hybrids(s.originated)}`;

  const where = ` in ${plural(s.numGenera, 'genus', 'genera')}`;

  const when =
    s.firstYear === null
      ? ''
      : s.firstYear === s.lastYear
      ? `, ${s.firstYear}`
      : `, ${s.firstYear}–${s.lastYear}`;

  return `${what}${where}${when}.`;
}
