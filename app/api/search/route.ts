import { NextRequest, NextResponse } from 'next/server';
import { SEARCH_FIELDS, CROSS_FIELDS } from 'lib/constants';
import { querySearch } from 'lib/queries/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const params: Record<string, string | null> = {};
  SEARCH_FIELDS.forEach((f) => {
    params[f] = searchParams.get(f);
  });
  CROSS_FIELDS.forEach((f) => {
    params[f] = searchParams.get(f);
  });

  const json = await querySearch(params);

  return NextResponse.json(json, { status: 200 });
}
