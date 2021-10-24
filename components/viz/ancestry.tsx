import { renderToString } from 'react-dom/server';
import React from 'react';
import { useAncestry } from 'lib/hooks/useAncestry';
import { sortBy } from 'lodash';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';

export const AncestryViz = ({ grex, maxDepth = false }) => {
  const ancestry = useAncestry(grex, maxDepth ? 1000 : 2);

  React.useEffect(() => {
    const { OrgChart } = require('d3-org-chart');

    if (!ancestry.nodes[0]) {
      return;
    }

    const ch = new OrgChart()
      .container('#tree')
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
        return 140;
      })
      .nodeHeight((a) => {
        return 72;
      })
      .siblingsMargin((d) => Math.max(25, (d.depth + 1) * 25))
      .childrenMargin((d) => Math.max(25, (d.depth + 1) * 25))
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
            className={`${n.type ? n.type : 'root'} ${
              isSpecies ? 'species' : ''
            }`}
          >
            <em>{formatted.genus}</em>{' '}
            {isSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
            <div>{n.registration_date}</div>
          </div>,
        );
      })
      .render()
      .expandAll();

    ch.fit();
  }, [ancestry]);

  return (
    <div className='ancestry-viz chart-wrap'>
      <div id='tree' />
    </div>
  );
};
