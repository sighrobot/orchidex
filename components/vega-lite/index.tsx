'use client';

import React from 'react';
import embed, { VisualizationSpec } from 'vega-embed';

import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';

import style from './style.module.scss';

// Matches --fg in app/globals.css (dark).
const DARK_FG = '#ececec';
const DARK_FG_RGB = '236, 236, 236';

// Vega's defaults (black text, grey axes) for a dark page.
const DARK_CONFIG = {
  axis: {
    labelColor: DARK_FG,
    titleColor: DARK_FG,
    domainColor: 'rgba(236, 236, 236, 0.4)',
    tickColor: 'rgba(236, 236, 236, 0.4)',
    gridColor: 'rgba(236, 236, 236, 0.1)',
  },
  legend: { labelColor: DARK_FG, titleColor: DARK_FG },
  title: { color: DARK_FG, subtitleColor: DARK_FG },
  text: { color: DARK_FG },
};

// Specs hard-code black in places (bar fills, tick colours). In dark mode,
// swap black and black-based rgba() for the light text colour. Data is left
// alone.
const toDark = (node: unknown): unknown => {
  if (typeof node === 'string') {
    if (node === 'black') return DARK_FG;
    return node.replace(/rgba\(0,\s*0,\s*0,/g, `rgba(${DARK_FG_RGB},`);
  }
  if (Array.isArray(node)) return node.map(toDark);
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        key === 'data' || key === 'values' ? value : toDark(value),
      ])
    );
  }
  return node;
};

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
  const theme = useResolvedTheme();

  React.useEffect(() => {
    const isDark = theme === 'dark';
    const viz = embed(
      `#${id}`,
      isDark ? (toDark(spec) as VisualizationSpec) : spec,
      {
        actions: false,
        renderer,
        ...(isDark && { config: DARK_CONFIG }),
      }
    );

    return () => {
      viz.then((result) => result.view.finalize());
    };
  }, [id, renderer, spec, theme]);

  return (
    <div className={style.vegaLite} style={{ height: `${height}px` }}>
      <div id={id} />
    </div>
  );
}
