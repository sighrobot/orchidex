import { NextRequest, NextResponse } from 'next/server';
import { capitalize } from 'lib/utils';
import { query } from 'lib/storage/pg';

type Params = Promise<{ genus: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { searchParams } = new URL(req.nextUrl);
  const parentType = searchParams.get('parentType');
  const { genus: rawGenus } = await params;
  const genus = capitalize(rawGenus);

  let q = '';

  if (!parentType) {
    q = `SELECT parent, SUM(c)::INT as c
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
      c DESC`;
  } else {
    const parentGenusType = `${parentType}_parent_genus`;
    const parentEpithetType = `${parentType}_parent_epithet`;

    q = `SELECT
  rhs.${parentEpithetType},
  COUNT(*)::INT c
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

  const json = await query(q);

  return NextResponse.json(json, { status: 200 });
}
