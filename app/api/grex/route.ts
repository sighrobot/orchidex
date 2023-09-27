import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/pg';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
  const { id } = Object.fromEntries(req.nextUrl.searchParams);
  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE id = '${id}'`
  );

  return NextResponse.json(json, { status: 200 });
}
