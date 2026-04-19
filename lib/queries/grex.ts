import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';
import { Grex } from 'lib/types';

export const queryGrexById = (id: string): Promise<Grex[]> => {
  return query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(', ')} FROM rhs WHERE id = ANY('{${id}}'::text[])`
  );
};

export const queryGrexChild = (s: string, p: string): Promise<Grex[]> => {
  const idArrayItems = [s, p].join(',');
  return query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(', ')} FROM rhs WHERE seed_parent_id = ANY('{${idArrayItems}}'::text[]) AND pollen_parent_id = ANY('{${idArrayItems}}'::text[])`
  );
};
