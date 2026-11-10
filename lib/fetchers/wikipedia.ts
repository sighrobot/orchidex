export type GenusMeta = {
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
};

// Wikipedia asks API clients to identify themselves, and may answer with an
// HTML error page (rate limit, bot block) instead of JSON. Never let that
// crash the genus page: fall back to an empty result.
export async function fetchGenusMeta(genus: string): Promise<GenusMeta> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        genus
      )}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Orchidex (https://orchidex.org)',
        },
        next: { revalidate: 60 * 60 * 24 },
      }
    );

    if (!res.ok || !res.headers.get('content-type')?.includes('json')) {
      return {};
    }

    return await res.json();
  } catch {
    return {};
  }
}
