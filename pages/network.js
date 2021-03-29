import { Container } from "components/container";
import React from "react";
import { keyBy } from "lodash";
import Head from "next/head";

const json = require("../../../small.json").filter(
  (d) => d.genus === "Aerides" && d.epithet !== null
);
// const nodeMap = keyBy(json, (d) => `${d.genus} ${d.epithet}`);
const nodeMap = { "null null": { id: "null null" } };
const links = [];

json.forEach((d) => {
  const grex = `${d.genus} ${d.epithet}`;
  const seedParent = `${d.seed_parent_genus} ${d.seed_parent_epithet}`;
  const pollenParent = `${d.pollen_parent_genus} ${d.pollen_parent_epithet}`;

  if (!nodeMap[grex]) {
    nodeMap[grex] = {
      id: grex,
      genus: d.genus,
      seedParent,
      pollenParent,
      path: "path",
    };
  }

  if (!nodeMap[seedParent]) {
    nodeMap[seedParent] = {
      id: seedParent,
      genus: d.seed_parent_genus,
      seedParent: "null null",
      pollenParent: "null null",
      path: "path",
    };
  }

  if (!nodeMap[pollenParent]) {
    nodeMap[pollenParent] = {
      id: pollenParent,
      genus: d.pollen_parent_genus,
      seedParent: "null null",
      pollenParent: "null null",
      path: "path",
    };
  }

  links.push({ source: seedParent, target: grex });
  links.push({ source: pollenParent, target: grex });
});

Object.keys(nodeMap).forEach((name) => {
  const g = nodeMap[name];
  let seedParent = g.seedParent;
  let count = 1;

  while (seedParent) {
    count++;
    if (nodeMap[seedParent]) {
      seedParent = nodeMap[seedParent].seedParent;
    } else {
      seedParent = null;
    }
  }

  nodeMap[name].level = count;
});

// json.forEach((d, idx) => {
//   const grex = `${d.genus} ${d.epithet}`;
//   const seedParent = `${d.seed_parent_genus} ${d.seed_parent_epithet}`;
//   const pollenParent = `${d.pollen_parent_genus} ${d.pollen_parent_epithet}`;

//   if (seedParent !== "null null") {
//     links.push({
//       source: seedParent,
//       target: grex,
//       id: `${idx}-seed`,
//     });
//   }

//   // const isSpecies =
//   // d.seed_parent_epithet[0] === d.seed_parent_epithet[0].toLowerCase();
//   // true;

//   // graph.addLink(isSpecies ? seedParent : seedParent + idx, grex);
//   if (!nodeMap[seedParent] && seedParent !== "null null") {
//     nodes.push({
//       id: seedParent,
//       genus: d.seed_parent_genus,
//       epithet: d.seed_parent_epithet,
//       value: 1,
//     });
//   }

//   if (!nodeMap[pollenParent] && pollenParent !== "null null") {
//     nodes.push({
//       id: pollenParent,
//       genus: d.pollen_parent_genus,
//       epithet: d.pollen_parent_epithet,
//       value: 1,
//     });
//   }

//   if (pollenParent !== "null null") {
//     links.push({
//       source: pollenParent,
//       target: grex,
//       id: `${idx}-pollen`,
//     });
//   }

//   // const isSpecies =
//   // d.pollen_parent_epithet[0] === d.pollen_parent_epithet[0].toLowerCase();
//   // true;
//   // graph.addLink(isSpecies ? pollenParent : pollenParent + idx, grex);
//   // }
// });

export default function Network() {
  React.useEffect(() => {
    // graph config
    const NODE_REL_SIZE = 1;
    const graph = ForceGraph3D()
      .dagMode("td")
      .dagLevelDistance(25)
      .backgroundColor("#bcebfb")
      .linkColor(() => "rgba(0, 0, 0,0.5)")
      .nodeRelSize(NODE_REL_SIZE)
      // .nodeId("id")
      // .nodeVal("level")
      .nodeLabel("path")
      .nodeAutoColorBy("genus")
      .nodeOpacity(0.9)
      // .linkDirectionalParticles(10)
      // .linkDirectionalParticleWidth(0.1)
      // .linkDirectionalParticleSpeed(0.01)
      .d3Force(
        "collision",
        d3.forceCollide((node) => NODE_REL_SIZE)
      )
      .d3VelocityDecay(0.3);

    // Decrease repel intensity
    graph.d3Force("charge").strength(-15);

    graph(document.getElementById("viz")).graphData({
      // nodes: [
      //   { path: "1/2", level: 1, leaf: "2", parent: "1" },
      //   { path: "1/2/3", level: 2, leaf: "3", parent: "1/2" },
      //   { path: "a/b", level: 1, leaf: "b", parent: "a" },
      //   { path: "a/b/c", level: 2, leaf: "c", parent: "a/b" },
      // ],
      nodes: Object.keys(nodeMap).map((k) => nodeMap[k]),
      // links: [
      //   { target: "1/2/3", source: "1/2" },
      //   { target: "a/b/c", source: "a/b" },
      //   { target: "a/b/c", source: "1/2" },
      // ],
      links,
    });
  }, []);

  return (
    <Container title="Network | Orchidex">
      <Head>
        <script src="//unpkg.com/d3-octree"></script>
        <script src="//unpkg.com/d3-force-3d"></script>
        <script src="//unpkg.com/3d-force-graph"></script>
      </Head>
      <h2>Network</h2>
      <div style={{ width: "800px", height: "800px" }} id="viz" />
    </Container>
  );
}
