import { NextRequest, NextResponse } from 'next/server';

import { searchRegistry } from 'lib/queries/search';

type Params = Promise<{ q: string }>;

// Text-only search, ranked by relevance. Used by the grex autocomplete.
// Returns a bare array of results.
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { q: rawQ } = await params;
  let q = rawQ;
  try {
    q = decodeURIComponent(rawQ);
  } catch {
    // Already decoded and contains a literal "%".
  }
  const { searchParams } = req.nextUrl;

  try {
    const { results } = await searchRegistry(
      { q: q.trim() },
      {
        limit: searchParams.get('limit') ?? 100,
        offset: searchParams.get('offset'),
      }
    );

    return NextResponse.json(results, { status: 200 });
  } catch (e) {
    console.error(e);
    // Callers expect an array, so an empty one keeps autocomplete working.
    return NextResponse.json([], { status: 500 });
  }
}
