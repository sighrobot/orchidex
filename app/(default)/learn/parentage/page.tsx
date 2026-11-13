import React from 'react';
import { Metadata } from 'next';

import GeneraChart from 'components/viz/parentage/genera-chart';
import { APP_TITLE } from 'lib/constants';
import { fetchGenusParentage } from 'lib/fetchers/genus-parentage';

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Genus parentage | Learn @ ${APP_TITLE}`,
  description:
    'Compare every orchid genus by how many hybrids are registered in it and how often its orchids are used as parents.',
};

export default async function GenusParentage() {
  const data = await fetchGenusParentage();

  return <GeneraChart data={data} />;
}
