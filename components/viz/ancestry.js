import { renderToString } from "react-dom/server";
import React from "react";
import { useAncestry } from "lib/hooks/useAncestry";
import Head from "next/head";
import { useRouter } from "next/router";
import sortBy from "lodash.sortby";
import { find } from "lodash";
import { abbreviateName } from "lib/utils";

export const AncestryViz = ({ grex }) => {
  const router = useRouter();
  const ancestry = useAncestry(grex, 2);

  React.useEffect(() => {
    if (typeof google === "undefined") {
      return;
    }

    let data;
    function drawChart() {
      data = new google.visualization.DataTable();
      data.addColumn("string", "name");
      data.addColumn("string", "parent");
      data.addColumn("string", "toolTip");

      const rows = [
        [
          {
            v: ancestry.nodes[0]?.id,
            f: renderToString(
              <div className="root">{abbreviateName(ancestry.nodes[0])}</div>
            ),
          },
          "",
          "",
        ],
        ...sortBy(ancestry.links, "type").map((l) => {
          const n = find(ancestry.nodes, { id: l.source });
          return [
            {
              v: l.source,
              f: renderToString(
                <div className={l.type}>{abbreviateName(n)}</div>
              ),
            },
            l.target,
            "",
          ];
        }),
      ];

      // For each orgchart box, provide the name, manager, and tooltip to show.
      data.addRows(rows);

      // Create the chart.
      var chart = new google.visualization.OrgChart(
        document.getElementById("chart_div")
      );
      // Draw the chart, setting the allowHtml option to true for the tooltips.
      chart.draw(data, { allowHtml: true });
      google.visualization.events.addListener(chart, "select", (e) => {
        const id = rows[chart.getSelection()[0].row][0].v.split("-")[0];

        router.push(`/grex/${id}`);
      });
    }

    google.charts.load("current", { packages: ["orgchart"] });
    google.charts.setOnLoadCallback(drawChart);
  }, [ancestry]);

  return (
    <>
      <Head>
        <script src="//www.gstatic.com/charts/loader.js" />
      </Head>

      <div className="ancestry-viz chart-wrap">
        <div id="chart_div" />
      </div>
    </>
  );
};
