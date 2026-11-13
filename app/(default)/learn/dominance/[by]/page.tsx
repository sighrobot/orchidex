import React from 'react';
import { Metadata } from 'next';

import DominanceChart from 'components/viz/dominance/chart';
import { APP_TITLE } from 'lib/constants';
import { fetchDominance } from 'lib/fetchers/dominance';

import type { DominanceKind } from 'lib/fetchers/dominance';

type Params = Promise<{ by: DominanceKind }>;

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;
// Only the kinds below; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ by: 'genus' }, { by: 'registrant' }];
}

const META: Record<DominanceKind, { title: string; description: string }> = {
  genus: {
    title: 'Genus dominance',
    description:
      'A visualization depicting the dominance over time of genera used in orchid hybridization, as registered by the Royal Horticultural Society.',
  },
  registrant: {
    title: 'Registrant dominance',
    description:
      'A visualization depicting the dominance over time of people and organizations who register orchid hybrids with the Royal Horticultural Society.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { by } = await params;
  const { title, description } = META[by];
  return {
    title: `${title} - Learn | ${APP_TITLE}`,
    description,
    openGraph: { images: [`/learn/${by}-dominance.png`] },
  };
}

export default async function Dominance({ params }: { params: Params }) {
  const { by } = await params;
  const data = await fetchDominance(by);

  // Keyed so switching kinds starts a fresh chart, which picks up the years
  // in view from the layout's shared state.
  return <DominanceChart key={by} data={data} kind={by} />;
}
