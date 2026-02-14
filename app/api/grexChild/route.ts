import { NextRequest } from 'next/server';
import { cachedJson } from 'lib/cache';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { s, p } = Object.fromEntries(req.nextUrl.searchParams);
  const idArrayItems = [s, p].join(',');

  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE seed_parent_id = ANY('{${idArrayItems}}'::text[]) AND pollen_parent_id = ANY('{${idArrayItems}}'::text[])`
  );

  return cachedJson(json);
}
