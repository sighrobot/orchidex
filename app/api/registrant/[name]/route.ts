import { query } from 'lib/datasette2';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const raw = searchParams.get('name') ?? '';
  const r = raw.replace(/'/g, "''");

  if (!r) {
    return NextResponse.json([], { status: 200 });
  }

  const fetched = await query(
    `SELECT * FROM rhs WHERE epithet != '' AND (registrant_name = '${r}' OR originator_name = '${r}') ORDER BY date_of_registration DESC`
  );
  const json = await fetched?.json();

  return NextResponse.json(json, { status: 200 });
}
