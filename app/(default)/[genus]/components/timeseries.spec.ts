import { VisualizationSpec } from 'vega-embed';

// The title is an HTML heading on the page, so it matches the site's type.
function getSpec({
  values,
}: {
  genus?: string;
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
    padding: 0,
  };
}

export default getSpec;
