import { queryOrThrow } from 'lib/storage/pg';
import { capitalize } from 'lib/utils';

export type ParentageData = {
  // Capitalized, as registered.
  genus: string;
  // Every orchid in the genus: those registered, those named as a parent,
  // and the accepted species in WCVP. Sorted by progeny, most first, then by
  // name.
  names: string[];
  // How many registered hybrids name each orchid as seed or pollen parent,
  // parallel to `names`.
  seed: number[];
  pollen: number[];
};

// One pass over the registry for the genus: each orchid with how often it's
// the seed or pollen parent, including the ones never used (0 and 0).
const RHS_SQL = `
  WITH uses AS (
    SELECT seed_parent_epithet e, 1 s, 0 p FROM rhs WHERE seed_parent_genus = $1
    UNION ALL
    SELECT pollen_parent_epithet, 0, 1 FROM rhs WHERE pollen_parent_genus = $1
    UNION ALL
    SELECT epithet, 0, 0 FROM rhs WHERE genus = $1
  )
  SELECT e, SUM(s)::int s, SUM(p)::int p
  FROM uses
  WHERE e IS NOT NULL AND e != ''
  GROUP BY e
`;

// Accepted species, which may never have been registered or used.
const WCVP_SQL = `
  SELECT taxon_name n
  FROM wcvp
  WHERE genus = $1 AND taxon_rank = 'Species' AND taxon_status = 'Accepted'
`;

export async function fetchParentage(rawGenus: string): Promise<ParentageData> {
  const genus = capitalize(rawGenus.trim().toLowerCase());
  const [rows, species] = (await Promise.all([
    queryOrThrow(RHS_SQL, [genus]),
    queryOrThrow(WCVP_SQL, [genus]),
  ])) as unknown as [{ e: string; s: number; p: number }[], { n: string }[]];

  const byName = new Map<string, { s: number; p: number }>();
  for (const r of rows) byName.set(r.e, { s: Number(r.s), p: Number(r.p) });

  const prefix = `${genus} `;
  for (const { n } of species) {
    const name = n.startsWith(prefix) ? n.slice(prefix.length).trim() : '';
    if (name && !byName.has(name)) byName.set(name, { s: 0, p: 0 });
  }

  const sorted = Array.from(byName).sort(
    ([a, x], [b, y]) => y.s + y.p - (x.s + x.p) || a.localeCompare(b),
  );

  return {
    genus,
    names: sorted.map(([n]) => n),
    seed: sorted.map(([, c]) => c.s),
    pollen: sorted.map(([, c]) => c.p),
  };
}
