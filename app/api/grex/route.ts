import { NextRequest, NextResponse } from 'next/server';
import { queryGrexById } from 'lib/queries/grex';

export async function GET(req: NextRequest) {
  const { id: idParam } = Object.fromEntries(req.nextUrl.searchParams);

  const json = await queryGrexById(idParam);

  return NextResponse.json(json, { status: 200 });
}
