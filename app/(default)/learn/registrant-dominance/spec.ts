const values = require('./values.json');

const spec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: { values },
  width: 'container',
  height: 800,
  background: 'transparent',
  config: { style: { cell: { stroke: 'transparent' } } },
  layer: [
    {
      // params: [
      //   {
      //     name: 'grid',
      //     select: 'interval',
      //     bind: 'scales',
      //   },
      // ],
      mark: { type: 'bar', size: 7 },
      transform: [
        { filter: { field: 'd', gte: { year: 1857 } } },
        { calculate: 'datum.d + 86400000', as: 'd2' },
      ],
      encoding: {
        x: {
          field: 'd',
          type: 'temporal',
          // scale: {
          //   domain: [
          //     new Date('1858-01-01').getTime(),
          //     new Date('2024-01-01').getTime(),
          //   ],
          // },
          axis: {
            grid: false,
            title: null,
            domain: false,
            labelFontWeight: 200,
            labelFontSize: 12,
          },
        },
        y: {
          field: 'c',
          type: 'quantitative',
          axis: null,
          stack: 'normalize',
        },
        tooltip: [
          { field: 'genus', type: 'nominal', title: 'Registrant' },
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
              'gold',
              '#08bdba',
              '#bae6ff',
              '#ba4e00',
              '#d4bbff',
              'purple',
              'gray',
              'gray',
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
        dx: { expr: 'width /2' },
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
        { calculate: "datum.rank > 20 ? '' : '– ' + datum.genus", as: 'g2' },
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
  ],
};

export default spec;
