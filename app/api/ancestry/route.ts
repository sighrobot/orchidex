import { NextRequest, NextResponse } from 'next/server';
import { SEARCH_FIELDS } from 'lib/constants';
import { UNKNOWN_CHAR } from 'lib/string';
import { massageQueryTerm } from 'lib/utils';
import { query } from 'lib/storage/pg';

export async function POST(req: NextRequest) {
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

  return NextResponse.json(json, { status: 200 });
}
