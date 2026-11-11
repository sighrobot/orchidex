import React from 'react';

import { H2 } from 'components/layout';
import { fetchGenusDominance } from 'lib/fetchers/genus-dominance';
import GenusDominanceChart from './chart';

import style from './style.module.scss';

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

export default async function GenusDominance() {
  const data = await fetchGenusDominance();

  return (
    <>
      <div className={style.pageHeader}>
        <div>
          <H2>Genus dominance</H2>

          <p>
            This visualization depicts the dominance over time of genera used in
            orchid hybridization, as registered by the Royal Horticultural
            Society. Each colored bar represents the share of hybrids registered
            that year for a given genus.
          </p>
        </div>
      </div>

      <GenusDominanceChart data={data} />
    </>
  );
}
