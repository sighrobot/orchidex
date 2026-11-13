import React from 'react';

import { fetchGenusDominance } from 'lib/fetchers/genus-dominance';
import GenusDominanceChart from './chart';

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

export default async function GenusDominance() {
  const data = await fetchGenusDominance();

  return <GenusDominanceChart data={data} title='Genus dominance' />;
}
