import { query } from 'lib/pg';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const select =
  'SELECT SUBSTR(date_of_registration, 0, 5) d, COUNT(*) c FROM rhs WHERE';
const aggr = ['GROUP BY d', 'ORDER BY d'];

export async function GET(req) {
  const { genus } = Object.fromEntries(req.nextUrl.searchParams);

  const where = [
    "genus != 'na'",
    "epithet != ''",
    "date_of_registration != ''",
    "registrant_name != ''",
  ];

  if (genus) {
    where.push(`lower(genus) = '${genus}'`);
  }

  const sql = `${select} ${where.join(' AND ')} ${aggr.join(' ')}`;

  const json = await query(sql);

  return NextResponse.json(json, { status: 200 });
}
