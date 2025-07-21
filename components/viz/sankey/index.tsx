'use client';

import React from 'react';
// import { ResponsiveSankey } from '@nivo/sankey';

// import style from './style.module.scss';
import ForceGraph3D from '3d-force-graph';
// import { GraphVizComponent } from '@graph-viz/react';

const top = [
  'Phalaenopsis',
  'Paphiopedilum',
  'Cattleya',
  'Dendrobium',
  'Cymbidium',
  'Rhyncholaeliocattleya',
  'Oncidium',
  'Vanda',
  'Rhyncattleanthe',
  'Cattlianthe',
  'Bulbophyllum',
  'Epidendrum',
  'Masdevallia',
  'Miltoniopsis',
  'Phragmipedium',
];
const topColors = ['red', 'blue', 'green', 'yellow', 'pink', 'cyan', 'orange', 'purple', 'brown', 'gray'];

let myGraph = ForceGraph3D();

export default function Sankey() {
  const cyContainer = React.useRef(null);

  const [data, setData] = React.useState<{ edge: string }[]>([]);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/treemap').then((fetched) =>
      fetched.json().then((rows) => {
        setData(rows);
      })
    );
  }, []);

  const idSet = React.useMemo(() => {
    const set = new Set();
    data.forEach((d) => {
      const [source, target] = d.edge.split('-');
      if (source && target) {
        set.add(source);
        set.add(target);
      }
    });
    return set;
  }, [data.length]);

  const nodes = React.useMemo(() => {
    return Array.from(idSet).map((id) => ({ id }));
  }, [idSet]);

  const links = React.useMemo(() => {
    const linkList: any[] = [];
    data.forEach((d) => {
      const [source, target] = d.edge.split('-');
      if (source && target) {
        linkList.push({
          source,
          target,
          color: 'black',
          label: target[0] === '' ? target : undefined,
        });
      }
    });
    return linkList;
  }, [data]);

  console.log({ nodes, links });

  React.useEffect(() => {
    myGraph(cyContainer.current ?? document.body)
      .graphData({
        nodes: nodes.map((n) => {
          const color = 'blue'

          return { ...n, color };
        }),
        links: links.map((l) => {
          return l;
        }),
      })
      .nodeVal((n) => 100)
      .nodeLabel((n) => n.id)
      .nodeRelSize(2)
      .linkColor(() => 'black')
      .dagMode('td')
      .backgroundColor('white')
      .dagLevelDistance(50);
  }, [cyContainer, links]);

  // const viz = React.useMemo(() => {
  //   if (nodes.length === 0 || links.length === 0) {
  //     return null;
  //   }
  //   return (
  //     <ResponsiveSankey
  //       data={{ nodes, links }}
  //       // margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
  //       align='end'
  //       nodeOpacity={0}
  //       // nodeHoverOthsersOpacity={0.35}
  //       // nodeThickness={18}
  //       nodeSpacing={0}
  //       // nodeBorderWidth={5}
  //       label={(d) => d.id}
  //       layout='vertical'
  //       // nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
  //       // nodeBorderRadius={10}
  //       // linkOpacity={0.5}
  //       // linkHoverOthersOpacity={0.1}
  //       // linkContract={3}
  //       animate={false}
  //       // isInteractive={false}
  //       enableLinkGradient={false}
  //       // labelPosition='outside'
  //       // labelOrientation='vertical'
  //       // labelPadding={16}
  //     />
  //   );
  // }, [nodes, links]);

  return (
    <div  style={{ width: '100%', height: '800px', border: '1px solid black' }}>
      {/* <GraphVizComponent
        nodes={nodes.map((n, a, b) => {
          return {
            id: n?.id ?? '',
            absoluteSize: top.includes(n.id) ? 100 : 10,
            displayGroupIds: [],
            fill: top.includes(n.id) ? topColors[top.indexOf(n.id)] : 'black',
          };
        })}
        config={{ links: { labelScale: 100 } }}
        links={links}
        groups={[]}
      /> */}
      {/* {viz} */}
      <div ref={cyContainer} style={{ width: '100%', height: '100%',  }}/>
    </div>
  );
}
