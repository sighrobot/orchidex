import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { queryOrThrow } from 'lib/storage/pg';

export type GenusDominanceGenus = {
  name: string;
  abbr: string;
  total: number;
};

export type GenusDominanceData = {
  // First and last year with registrations (inclusive).
  start: number;
  end: number;
  // The calendar year when the data was fetched.
  currentYear: number;
  // Sorted by all-time registrations, most first.
  genera: GenusDominanceGenus[];
  // Flat [genus index, year - start, count] triples, sorted by year then genus.
  cells: number[];
};

// The few registrations before this are a year or more apart, so each one
// would draw as a full-height bar of a single genus.
const FIRST_YEAR = 1857;

const SQL = `
  SELECT genus g, SUBSTRING(date_of_registration, 1, 4) y, COUNT(*)::int c
  FROM rhs
  WHERE genus != 'na'
    AND epithet != ''
    AND registrant_name != ''
    AND date_of_registration ~ '^[0-9]{4}'
  GROUP BY g, y
`;

export async function fetchGenusDominance(): Promise<GenusDominanceData> {
  const currentYear = new Date().getFullYear();
  const rows = (await queryOrThrow(SQL)) as unknown as {
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
    return { start: 0, end: -1, currentYear, genera: [], cells: [] };
  }

  const genera = Array.from(totals, ([name, total]) => ({
    name,
    abbr: GENUS_TO_ABBREVIATION[name] || name,
    total,
  })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const index = new Map(genera.map((g, i) => [g.name, i]));
  const cells = kept
    .map(({ g, y, c }) => [index.get(g) ?? 0, y - start, c])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .flat();

  return { start, end, currentYear, genera, cells };
}
