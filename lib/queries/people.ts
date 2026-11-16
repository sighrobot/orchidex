import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { queryOrThrow } from 'lib/storage/pg';
import { normalize } from 'lib/string';
import { Grex } from 'lib/types';

// Registrants (who registered a hybrid with the RHS) and originators (who
// made the cross). Names are free text in the registry, so the same person or
// nursery can appear under several spellings.

// Registry markers that aren't people.
const NOT_PEOPLE = ['', 'O/U', 'This is a natural hybrid'];

export type PersonMatch = {
  name: string;
  registered: number;
  originated: number;
};

// Names containing `q` (accent- and case-insensitive), busiest first.
export async function searchPeople(
  q: string,
  limit: number,
): Promise<PersonMatch[]> {
  const rows = await queryOrThrow(
    `WITH names AS (
       SELECT registrant_name name, 1 r, 0 o FROM rhs
       WHERE epithet <> '' AND registrant_name_normalized LIKE $1
       UNION ALL
       SELECT originator_name, 0, 1 FROM rhs
       WHERE epithet <> '' AND originator_name_normalized LIKE $1
     )
     SELECT name, SUM(r)::int registered, SUM(o)::int originated
     FROM names WHERE name <> ALL($2::text[])
     GROUP BY name
     ORDER BY SUM(r) + SUM(o) DESC, name
     LIMIT $3`,
    [`%${normalize(q)}%`, NOT_PEOPLE, limit],
  );
  return rows as unknown as PersonMatch[];
}

export type PersonProfile = {
  name: string;
  registered: number;
  originated: number;
  // Both registered and originated by this person: their own crosses.
  own_crosses: number;
  first_registration: string | null;
  latest_registration: string | null;
  genera: { genus: string; count: number }[];
  by_decade: { decade: number; count: number }[];
  // Orchids this person used most often as a parent.
  favorite_parents: {
    genus: string;
    epithet: string;
    id: string | null;
    count: number;
  }[];
  recent: Grex[];
};

// Everything registered or originated under exactly `name`.
export async function queryPerson(
  name: string,
  { recentLimit }: { recentLimit: number },
): Promise<PersonProfile | null> {
  const mine = `SELECT * FROM rhs
     WHERE epithet <> '' AND (registrant_name = $1 OR originator_name = $1)`;

  const [summary, genera, decades, parents, recent] = await Promise.all([
    queryOrThrow(
      `WITH mine AS (${mine})
       SELECT
         COUNT(*) FILTER (WHERE registrant_name = $1)::int registered,
         COUNT(*) FILTER (WHERE originator_name = $1)::int originated,
         COUNT(*) FILTER (WHERE registrant_name = $1 AND originator_name = $1)::int own_crosses,
         MIN(NULLIF(date_of_registration, '')) first_registration,
         MAX(NULLIF(date_of_registration, '')) latest_registration
       FROM mine`,
      [name],
    ),
    queryOrThrow(
      `WITH mine AS (${mine})
       SELECT genus, COUNT(*)::int count FROM mine
       GROUP BY genus ORDER BY count DESC, genus LIMIT 15`,
      [name],
    ),
    queryOrThrow(
      `WITH mine AS (${mine})
       SELECT (SUBSTRING(date_of_registration, 1, 3) || '0')::int decade, COUNT(*)::int count
       FROM mine WHERE date_of_registration ~ '^[0-9]{4}'
       GROUP BY decade ORDER BY decade`,
      [name],
    ),
    queryOrThrow(
      `WITH mine AS (${mine}), used AS (
         SELECT seed_parent_genus genus, seed_parent_epithet epithet, seed_parent_id id FROM mine
         UNION ALL
         SELECT pollen_parent_genus, pollen_parent_epithet, pollen_parent_id FROM mine
       )
       SELECT genus, epithet, MAX(id) id, COUNT(*)::int count FROM used
       WHERE coalesce(epithet, '') <> '' AND lower(genus) <> 'na'
       GROUP BY genus, epithet ORDER BY count DESC, genus, epithet LIMIT 10`,
      [name],
    ),
    queryOrThrow(
      `WITH mine AS (${mine})
       SELECT ${[...ID_FIELDS, ...SEARCH_FIELDS].join(', ')} FROM mine
       ORDER BY NULLIF(date_of_registration, '') DESC NULLS LAST, genus, epithet
       LIMIT $2`,
      [name, recentLimit],
    ),
  ]);

  const s = summary[0] as unknown as Omit<
    PersonProfile,
    'name' | 'genera' | 'by_decade' | 'favorite_parents' | 'recent'
  >;
  if (!s || s.registered + s.originated === 0) return null;

  return {
    name,
    ...s,
    genera: genera as unknown as PersonProfile['genera'],
    by_decade: decades as unknown as PersonProfile['by_decade'],
    favorite_parents: parents as unknown as PersonProfile['favorite_parents'],
    recent,
  };
}
