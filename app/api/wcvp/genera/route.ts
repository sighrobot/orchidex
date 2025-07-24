import { NextResponse } from 'next/server';
import { query } from 'lib/storage/pg';

export async function GET() {
  let q = `
  select distinct(genus) from wcvp where taxon_status = 'Accepted' order by genus
  `;

  const json = await query(q);

  return NextResponse.json(json, { status: 200 });
}
