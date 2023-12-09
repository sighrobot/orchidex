import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const json = await query(
    "SELECT genus g FROM rhs WHERE genus != 'na' AND epithet != '' GROUP BY genus"
  );

  return NextResponse.json(json, { status: 200 });
}
