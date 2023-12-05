import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/pg';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const {
    q: rawQ,
    limit = 100,
    offset,
  } = Object.fromEntries(req.nextUrl.searchParams);
  const q = rawQ.replace(/'/g, "''");

  // https://alexklibisz.com/2022/02/18/optimizing-postgres-trigram-search#a-blazing-fast-search-query
  const sql = `
    WITH input AS (SELECT '${q}' AS q)
      SELECT
        ${ID_FIELDS.join(', ')},
        ${SEARCH_FIELDS.join(', ')},
        1 - (input.q <<-> (COALESCE(epithet, '') || ' ' || 
          COALESCE(genus, '') || ' ' ||
          COALESCE(registrant_name, ''))) AS score
    FROM rhs, input
    WHERE epithet != '' AND input.q <% (COALESCE(epithet, '') || ' ' ||
      COALESCE(genus, '') || ' ' ||
      COALESCE(registrant_name, ''))
    ORDER BY input.q <<-> (COALESCE(epithet, '') || ' ' ||
      COALESCE(genus, '') || ' ' ||
      COALESCE(registrant_name, '')),
epithet 
    LIMIT ${limit}
    ${offset ? `OFFSET ${offset}` : ''}`;

  const json = await query(sql);

  return NextResponse.json(json, { status: 200 });
}
