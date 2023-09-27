import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/pg';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { genus, epithet: e } = Object.fromEntries(req.nextUrl.searchParams);
  const epithet = e.replace(/'/g, "''");
  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`
  );

  return NextResponse.json(json, { status: 200 });
}
