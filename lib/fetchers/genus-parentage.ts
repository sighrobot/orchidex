import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { queryOrThrow } from 'lib/storage/pg';

export type GenusParentageData = {
  // Every genus registered or named as a parent, as registered. Sorted by
  // registrations, most first, then by name.
  genera: string[];
  // RHS abbreviations, parallel to `genera`; the name itself if none.
  abbrs: string[];
  // Orchids registered in each genus.
  registered: number[];
  // How many registered hybrids name an orchid of each genus as seed or
  // pollen parent.
  seed: number[];
  pollen: number[];
  // Of those, how many are hybrids in another genus.
  outside: number[];
  // Accepted species in WCVP.
  species: number[];
};

// One pass over the registry: each registration counts once for its genus,
// and once for each parent's genus.
const RHS_SQL = `
  WITH uses AS (
    SELECT TRIM(genus) g, 1 r, 0 s, 0 p, 0 o
    FROM rhs
    WHERE genus != 'na' AND epithet != ''
    UNION ALL
    SELECT TRIM(seed_parent_genus), 0, 1, 0,
      (TRIM(seed_parent_genus) != TRIM(genus))::int
    FROM rhs
    WHERE genus != 'na' AND epithet != ''
    UNION ALL
    SELECT TRIM(pollen_parent_genus), 0, 0, 1,
      (TRIM(pollen_parent_genus) != TRIM(genus))::int
    FROM rhs
    WHERE genus != 'na' AND epithet != ''
  )
  SELECT g, SUM(r)::int r, SUM(s)::int s, SUM(p)::int p, SUM(o)::int o
  FROM uses
  WHERE g IS NOT NULL AND g != '' AND g != 'na'
  GROUP BY g
`;

const WCVP_SQL = `
  SELECT genus g, COUNT(*)::int n
  FROM wcvp
  WHERE genus = ANY($1) AND taxon_rank = 'Species' AND taxon_status = 'Accepted'
  GROUP BY genus
`;

type Row = { g: string; r: number; s: number; p: number; o: number };

export async function fetchGenusParentage(): Promise<GenusParentageData> {
  const rows = (await queryOrThrow(RHS_SQL)) as unknown as Row[];
  const species = (await queryOrThrow(WCVP_SQL, [
    rows.map((r) => r.g),
  ])) as unknown as { g: string; n: number }[];
  const speciesOf = new Map(species.map(({ g, n }) => [g, Number(n)]));

  const sorted = rows
    .map((r) => ({
      g: r.g,
      r: Number(r.r),
      s: Number(r.s),
      p: Number(r.p),
      o: Number(r.o),
    }))
    .sort((a, b) => b.r - a.r || a.g.localeCompare(b.g));

  return {
    genera: sorted.map((r) => r.g),
    abbrs: sorted.map((r) => GENUS_TO_ABBREVIATION[r.g] ?? r.g),
    registered: sorted.map((r) => r.r),
    seed: sorted.map((r) => r.s),
    pollen: sorted.map((r) => r.p),
    outside: sorted.map((r) => r.o),
    species: sorted.map((r) => speciesOf.get(r.g) ?? 0),
  };
}
