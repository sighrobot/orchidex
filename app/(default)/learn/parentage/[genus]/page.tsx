import React from 'react';
import { Metadata } from 'next';

import ParentageChart from 'components/viz/parentage/chart';
import { APP_TITLE } from 'lib/constants';
import { fetchParentage } from 'lib/fetchers/parentage';
import { capitalize } from 'lib/utils';

type Params = Promise<{ genus: string }>;

// Registrations change slowly; rebuild each genus's counts once a day.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { genus: rawGenus } = await params;
  const genus = capitalize(decodeURIComponent(rawGenus));

  return {
    title: `${genus} parentage | Learn @ ${APP_TITLE}`,
    description: `Visualize the frequency with which all ${genus} orchids are used in creating new hybrids.`,
  };
}

export default async function Parentage({ params }: { params: Params }) {
  const { genus } = await params;
  const data = await fetchParentage(decodeURIComponent(genus));

  return <ParentageChart key={data.genus} data={data} />;
}
