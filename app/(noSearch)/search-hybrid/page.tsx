import { permanentRedirect } from 'next/navigation';

import { fromLegacyParams, searchUrl } from 'lib/search/params';

// Retired page. Old links (including shared searches) land on /search with
// the hybrid fields open and highlighted.
export default async function LegacySearchHybridPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = fromLegacyParams(await searchParams);
  permanentRedirect(searchUrl(params, { panel: 'hybrid' }));
}
