import { query } from 'lib/datasette2';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const names = await req.json();

  const q = names
    .map((n) => {
      const epithetClause = n.epithet.includes(UNKNOWN_CHAR)
        ? `like '${massageQueryTerm(
            n.epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_'),
          )}'`
        : `= '${massageQueryTerm(n.epithet)}'`;

      return `(lower(genus) = '${massageQueryTerm(
        n.genus,
      )}' AND lower(epithet) ${epithetClause})`;
    })
    .join(' OR ');

  return query(`SELECT * FROM rhs WHERE ${q}`);
};
