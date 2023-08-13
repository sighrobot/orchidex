'use client';

import React from 'react';
import embed, { VisualizationSpec } from 'vega-embed';

import style from './style.module.scss';

export default function VegaLite({
  id,
  spec,
  height,
}: {
  id: string;
  spec: VisualizationSpec;
  height: number;
}) {
  React.useEffect(() => {
    const viz = embed(`#${id}`, spec, { actions: false, renderer: 'svg' });

    return () => {
      viz.then((result) => result.view.finalize());
    };
  }, [id, spec]);

  return (
    <div className={style.vegaLite} style={{ height: `${height}px` }}>
      <div id={id} />
    </div>
  );
}
