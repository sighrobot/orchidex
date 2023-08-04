import { query } from 'lib/datasette2';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { genus, epithet: e } = Object.fromEntries(req.nextUrl.searchParams);
  const epithet = e.replace(/'/g, "''");
  const fetched = await query(
    `SELECT * FROM rhs WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`
  );
  const json = await fetched?.json();

  return NextResponse.json(json, { status: 200 });
}
