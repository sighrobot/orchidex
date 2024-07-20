'use client';

import React from 'react';
import embed, { VisualizationSpec } from 'vega-embed';

import style from './style.module.scss';

export default function VegaLite({
  id,
  spec,
  height,
  renderer = 'svg',
}: {
  id: string;
  spec: VisualizationSpec;
  height: number;
  renderer?: 'svg' | 'canvas';
}) {
  React.useEffect(() => {
    const viz = embed(`#${id}`, spec, { actions: false, renderer });

    return () => {
      viz.then((result) => result.view.finalize());
    };
  }, [id, renderer, spec]);

  return (
    <div className={style.vegaLite} style={{ height: `${height}px` }}>
      <div id={id} />
    </div>
  );
}
