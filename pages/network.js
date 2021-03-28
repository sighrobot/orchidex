import { Container } from "components/container";
import React from "react";
import Viva from "vivagraphjs";
import { keyBy } from "lodash";

var graphGenerator = Viva.Graph.generator();
var graph = graphGenerator.grid(3, 3);
const json = require("../../../small.json").filter(
  (d) => d.genus === "Aerides" && d.epithet !== null
);
// const nodeMap = keyBy(json, (d) => `${d.genus} ${d.epithet}`);
const nodes = json.map((d) => ({
  ...d,
  _id: d.id,
  id: `${d.genus} ${d.epithet}`,
}));
// nodes.forEach((d) => graph.addNode(`${d.genus} ${d.epithet}`));

const links = [];

json.forEach((d, idx) => {
  const grex = `${d.genus} ${d.epithet}`;
  const seedParent = `${d.seed_parent_genus} ${d.seed_parent_epithet}`;
  const pollenParent = `${d.pollen_parent_genus} ${d.pollen_parent_epithet}`;

  if (seedParent !== "null null" && seedParent !== " ") {
    console.log(seedParent);
    links.push({
      source: seedParent,
      target: `${d.genus} ${d.epithet}`,
      id: `${idx}-seed`,
    });

    graph.addLink(seedParent, grex);
  }
  if (pollenParent !== "null null" && pollenParent !== " ") {
    console.log(pollenParent);
    links.push({
      source: pollenParent,
      target: `${d.genus} ${d.epithet}`,
      id: `${idx}-pollen`,
    });
    graph.addLink(pollenParent, grex);
  }
});

console.log({ nodes, links });

export default function Network() {
  React.useEffect(() => {
    const container = document.querySelector("#viz");
    let graphics = Viva.Graph.View.webglGraphics();
    let domLabels = generateDOMLabels(graph);
    var layout = Viva.Graph.Layout.forceDirected(graph, {
      springLength: 100,
      springCoeff: 0.0008,
      dragCoeff: 0.02,
      gravity: -1.2,
    });
    graphics.placeNode(function (ui, pos) {
      // This callback is called by the renderer before it updates
      // node coordinate. We can use it to update corresponding DOM
      // label position;

      // we create a copy of layout position
      var domPos = {
        x: pos.x,
        y: pos.y,
      };
      // And ask graphics to transform it to DOM coordinates:
      graphics.transformGraphToClientCoordinates(domPos);

      // then move corresponding dom label to its own position:
      var nodeId = ui.node.id;
      var labelStyle = domLabels[nodeId].style;
      labelStyle.left = domPos.x + "px";
      labelStyle.top = domPos.y + "px";
    });

    let renderer = Viva.Graph.View.renderer(graph, {
      layout,
      container,
      graphics,
    });

    renderer.run();

    function generateDOMLabels(graph) {
      // this will map node id into DOM element
      var labels = Object.create(null);
      graph.forEachNode(function (node) {
        var label = document.createElement("span");
        label.classList.add("node-label");
        label.innerText = node.id;
        labels[node.id] = label;
        container.appendChild(label);
      });
      // NOTE: If your graph changes over time you will need to
      // monitor graph changes and update DOM elements accordingly
      return labels;
    }
  }, []);

  return (
    <Container title="Network | Orchidex">
      <h2>Network</h2>
      <div style={{ width: "800px", height: "800px" }} id="viz" />
    </Container>
  );
}
