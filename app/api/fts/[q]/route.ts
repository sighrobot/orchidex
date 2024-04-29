import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(
  req: NextRequest,
  { params }: { params: { q: string } }
) {
  const { q: rawQ } = params;
  const q = rawQ.replace(/'/g, "''");

  const { limit = 100, offset } = Object.fromEntries(req.nextUrl.searchParams);

  // https://alexklibisz.com/2022/02/18/optimizing-postgres-trigram-search#a-blazing-fast-search-query
  const sql = `
    WITH input AS (SELECT '${q}' AS q)
      SELECT
        ${ID_FIELDS.join(', ')},
        ${SEARCH_FIELDS.join(', ')},
        1 - (input.q <<-> (COALESCE(genus, '') || ' ' || 
          COALESCE(epithet, '') || ' ' ||
          COALESCE(registrant_name, ''))) AS score
    FROM rhs, input
    WHERE epithet != '' AND input.q <% (COALESCE(genus, '') || ' ' ||
      COALESCE(epithet, '') || ' ' ||
      COALESCE(registrant_name, ''))
    ORDER BY score DESC, genus ASC, lower(epithet) ASC
    LIMIT ${limit}
    ${offset ? `OFFSET ${offset}` : ''}`;

  const json = await query(sql);

  return NextResponse.json(json, { status: 200 });
}
