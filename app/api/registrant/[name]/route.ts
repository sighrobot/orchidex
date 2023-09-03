import { query } from 'lib/pg';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const raw = searchParams.get('name') ?? '';
  const r = raw.replace(/'/g, "''");

  if (!r) {
    return NextResponse.json([], { status: 200 });
  }

  const json = await query(
    `SELECT * FROM rhs WHERE epithet != '' AND (registrant_name = '${r}' OR originator_name = '${r}') ORDER BY date_of_registration DESC`
  );

  return NextResponse.json(json, { status: 200 });
}
