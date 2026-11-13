import React from 'react';
import { Metadata } from 'next';

import DominanceChart from 'components/viz/dominance/chart';
import { APP_TITLE } from 'lib/constants';
import { fetchDominance } from 'lib/fetchers/dominance';

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Registrant dominance - Learn | ${APP_TITLE}`,
    description: `A visualization depicting the dominance over time of people and
            organizations who register orchid hybrids with the Royal
            Horticultural Society.`,
    openGraph: { images: ['/learn/registrant-dominance.png'] },
  };
}

export default async function RegistrantDominance() {
  const data = await fetchDominance('registrant');

  return (
    <DominanceChart
      data={data}
      kind='registrant'
      title='Registrant dominance'
    />
  );
}
