import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand ISR revalidation endpoint.
 *
 * Call this after the daily data update (e.g. from a cron job or CI pipeline)
 * to immediately bust the ISR page cache:
 *
 *   curl -X POST https://orchidex.vercel.app/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATION_SECRET"
 *
 * Note: This purges Next.js ISR caches (server-rendered pages). API route
 * responses cached at the Vercel CDN edge expire naturally based on their
 * Cache-Control s-maxage (currently 1 hour).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.REVALIDATION_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/', 'layout');

  return NextResponse.json({ revalidated: true });
}
