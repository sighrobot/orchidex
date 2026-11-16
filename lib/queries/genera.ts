import { ABBR_TO_GENUS, GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { queryOrThrow } from 'lib/storage/pg';
import { Grex } from 'lib/types';
import { capitalize } from 'lib/utils';

// Turns "paph", "Paph." or "PAPHIOPEDILUM" into "Paphiopedilum". Unknown
// names come back capitalized, unchanged otherwise.
export function resolveGenusName(raw: string): string {
  const trimmed = raw.trim();
  const base = capitalize(trimmed.replace(/\.$/, '').toLowerCase());
  return ABBR_TO_GENUS[`${base}.`] ?? ABBR_TO_GENUS[trimmed] ?? base;
}

export const abbreviationFor = (genus: string): string | null =>
  GENUS_TO_ABBREVIATION[genus] ?? null;

export type GenusCount = { genus: string; count: number };

// Genera with registrations, most first. `q` filters by name (contains).
export async function queryGenera(
  q: string | undefined,
  limit: number,
): Promise<{ total: number; genera: GenusCount[] }> {
  const rows = (await queryOrThrow(
    `SELECT TRIM(genus) genus, COUNT(*)::int count, COUNT(*) OVER()::int total
     FROM rhs
     WHERE genus <> 'na' AND epithet <> ''
       AND ($1::text IS NULL OR lower(genus) LIKE $1)
     GROUP BY TRIM(genus)
     ORDER BY count DESC, genus
     LIMIT $2`,
    [q ? `%${q.toLowerCase()}%` : null, limit],
  )) as unknown as (GenusCount & { total: number })[];

  return {
    total: rows[0]?.total ?? 0,
    genera: rows.map(({ genus, count }) => ({ genus, count })),
  };
}

export type GenusProfile = {
  genus: string;
  records: number;
  species: number;
  hybrids: number;
  // Hybrids whose parents come from different genera.
  intergeneric_hybrids: number;
  first_registration: string | null;
  latest_registration: string | null;
  accepted_species_wcvp: number;
  top_registrants: { name: string; count: number }[];
  // Orchids in this genus used most often as a parent of any hybrid.
  top_parents: {
    epithet: string;
    id: string | null;
    as_seed: number;
    as_pollen: number;
  }[];
  by_decade: { decade: number; count: number }[];
  recent: Grex[];
};

export async function queryGenus(genus: string): Promise<GenusProfile | null> {
  const lowerFirst = `left(epithet, 1) = lower(left(epithet, 1)) AND left(epithet, 1) !~ '[0-9×]'`;

  const [summary, wcvp, registrants, parents, decades, recent] =
    await Promise.all([
      queryOrThrow(
        `SELECT
           COUNT(*)::int records,
           COUNT(*) FILTER (WHERE ${lowerFirst}
             AND coalesce(seed_parent_epithet, '') = '')::int species,
           COUNT(*) FILTER (WHERE NOT (${lowerFirst}
             AND coalesce(seed_parent_epithet, '') = ''))::int hybrids,
           COUNT(*) FILTER (WHERE coalesce(seed_parent_genus, '') <> ''
             AND seed_parent_genus <> pollen_parent_genus)::int intergeneric_hybrids,
           MIN(NULLIF(date_of_registration, '')) first_registration,
           MAX(NULLIF(date_of_registration, '')) latest_registration
         FROM rhs WHERE genus = $1 AND epithet <> ''`,
        [genus],
      ),
      queryOrThrow(
        `SELECT COUNT(*)::int c FROM wcvp
         WHERE genus = $1 AND taxon_rank = 'Species' AND taxon_status = 'Accepted'`,
        [genus],
      ),
      queryOrThrow(
        `SELECT registrant_name name, COUNT(*)::int count FROM rhs
         WHERE genus = $1 AND epithet <> ''
           AND registrant_name NOT IN ('', 'O/U', 'This is a natural hybrid')
         GROUP BY registrant_name ORDER BY count DESC, name LIMIT 10`,
        [genus],
      ),
      queryOrThrow(
        `WITH uses AS (
           SELECT seed_parent_epithet e, seed_parent_id id, 1 s, 0 p FROM rhs
           WHERE seed_parent_genus = $1
           UNION ALL
           SELECT pollen_parent_epithet, pollen_parent_id, 0, 1 FROM rhs
           WHERE pollen_parent_genus = $1
         )
         SELECT e epithet, MAX(id) id, SUM(s)::int as_seed, SUM(p)::int as_pollen
         FROM uses WHERE coalesce(e, '') <> ''
         GROUP BY e ORDER BY SUM(s) + SUM(p) DESC, e LIMIT 15`,
        [genus],
      ),
      queryOrThrow(
        `SELECT (SUBSTRING(date_of_registration, 1, 3) || '0')::int decade, COUNT(*)::int count
         FROM rhs
         WHERE genus = $1 AND epithet <> '' AND date_of_registration ~ '^[0-9]{4}'
         GROUP BY decade ORDER BY decade`,
        [genus],
      ),
      queryOrThrow(
        `SELECT ${[...ID_FIELDS, ...SEARCH_FIELDS].join(', ')} FROM rhs
         WHERE genus = $1 AND epithet <> '' AND date_of_registration <> ''
         ORDER BY date_of_registration DESC, genus, epithet LIMIT 5`,
        [genus],
      ),
    ]);

  const s = summary[0] as unknown as GenusProfile;
  const accepted = (wcvp[0] as unknown as { c: number })?.c ?? 0;
  if (!s?.records && !accepted) return null;

  return {
    ...s,
    genus,
    accepted_species_wcvp: accepted,
    top_registrants: registrants as unknown as GenusProfile['top_registrants'],
    top_parents: parents as unknown as GenusProfile['top_parents'],
    by_decade: decades as unknown as GenusProfile['by_decade'],
    recent,
  };
}

export type WcvpTaxon = {
  plant_name_id?: string;
  taxon_name?: string;
  taxon_rank?: string;
  taxon_status?: string;
  primary_author?: string;
  first_published?: string;
  lifeform_description?: string;
  climate_description?: string;
  geographic_area?: string;
};

// World Checklist of Vascular Plants entry for a species name, as the grex
// page looks it up. Prefers the accepted species row.
export async function queryWcvpTaxon(
  genus: string,
  epithet: string,
): Promise<WcvpTaxon | null> {
  const name = `${genus} ${epithet
    .replace(/ var /g, ' var. ')
    .replace(/{var}/g, 'var.')
    .replace(/ subsp. /g, ' var. ')
    .replace(/{subsp.}/g, 'subsp.')
    .trim()}`;
  const rows = (await queryOrThrow(
    `SELECT plant_name_id, taxon_name, taxon_rank, taxon_status, primary_author,
            first_published, lifeform_description, climate_description, geographic_area
     FROM wcvp WHERE taxon_name = $1
     ORDER BY (taxon_status = 'Accepted') DESC, (taxon_rank = 'Species') DESC
     LIMIT 1`,
    [name],
  )) as unknown as WcvpTaxon[];
  return rows[0] ?? null;
}
