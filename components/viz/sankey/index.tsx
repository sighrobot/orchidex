'use client';

import React from 'react';
// import { ResponsiveSankey } from '@nivo/sankey';

// import style from './style.module.scss';

// import { GraphVizComponent } from '@graph-viz/react';

let capture = true;
let myGraph;
const top = [
  {
    genus: 'Phalaenopsis',
    c: 40477,
  },
  {
    genus: 'Paphiopedilum',
    c: 30602,
  },
  {
    genus: 'Cattleya',
    c: 19687,
  },
  {
    genus: 'Dendrobium',
    c: 19574,
  },
  {
    genus: 'Cymbidium',
    c: 18430,
  },
  {
    genus: 'Rhyncholaeliocattleya',
    c: 16434,
  },
  {
    genus: 'Oncidium',
    c: 8616,
  },
  {
    genus: 'Vanda',
    c: 5604,
  },
  {
    genus: 'Rhyncattleanthe',
    c: 3571,
  },
  {
    genus: 'Cattlianthe',
    c: 3126,
  },
  {
    genus: 'Bulbophyllum',
    c: 2806,
  },
  {
    genus: 'Epidendrum',
    c: 2800,
  },
  {
    genus: 'Masdevallia',
    c: 2372,
  },
  {
    genus: 'Miltoniopsis',
    c: 2008,
  },
  {
    genus: 'Phragmipedium',
    c: 1650,
  },
  {
    genus: 'Tolumnia',
    c: 1581,
  },
  {
    genus: 'Stelis',
    c: 1341,
  },
  {
    genus: 'Lepanthes',
    c: 1228,
  },
  {
    genus: 'Sarcochilus',
    c: 1139,
  },
  {
    genus: 'Papilionanda',
    c: 1092,
  },
  {
    genus: 'Habenaria',
    c: 1057,
  },
  {
    genus: 'Catasetum',
    c: 1003,
  },
  {
    genus: 'Lycaste',
    c: 861,
  },
  {
    genus: 'Calanthe',
    c: 808,
  },
  {
    genus: 'Oncidopsis',
    c: 792,
  },
  {
    genus: 'Brassocattleya',
    c: 783,
  },
  {
    genus: 'Laeliocattleya',
    c: 772,
  },
  {
    genus: 'Coelogyne',
    c: 762,
  },
  {
    genus: 'Disa',
    c: 721,
  },
  {
    genus: 'Vandachostylis',
    c: 706,
  },
];

const topSet = new Set(top.map((t) => t.genus));

export const Sankey = () => {
  const cyContainer = React.useRef<HTMLDivElement>(null);

  const [data, setData] = React.useState<{ edge: string }[]>([]);
  const [genera, setGenera] = React.useState([]);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/treemap').then((fetched) =>
      fetched.json().then((rows) => {
        setData(rows);
      })
    );

    fetch('http://localhost:3000/api/wcvp/genera').then((fetched) =>
      fetched.json().then((rows) => {
        setGenera(rows.map((r) => r.genus));
      })
    );
  }, []);
  const generaSet = new Set(genera);
  const idSet = React.useMemo(() => {
    const set = new Set();
    data.forEach((d) => {
      const [source, target] = d.edge.split('-');
      if (source && target) {
        set.add(source);
        set.add(target);
      }
    });
    genera.forEach((g) => {
      set.add(g);
    });
    return set;
  }, [data.length]);

  const nodes = React.useMemo(() => {
    return Array.from(idSet).map((id) => ({
      id,
      isTop: topSet.has(id),
      isNatural: generaSet.has(id),
      count: topSet.has(id) ? top.find((t) => t.genus === id)?.c : undefined,
      // color: generaSet.has(id) ? 'red' : 'white',
    }));
  }, [idSet]);

  const links = React.useMemo(() => {
    const linkList: any[] = [];
    data.forEach((d) => {
      const [source, target] = d.edge.split('-');
      if (source && target) {
        linkList.push({
          source,
          target,
        });
      }
    });
    return linkList;
  }, [data]);

  // console.log({ nodes, links });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const ForceGraph3D = require('3d-force-graph').default;
      myGraph = ForceGraph3D();
    }
    myGraph(cyContainer.current ?? document.body, {
      rendererConfig: { preserveDrawingBuffer: true },
    })
      .width(1000)
      .height(1000)
      .graphData({
        nodes: nodes.map((n) => {
          return { ...n };
        }),
        links: links.map((l) => {
          return l;
        }),
      })
      // .nodeVal((n) => 100)
      .nodeColor((n) => (n.isNatural ? '#ffff81' : 'white'))
      // .nodeColor((n) => 'white')
      .nodeOpacity(1)
      .nodeLabel((n) => n.id)
      // .nodeRelSize(10)
      // .nodeVal((n) => (n.isTop ? 10000 : n.isNatural ? 40 : 20))
      .nodeVal((n) => {
        const min = 1000;
        const sizeRange = 10000 - min;
        return n.count
          ? (n.count / top[0].c) * sizeRange + min
          : n.isNatural
          ? 500
          : 120;
      })
      .nodeResolution(16)
      .linkColor(() => 'white')
      .linkWidth(30)
      // .linkOpacity(1)
      .dagMode('td')
      .backgroundColor('#00000000')
      .dagLevelDistance(5)
      .showNavInfo(false)
      .d3AlphaDecay(0.001)
      .d3VelocityDecay(0.4)
      .dagNodeFilter((n) => !n.isNatural);

    myGraph.d3Force('link').distance((l) => {
      // console.log(l);
      return generaSet.has(l.source) || topSet.has(l.source) ? 20 : 300;
    });
    myGraph.d3Force('charge').strength((n) => {
      // console.log(l);
      return n.isNatural || n.isTop ? -100 : -30;
    });
    console.log(myGraph.renderer());
  }, [cyContainer.current, nodes, links]);

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
    <div style={{ width: '100%', height: '1200px', border: '1px solid red' }}>
      <button
        onClick={() => {
          capture = true;
          function render() {
            myGraph.renderer().render(myGraph.scene(), myGraph.camera());

            if (capture) {
              capture = false;
              document.querySelector('canvas').toBlob((blob) => {
                const newImg = document.createElement('img');
                const url = URL.createObjectURL(blob);

                newImg.src = url;
                document.body.appendChild(newImg);
              });
            }

            requestAnimationFrame(render);
          }
          requestAnimationFrame(render);
        }}
      >
        a
      </button>
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
      <style>{`canvas {width: 300px; height: 300px; border: 1px solid pink;}`}</style>
      <div ref={cyContainer} />
    </div>
  );
};
