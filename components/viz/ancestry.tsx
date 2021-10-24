import { renderToString } from 'react-dom/server';
import React from 'react';
import { useAncestry } from 'lib/hooks/useAncestry';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { find, get, sortBy } from 'lodash';
import { formatName, repairMalformedNaturalHybridEpithet } from 'lib/string';

import style from './list.module.scss';

export const AncestryViz = ({ grex, maxDepth = false }) => {
  const router = useRouter();
  const ancestry = useAncestry(grex, maxDepth ? 1000 : 2);

  React.useEffect(() => {
    const google = get(global, "google");
    const { OrgChart } = require("d3-org-chart");
    console.log({ ancestry });

    if (!google || !OrgChart || !ancestry.nodes[0]) {
      return;
    }

    // let data;
    function drawChart() {
      // data = new google.visualization.DataTable();
      // data.addColumn("string", "name");
      // data.addColumn("string", "parent");
      // data.addColumn("string", "toolTip");

      // const formattedRoot = formatName(ancestry.nodes[0], {
      //   shortenGenus: true,
      //   shortenEpithet: true,
      // });

      // const isSpecies =
      //   formattedRoot.epithet &&
      //   formattedRoot.epithet[0] === formattedRoot.epithet[0].toLowerCase();
      // const repairedEpithet =
      //   repairMalformedNaturalHybridEpithet(formattedRoot);

      // const rows = [
      //   [
      //     {
      //       v: ancestry.nodes[0]?.id,
      //       f: renderToString(
      //         <div className={`root ${isSpecies ? "species" : ""}`}>
      //           <em>{formattedRoot.genus}</em>{" "}
      //           {isSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
      //         </div>
      //       ),
      //     },
      //     "",
      //     "",
      //   ],
      //   ...sortBy(ancestry.links, "type").map((l) => {
      //     const n = find(ancestry.nodes, { id: l.source });
      //     const formatted = formatName(n, {
      //       shortenGenus: true,
      //       shortenEpithet: true,
      //     });
      //     const isSpecies =
      //       formatted.epithet &&
      //       formatted.epithet[0] === formatted.epithet[0].toLowerCase();
      //     const repairedEpithet =
      //       repairMalformedNaturalHybridEpithet(formatted);
      //     return [
      //       {
      //         v: l.source,
      //         f: renderToString(
      //           <div className={`${l.type} ${isSpecies ? "species" : ""}`}>
      //             <em>{formatted.genus}</em>{" "}
      //             {isSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
      //           </div>
      //         ),
      //       },
      //       l.target,
      //       "",
      //     ];
      //   }),
      // ];

      // For each orgchart box, provide the name, manager, and tooltip to show.
      // data.addRows(rows);

      // Create the chart.
      // var chart = new google.visualization.OrgChart(
      //   document.getElementById("chart_div")
      // );
      // Draw the chart, setting the allowHtml option to true for the tooltips.
      // chart.draw(data, { allowHtml: true, allowCollapse: true });
      // google.visualization.events.addListener(chart, "select", (e) => {
      //   const id = rows[chart.getSelection()[0].row][0].v.split("-")[0];

      //   router.push(`/grex/${id}`);
      // });
      const ch = new OrgChart()
        .container("#tree")
        .data([
          ...sortBy(ancestry.links, ["type", "genus", "epithet"]).map((l) => {
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
        // .siblingsMargin((d) => Math.max(50, d.depth * 50))
        .childrenMargin((d) => Math.max(100, d.depth * 100))
        .nodeContent(({ data: n }) => {
          const formatted = formatName(n, {
            shortenGenus: true,
            shortenEpithet: true,
          });
          const isSpecies =
            formatted.epithet &&
            formatted.epithet[0] === formatted.epithet[0].toLowerCase();
          const repairedEpithet =
            repairMalformedNaturalHybridEpithet(formatted);

          return renderToString(
            <div
              className={`${n.type ? n.type : "root"} ${
                isSpecies ? "species" : ""
              }`}
            >
              <em>{formatted.genus}</em>{" "}
              {isSpecies ? <em>{repairedEpithet}</em> : repairedEpithet}
              <div>{n.registration_date}</div>
            </div>
          );
        })
        .render()
        .expandAll();

      ch.fit();
    }

    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(drawChart);
  }, [ancestry]);

  if (typeof document !== 'undefined') {
    const el = document.querySelector('.chart-wrap');
    if (el) el.scrollTo(800 / 2 - window.innerWidth / 2, 0);
  }

  return (
    <>
      <Script>
        <script src="//www.gstatic.com/charts/loader.js" />
      </Script>

      <div id="tree" />

      <div className="ancestry-viz chart-wrap" style={{ overflowX: "scroll" }}>
        <div id="chart_div" style={{ width: "auto" }} />
      </div>
    </>
  );
};
