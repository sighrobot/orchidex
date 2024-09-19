import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json([], { status: 200 });
  }

  const q = `WITH RECURSIVE ancestry AS (
    SELECT
      *,
      0 AS depth,
      1::decimal AS s
    FROM
      rhs
    WHERE
      id = '${id}'
    UNION ALL
    SELECT
      rhs.*,
      ancestry.depth + 1 AS depth,
      (ancestry.s - (1 / POW(2, ancestry.depth + 1)))::decimal AS s
    FROM
      rhs
    JOIN ancestry ON (
      (
        rhs.id = ancestry.seed_parent_id
      )
      OR (
        rhs.id = ancestry.pollen_parent_id
      )
    )
  )
  SELECT DISTINCT ON (id)
    *,
    SUM(s) OVER (PARTITION BY id) AS score
  FROM
    ancestry WHERE genus != lower(genus)`;

  const json = await query(q);

  return NextResponse.json(json, { status: 200 });
}
