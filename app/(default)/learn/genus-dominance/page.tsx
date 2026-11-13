import React from 'react';

import DominanceChart from 'components/viz/dominance/chart';
import { fetchDominance } from 'lib/fetchers/dominance';

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

export default async function GenusDominance() {
  const data = await fetchDominance('genus');

  return <DominanceChart data={data} kind='genus' title='Genus dominance' />;
}
