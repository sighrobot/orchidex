import { query } from 'lib/datasette2';
import { capitalize } from 'lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const g = searchParams.get('genus');
  const parentType = searchParams.get('parentType');
  const genus = capitalize(g);

  let q = '';

  if (!parentType) {
    q = `SELECT parent, SUM(c) as c
    FROM (
      SELECT 
        seed_parent_epithet as parent,
        COUNT(*) as c
      FROM rhs
      WHERE seed_parent_genus = '${genus}'
      GROUP BY seed_parent_genus, seed_parent_epithet
      UNION ALL
      SELECT 
        pollen_parent_epithet as parent,
        COUNT(*) as c
      FROM rhs
      WHERE pollen_parent_genus = '${genus}'
      GROUP BY pollen_parent_genus, pollen_parent_epithet
    ) subquery
    GROUP BY parent
    UNION ALL
    SELECT
      epithet,
      0
    FROM
      rhs
    WHERE
      genus = '${genus}'
      AND epithet != ''
      AND epithet NOT IN (
        SELECT
          DISTINCT seed_parent_epithet
        FROM
          rhs
        WHERE
          seed_parent_genus = '${genus}'
      )
      AND epithet NOT IN (
        SELECT
          DISTINCT pollen_parent_epithet
        FROM
          rhs
        WHERE
          pollen_parent_genus = '${genus}'
      )
    ORDER BY
      c DESC;`;
  } else {
    const parentGenusType = `${parentType}_parent_genus`;
    const parentEpithetType = `${parentType}_parent_epithet`;

    q = `SELECT
  rhs.${parentEpithetType},
  COUNT(*) c
FROM
  rhs
WHERE
  rhs.${parentGenusType} = '${genus}'
GROUP BY
  rhs.${parentEpithetType}
UNION ALL
SELECT
  epithet,
  0
FROM
  rhs
WHERE
  genus = '${genus}'
  AND epithet != ''
  AND epithet NOT IN (
    SELECT
      DISTINCT ${parentEpithetType}
    FROM
      rhs
    WHERE
    ${parentGenusType} = '${genus}'
  )
ORDER BY
  c DESC`;
  }

  const fetched = await query(q);
  const json = await fetched?.json();

  return NextResponse.json(json, { status: 200 });
}