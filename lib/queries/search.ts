import { ABBR_TO_GENUS } from 'lib/abbreviations';
import {
  ID_FIELDS,
  NORMALIZED_SEARCH_FIELDS,
  SEARCH_FIELDS,
} from 'lib/constants';
import {
  effectiveSort,
  hasCriteria,
  MAX_PAGE_SIZE,
  PAGE_SIZE,
  SearchParams,
  SearchOrigin,
  SearchType,
} from 'lib/search/params';
import { queryOrThrow } from 'lib/storage/pg';
import { normalize, UNKNOWN_CHAR } from 'lib/string';
import { Grex } from 'lib/types';
import { capitalize } from 'lib/utils';

// Every user-supplied value goes through `add`, which returns a $n placeholder.
// Postgres rejects a query that passes a $n it never uses, so only call `add`
// for SQL that's actually included.
type AddParam = (value: unknown) => string;

const SELECT_FIELDS = ID_FIELDS.concat(SEARCH_FIELDS)
  .map((f) => `rhs.${f}`)
  .join(', ');

const NATURAL_HYBRID_REGISTRANT = 'This is a natural hybrid';

// Wrap a value in double quotes for an exact match; otherwise it's a
// case-insensitive "contains" match. LIKE wildcards are left alone on purpose:
// the grex page relies on `_` to match unknown characters.
function matchColumn(column: string, value: string, add: AddParam) {
  const normalized = NORMALIZED_SEARCH_FIELDS.includes(column);
  const left = normalized ? `rhs.${column}_normalized` : `lower(rhs.${column})`;
  const isExact =
    value.length > 1 && value.startsWith('"') && value.endsWith('"');
  const raw = isExact ? value.slice(1, -1) : value;
  const term = normalized ? normalize(raw) : raw.toLowerCase();

  return isExact
    ? `${left} = ${add(term)}`
    : `${left} LIKE ${add(`%${term}%`)}`;
}

function parentSide(
  role: 'seed' | 'pollen',
  genus: string | undefined,
  epithet: string | undefined,
  add: AddParam
) {
  const conds: string[] = [];
  if (genus) conds.push(matchColumn(`${role}_parent_genus`, genus, add));
  if (epithet) conds.push(matchColumn(`${role}_parent_epithet`, epithet, add));
  return conds;
}

function parentCondition(p: SearchParams, add: AddParam) {
  const asListed = [
    ...parentSide('seed', p.g1, p.e1, add),
    ...parentSide('pollen', p.g2, p.e2, add),
  ];
  const reversed = [
    ...parentSide('seed', p.g2, p.e2, add),
    ...parentSide('pollen', p.g1, p.e1, add),
  ];
  return `((${asListed.join(' AND ')}) OR (${reversed.join(' AND ')}))`;
}

// SQL versions of the badge rules in components/pills/pills.tsx. One
// difference: natural hybrids also count as primary here, since every natural
// hybrid is a cross of two species.
function typeCondition(type: SearchType | SearchOrigin | 'natural') {
  const first = (col: string) => `left(rhs.${col}, 1)`;
  const startsLower = (col: string) => `${first(col)} = lower(${first(col)})`;
  const present = (col: string) => `coalesce(rhs.${col}, '') <> ''`;

  const hasParents = `(${present('seed_parent_epithet')} AND ${present(
    'pollen_parent_epithet'
  )})`;
  // A parent recorded with an unknown character, chr(65533) "�".
  const parentIsNatural = `(${first(
    'seed_parent_epithet'
  )} = chr(65533) OR ${first('pollen_parent_epithet')} = chr(65533))`;
  const lowerEpithet = `(${startsLower('epithet')} AND ${first(
    'epithet'
  )} !~ '[0-9]')`;
  const natural = `(${first(
    'epithet'
  )} = '×' OR (${hasParents} AND (coalesce(rhs.registrant_name, '') = '${NATURAL_HYBRID_REGISTRANT}' OR (NOT ${parentIsNatural} AND ${lowerEpithet}))))`;
  const species = `(NOT ${hasParents} AND ${lowerEpithet} AND ${first(
    'epithet'
  )} <> '×')`;
  const speciesParents = `(${hasParents} AND NOT ${parentIsNatural} AND ${startsLower(
    'seed_parent_epithet'
  )} AND ${startsLower('pollen_parent_epithet')})`;
  const primary = `(${natural} OR ${speciesParents})`;

  switch (type) {
    case 'species':
      return species;
    case 'hybrid':
      return `NOT ${species}`;
    case 'natural':
      return natural;
    case 'primary':
      return primary;
    // Every other hybrid: at least one parent is itself a hybrid.
    case 'complex':
      return `(NOT ${species} AND NOT ${primary})`;
  }
}

// Turns free text into prefix-matching tsquery terms, e.g. "paph rothsch" →
// "paphiopedilum:* & rothsch:*". Characters with meaning in tsquery syntax are
// dropped so a stray "&" or ":" can't break the query.
const NON_WORD = new RegExp('[^\\p{L}\\p{N}]+', 'u');

function textQuery(q: string) {
  const tokens = normalize(q)
    .split(NON_WORD)
    .filter((t) => t);

  if (tokens.length === 0) return null;

  // Genus abbreviations like "Paph" have three consonants in a row.
  if (/[^aeiou\s]{3}/i.test(tokens[0])) {
    const genus = ABBR_TO_GENUS[`${capitalize(tokens[0])}.`];
    if (genus) tokens[0] = normalize(genus);
  }

  return {
    prefix: tokens.map((t) => `${t}:*`).join(' & '),
    exact: tokens.join(' & '),
  };
}

export type SearchResult = { results: Grex[]; total: number };

// `limit` and `offset` may come straight from a URL; they're clamped here.
// With no criteria this pages through the whole registry.
export async function searchRegistry(
  p: SearchParams,
  { limit, offset }: { limit?: unknown; offset?: unknown } = {}
): Promise<SearchResult> {
  const values: unknown[] = [];
  const add: AddParam = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  const where = [`rhs.epithet <> ''`];
  let from = 'rhs';
  let rank = '';

  if (p.q) {
    const text = textQuery(p.q);
    // Text with nothing searchable in it (e.g. "&&") matches nothing.
    if (!text) return { results: [], total: 0 };

    from = 'rhs JOIN materialized_fts f ON f.id = rhs.id';
    where.push(`f.document @@ to_tsquery(${add(text.prefix)})`);
    // Only the relevance sort uses this, so only that sort adds its param.
    rank = text.exact;
  }

  if (p.genus) where.push(matchColumn('genus', p.genus, add));
  if (p.epithet) where.push(matchColumn('epithet', p.epithet, add));
  if (p.registrant) {
    where.push(matchColumn('registrant_name', p.registrant, add));
  }
  if (p.originator) {
    where.push(matchColumn('originator_name', p.originator, add));
  }
  if (p.g1 || p.e1 || p.g2 || p.e2) where.push(parentCondition(p, add));
  if (p.type) where.push(typeCondition(p.type));
  if (p.type === 'hybrid' && p.origin) where.push(typeCondition(p.origin));
  if (p.type === 'hybrid' && p.origin === 'primary' && p.natural) {
    where.push(typeCondition('natural'));
  }
  if (p.type === 'hybrid' && p.intergeneric) {
    where.push(
      `coalesce(rhs.seed_parent_genus, '') <> coalesce(rhs.pollen_parent_genus, '')`
    );
  }
  // Species have an empty date, which would otherwise sort before any year.
  const date = `NULLIF(rhs.date_of_registration, '')`;
  if (p.from) where.push(`${date} >= ${add(p.from)}`);
  if (p.to) where.push(`${date} <= ${add(p.to)}`);

  const sort = effectiveSort(p);
  const orderBy =
    sort === 'relevance'
      ? // Species first, then best text match.
        `(lower(rhs.epithet) = rhs.epithet) DESC, ts_rank(f.document, to_tsquery(${add(
          rank
        )})) DESC, ${date} DESC NULLS LAST`
      : sort === 'newest'
      ? `${date} DESC NULLS LAST, rhs.genus, rhs.epithet`
      : sort === 'oldest'
      ? `${date} ASC NULLS LAST, rhs.genus, rhs.epithet`
      : `rhs.genus, rhs.epithet`;

  const safeLimit = clampInt(limit, 1, MAX_PAGE_SIZE, PAGE_SIZE);
  const safeOffset = clampInt(offset, 0, Number.MAX_SAFE_INTEGER, 0);

  const sql = `
    SELECT ${SELECT_FIELDS}, count(*) OVER() AS total_count
    FROM ${from}
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}, rhs.id
    LIMIT ${add(safeLimit)} OFFSET ${add(safeOffset)}`;

  const rows = (await queryOrThrow(sql, values)) as (Grex & {
    total_count: string;
  })[];

  return {
    results: rows.map(({ total_count, ...grex }) => grex),
    // On a page past the end there are no rows to carry the count.
    total: rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0,
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

// Field search used by the grex page to look a record up by name.
// Returns nothing rather than the first page of everything when given no
// criteria.
export const querySearch = async (p: SearchParams): Promise<Grex[]> =>
  hasCriteria(p)
    ? (await searchRegistry(p, { limit: MAX_PAGE_SIZE })).results
    : [];
