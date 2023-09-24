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
        id,
        genus,
        epithet,
        registrant_name,
        originator_name,
        date_of_registration,
        seed_parent_genus,
        seed_parent_epithet,
        pollen_parent_genus,
        pollen_parent_epithet,
        1 - (input.q <<-> (COALESCE(epithet, '') || ' ' || 
          COALESCE(registrant_name, '') || ' ' ||
          COALESCE(genus, ''))) AS score
    FROM rhs, input
    WHERE epithet != '' AND input.q <% (COALESCE(epithet, '') || ' ' ||
      COALESCE(registrant_name, '') || ' ' ||
      COALESCE(genus, ''))
    ORDER BY input.q <<-> (COALESCE(epithet, '') || ' ' ||
      COALESCE(registrant_name, '') || ' ' ||
      COALESCE(genus, '')),
epithet 
    LIMIT ${limit}
    ${offset ? `OFFSET ${offset}` : ''}`;

  const json = await query(sql);

  return NextResponse.json(json, { status: 200 });
}
