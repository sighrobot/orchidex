import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; level: string } }
) {
  const { searchParams } = req.nextUrl;
  const sortBy = searchParams.get('sortBy');
  const direction = searchParams.get('direction');

  const { id } = params;
  const rawLevel = parseInt(params.level, 10);

  if (Number.isNaN(rawLevel) || rawLevel < 0) {
    return NextResponse.json([], { status: 200 });
  }

  const level = rawLevel + 1;

  const json = await query(`
    WITH RECURSIVE progeny_tree AS (
        SELECT 
            ${ID_FIELDS.join(', ')},
            1 AS generation -- Start with the first generation
        FROM 
            rhs
        WHERE 
            id = '${id}' -- Replace with the actual id of the given orchid

        UNION ALL

        SELECT 
            ${ID_FIELDS.map((f) => `o.${f}`).join(', ')},
            pt.generation + 1 -- Increment the generation value
        FROM 
            rhs o
        INNER JOIN 
            progeny_tree pt ON (o.seed_parent_id = pt.id OR o.pollen_parent_id = pt.id)
        WHERE
            pt.generation < ${level} -- Replace N with the desired depth
    )
            
    , progeny_with_count AS (
        SELECT 
            ${ID_FIELDS.map((f) => `pt.${f}`).join(', ')},
            pt.generation,
            COUNT(DISTINCT(child.id))::int AS first_order_progeny_count
        FROM 
            progeny_tree pt
        LEFT JOIN (
            SELECT id, seed_parent_id AS parent_id FROM rhs
            UNION ALL
            SELECT id, pollen_parent_id AS parent_id FROM rhs
        ) child ON child.parent_id = pt.id
        GROUP BY 
            ${ID_FIELDS.map((f) => `pt.${f}`).join(', ')},
            pt.generation
    )

    -- Combine generations and remove duplicates
    , combined_generations AS (
        SELECT
            ${ID_FIELDS.join(', ')},
            array_agg(DISTINCT generation) AS combined_generations,
            MAX(first_order_progeny_count) AS first_order_progeny_count
        FROM progeny_with_count
        GROUP BY 
            ${ID_FIELDS.join(', ')}
            
    )

    SELECT 
        ${ID_FIELDS.map((f) => `combined_generations.${f}`).join(', ')},
        combined_generations.combined_generations AS generations,
        combined_generations.first_order_progeny_count,
        ${SEARCH_FIELDS.map((f) => `rhs.${f}`).join(', ')}
    FROM 
        rhs, combined_generations
    WHERE
        rhs.id = combined_generations.id AND rhs.id != '${id}'
    ORDER BY
        ${
          sortBy === 'parent_name' ? 'seed_parent_epithet' : sortBy
        } ${direction}
    LIMIT
        10000
  `);

  return NextResponse.json(json, { status: 200 });
}
