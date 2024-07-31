import { NextRequest, NextResponse } from 'next/server';

import { query } from 'lib/storage/pg';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const json = await query(`
        WITH RECURSIVE progeny_depth AS (
    SELECT 
        id,
        1 AS generation -- Start with the first generation
    FROM 
        rhs
    WHERE 
        id = '${id}' -- Replace with the actual id of the given orchid

    UNION ALL

    SELECT 
        o.id,
        pt.generation + 1 -- Increment the generation value
    FROM 
        rhs o
    INNER JOIN 
        progeny_depth pt ON (o.seed_parent_id = pt.id OR o.pollen_parent_id = pt.id)
)

SELECT 
    MAX(generation) AS deepest_generation
FROM 
    progeny_depth;
      `);

  return NextResponse.json(json, { status: 200 });
}
