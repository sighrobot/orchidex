import { renderToString } from 'react-dom/server';
import React, { useRef } from 'react';
import { useAncestry } from 'lib/hooks/useAncestry';
import { orderBy } from 'lodash';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';
import {
  isIntergeneric,
  isNaturalHybrid,
  isPrimary,
  isSpecies,
} from 'components/pills/pills';
import cn from 'classnames';
import style from './ancestry.module.scss';
import pillStyle from '../pills/pills.module.scss';
import Link from 'next/link';
import { grexToHref } from 'components/name/name';

let chart = null;

export const AncestryViz = ({ grex, maxDepth = false }) => {
  const d3Container = useRef(null);
  const ancestry = useAncestry(grex, maxDepth ? 1000 : 3);

  React.useEffect(() => {
    const { OrgChart } = require('d3-org-chart');

    if (!ancestry.nodes[0]) {
      return;
    }

    if (!chart) {
      chart = new OrgChart();
    }

    chart
      .svgHeight(
        window.innerHeight < 800
          ? window.innerHeight * 0.5
          : window.innerHeight * 0.75,
      )
      .scaleExtent([0.05, 1])
      .container(d3Container.current)
      .duration(200)
      .compact(false)
      .nodeWidth((d) => 160)
      .nodeHeight((a) => 108)
      .childrenMargin((d) => 100)
      .siblingsMargin((d) => 50)
      .buttonContent(() => null)
      .data([
        ...orderBy(ancestry.links, ['type'], ['desc']).map((l) => {
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
      .nodeContent(({ data: n }) => {
        const formatted = formatName(n);
        const nIsSpecies = isSpecies(n);
        const repairedEpithet = repairMalformedNaturalHybridEpithet({
          epithet: formatted.short.epithet,
        });
        const href = grexToHref({ ...n, id: n.id.split('-')[0] });
        const content = (
          <div
            className={cn(style.node, {
              [style.root]: !n.type,
              [style[n.type]]: n.type,
              [pillStyle.species]: nIsSpecies,
              [pillStyle.natural]: isNaturalHybrid(n),
              [pillStyle.primary]: isPrimary(n),
              [pillStyle.intergeneric]: isIntergeneric(n),
              [style.normal]:
                !nIsSpecies &&
                !isNaturalHybrid(n) &&
                !isPrimary(n) &&
                !isIntergeneric(n),
            })}
          >
            {nIsSpecies && (
              <div className={cn(style.pill)}>
                <span>Species</span>
              </div>
            )}

            {isIntergeneric(n) && isPrimary(n) ? (
              <div className={cn(style.pill)}>
                <span>Intergeneric Primary</span>
              </div>
            ) : isPrimary(n) ? (
              <div className={cn(style.pill)}>
                <span>Primary</span>
              </div>
            ) : isIntergeneric(n) ? (
              <div className={cn(style.pill)}>
                <span>Intergeneric</span>
              </div>
            ) : null}

            {isNaturalHybrid(n) && (
              <div className={cn(style.pill)}>
                <span>Natural</span>
              </div>
            )}

            <div className={style.name}>
              <em>{formatted.short.genus}</em>{' '}
              {nIsSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
            </div>
            {
              <div className={cn(style.level)}>
                {!nIsSpecies && (
                  <span>{n.date_of_registration.slice(0, 4)}</span>
                )}
                {n.l && <span>{n.l}º</span>}
              </div>
            }
          </div>
        );

        return renderToString(
          n.type ? (
            <Link
              className={style.nodeLink}
              href={href}
              target={maxDepth ? '_blank' : undefined}
            >
              {content}
            </Link>
          ) : (
            content
          ),
        );
      })
      .layout('bottom');

    chart.render().expandAll();
    chart.fit();

    return () => {
      chart = null;
    };
  }, [d3Container.current, ancestry]);

  return (
    <div className={style.viz}>
      {/* <menu>
        <button onClick={() => chart.fit()}>Reset view</button>
      </menu> */}
      <div className={style.vizContainer} ref={d3Container} />
    </div>
  );
};
