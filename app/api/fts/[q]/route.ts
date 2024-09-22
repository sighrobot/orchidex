import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(
  req: NextRequest,
  { params }: { params: { q: string } }
) {
  const { q: rawQ } = params;
  const q = rawQ.replace(/'/g, "''");

  const { limit = 100, offset } = Object.fromEntries(req.nextUrl.searchParams);

  const vectorizedWild = q
    .split(' ')
    .map((t) => `${t}:*`)
    .join(' & ');
  const vectorized = q.split(' ').join(' & ');

  // https://rachbelaid.com/postgres-full-text-search-is-good-enough/ <-- https://stackoverflow.com/a/57379943
  // p.s. https://dba.stackexchange.com/a/177044
  // p.p.s. https://www.www-old.bartlettpublishing.com/site/bartpub/blog/3/entry/350
  const sql = `
    SELECT ${ID_FIELDS.concat(SEARCH_FIELDS)
      .map((f) => `rhs.${f}`)
      .join(', ')}
    FROM materialized_fts
    LEFT JOIN rhs ON rhs.id = materialized_fts.id
    WHERE document @@ to_tsquery('${vectorizedWild}')
    ORDER BY (lower(rhs.epithet) = rhs.epithet) DESC, ts_rank(document, to_tsquery('${vectorized}')) DESC
    LIMIT ${limit}
    ${offset ? `OFFSET ${offset}` : ''}`.trim();

  const json = await query(sql);

  return NextResponse.json(json, { status: 200 });
}
