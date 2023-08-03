import { query } from 'lib/datasette2';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
  const { id } = Object.fromEntries(req.nextUrl.searchParams);
  const fetched = await query(`SELECT * FROM rhs WHERE id = '${id}' limit 1`);
  const json = await fetched?.json();

  return NextResponse.json(json, { status: 200 });
}
