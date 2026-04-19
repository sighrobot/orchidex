import { NextRequest, NextResponse } from 'next/server';
import { queryGrexChild } from 'lib/queries/grex';

export async function GET(req: NextRequest) {
  const { s, p } = Object.fromEntries(req.nextUrl.searchParams);

  const json = await queryGrexChild(s, p);

  return NextResponse.json(json, { status: 200 });
}
