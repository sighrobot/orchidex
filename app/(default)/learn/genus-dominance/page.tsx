'use client';
import React from 'react';

import { H2 } from 'components/layout';
import VegaLite from 'components/vega-lite';
import Shirt from 'components/shirt';
import { getSpec } from './spec';

import style from './style.module.scss';

export default function GenusDominance() {
  const [labelYear, setLabelYear] = React.useState<'all' | '2024'>('all');
  const handleLabel = (e) => setLabelYear(e.target.value);

  return (
    <>
      <div className={style.pageHeader}>
        <div>
          <H2>Genus dominance</H2>

          <p>
            This visualization depicts the dominance over time of genera used in
            orchid hybridization, as registered by the Royal Horticultural
            Society. Each colored bar represents the number of hybrids
            registered that year for a given genus.
          </p>
        </div>

        <Shirt />
      </div>

      <div className={style.labelControl}>
        <label>
          Show labels for
          <select value={labelYear} onChange={handleLabel}>
            <option value='all'>All-time</option>
            <option value='2024'>2024</option>
          </select>
        </label>
      </div>

      <div style={{ width: '100%' }}>
        <VegaLite
          height={800}
          renderer='canvas'
          id='dominance'
          spec={getSpec({ labelYear })}
        />
      </div>
    </>
  );
}
