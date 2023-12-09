import { NextRequest, NextResponse } from 'next/server';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';
import { query } from 'lib/storage/pg';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const genus = searchParams.get('genus');
  const epithet = searchParams.get('epithet');

  if (!genus || !epithet) {
    return NextResponse.json([], { status: 200 });
  }

  const epithetClause = epithet.includes(UNKNOWN_CHAR)
    ? `like '${massageQueryTerm(
        epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_')
      )}'`
    : `= '${massageQueryTerm(epithet)}'`;

  const q = `WITH RECURSIVE ancestry AS (
    SELECT
      *
    FROM
      rhs
    WHERE
      lower(genus) = '${massageQueryTerm(genus)}'
      AND lower(epithet) ${epithetClause}
    UNION
    SELECT
      rhs.*
    FROM
      rhs
    JOIN ancestry ON (
      (
        rhs.genus = ancestry.seed_parent_genus
        AND rhs.epithet = ancestry.seed_parent_epithet
      )
      OR (
        rhs.genus = ancestry.pollen_parent_genus
        AND rhs.epithet = ancestry.pollen_parent_epithet
      )
    )
  )
  SELECT
    *
  FROM
    ancestry`;

  const json = await query(q);

  return NextResponse.json(json, { status: 200 });
}
