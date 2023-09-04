import { query } from 'lib/pg';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async function GetAncestry2(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genus = searchParams.get('genus');
  const epithet = searchParams.get('epithet');

  if (!genus || !epithet) {
    return new Response(JSON.stringify([]));
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

  return new Response(JSON.stringify(json));
}
