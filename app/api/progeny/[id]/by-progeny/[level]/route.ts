import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; level: string } }
) {
  const { id } = params;
  const rawLevel = parseInt(params.level, 10);

  if (Number.isNaN(rawLevel) || rawLevel < 0) {
    return NextResponse.json([], { status: 200 });
  }

  const level = rawLevel + 1;

  const json = await query(`
    WITH RECURSIVE progeny_tree AS (
    SELECT
        ${ID_FIELDS.concat(SEARCH_FIELDS).join(', ')},
        1 AS generation
    FROM
        rhs
    WHERE
        id = '${id}' -- Replace with the actual id of the given orchid

    UNION ALL

    SELECT
        ${ID_FIELDS.concat(SEARCH_FIELDS)
          .map((f) => `o.${f}`)
          .join(', ')},
        pt.generation + 1 AS generation
    FROM
        rhs o
    INNER JOIN
        progeny_tree pt ON (o.seed_parent_id = pt.id OR o.pollen_parent_id = pt.id)
    -- WHERE
        -- pt.generation < ${level} -- Replace N with the desired depth
)

-- Final SELECT to get all progeny up to Nth order
, progeny_with_count AS (
    SELECT
        ${ID_FIELDS.concat(SEARCH_FIELDS)
          .map((f) => `pt.${f}`)
          .join(', ')},
        pt.generation,
        COUNT(child.id)::int AS first_order_progeny_count
    FROM
        progeny_tree pt
    LEFT JOIN
        rhs child ON child.seed_parent_id = pt.id OR child.pollen_parent_id = pt.id
    GROUP BY
    ${ID_FIELDS.concat(SEARCH_FIELDS)
      .map((f) => `pt.${f}`)
      .join(', ')}, pt.generation
)

SELECT
    ${ID_FIELDS.concat(SEARCH_FIELDS).join(', ')},
    generation,
    first_order_progeny_count
FROM
    progeny_with_count
-- WHERE
    -- generation = ${level}
WHERE
    id != '${id}'
ORDER BY
    first_order_progeny_count DESC;
  `);

  return NextResponse.json(json, { status: 200 });
}
