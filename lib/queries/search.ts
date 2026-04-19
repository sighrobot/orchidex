import { SEARCH_FIELDS, CROSS_FIELDS } from 'lib/constants';
import { formatClause, makeCrossQuery } from 'lib/utils';
import { query } from 'lib/storage/pg';
import { Grex } from 'lib/types';

export const querySearch = (params: Record<string, string | null>): Promise<Grex[]> => {
  const isCross = CROSS_FIELDS.some((f) => params[f]);

  const condx = isCross
    ? makeCrossQuery(params)
    : SEARCH_FIELDS.map((f) => {
        if (params[f]) {
          return formatClause(f, params[f]);
        }
      })
        .filter((c) => c)
        .join(' and ');

  return query(
    `SELECT * FROM rhs WHERE epithet != '' AND ${condx} ORDER BY date_of_registration DESC LIMIT 1000`
  );
};
