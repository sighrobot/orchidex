import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/pg';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
  const { s, p } = Object.fromEntries(req.nextUrl.searchParams);
  const idArrayItems = [s, p].join(',');

  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE seed_parent_id = ANY('{${idArrayItems}}'::text[]) AND pollen_parent_id = ANY('{${idArrayItems}}'::text[])`
  );

  return NextResponse.json(json, { status: 200 });
}
