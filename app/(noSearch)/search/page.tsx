import React, { Suspense } from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { parseSearchParams } from 'lib/search/params';

import SearchView from './view';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);

  return {
    title: q ? `${q} - Search - ${APP_TITLE}` : `Search - ${APP_TITLE}`,
    description: q
      ? `Search hundreds of thousands of records on Orchidex for "${q}" and learn about the people and organizations who grow and discover orchids species and hybrids.`
      : 'Learn about the people and organizations who grow and discover orchids species and hybrids by searching hundreds of thousands of records on Orchidex.',
  };
}

export default function SearchPage() {
  // useSearchParams in the view needs a Suspense boundary.
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
