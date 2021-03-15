import { renderToString } from "react-dom/server";
import React from "react";
import { find, orderBy, sortBy } from "lodash";

import { Container } from "components/container";
import { Grex as G } from "components/grex";
import { fetchGrex } from "lib/hooks/useGrex";
import { useProgeny } from "lib/hooks/useProgeny";
import { useRouter } from "next/router";
import { useDate } from "lib/hooks/useDate";
import Link from "next/link";
import { useAncestry } from "lib/hooks/useAncestry";
import { abbreviateName } from "lib/utils";
import { Resources } from "components/resources";

export async function getServerSideProps(context) {
  const data = await fetchGrex(context.query.id);

  if (!data) {
    return {
      notFound: true,
    };
  }

  return {
    props: { grex: data }, // will be passed to the page component as props
  };
}

export const Grex = ({ grex }) => {
  const router = useRouter();

  const ancestry = useAncestry(grex, 4);
  const onDate = useDate({ d: grex?.date_of_registration });
  const progeny = useProgeny(grex);

  const byRegistrant = onDate.filter(
    (f) => f.id !== grex.id && f.registrant_name === grex?.registrant_name
  );

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  React.useEffect(() => {
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
    <Container title={`${grex.genus} ${grex.epithet} | Orchidex`}>
      <G heading grex={grex} hideLink />

      <Resources grex={grex} />

      <section>
        <details>
          <summary>Progeny ({progeny.length.toLocaleString()})</summary>
          <div>
            {orderBy(
              progeny.filter((d) => d.synonym_flag.includes("not")),
              ["date_of_registration", "genus", "epithet"],
              ["desc"]
            ).map((grexOnDate) => {
              return <G key={grexOnDate.id} grex={grexOnDate} />;
            })}
          </div>
        </details>
      </section>

      <section>
        <details>
          <summary>Ancestry</summary>
          <div>
            <div className="chart-wrap">
              <div id="chart_div" />
            </div>
          </div>
        </details>
      </section>

      {grex?.date_of_registration && (
        <section>
          <details>
            <summary>
              Same-Date Registrations by{" "}
              <strong>{grex?.registrant_name}</strong> (
              {byRegistrant.length.toLocaleString()})
            </summary>
            <div>
              {orderBy(byRegistrant, ["genus", "epithet"]).map(
                (grexOnDate, idx) => {
                  return (
                    <G
                      key={`${idx}-${grexOnDate.id}`}
                      grex={grexOnDate}
                      hideReg
                    />
                  );
                }
              )}
            </div>
          </details>
        </section>
      )}

      <section>
        <details>
          <summary>Raw Data</summary>
          <div>
            <table>
              <tbody>
                {Object.keys(grex).map((k) => {
                  const field = grex[k];
                  let href;
                  let rel;
                  let target;

                  switch (k) {
                    case "id":
                      href = `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${field}`;
                      rel = "noopener noreferrer";
                      target = "_blank";
                      break;
                    case "genus":
                      href = `/?genus="${field}"`;
                      break;
                    case "epithet":
                      href = `/?epithet="${field}"`;
                      break;
                    case "registrant_name":
                      href = `/?registrant_name="${field}"`;
                      break;
                    case "date_of_registration":
                      href = `/date/${field}`;
                      break;
                    case "seed_parent_genus":
                      href = `/?seed_parent_genus="${field}"`;
                      break;
                    case "seed_parent_epithet":
                      href = `/?seed_parent_epithet="${field}"`;
                      break;
                    case "pollen_parent_genus":
                      href = `/?pollen_parent_genus="${field}"`;
                      break;
                    case "pollen_parent_epithet":
                      href = `/?pollen_parent_epithet="${field}"`;
                      break;
                    default:
                      break;
                  }

                  return (
                    <tr key={k}>
                      <th>{k.replace(/_/g, " ")}:</th>
                      <td>
                        {href ? (
                          <Link href={href}>
                            <a target={target} rel={rel}>
                              {grex[k]}
                            </a>
                          </Link>
                        ) : (
                          grex[k]
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </Container>
  );
};

export default Grex;
