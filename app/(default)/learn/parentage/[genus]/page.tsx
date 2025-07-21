import React from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { capitalize } from 'lib/utils';
import Treemap from 'components/viz/treemap';
import Sankey from 'components/viz/sankey';

export async function generateMetadata({
  params,
}: {
  params: { genus: string };
}): Promise<Metadata> {
  const genus = decodeURIComponent(params.genus);
  const capitalizedGenus = capitalize(genus);

  return {
    title: `${capitalizedGenus} parentage | Learn @ ${APP_TITLE}`,
    description: `Visualize the frequency with which all ${capitalizedGenus} orchids are used in creating new hybrids.`,
  };
}

export default async function Parentage({
  params: { genus } = { genus: '' },
} = {}) {
  return <Sankey/>;//<Treemap genus={genus} />;
}
