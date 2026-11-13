import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';
import { Grex, PersonCount } from 'lib/types';

// Everything a person registered or originated, newest first.
export const queryPerson = (name: string): Promise<Grex[]> => {
  if (!name) return Promise.resolve([]);

  return query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(', ')}
    FROM rhs
    WHERE epithet != '' AND (registrant_name = $1 OR originator_name = $1)
    ORDER BY date_of_registration DESC`,
    [name]
  );
};

// Whose hybrids this person crosses with: for each parent hybrid used by one
// of their records, its originator (or registrant, when there's no
// originator), counted once per record.
export const queryPersonParentBreeders = (
  name: string,
  limit = 5
): Promise<PersonCount[]> => {
  if (!name) return Promise.resolve([]);

  const parentJoin = (side: 'seed' | 'pollen') => `
    SELECT h.id, coalesce(nullif(p.originator_name, ''), p.registrant_name) AS name
    FROM rhs h
    JOIN rhs p
      ON p.genus = h.${side}_parent_genus
      AND p.epithet = h.${side}_parent_epithet
    WHERE (h.registrant_name = $1 OR h.originator_name = $1)
      AND h.epithet != ''
      AND p.registrant_name != ''
      AND p.registrant_name NOT LIKE '%natural hybrid%'`;

  return query(
    `SELECT name, count(DISTINCT id)::int AS count
    FROM (${parentJoin('seed')} UNION ALL ${parentJoin('pollen')}) parents
    WHERE name IS NOT NULL AND name NOT IN ('', 'O/U', $1)
    GROUP BY name
    ORDER BY count DESC, name
    LIMIT ${Math.floor(limit)}`,
    [name]
  ) as unknown as Promise<PersonCount[]>;
};
