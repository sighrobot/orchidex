import React from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { capitalize } from 'lib/utils';
import Treemap from 'components/viz/treemap';

type Params = Promise<{ genus: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { genus: rawGenus } = await params;
  const genus = decodeURIComponent(rawGenus);
  const capitalizedGenus = capitalize(genus);

  return {
    title: `${capitalizedGenus} parentage | Learn @ ${APP_TITLE}`,
    description: `Visualize the frequency with which all ${capitalizedGenus} orchids are used in creating new hybrids.`,
  };
}

export default async function Parentage({ params }: { params: Params }) {
  const { genus } = await params;
  return <Treemap genus={genus} />;
}
