import { NextRequest, NextResponse } from 'next/server';
import { ID_FIELDS, SEARCH_FIELDS } from 'lib/constants';
import { query } from 'lib/storage/pg';

type Params = Promise<{ name: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { name: raw } = await params;
  const r = raw.replace(/'/g, "''");

  if (!r) {
    return NextResponse.json([], { status: 200 });
  }

  const json = await query(
    `SELECT ${ID_FIELDS.join(', ')}, ${SEARCH_FIELDS.join(
      ', '
    )} FROM rhs WHERE epithet != '' AND (registrant_name = '${r}' OR originator_name = '${r}') ORDER BY date_of_registration DESC`
  );

  return NextResponse.json(json, { status: 200 });
}
