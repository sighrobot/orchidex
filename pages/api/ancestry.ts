import { SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/pg';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async function getAncestry(req: NextRequest) {
  const names = await req.json();

  const q = names
    .map((n) => {
      const epithetClause = n.epithet.includes(UNKNOWN_CHAR)
        ? `like '${massageQueryTerm(
            n.epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_')
          )}'`
        : `= '${massageQueryTerm(n.epithet)}'`;

      return `(lower(genus) = '${massageQueryTerm(
        n.genus
      )}' AND lower(epithet) ${epithetClause})`;
    })
    .join(' OR ');

  const json = await query(
    `SELECT id, ${SEARCH_FIELDS.join(', ')} FROM rhs WHERE ${q}`
  );

  return new Response(JSON.stringify(json));
}
