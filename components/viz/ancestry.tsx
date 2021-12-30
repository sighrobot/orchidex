import { renderToString } from 'react-dom/server';
import React, { useRef } from 'react';
import { useAncestry } from 'lib/hooks/useAncestry';
import { sortBy } from 'lodash';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';
import { useRouter } from 'next/router';

let chart = null;
export const AncestryViz = ({ grex, maxDepth = false }) => {
  const d3Container = useRef(null);
  const router = useRouter();
  const ancestry = useAncestry(grex, maxDepth ? 1000 : 2);

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
        return 180;
      })
      .nodeHeight((a) => {
        return 80;
      })
      .childrenMargin((d) => (d.depth + 3) * 25)
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
      .layout('bottom')
      .render()
      .expandAll();

    chart.render().fit();
  }, [d3Container.current, ancestry]);

  const handleResetView = React.useCallback(() => {
    // chart?.expandAll();
    chart?.render().fit();
  }, []);

  const handleExpandAll = React.useCallback(() => {
    chart?.expandAll();
    // chart?.fit();
    chart?.render();
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
