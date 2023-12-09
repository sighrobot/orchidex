import { NextRequest, NextResponse } from 'next/server';
import { getStatSql } from 'lib/stats';
import { Grex, Stat } from 'lib/types';
import { query } from 'lib/storage/pg';

export async function POST(req: NextRequest) {
  const data = (await req.json()) as {
    grex: Grex;
    stat: Stat;
  };

  const q = getStatSql(data);

  if (q) {
    const json = await query(q);
    return NextResponse.json(json, { status: 200 });
  }

  return NextResponse.json([], { status: 200 });
}
