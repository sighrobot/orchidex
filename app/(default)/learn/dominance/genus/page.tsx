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
    title: `Genus dominance in hybridization | Learn @ ${APP_TITLE}`,
    description: `Visualize the dominance of genera used in the creation of new hybrids over time.`,
  };
}

export default function GenusDominance() {
  return (
    <>
      <div className={style.pageHeader}>
        <div>
          <H2>Genus dominance</H2>

          <p>
            This visualization depicts the change in popularity over time of
            orchid genera used in hybridization. Each colored bar segment
            represents the number of new hybrids registered that year for a
            given genus.
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
