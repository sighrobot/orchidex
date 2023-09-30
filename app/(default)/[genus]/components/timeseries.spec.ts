import { capitalize } from 'lib/utils';
import { VisualizationSpec } from 'vega-embed';

function getSpec({
  genus,
  values,
}: {
  genus: string;
  values: Record<string, any>[];
}): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    config: { view: { stroke: 'transparent' } },
    background: 'transparent',
    width: 'container',
    height: 'container',
    data: { values },
    mark: { type: 'bar' },
    encoding: {
      x: {
        field: 'd',
        type: 'temporal',
        axis: { grid: false, tickMinStep: 1 },
        title: null,
        // scale: { nice: 'year' },
      },
      y: {
        field: 'c',
        aggregate: 'sum',
        type: 'quantitative',
        title: null,
        scale: { zero: false },
        axis: {
          domain: false,
          ticks: false,
          gridColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
      fill: { value: 'black' },
      stroke: { value: 'black' },
    },
    title: {
      text: `${capitalize(genus)} hybrids registered per year`,
      anchor: 'start',
      offset: 10,
    },
    padding: 0,
  };
}

export default getSpec;
