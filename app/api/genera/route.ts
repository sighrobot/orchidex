import { query } from 'lib/pg';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
  const json = await query(
    "SELECT genus g FROM rhs WHERE genus != 'na' AND epithet != '' GROUP BY genus"
  );

  return NextResponse.json(json, { status: 200 });
}
