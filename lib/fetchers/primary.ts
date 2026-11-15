import { queryOrThrow } from 'lib/storage/pg';
import { capitalize } from 'lib/utils';

// A genus `genus` can be crossed with, and the evidence for it.
export type PrimaryPartner = {
  // Capitalized, as registered.
  g: string;
  // Registered hybrids of any kind with one parent in each genus.
  c: number;
  // Of those, primary hybrids: both parents species.
  p: number;
  // When no hybrid crosses the two directly: a hybrid genus whose
  // registrations descend from both, such as Vandaenopsis for Vanda and
  // Phalaenopsis.
  via: string | null;
};

export type PrimaryData = {
  // Capitalized, as registered. The same when crossing within a genus.
  genus: string;
  cross: string;
  // The species of each genus: every species registered, named as the parent
  // of a primary hybrid, or accepted in WCVP. `ids` holds each one's
  // registry id, or '' when it has none. When `cross` is `genus` the columns
  // are the rows, and `cols` is null.
  rows: { names: string[]; ids: string[] };
  cols: { names: string[]; ids: string[] } | null;
  // Registered primary hybrids, one per pair of species, as parallel arrays:
  // the row and column species, and the earliest registration of the cross
  // (either way round). Within a genus, `row` < `col`.
  crosses: {
    row: number[];
    col: number[];
    id: string[];
    // Index into `hybridGenera`.
    genus: number[];
    epithet: string[];
    year: number[];
    // 1 for a natural hybrid.
    natural: number[];
    // Registrations of the pair, if more than one.
    count: number[];
  };
  hybridGenera: string[];
  // Genera `genus` has been crossed with, most hybrids first, those known
  // only through a hybrid genus last. Includes `genus` itself.
  partners: PrimaryPartner[];
  // For a hybrid genus, which has no species of its own: the genera its
  // registrations descend from. Empty otherwise.
  composition: string[];
};

// A parent epithet that names a species: lowercase and not a number, a
// natural hybrid ("�"), or one of the RHS's placeholders for unknown parents.
const speciesEpithet = (col: string) => `(
  coalesce(${col}, '') <> ''
  AND left(${col}, 1) = lower(left(${col}, 1))
  AND left(${col}, 1) !~ '[0-9×]'
  AND left(${col}, 1) <> chr(65533)
  AND lower(${col}) NOT IN ('na', 'uk')
)`;
const BOTH_SPECIES = `(${speciesEpithet('seed_parent_epithet')} AND ${speciesEpithet('pollen_parent_epithet')})`;

// Every pair of parent genera, by the genus of the hybrids they make.
const GENUS_PAIRS_SQL = `
  SELECT genus g, seed_parent_genus s, pollen_parent_genus p,
    COUNT(*)::int c,
    (COUNT(*) FILTER (WHERE ${BOTH_SPECIES}))::int pc
  FROM rhs
  WHERE coalesce(seed_parent_genus, '') NOT IN ('', 'na')
    AND coalesce(pollen_parent_genus, '') NOT IN ('', 'na')
    AND coalesce(genus, '') NOT IN ('', 'na')
  GROUP BY 1, 2, 3
`;

// A registry entry with no parents and a lowercase name: a species.
const SPECIES_ROW = `(
  coalesce(seed_parent_epithet, '') = ''
  AND coalesce(pollen_parent_epithet, '') = ''
  AND ${speciesEpithet('epithet')}
)`;

// Genera with species of their own, in WCVP or in the registry.
const SPECIES_GENERA_SQL = `
  SELECT DISTINCT genus g, 1 w FROM wcvp
  WHERE taxon_rank = 'Species' AND taxon_status = 'Accepted'
  UNION ALL
  SELECT DISTINCT genus, 0 FROM rhs WHERE ${SPECIES_ROW}
`;

const SPECIES_SQL = `
  SELECT epithet n, MIN(id::text) id FROM rhs
  WHERE genus = $1 AND ${SPECIES_ROW}
  GROUP BY epithet
`;

const WCVP_SQL = `
  SELECT taxon_name n FROM wcvp
  WHERE genus = $1 AND taxon_rank = 'Species' AND taxon_status = 'Accepted'
`;

// Primary hybrids between the two genera, one row per pair of species: the
// earliest registration, and how many there are. Within a genus each pair
// is put in name order; across two, `a` is always from $1. A cross is natural
// as in components/pills: a "×" name, the RHS's note, or a lowercase name.
// Registered grexes are preferred over natural hybrids as the example.
const CROSSES_SQL = `
  WITH c AS (
    SELECT id::text id, genus, epithet, date_of_registration d,
      (left(epithet, 1) = '×'
        OR registrant_name = 'This is a natural hybrid'
        OR (left(epithet, 1) = lower(left(epithet, 1)) AND left(epithet, 1) !~ '[0-9]'))::int nat,
      CASE WHEN $1 = $2 THEN seed_parent_epithet <= pollen_parent_epithet
        ELSE seed_parent_genus = $1 END seed_first,
      seed_parent_epithet se, seed_parent_id::text si,
      pollen_parent_epithet pe, pollen_parent_id::text pi
    FROM rhs
    WHERE ((seed_parent_genus = $1 AND pollen_parent_genus = $2)
        OR (seed_parent_genus = $2 AND pollen_parent_genus = $1))
      AND ${BOTH_SPECIES}
  ), o AS (
    SELECT *,
      CASE WHEN seed_first THEN se ELSE pe END a,
      CASE WHEN seed_first THEN si ELSE pi END a_id,
      CASE WHEN seed_first THEN pe ELSE se END b,
      CASE WHEN seed_first THEN pi ELSE si END b_id
    FROM c
  )
  SELECT DISTINCT ON (a, b) a, a_id, b, b_id, id, genus, epithet, nat,
    SUBSTRING(d, 1, 4) y, COUNT(*) OVER (PARTITION BY a, b)::int n
  FROM o
  WHERE NOT ($1 = $2 AND a = b)
  ORDER BY a, b, nat, d NULLS LAST, id
`;

type Graph = {
  // Genera with species of their own.
  natural: Set<string>;
  // For every other genus, the natural genera its hybrids descend from.
  composition: Map<string, Set<string>>;
  // Hybrids between two natural genera, keyed `${a}|${b}` with a <= b.
  direct: Map<string, { c: number; p: number }>;
  // Registered hybrids per hybrid genus, to pick the clearest example.
  size: Map<string, number>;
};

const pairKey = (a: string, b: string) => (a <= b ? `${a}|${b}` : `${b}|${a}`);

async function buildGraph(): Promise<Graph> {
  const [pairs, speciesGenera] = (await Promise.all([
    queryOrThrow(GENUS_PAIRS_SQL),
    queryOrThrow(SPECIES_GENERA_SQL),
  ])) as unknown as [
    { g: string; s: string; p: string; c: number; pc: number }[],
    { g: string; w: number }[],
  ];

  // A genus counts as natural if WCVP accepts species in it, or if the
  // registry lists species in it and none of its hybrids cross genera; the
  // second catches genera the RHS still uses but WCVP has sunk, without
  // mistaking a hybrid genus with a stray natural hybrid for one.
  const crossesGenera = new Set<string>();
  for (const r of pairs) if (r.s !== r.p) crossesGenera.add(r.g);
  const natural = new Set<string>();
  for (const { g, w } of speciesGenera) {
    if (g && (Number(w) === 1 || !crossesGenera.has(g))) natural.add(g);
  }

  const direct = new Map<string, { c: number; p: number }>();
  const size = new Map<string, number>();
  const parentsOf = new Map<string, Set<string>>();
  for (const { g, s, p, c, pc } of pairs) {
    size.set(g, (size.get(g) ?? 0) + Number(c));
    if (natural.has(s) && natural.has(p)) {
      const k = pairKey(s, p);
      const d = direct.get(k) ?? { c: 0, p: 0 };
      d.c += Number(c);
      d.p += Number(pc);
      direct.set(k, d);
    }
    if (natural.has(g)) continue;
    const set = parentsOf.get(g) ?? new Set();
    set.add(s);
    set.add(p);
    parentsOf.set(g, set);
  }

  // What each hybrid genus descends from: the natural genera among its
  // hybrids' parents, and what any hybrid genera among them descend from,
  // repeated until nothing changes.
  const composition = new Map<string, Set<string>>();
  parentsOf.forEach((_, g) => composition.set(g, new Set()));
  for (let changed = true, round = 0; changed && round < 50; round++) {
    changed = false;
    parentsOf.forEach((parents, g) => {
      const into = composition.get(g)!;
      const before = into.size;
      parents.forEach((p) => {
        if (natural.has(p)) into.add(p);
        else composition.get(p)?.forEach((x) => into.add(x));
      });
      if (into.size !== before) changed = true;
    });
  }

  return { natural, composition, direct, size };
}

// The graph covers the whole registry, so it's built once a day per server
// rather than for every genus.
const DAY = 86_400_000;
let graphCache: { at: number; graph: Promise<Graph> } | null = null;
const getGraph = () => {
  if (!graphCache || Date.now() - graphCache.at > DAY) {
    const graph = buildGraph();
    graphCache = { at: Date.now(), graph };
    graph.catch(() => (graphCache = null));
  }
  return graphCache.graph;
};

function partnersOf(genus: string, graph: Graph): PrimaryPartner[] {
  const found = new Map<string, PrimaryPartner>();
  graph.direct.forEach(({ c, p }, k) => {
    const [a, b] = k.split('|');
    if (a !== genus && b !== genus) return;
    const other = a === genus ? b : a;
    found.set(other, { g: other, c, p, via: null });
  });
  // Genera crossed with `genus` only by way of a hybrid genus: the smallest
  // such genus (fewest genera behind it), then the most registered.
  const best = new Map<string, { via: string; k: number; n: number }>();
  graph.composition.forEach((set, h) => {
    if (!set.has(genus) || set.size < 2) return;
    const n = graph.size.get(h) ?? 0;
    set.forEach((other) => {
      if (other === genus || found.has(other)) return;
      const cur = best.get(other);
      if (!cur || set.size < cur.k || (set.size === cur.k && n > cur.n)) {
        best.set(other, { via: h, k: set.size, n });
      }
    });
  });
  best.forEach(({ via }, other) => {
    found.set(other, { g: other, c: 0, p: 0, via });
  });
  // Always offer crosses within the genus, even with none registered.
  if (!found.has(genus)) found.set(genus, { g: genus, c: 0, p: 0, via: null });

  // The genus itself, then the genera crossed directly, then the rest.
  const rank = (x: PrimaryPartner) => (x.g === genus ? 0 : x.via ? 2 : 1);
  return Array.from(found.values()).sort(
    (x, y) =>
      rank(x) - rank(y) || y.c - x.c || y.p - x.p || x.g.localeCompare(y.g),
  );
}

// Every species of `genus`: those registered, then any more named as
// parents in `crosses` or accepted in WCVP.
async function speciesOf(genus: string, fromCrosses: Map<string, string>) {
  const [registered, accepted] = (await Promise.all([
    queryOrThrow(SPECIES_SQL, [genus]),
    queryOrThrow(WCVP_SQL, [genus]),
  ])) as unknown as [{ n: string; id: string }[], { n: string }[]];

  const ids = new Map<string, string>();
  for (const { n, id } of registered) if (n) ids.set(n, id ?? '');
  fromCrosses.forEach((id, n) => {
    if (!ids.get(n)) ids.set(n, id ?? '');
  });
  const prefix = `${genus} `;
  for (const { n } of accepted) {
    const name = n.startsWith(prefix) ? n.slice(prefix.length).trim() : '';
    // WCVP names a few infraspecific taxa at species rank; keep the species.
    if (name && !name.includes(' ') && !ids.has(name)) ids.set(name, '');
  }
  const names = Array.from(ids.keys()).sort((a, b) => a.localeCompare(b));
  return { names, ids: names.map((n) => ids.get(n) ?? '') };
}

type CrossRow = {
  a: string;
  a_id: string | null;
  b: string;
  b_id: string | null;
  id: string;
  genus: string;
  epithet: string;
  nat: number;
  y: string;
  n: number;
};

export async function fetchPrimary(
  rawGenus: string,
  rawCross?: string,
): Promise<PrimaryData> {
  const genus = capitalize(rawGenus.trim().toLowerCase());
  const cross = rawCross ? capitalize(rawCross.trim().toLowerCase()) : genus;
  const same = genus === cross;

  const [graph, rows] = (await Promise.all([
    getGraph(),
    queryOrThrow(CROSSES_SQL, [genus, cross]),
  ])) as unknown as [Graph, CrossRow[]];

  const fromA = new Map<string, string>();
  const fromB = same ? fromA : new Map<string, string>();
  for (const r of rows) {
    if (!fromA.get(r.a)) fromA.set(r.a, r.a_id ?? '');
    if (!fromB.get(r.b)) fromB.set(r.b, r.b_id ?? '');
  }
  const [rowSpecies, colSpecies] = await Promise.all([
    speciesOf(genus, fromA),
    same ? null : speciesOf(cross, fromB),
  ]);

  const rowIndex = new Map(rowSpecies.names.map((n, i) => [n, i]));
  const colIndex = colSpecies
    ? new Map(colSpecies.names.map((n, i) => [n, i]))
    : rowIndex;
  const hybridGenera: string[] = [];
  const genusIndex = new Map<string, number>();
  const crosses: PrimaryData['crosses'] = {
    row: [],
    col: [],
    id: [],
    genus: [],
    epithet: [],
    year: [],
    natural: [],
    count: [],
  };
  for (const r of rows) {
    const i = rowIndex.get(r.a);
    const j = colIndex.get(r.b);
    if (i === undefined || j === undefined) continue;
    if (!genusIndex.has(r.genus)) {
      genusIndex.set(r.genus, hybridGenera.length);
      hybridGenera.push(r.genus);
    }
    crosses.row.push(same ? Math.min(i, j) : i);
    crosses.col.push(same ? Math.max(i, j) : j);
    crosses.id.push(r.id);
    crosses.genus.push(genusIndex.get(r.genus)!);
    crosses.epithet.push(r.epithet);
    crosses.year.push(Number(r.y) || 0);
    crosses.natural.push(Number(r.nat) ? 1 : 0);
    crosses.count.push(Number(r.n) || 1);
  }

  const isNatural = graph.natural.has(genus);
  return {
    genus,
    cross,
    rows: rowSpecies,
    cols: colSpecies,
    crosses,
    hybridGenera,
    partners: isNatural ? partnersOf(genus, graph) : [],
    composition: isNatural
      ? []
      : Array.from(graph.composition.get(genus) ?? []).sort(),
  };
}
