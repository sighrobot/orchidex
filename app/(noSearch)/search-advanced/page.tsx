import { permanentRedirect } from 'next/navigation';

import { fromLegacyParams, searchUrl } from 'lib/search/params';

// Retired page. Old links (including shared searches) land on /search with
// the advanced fields open and highlighted.
export default async function LegacySearchAdvancedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = fromLegacyParams(await searchParams);

  // Its seed/pollen parent fields now live under Hybrid search, so a link that
  // only searched by parents highlights that section instead.
  const hasParents = !!(params.g1 || params.e1 || params.g2 || params.e2);
  const hasOther = !!(
    params.genus ||
    params.epithet ||
    params.registrant ||
    params.originator ||
    params.from ||
    params.to
  );
  const panel = hasParents && !hasOther ? 'hybrid' : 'advanced';

  permanentRedirect(searchUrl(params, { panel }));
}
