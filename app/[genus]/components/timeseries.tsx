'use client';

import VegaLite from 'components/vega-lite';

import { useHybridsTimeseries } from 'lib/fetchers/timeseries';
import getSpec from './timeseries.spec';

export default function Timeseries({
  id,
  genus,
}: {
  id: string;
  genus: string;
}) {
  const { data } = useHybridsTimeseries({ genus });

  return (
    <VegaLite id={id} height={96} spec={getSpec({ genus, values: data })} />
  );
}
