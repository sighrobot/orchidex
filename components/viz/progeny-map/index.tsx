import React from 'react';
import { ResponsiveTreeMapCanvas } from '@nivo/treemap';
import { useProgenyAll } from 'lib/hooks/useProgeny';
import { Grex } from 'lib/types';
import { orderBy } from 'lodash';

import style from './style.module.scss';

// sortable by

// year
// alpha by name
// alpha by registrant
// sort list based on number of progeny
// alpha by seed/pollen parent

export default function ProgenyMap({ grex }: { grex: Grex }) {
  const { isLoading, data = [] } = useProgenyAll(grex);

  const children = React.useMemo(
    () =>
      orderBy(
        data.map((g) => {
          return {
            ...g,
            value: g.first_order_progeny_count + 1,
          };
        }),
        ['first_order_progeny_count', 'epithet'],
        ['desc']
      ),
    [data]
  );

  const grouped = React.useMemo(() => {
    const byGeneration = {};

    data.forEach((g) => {
      if (!byGeneration[g.generation]) {
        byGeneration[g.generation] = [];
      }

      byGeneration[g.generation].push(g);
    });

    const children = [];

    Object.keys(byGeneration).forEach((k) => {
      children.push({
        id: `F${k}`,
        children: byGeneration[k],
        value: 100,
      });
    });
    console.log({ children });
    return children;
  }, [data]);

  React.useEffect(() => {
    (HTMLCanvasElement as any).prototype.getBBox = function () {
      return { width: this.offsetWidth, height: this.offsetHeight };
    };
  });

  if (isLoading) {
    return 'loading';
  }
  return (
    <div className={style.progenyMap}>
      <ResponsiveTreeMapCanvas<Grex>
        data={{ children }}
        identity='id'
        value='value'
        leavesOnly
        orientLabel={false}
        // colorBy={}
        colors={(d: any) => {
          if (d.data.generation === 2) {
            return '#7fc97faa';
            return 'rgba(0, 0, 255, 0.5)';
          }
          if (d.data.generation === 3) {
            return '#beaed4aa';
            return 'rgba(0, 0, 255, 0.5)';
          }
          if (d.data.generation === 4) {
            return '#fdc086aa';
            return 'rgba(0, 0, 255, 0.33)';
          }
          if (d.data.generation === 5) {
            return '#ffff99aa';
            return 'rgba(0, 0, 255, 0.15)';
          }

          //   if (d.data.first_order_progeny_count === 0) {
          //     return 'rgba(0, 0, 0, 0.1)';
          //   }
          //   return `rgba(128, 214, 128, ${
          //     (d.data.first_order_progeny_count /
          //       data[0]?.first_order_progeny_count ?? 1) *
          //       0.75 +
          //     0.25
          //   })`;
        }}
        // nodeOpacity={0.3}
        label={(d) => {
          if (!d.data.epithet || d.width < 9 || d.height < 9) {
            return '';
          }
          const slice = d.data.epithet.slice(0, Math.max(d.width / 7, 2));
          if (
            (d.value / data[0]?.c > 0.02 && d.width > 16) ||
            d.width > 40 ||
            slice.length === d.data.epithet.length
          ) {
            return `${slice} (F${d.data.generation - 1})`;
          }
          return '';
        }}
        labelTextColor={(d: any) =>
          `rgba(0, 0, 0, ${
            (d.data.first_order_progeny_count /
              (data[0] ? data[0]?.first_order_progeny_count || 1 : 1)) *
              0.67 +
            0.33
          })`
        }
        tooltip={({ node }) => {
          return (
            <div className={style.tooltip}>
              <strong>
                {node.data.epithet} (F{node.data.generation - 1})
              </strong>
              : {node.data.first_order_progeny_count} progeny
            </div>
          );
        }}
      />
    </div>
  );
}
