import { NextRequest, NextResponse } from 'next/server';
import { SEARCH_FIELDS, CROSS_FIELDS } from 'lib/constants';
import { formatClause, makeCrossQuery } from 'lib/utils';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
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

  return NextResponse.json(json, { status: 200 });
}
