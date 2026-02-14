import { NextResponse } from 'next/server';

// Data updates daily at ~8am. Cache for 1 hour at the edge so fresh data
// propagates within an hour of the update without any manual purging.
export const CACHE_MAX_AGE = 60 * 60; // 1 hour (seconds)

/**
 * Return a JSON response with Vercel edge-caching headers.
 *
 * s-maxage        – Vercel CDN caches the response for CACHE_MAX_AGE seconds.
 * stale-while-revalidate – Serve stale for 60 s while refreshing in background.
 */
export function cachedJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
    },
  });
}
