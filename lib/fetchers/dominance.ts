import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { queryOrThrow } from 'lib/storage/pg';

// What a dominance chart splits each year's registrations by.
export type DominanceKind = 'genus' | 'registrant';

// Each kind's counterpart: a genus's registrations split by registrant, and a
// registrant's split by genus.
export const OTHER_KIND: Record<DominanceKind, DominanceKind> = {
  genus: 'registrant',
  registrant: 'genus',
};

// One genus or registrant whose registrations a chart is limited to.
export type DominanceWithin = { kind: DominanceKind; name: string };

export type DominanceGroup = {
  name: string;
  // A short form for labels: the genus abbreviation, or the name itself.
  abbr: string;
  total: number;
};

export type DominanceData = {
  // First and last year with registrations (inclusive).
  start: number;
  end: number;
  // The calendar year when the data was fetched.
  currentYear: number;
  // Sorted by all-time registrations, most first.
  groups: DominanceGroup[];
  // Flat [group index, year - start, count] triples, sorted by year then group.
  cells: number[];
};

// The few registrations before this are a year or more apart, so each one
// would draw as a full-height bar of a single group.
const FIRST_YEAR = 1857;

// The column each kind groups by. Fixed here, never taken from input.
const COLUMN: Record<DominanceKind, string> = {
  genus: 'genus',
  registrant: 'registrant_name',
};

// Rows each kind leaves out, beyond those every kind does. "O/U" is the
// registry's mark for an unknown registrant, so it isn't anyone's share of
// registrations; those orchids still count toward their genus.
const EXCLUDE: Record<DominanceKind, string> = {
  genus: '',
  registrant: `AND registrant_name != 'O/U'`,
};

const sql = (kind: DominanceKind, within?: DominanceWithin) => `
  SELECT ${COLUMN[kind]} g, SUBSTRING(date_of_registration, 1, 4) y, COUNT(*)::int c
  FROM rhs
  WHERE genus != 'na'
    AND epithet != ''
    AND registrant_name != ''
    AND date_of_registration ~ '^[0-9]{4}'
    ${EXCLUDE[kind]}
    ${within ? `AND ${COLUMN[within.kind]} = $1` : ''}
  GROUP BY g, y
`;

// Registrations per group per year, of all registrations or only those of
// one genus or registrant (`within`, which must be of the other kind).
export async function fetchDominance(
  kind: DominanceKind,
  within?: DominanceWithin,
): Promise<DominanceData> {
  const currentYear = new Date().getFullYear();
  const rows = (await queryOrThrow(
    sql(kind, within),
    within ? [within.name] : undefined,
  )) as unknown as {
    g: string;
    y: string;
    c: number;
  }[];

  const totals = new Map<string, number>();
  const kept: { g: string; y: number; c: number }[] = [];
  let start = Infinity;
  let end = -Infinity;

  for (const r of rows) {
    const y = Number(r.y);
    const c = Number(r.c);
    if (!r.g || y < FIRST_YEAR || y > currentYear || !c) continue;
    kept.push({ g: r.g, y, c });
    totals.set(r.g, (totals.get(r.g) ?? 0) + c);
    if (y < start) start = y;
    if (y > end) end = y;
  }

  if (!kept.length) {
    return { start: 0, end: -1, currentYear, groups: [], cells: [] };
  }

  const groups = Array.from(totals, ([name, total]) => ({
    name,
    abbr: (kind === 'genus' && GENUS_TO_ABBREVIATION[name]) || name,
    total,
  })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const index = new Map(groups.map((g, i) => [g.name, i]));
  const cells = kept
    .map(({ g, y, c }) => [index.get(g) ?? 0, y - start, c])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .flat();

  return { start, end, currentYear, groups, cells };
}
