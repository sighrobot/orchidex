import { NextRequest } from 'next/server';
import { cachedJson } from 'lib/cache';
import { query } from 'lib/storage/pg';

const select = 'SELECT registrant_name r, COUNT(*)::int c FROM rhs WHERE';
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

  const sql = `${select} ${where.join(' AND ')} ${aggr.join(' ')} LIMIT 25`;

  const json = await query(sql);

  return cachedJson(json);
}
