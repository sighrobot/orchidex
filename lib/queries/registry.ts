import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { queryOrThrow } from 'lib/storage/pg';
import { Grex } from 'lib/types';

// Registry-wide numbers: totals, the newest registrations and trends.

const FIELDS = [...ID_FIELDS, ...SEARCH_FIELDS].join(', ');

export type RegistryOverview = {
  records: number;
  registered_hybrids: number;
  species: number;
  natural_hybrids: number;
  synonyms: number;
  genera: number;
  registrants: number;
  first_registration: string | null;
  latest_registration: string | null;
  registered_this_year: number;
  registered_last_year: number;
};

export async function queryOverview(): Promise<RegistryOverview> {
  const year = new Date().getFullYear();
  const [row] = (await queryOrThrow(
    `SELECT
       COUNT(*)::int records,
       COUNT(*) FILTER (WHERE epithet <> '' AND date_of_registration <> '')::int registered_hybrids,
       COUNT(*) FILTER (WHERE epithet <> ''
         AND left(epithet, 1) = lower(left(epithet, 1))
         AND left(epithet, 1) !~ '[0-9×]'
         AND coalesce(seed_parent_epithet, '') = '')::int species,
       COUNT(*) FILTER (WHERE registrant_name LIKE '%a natural hybrid%')::int natural_hybrids,
       COUNT(*) FILTER (WHERE synonym_flag LIKE '%is  a%')::int synonyms,
       COUNT(DISTINCT TRIM(genus)) FILTER (WHERE genus <> 'na' AND epithet <> '')::int genera,
       COUNT(DISTINCT registrant_name) FILTER (
         WHERE registrant_name NOT IN ('', 'O/U', 'This is a natural hybrid'))::int registrants,
       MIN(NULLIF(date_of_registration, '')) first_registration,
       MAX(NULLIF(date_of_registration, '')) latest_registration,
       COUNT(*) FILTER (WHERE date_of_registration LIKE $1)::int registered_this_year,
       COUNT(*) FILTER (WHERE date_of_registration LIKE $2)::int registered_last_year
     FROM rhs`,
    [`${year}-%`, `${year - 1}-%`],
  )) as unknown as RegistryOverview[];
  return row;
}

// Registrations on or after `since` (YYYY-MM-DD), newest first. Without
// `since`, the week ending on the registry's newest registration date.
export async function queryRecent({
  genus,
  since,
  limit,
}: {
  genus?: string;
  since?: string;
  limit: number;
}): Promise<{ latest: string | null; since: string | null; results: Grex[] }> {
  const [latestRow] = (await queryOrThrow(
    `SELECT MAX(date_of_registration) latest FROM rhs
     WHERE epithet <> '' AND date_of_registration <> ''
       AND ($1::text IS NULL OR genus = $1)`,
    [genus ?? null],
  )) as unknown as { latest: string | null }[];

  const latest = latestRow?.latest ?? null;
  if (!latest) return { latest, since: since ?? null, results: [] };

  let from = since;
  if (!from) {
    const d = new Date(`${latest}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 6);
    from = d.toISOString().slice(0, 10);
  }

  const results = await queryOrThrow(
    `SELECT ${FIELDS} FROM rhs
     WHERE epithet <> '' AND date_of_registration >= $1
       AND ($2::text IS NULL OR genus = $2)
     ORDER BY date_of_registration DESC, genus, epithet
     LIMIT $3`,
    [from, genus ?? null, limit],
  );

  return { latest, since: from, results };
}

export type TrendBucket = 'year' | 'decade';

// Registrations per year or decade, optionally for one genus or person.
export async function queryTrends({
  bucket,
  genus,
  person,
}: {
  bucket: TrendBucket;
  genus?: string;
  person?: string;
}): Promise<{ period: number; count: number }[]> {
  const period =
    bucket === 'decade'
      ? `(SUBSTRING(date_of_registration, 1, 3) || '0')::int`
      : `SUBSTRING(date_of_registration, 1, 4)::int`;

  return (await queryOrThrow(
    `SELECT ${period} period, COUNT(*)::int count
     FROM rhs
     WHERE genus <> 'na' AND epithet <> ''
       AND date_of_registration ~ '^[0-9]{4}'
       AND ($1::text IS NULL OR genus = $1)
       AND ($2::text IS NULL OR registrant_name = $2 OR originator_name = $2)
     GROUP BY period ORDER BY period`,
    [genus ?? null, person ?? null],
  )) as unknown as { period: number; count: number }[];
}
