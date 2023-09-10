import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce, orderBy } from 'lodash';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import { useAncestry } from 'lib/hooks/useAncestry';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';
import {
  isIntergeneric,
  isNaturalHybrid,
  isPrimary,
  isSpecies,
} from 'components/pills/pills';
import { grexToHref } from 'components/name/name';
import { Grex } from 'lib/types';

import style from './ancestry.module.scss';

// Dynamic Width (Build Regex)
const wrap = (s, w) =>
  s.replace(new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n');

function getGrexColor(g: Grex): string {
  const species = isSpecies(g);
  const natural = isNaturalHybrid(g);
  const primary = isPrimary(g);
  const intergeneric = isIntergeneric(g);
  const hypothetical = g.hypothetical;

  if (intergeneric) {
    if (primary) {
      return `linear-gradient(
        to bottom right,
        rgba(239, 133, 180, 1),
        rgba(130, 168, 248, 1)
      )`;
    }

    if (natural) {
      return `linear-gradient(
        to right,
        rgba(239, 133, 180, 1),
        rgba(91, 175, 248, 1)
      )`;
    }

    return 'rgba(239, 133, 180, 1)';
  }

  if (primary) {
    return 'rgba(130, 168, 248, 1)';
  }

  if (natural) {
    return 'rgba(91, 175, 248, 1)';
  }

  if (species) {
    return 'rgba(103, 187, 110, 1)';
  }

  if (hypothetical) {
    return 'black';
  }

  return 'rgba(184, 151, 248, 1)';
}

let cy;

cytoscape.use(dagre);

export const AncestryViz = ({
  grex,
  seedParent,
  pollenParent,
  maxDepth = false,
}: {
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  maxDepth?: boolean;
}) => {
  const router = useRouter();
  const [depth, setDepth] = React.useState<number>(maxDepth ? 1000 : 4);

  const handleNodeClick = React.useCallback(
    (e) => {
      const g = e.target.data() as Grex;
      const href = grexToHref({ ...g, id: g.id.split('-')[0] });
      router.push(href);
    },
    [router]
  );

  const handleChangeDepth = debounce((e) => {
    setDepth(parseInt(e.target.value, 10));
  }, 350);

  const cyContainer = useRef(null);
  const regularAncestry = useAncestry(grex, depth);
  const seedParentAncestry = useAncestry(seedParent || {}, depth);
  const pollenParentAncestry = useAncestry(pollenParent || {}, depth);
  const parentAncestry = {
    nodes: [grex, ...seedParentAncestry.nodes, ...pollenParentAncestry.nodes],
    links: [
      { source: seedParent?.id, target: grex.id },
      { source: pollenParent?.id, target: grex.id },
      ...seedParentAncestry.links,
      ...pollenParentAncestry.links,
    ],
    nodeMap: {
      [grex.id]: grex,
      ...seedParentAncestry.nodeMap,
      ...pollenParentAncestry.nodeMap,
    },
  };
  const ancestry =
    seedParent && pollenParent ? parentAncestry : regularAncestry;

  React.useEffect(() => {
    cy = cytoscape({
      layout: { name: 'dagre', rankSep: 100 },
      autoungrabify: true,
      container: cyContainer.current,
      maxZoom: 1,
      elements: [
        ...ancestry.nodes.map((n) => ({ data: n })),
        ...orderBy(ancestry.links, ['type'], ['desc']).map((l) => ({
          data: l,
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            height: 148,
            width: 220,
            'background-gradient-direction': 'to-bottom-right',
            color: 'white',
            'font-family': 'IBM Plex Sans',
            'font-size': 24,
            'line-height': 1,
            'min-zoomed-font-size': 12,
            shape: 'roundrectangle',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'border-color': 'black',
            'border-width': 1,

            'background-color': (n) => {
              const g = n.data() as Grex;
              return isIntergeneric(g) && isPrimary(g) ? '' : getGrexColor(g);
            },
            'background-fill': (n) => {
              const g = n.data() as Grex;
              return isIntergeneric(g) && isPrimary(g) ? 'linear-gradient' : '';
            },
            'background-gradient-stop-colors': (n) => {
              const g = n.data() as Grex;
              return isIntergeneric(g)
                ? isPrimary(g)
                  ? ['rgba(239, 133, 180, 1)', 'rgba(130, 168, 248, 1)']
                  : ['rgba(239, 133, 180, 1)', 'rgba(91, 175, 248, 1)']
                : [];
            },
            label: (n) => {
              const g = n.data() as Grex;
              const formatted = formatName(g);
              const repairedEpithet = repairMalformedNaturalHybridEpithet({
                epithet: formatted.short.epithet,
              });
              const name = isSpecies(g)
                ? `${formatted.short.genus} ${repairedEpithet}`
                : formatted.short.full;
              const nameLines = wrap(name, 17).split('\n');
              const blankLines = Array(4 - nameLines.length).fill('');
              const year = g.date_of_registration
                ? g.date_of_registration.slice(0, 4)
                : '';
              const lastLine = !g.l
                ? `${year}                     ☺`
                : `${
                    g.date_of_registration ? year : '          '
                  }                    ${g.l ? `${g.l}º` : ''}`;

              return [...nameLines, ...blankLines, lastLine].join('\n');
            },
          },
        },
        {
          selector: 'edge',
          style: {
            events: 'no',
            width: 4,
            'line-color': '#ccc',
            'curve-style': 'taxi',
            'taxi-direction': 'upward',
            'edge-distances': 'node-position',
          },
        },
      ],
    }).fit();

    cy.on('vclick', 'node', handleNodeClick);
  }, [ancestry, handleNodeClick]);

  return (
    <div className={style.viz}>
      <menu>
        <label>
          {depth}º
          <input
            type='range'
            min={1}
            max={8}
            onChange={handleChangeDepth}
            defaultValue={depth}
          />
        </label>

        <button onClick={() => cy.fit()}>Reset zoom</button>
      </menu>

      <div className={style.vizContainer} ref={cyContainer} />
    </div>
  );
};
