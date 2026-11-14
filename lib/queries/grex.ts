import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';
import { Grex } from 'lib/types';

const FIELDS = [...ID_FIELDS, ...SEARCH_FIELDS].join(', ');

// Ids arrive straight from URLs, so they're passed as a query parameter,
// never pasted into the SQL.
const toIds = (ids: string) =>
  ids
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

// One or more orchids by id; `id` may be a comma-separated list.
export const queryGrexById = (id: string): Promise<Grex[]> =>
  query(`SELECT ${FIELDS} FROM rhs WHERE id = ANY($1::text[])`, [toIds(id)]);

// The registered cross of `s` and `p`, in either direction.
export const queryGrexChild = (s: string, p: string): Promise<Grex[]> => {
  const ids = toIds(`${s},${p}`);
  return query(
    `SELECT ${FIELDS} FROM rhs WHERE seed_parent_id = ANY($1::text[]) AND pollen_parent_id = ANY($1::text[])`,
    [ids],
  );
};
