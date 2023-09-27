import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce, orderBy } from 'lodash';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cn from 'classnames';

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
import { H3 } from 'components/layout';

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

  if (hypothetical) {
    return 'black';
  }

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

  return 'rgba(184, 151, 248, 1)';
}

let cy;

cytoscape.use(dagre);

export const AncestryViz = ({
  grex,
  seedParent,
  pollenParent,
  maxDepth = false,
  isFullScreen,
  onFullScreenOpen,
  onFullScreenClose,
}: {
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  maxDepth?: boolean;
  onFullScreenOpen?: () => void;
  isFullScreen?: boolean;
  onFullScreenClose?: () => void;
}) => {
  const router = useRouter();
  const [depth, setDepth] = React.useState<number>(maxDepth ? 1000 : 3);
  const [inspected, setInspected] = React.useState<Grex>(); // TODO: hook this up someday

  const handleNodeClick = React.useCallback(
    (e) => {
      if (!isFullScreen) {
        const g = e.target.data() as Grex;
        if (g.hypothetical) return;
        const href = grexToHref({ ...g, id: g.id.split('-')[0] });
        router.push(href);
      }
    },
    [router, isFullScreen]
  );

  const handleNodeSelect = React.useCallback((e) => {
    setInspected(e.target.data() as Grex);
  }, []);

  const handleNodeUnselect = React.useCallback(() => {
    setInspected(undefined);
  }, []);

  const handleChangeDepth = debounce((e) => {
    setDepth(parseInt(e.target.value, 10));
  }, 350);

  const cyContainer = useRef(null);
  const regularAncestry = useAncestry(grex, depth);
  const seedParentAncestry = useAncestry(seedParent || {}, depth);
  const pollenParentAncestry = useAncestry(pollenParent || {}, depth);
  const parentAncestry = {
    nodes: [
      grex,
      seedParent,
      pollenParent,
      ...seedParentAncestry.nodes,
      ...pollenParentAncestry.nodes,
    ],
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
      userZoomingEnabled: isFullScreen,
      userPanningEnabled: isFullScreen,
      boxSelectionEnabled: false,
      container: cyContainer.current,
      maxZoom: 1,
      minZoom: isFullScreen ? 1 / (depth + 1) : undefined,
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
              return isIntergeneric(g) && isPrimary(g)
                ? 'linear-gradient'
                : 'solid';
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
                ? `${year}                    𓆺`
                : `${
                    g.date_of_registration ? year : '          '
                  }                    ${g.l ? `${g.l}º` : ''}`;

              return [...nameLines, ...blankLines, lastLine].join('\n');
            },
          },
        },
        // {
        //   selector: 'node:selected',
        //   style: isFullScreen
        //     ? {
        //         'border-color': 'black',
        //         'border-width': 25,
        //       }
        //     : {},
        // },
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
    }).fit(isFullScreen ? 40 : 0);

    cy.removeAllListeners();

    if (isFullScreen) {
      // cy.on('select', 'node', handleNodeSelect);
      // cy.on('unselect', 'node', handleNodeUnselect);
    } else {
      cy.on('vclick', 'node', handleNodeClick);
    }
  }, [
    ancestry,
    handleNodeClick,
    isFullScreen,
    handleNodeSelect,
    handleNodeUnselect,
    depth,
  ]);

  const MenuWrap = ({ children }) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        left: 0,
        background: isFullScreen ? 'rgba(255, 255, 255,0.8)' : undefined,
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );

  return (
    <div className={style.viz}>
      <MenuWrap>
        <div className={style.menuOuter}>
          {isFullScreen && (
            <H3>
              <em>{formatName(grex).long.genus}</em>{' '}
              {formatName(grex).long.epithet}
            </H3>
          )}

          <menu>
            {isFullScreen && (
              <label>
                Generations:
                <select onChange={handleChangeDepth} defaultValue={depth}>
                  {Array(9)
                    .fill(null)
                    .map((_, idx) => {
                      return <option value={idx + 1}>{idx + 2}</option>;
                    })}
                </select>
              </label>
            )}

            {isFullScreen && (
              <button onClick={() => cy.fit(40)}>&#x27F3;&nbsp;Reset</button>
            )}

            <button
              onClick={isFullScreen ? onFullScreenClose : onFullScreenOpen}
            >
              {isFullScreen ? <>&times;</> : <>&#x26F6;</>}&nbsp;
              {isFullScreen ? 'Close' : 'Expand Ancestry'}
            </button>
          </menu>
        </div>
      </MenuWrap>

      <div
        className={cn(style.vizContainer, { [style.expanded]: isFullScreen })}
        ref={cyContainer}
      />
    </div>
  );
};
