import { query } from 'lib/pg';
import { SEARCH_FIELDS, CROSS_FIELDS } from 'lib/constants';
import { formatClause, makeCrossQuery } from 'lib/utils';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async function Search(req: NextRequest) {
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

  const json = await query(
    `SELECT * FROM rhs WHERE epithet != '' AND ${condx} order by date_of_registration desc limit 1000`
  );

  return new Response(JSON.stringify(json));
}
