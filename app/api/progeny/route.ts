import { NextRequest } from 'next/server';
import { cachedJson } from 'lib/cache';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { genus, epithet: e } = Object.fromEntries(req.nextUrl.searchParams);
  const epithet = e.replace(/'/g, "''");
  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`
  );

  return cachedJson(json);
}
