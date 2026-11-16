import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { queryOrThrow } from 'lib/storage/pg';
import { Grex } from 'lib/types';

// Ancestry and progeny walks over the parent ids in `rhs`. Every input is
// passed as a $n parameter. Depths are capped so a bad record (or a cycle)
// can't run away.

const FIELDS = [...ID_FIELDS, ...SEARCH_FIELDS];
const rhsFields = (alias: string) => FIELDS.map((f) => `${alias}.${f}`).join(', ');

export const MAX_ANCESTRY_DEPTH = 40;
export const MAX_PROGENY_GENERATIONS = 10;

export type AncestorRow = Grex & {
  // Fewest and most generations back this ancestor appears.
  min_depth: number;
  max_depth: number;
  // How many distinct lines of descent lead to it.
  paths: number;
  // Share of the root's genome from this ancestor: the sum over every path
  // of 1/2^depth. The root itself is 1.
  contribution: number;
};

// Every ancestor of `id`, including `id` itself at depth 0. A parent used as
// both seed and pollen parent (a selfing) is walked twice, so contributions
// add up.
export async function queryAncestry(id: string): Promise<AncestorRow[]> {
  const rows = await queryOrThrow(
    `WITH RECURSIVE walk AS (
       SELECT id, seed_parent_id, pollen_parent_id, 0 AS depth, 1::float8 AS w
       FROM rhs WHERE id = $1
       UNION ALL
       SELECT r.id, r.seed_parent_id, r.pollen_parent_id, walk.depth + 1, walk.w / 2
       FROM walk
       CROSS JOIN LATERAL (VALUES (walk.seed_parent_id), (walk.pollen_parent_id)) p(pid)
       JOIN rhs r ON r.id = p.pid
       WHERE walk.depth < $2
     ), agg AS (
       SELECT id, MIN(depth)::int min_depth, MAX(depth)::int max_depth,
              COUNT(*)::int paths, SUM(w)::float8 contribution
       FROM walk GROUP BY id
     )
     SELECT ${rhsFields('rhs')}, agg.min_depth, agg.max_depth, agg.paths, agg.contribution
     FROM agg JOIN rhs ON rhs.id = agg.id
     ORDER BY agg.min_depth, agg.contribution DESC, rhs.genus, rhs.epithet`,
    [id, MAX_ANCESTRY_DEPTH],
  );
  return rows as unknown as AncestorRow[];
}

export type ProgenySort = 'newest' | 'oldest' | 'name' | 'most_progeny';

const PROGENY_ORDER: Record<ProgenySort, string> = {
  newest: `NULLIF(rhs.date_of_registration, '') DESC NULLS LAST, rhs.genus, rhs.epithet`,
  oldest: `NULLIF(rhs.date_of_registration, '') ASC NULLS LAST, rhs.genus, rhs.epithet`,
  name: 'rhs.genus, rhs.epithet',
  most_progeny: `child_count DESC, NULLIF(rhs.date_of_registration, '') DESC NULLS LAST`,
};

export type ProgenyRow = Grex & {
  // The nearest generation this descendant appears in (1 = child).
  generation: number;
  // How many registered hybrids name it as a parent.
  child_count: number;
};

export type ProgenyPage = {
  total: number;
  by_generation: { generation: number; count: number }[];
  results: ProgenyRow[];
};

// Descendants of `id` up to `generations` deep, each listed once at its
// nearest generation.
export async function queryProgeny(
  id: string,
  {
    generations,
    sort,
    limit,
    offset,
  }: { generations: number; sort: ProgenySort; limit: number; offset: number },
): Promise<ProgenyPage> {
  const descendants = `WITH RECURSIVE walk AS (
       SELECT id, 1 AS generation FROM rhs
       WHERE (seed_parent_id = $1 OR pollen_parent_id = $1) AND id <> $1
       UNION
       SELECT r.id, walk.generation + 1
       FROM walk JOIN rhs r ON r.seed_parent_id = walk.id OR r.pollen_parent_id = walk.id
       WHERE walk.generation < $2
     ), d AS (
       SELECT id, MIN(generation)::int generation FROM walk WHERE id <> $1 GROUP BY id
     )`;

  const [rows, gens] = await Promise.all([
    queryOrThrow(
      `${descendants}
       SELECT ${rhsFields('rhs')}, d.generation,
              (SELECT COUNT(*) FROM rhs c
               WHERE c.seed_parent_id = rhs.id OR c.pollen_parent_id = rhs.id)::int child_count
       FROM d JOIN rhs ON rhs.id = d.id
       ORDER BY d.generation, ${PROGENY_ORDER[sort]}, rhs.id
       LIMIT $3 OFFSET $4`,
      [id, generations, limit, offset],
    ),
    queryOrThrow(
      `${descendants}
       SELECT generation, COUNT(*)::int count FROM d GROUP BY generation ORDER BY generation`,
      [id, generations],
    ),
  ]);

  const by_generation = gens as unknown as ProgenyPage['by_generation'];

  return {
    total: by_generation.reduce((sum, g) => sum + g.count, 0),
    by_generation,
    results: rows as unknown as ProgenyRow[],
  };
}

// How many registered hybrids name `id` as seed or pollen parent.
export async function queryChildCount(id: string): Promise<number> {
  const [row] = (await queryOrThrow(
    `SELECT COUNT(*)::int c FROM rhs WHERE seed_parent_id = $1 OR pollen_parent_id = $1`,
    [id],
  )) as unknown as { c: number }[];
  return row?.c ?? 0;
}

// Registered crosses of `a` and `b`, in either direction. Selfings (a × a)
// match when `a` and `b` are the same.
export const queryCross = (a: string, b: string): Promise<Grex[]> =>
  queryOrThrow(
    `SELECT ${rhsFields('rhs')} FROM rhs
     WHERE epithet <> ''
       AND ((seed_parent_id = $1 AND pollen_parent_id = $2)
         OR (seed_parent_id = $2 AND pollen_parent_id = $1))
     ORDER BY NULLIF(date_of_registration, '') NULLS LAST`,
    [a, b],
  );
