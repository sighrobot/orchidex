import React from 'react';
import { Metadata } from 'next';

import PrimaryChart from 'components/viz/primary/chart';
import { fetchPrimary } from 'lib/fetchers/primary';

import { primaryMetadata } from '../meta';

type Params = Promise<{ genus: string }>;

// Registrations change slowly; rebuild each genus's crosses once a day.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { genus } = await params;
  return primaryMetadata(genus);
}

export default async function PrimaryHybrids({ params }: { params: Params }) {
  const { genus } = await params;
  const data = await fetchPrimary(decodeURIComponent(genus));

  return <PrimaryChart key={data.genus} data={data} />;
}
