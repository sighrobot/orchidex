import { query } from 'lib/datasette2';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const data = await query(
    "SELECT genus g FROM rhs WHERE genus != 'na' AND epithet != '' GROUP BY genus"
  );
  const json = await data?.json();

  return NextResponse.json(json, { status: 200 });
}
