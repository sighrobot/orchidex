const values = require('./values.json');

const TOP_ALL_TIME = [
  'Phal.',
  'Paph.',
  'C.',
  'Cym.',
  'Den.',
  'Rlc.',
  // 'Onc.',
  'V.',
  'Rth.',
  'Ctt.',
  // 'Mps.',
  // 'Masd.',
  'Phrag.',
  'Tolu.',
  'Sarco.',
  'Pda.',
  // 'Oip.',
  'Bc.',
  // 'Lyc.',
  'Epi.',
];

const ADJUST_ALL_TIME = {
  'Lyc.': { angle: -20, yOffset: -2 },
  'Masd.': { angle: -10, yOffset: 0 },
  'Mps.': { angle: 0, yOffset: 2 },
  'Oip.': { angle: 10, yOffset: 2 },
  'Onc.': { angle: 20, yOffset: 6 },
};

const ADJUST_2024 = {
  'Ctsm.': { bandPosition: 0.75 },
  'Ctt.': { bandPosition: 0.25 },
};

const DEFAULT_CALC_ALL_TIME = `${TOP_ALL_TIME.map(
  (f) => `datum.genus == '${f}'`
).join(' || ')} ? '– ' + datum.genus : ''`;

const DEFAULT_CALC_2024 =
  "datum.rank > 20 || datum.genus == 'Ctsm.' || datum.genus == 'Ctt.' ? '' : '– ' + datum.genus";

export function getSpec({ labelYear }: { labelYear?: 'all' | '2024' }) {
  const ADJUST = labelYear === '2024' ? ADJUST_2024 : ADJUST_ALL_TIME;
  const DEFAULT_CALC =
    labelYear === '2024' ? DEFAULT_CALC_2024 : DEFAULT_CALC_ALL_TIME;

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values },
    width: 'container',
    height: 800,
    background: 'transparent',
    config: { style: { cell: { stroke: 'transparent' } } },
    layer: [
      {
        mark: { type: 'bar', size: 7 },
        transform: [
          { filter: { field: 'd', gte: { year: 1857 } } },
          { calculate: 'datum.d + 86400000', as: 'd2' },
        ],
        encoding: {
          x: {
            field: 'd',
            type: 'temporal',
            axis: {
              grid: false,
              title: null,
              domain: false,
              labelFontWeight: 200,
              labelFontSize: 12,
              tickColor: 'black',
              tickSize: 5,
            },
          },
          y: {
            field: 'c',
            type: 'quantitative',
            axis: null,
            stack: 'normalize',
          },
          tooltip: [
            { field: 'full', type: 'nominal', title: 'Genus' },
            { field: 'd2', type: 'temporal', title: 'Year', format: '%Y' },
            { field: 'c', type: 'quantitative', title: '# of registrations' },
          ],
          fill: {
            legend: null,
            field: 'genus',
            scale: {
              range: [
                '#8a3ffc',
                '#33b1ff',
                '#007d79',
                '#ff7eb6',
                '#fa4d56',
                '#6fdc8c',
                '#4589ff',
                '#d12771',
                'orange',
                'turquoise',
                '#08bdba',
                '#bae6ff',
                'violet',
                '#d4bbff',
                'royalblue',
                'royalblue',
                '#663399',
                'rgb(169, 106, 247)',
              ],
            },
            sort: { op: 'sum', field: 'c', order: 'descending' },
          },
          order: { field: 'genus', sort: 'descending' },
        },
      },
      {
        mark: {
          type: 'text',
          xOffset: { expr: 'width / 2' },
          align: 'left',
          fontSize: 12,
          fontWeight: 200,
        },
        transform: [
          { filter: { field: 'd', gt: { year: 2023 } } },
          {
            aggregate: [{ op: 'sum', field: 'c', as: 'sumByGenus' }],
            groupby: ['genus'],
          },
          {
            window: [{ op: 'row_number', as: 'rank' }],
            sort: [{ field: 'sumByGenus', order: 'descending' }],
          },
          {
            calculate: DEFAULT_CALC,
            as: 'g2',
          },
        ],
        encoding: {
          order: { field: 'genus', sort: 'descending' },
          text: { field: 'g2' },
          y: {
            field: 'sumByGenus',
            stack: 'normalize',
            type: 'quantitative',
            bandPosition: 0.5,
          },
        },
      },

      ...Object.keys(ADJUST).map((k) => ({
        mark: {
          type: 'text',
          xOffset: { expr: 'width / 2' },
          yOffset: ADJUST[k].yOffset,
          angle: ADJUST[k].angle,
          align: 'left',
          fontSize: 12,
          fontWeight: 200,
        },
        transform: [
          { filter: { field: 'd', gt: { year: 2023 } } },
          {
            aggregate: [{ op: 'sum', field: 'c', as: 'sumByGenus' }],
            groupby: ['genus'],
          },
          {
            window: [{ op: 'row_number', as: 'rank' }],
            sort: [{ field: 'sumByGenus', order: 'descending' }],
          },
          {
            calculate: `datum.genus != '${k}' ? '' : '– ' + datum.genus`,
            as: 'g2',
          },
        ],
        encoding: {
          order: { field: 'genus', sort: 'descending' },
          text: { field: 'g2' },
          y: {
            field: 'sumByGenus',
            stack: 'normalize',
            type: 'quantitative',
            bandPosition: ADJUST[k].bandPosition,
          },
        },
      })),
    ],
  };
}
