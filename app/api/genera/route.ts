import { NextResponse } from 'next/server';

import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { query } from 'lib/storage/pg';

// The list changes only as new genera are registered; rebuild it daily.
export const dynamic = 'force-static';
export const revalidate = 86400;

// Every genus with registrations: its name, RHS abbreviation and how many
// orchids are registered in it, most first.
export async function GET() {
  const rows = (await query(
    `SELECT TRIM(genus) g, COUNT(*)::int c
     FROM rhs
     WHERE genus != 'na' AND epithet != ''
     GROUP BY TRIM(genus)
     ORDER BY c DESC, g`,
  )) as unknown as { g: string; c: number }[];

  return NextResponse.json(
    rows.map(({ g, c }) => ({ g, c, a: GENUS_TO_ABBREVIATION[g] ?? null })),
    { status: 200 },
  );
}
