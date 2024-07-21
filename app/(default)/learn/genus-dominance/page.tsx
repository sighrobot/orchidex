import React from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { H2 } from 'components/layout';
import VegaLite from 'components/vega-lite';
import Shirt from 'components/shirt';
import spec from './spec';

import style from './style.module.scss';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Genus dominance - Learn | ${APP_TITLE}`,
    description: `A visualization depicting the dominance over time of genera used in
            orchid hybridization, as registered by the Royal Horitcultural
            Society.`,
    openGraph: { images: ['/learn/genus-dominance.png'] },
  };
}

export default function GenusDominance() {
  return (
    <>
      <div className={style.pageHeader}>
        <div>
          <H2>Genus dominance</H2>

          <p>
            This visualization depicts the dominance over time of genera used in
            orchid hybridization, as registered by the Royal Horitcultural
            Society. Each colored bar represents the number of hybrids
            registered that year for a given genus.
          </p>
        </div>

        <Shirt />
      </div>

      <div style={{ width: '100%' }}>
        <VegaLite height={800} renderer='canvas' id='dominance' spec={spec} />
      </div>
    </>
  );
}
