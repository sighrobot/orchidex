import { NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

export async function GET() {
  const records = await query(`SELECT count(*)::int as records FROM rhs`);
  const synonyms = await query(
    "SELECT count(*)::int as synonyms FROM rhs where synonym_flag like '%is  a%'"
  );
  const species = await query(
    "SELECT count(*)::int as species FROM rhs where epithet != '' and substring(epithet, 1, 1) = lower(substring(epithet, 1, 1))"
  );
  const naturalHybrids = await query(
    "SELECT count(*)::int as naturalHybrids FROM rhs where registrant_name like '%a natural hybrid%'"
  );

  return NextResponse.json(
    {
      ...records[0],
      ...synonyms[0],
      ...species[0],
      ...naturalHybrids[0],
    },
    { status: 200 }
  );
}
