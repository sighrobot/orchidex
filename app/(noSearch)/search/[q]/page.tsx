import React from 'react';

import { SearchLayoutParams } from './layout';
import SearchView from './view';

export default async function SearchPage({
  params,
}: {
  params: SearchLayoutParams;
}) {
  const { q } = await params;
  const decodedQ = decodeURIComponent(q ?? '');

  return (
    <>
      <SearchView q={decodedQ} />
    </>
  );
}
