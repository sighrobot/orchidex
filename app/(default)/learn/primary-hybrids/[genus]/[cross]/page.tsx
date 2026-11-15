import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import PrimaryChart from 'components/viz/primary/chart';
import { fetchPrimary } from 'lib/fetchers/primary';

import { primaryMetadata } from '../../meta';

type Params = Promise<{ genus: string; cross: string }>;

// Registrations change slowly; rebuild each pair's crosses once a day.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { genus, cross } = await params;
  return primaryMetadata(genus, cross);
}

export default async function PrimaryHybridsCross({
  params,
}: {
  params: Params;
}) {
  const { genus, cross } = await params;
  const a = decodeURIComponent(genus).toLowerCase();
  const b = decodeURIComponent(cross).toLowerCase();
  // Crossing a genus with itself is the genus's own page.
  if (a === b) redirect(`/learn/primary-hybrids/${encodeURIComponent(a)}`);

  const data = await fetchPrimary(a, b);

  return <PrimaryChart key={`${data.genus}|${data.cross}`} data={data} />;
}
