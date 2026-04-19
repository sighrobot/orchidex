import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';
import { Grex } from 'lib/types';

export const queryRegistrant = (name: string): Promise<Grex[]> => {
  const r = name.replace(/'/g, "''");

  if (!r) return Promise.resolve([]);

  return query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(', ')} FROM rhs WHERE epithet != '' AND (registrant_name = '${r}' OR originator_name = '${r}') ORDER BY date_of_registration DESC`
  );
};
