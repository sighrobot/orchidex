import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { id: idParam } = Object.fromEntries(req.nextUrl.searchParams);

  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE id = ANY('{${idParam}}'::text[])`
  );

  return NextResponse.json(json, { status: 200 });
}
