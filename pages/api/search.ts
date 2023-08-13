import { query } from 'lib/datasette2';
import { SEARCH_FIELDS, CROSS_FIELDS } from 'lib/constants';
import { formatClause, makeCrossQuery } from 'lib/utils';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params: any = {};
  SEARCH_FIELDS.forEach((f) => {
    params[f] = searchParams.get(f);
  });
  CROSS_FIELDS.forEach((f) => {
    params[f] = searchParams.get(f);
  });

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
    `SELECT * FROM rhs WHERE epithet != '' AND ${condx} order by date_of_registration desc limit 1000`
  );
};
