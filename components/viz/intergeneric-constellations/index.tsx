'use client';

import React from 'react';

// let capture = true;

let myGraph;

// TODO: fetch dynamically
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

export const IntergenericConstellationsViz = () => {
  const cyContainer = React.useRef<HTMLDivElement>(null);

  const [data, setData] = React.useState<{ edge: string }[]>([]);
  const [genera, setGenera] = React.useState<string[]>([]);

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

  const generaSet = React.useMemo(() => new Set(genera), [genera]);

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
  }, [data, genera]);

  const nodes = React.useMemo(() => {
    return Array.from(idSet).map((id: string) => ({
      id,
      isTop: topSet.has(id),
      isNatural: generaSet.has(id),
      count: topSet.has(id) ? top.find((t) => t.genus === id)?.c : undefined,
    }));
  }, [idSet, generaSet]);

  const links = React.useMemo(() => {
    const linkList: any[] = [];
    data.forEach((d) => {
      const [source, target] = d.edge.split('-');
      if (source && target) {
        linkList.push({ source, target });
      }
    });
    return linkList;
  }, [data]);

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
      .graphData({ nodes, links })
      .nodeColor((n) => (n.isNatural ? '#ffff81' : 'white'))
      .nodeOpacity(1)
      .nodeLabel((n) => n.id)
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
      .dagMode('td')
      .backgroundColor('#00000000')
      .dagLevelDistance(5)
      .showNavInfo(false)
      .d3AlphaDecay(0.001)
      .d3VelocityDecay(0.4)
      .dagNodeFilter((n) => !n.isNatural);

    myGraph.d3Force('link').distance((l) => {
      return generaSet.has(l.source) || topSet.has(l.source) ? 20 : 300;
    });
    myGraph.d3Force('charge').strength((n) => {
      return n.isNatural || n.isTop ? -100 : -30;
    });
  }, [nodes, links, generaSet]);

  return (
    <div style={{ width: '100%', height: '1200px', border: '1px solid red' }}>
      {/* <button
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
      </button> */}

      <style>{`canvas {width: 300px; height: 300px; border: 1px solid pink;}`}</style>
      <div ref={cyContainer} />
    </div>
  );
};
