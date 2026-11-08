import { permanentRedirect } from 'next/navigation';

import { searchUrl } from 'lib/search/params';

// Old basic-search URLs: /search/<text> → /search?q=<text>
export default async function LegacySearchPage({
  params,
}: {
  params: Promise<{ q: string }>;
}) {
  const { q } = await params;
  let text = q;
  try {
    text = decodeURIComponent(q);
  } catch {
    // Already decoded.
  }
  permanentRedirect(searchUrl({ q: text.trim() }));
}
