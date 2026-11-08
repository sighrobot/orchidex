import { NextRequest, NextResponse } from 'next/server';

import { searchRegistry } from 'lib/queries/search';
import { parseSearchParams } from 'lib/search/params';

// GET /api/search?q=…&genus=…&type=hybrid&offset=50
// Returns { results, total }. See lib/search/params.ts for every param.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    const json = await searchRegistry(parseSearchParams(searchParams), {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });
    return NextResponse.json(json, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
