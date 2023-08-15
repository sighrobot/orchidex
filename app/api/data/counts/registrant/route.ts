import { query } from 'lib/datasette2';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const select = 'SELECT registrant_name r, COUNT(*) c FROM rhs WHERE';
const aggr = ['GROUP BY r', 'ORDER BY c DESC'];

export async function GET(req: NextRequest) {
  const { genus } = Object.fromEntries(req.nextUrl.searchParams);

  const where = [
    "genus != 'na'",
    "epithet != ''",
    "date_of_registration != ''",
  ];

  if (genus) {
    where.push(`lower(genus) = '${genus}'`);
  }

  const sql = `${select} ${where.join(' AND ')} ${aggr.join(' ')}`;

  const fetched = await query(sql);
  const json = await fetched?.json();

  return NextResponse.json(json, { status: 200 });
}