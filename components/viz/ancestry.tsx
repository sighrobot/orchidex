import { renderToString } from 'react-dom/server';
import React, { useRef } from 'react';
import { useAncestry } from 'lib/hooks/useAncestry';
import { sortBy } from 'lodash';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';
import { useRouter } from 'next/router';

export const AncestryViz = ({ grex, maxDepth = false }) => {
  const d3Container = useRef(null);
  const router = useRouter();
  const ancestry = useAncestry(grex, maxDepth ? 1000 : 2);
  const isSmall =
    typeof window === 'undefined' ? false : window.innerWidth < 600;
  let chart = null;

  const handleResetView = React.useCallback(() => {
    if (chart) {
      if (maxDepth || !isSmall) {
        chart.fit();
      } else {
        chart.zoomTreeBounds({
          x0: -window.innerWidth * 0.85,
          x1: window.innerWidth * 0.85,
          y0: 300,
          y1: -650,
        });
      }
    }
  }, [isSmall, maxDepth]);

  React.useLayoutEffect(() => {
    const { OrgChart } = require('d3-org-chart');

    if (!ancestry.nodes[0]) {
      return;
    }

    if (!chart) {
      chart = new OrgChart();
    }

    chart
      .svgHeight(maxDepth ? window.innerHeight * 0.75 : 350)
      .container(d3Container.current)

      .data([
        ...sortBy(ancestry.links, ['type', 'genus', 'epithet']).map((l) => {
          return {
            ...ancestry.nodeMap[l.source],
            type: l.type,
            id: l.source,
            parentId: l.target,
          };
        }),
        {
          ...ancestry.nodeMap[ancestry.nodes[0].id],
          id: ancestry.nodes[0].id,
        },
      ])
      .nodeWidth((a, b, c) => {
        return maxDepth || !isSmall ? 200 : 150;
      })
      .nodeHeight((a) => {
        return 80;
      })
      .childrenMargin((d) => (d.depth === 0 ? 100 : (d.depth + 1) * 25))

      .nodeContent(({ data: n }) => {
        const formatted = formatName(n, {
          shortenGenus: true,
          shortenEpithet: true,
        });
        const isSpecies =
          formatted.epithet &&
          formatted.epithet[0] === formatted.epithet[0].toLowerCase();
        const repairedEpithet = repairMalformedNaturalHybridEpithet(formatted);

        return renderToString(
          <div
            className={`node ${n.type ? n.type : 'root'} ${
              isSpecies ? 'species' : ''
            }`}
          >
            <div className='name'>
              <em>{formatted.genus}</em>{' '}
              {isSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
            </div>
            {n.date_of_registration && (
              <div className='date'>{n.date_of_registration.slice(0, 4)}</div>
            )}
          </div>,
        );
      })
      .onNodeClick((id: string) => {
        router.push(`/grex/${id.split('-')[0]}`);
      })
      .layout('bottom');

    if (!maxDepth && isSmall) {
      chart
        .neightbourMargin((d) => 20)
        .siblingsMargin((d) => 20)
        .childrenMargin((d) => 80)
        .compactMarginPair((d) => 40);
    }

    chart.render().expandAll();

    handleResetView();
  }, [isSmall, handleResetView, d3Container.current, ancestry]);

  const handleExpandAll = React.useCallback(() => {
    chart.expandAll();
  }, []);

  return (
    <div className='ancestry-viz'>
      <menu>
        <button onClick={handleResetView}>Re-center</button>
        <button onClick={handleExpandAll}>Expand All</button>
      </menu>
      <div ref={d3Container} />
    </div>
  );
};
