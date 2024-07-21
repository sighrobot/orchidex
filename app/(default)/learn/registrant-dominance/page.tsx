import React from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { H2 } from 'components/layout';
import VegaLite from 'components/vega-lite';
import spec from './spec';

import style from './style.module.scss';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Registrant dominance - Learn | ${APP_TITLE}`,
    description: `A visualization depicting the dominance over time of people and
            organizations who register orchid hybrids with the Royal
            Horticultural Society.`,
    openGraph: { images: ['/learn/registrant-dominance.png'] },
  };
}

export default function GenusDominance() {
  return (
    <>
      <div className={style.pageHeader}>
        <div>
          <H2>Registrant dominance</H2>

          <p>
            This visualization depicts the dominance over time of people and
            organizations who register orchid hybrids with the Royal
            Horticultural Society. Each colored bar represents the number of new
            hybrids registered that year by a given registrant.
          </p>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <VegaLite height={800} renderer='canvas' id='dominance' spec={spec} />
      </div>
    </>
  );
}
