'use client';

import React from 'react';

import { DARK_COLORS } from 'lib/theme';

import { MIN_GAPPED, type Layout } from './layout';
import style from './style.module.scss';

// Drawing helpers shared by the parentage treemaps: one genus's orchids, and
// every genus.

// The original chart's color: orchid, from a quarter to fully opaque as a
// cell's value grows, and a faint gray for cells with none.
const ORCHID = [218, 112, 214];
const MIN_ALPHA = 0.25;
const NONE_ALPHA = 0.1;
// Steps of the color scale, so cells can be filled a color at a time.
export const LEVELS = 48;
// How far cells that aren't highlighted are mixed toward the page.
const FADE = { light: 0.75, dark: 0.7 };
export const SLIDER_STEPS = 200;

export const fmt = new Intl.NumberFormat('en-US');
export const plural = (n: number, one: string, many: string) =>
  `${fmt.format(n)} ${n === 1 ? one : many}`;

const rgbOf = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, k) => Math.round(v + (b[k] - v) * t));
const css = (c: number[]) => `rgb(${c.join(',')})`;
const luminance = ([r, g, b]: number[]) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// WCAG relative luminance, for contrast with label text.
const relativeLuminance = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// In dark mode labels are always light, so the scale stops short of full
// orchid: at the brightest shade with about 4:1 contrast with white text.
// The whole ramp is compressed to fit, so every step stays distinct.
const DARK_MAX_LUMINANCE = 0.21;

// The most orchid can be mixed into `bg` and stay no brighter than `max`.
const maxMix = (bg: number[], max: number) => {
  if (relativeLuminance(ORCHID) <= max) return 1;
  let lo = 0;
  let hi = 1;
  for (let step = 0; step < 20; step++) {
    const mid = (lo + hi) / 2;
    if (relativeLuminance(mix(bg, ORCHID, mid)) <= max) lo = mid;
    else hi = mid;
  }
  return lo;
};

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// The slider moves on a log scale, so small thresholds are as easy to pick as
// large ones. Position 0 is no threshold.
export const sliderToValue = (pos: number, max: number) =>
  pos <= 0
    ? 0
    : Math.max(
        1,
        Math.round(Math.expm1((pos / SLIDER_STEPS) * Math.log1p(max))),
      );
export const valueToSlider = (v: number, max: number) =>
  v <= 0 || max <= 0
    ? 0
    : Math.round((Math.log1p(v) / Math.log1p(max)) * SLIDER_STEPS);

export type Palette = {
  fill: string[];
  faded: string[];
  label: string[];
  fadedLabel: string[];
  ink: string;
  dark: boolean;
};

// The fills and label colors for each step of the scale, in this theme.
export function usePalette(theme: 'light' | 'dark'): Palette {
  return React.useMemo(() => {
    const dark = theme === 'dark';
    const paper = dark ? DARK_COLORS.bg : '#ffffff';
    const ink = dark ? DARK_COLORS.fg : '#000000';
    const bg = rgbOf(paper);
    const fg = rgbOf(ink);
    const fade = dark ? FADE.dark : FADE.light;
    const top = dark ? maxMix(bg, DARK_MAX_LUMINANCE) : 1;
    const levels = Array.from({ length: LEVELS }, (_, l) =>
      mix(bg, ORCHID, MIN_ALPHA + ((top - MIN_ALPHA) * l) / (LEVELS - 1)),
    );
    const none = mix(bg, fg, NONE_ALPHA);
    // Index 0 is "none"; 1..LEVELS climb the scale.
    const fills = [none, ...levels];
    return {
      fill: fills.map(css),
      faded: fills.map((c) => css(mix(c, bg, fade))),
      // Labels: always light in dark mode; otherwise dark on light cells
      // and light on dark ones.
      label: fills.map((c) =>
        !dark && luminance(c) > 0.45
          ? 'rgba(0,0,0,0.85)'
          : 'rgba(255,255,255,0.9)',
      ),
      fadedLabel: fills.map((c) =>
        !dark && luminance(mix(c, bg, fade)) > 0.45
          ? 'rgba(0,0,0,0.4)'
          : 'rgba(255,255,255,0.4)',
      ),
      ink,
      dark,
    };
  }, [theme]);
}

// The color step for `v`, out of `max`. The scale runs on the square root of
// the value, so the many cells with a few dozen still differ from those with
// one.
export const levelFor = (v: number, max: number) =>
  v <= 0
    ? 0
    : 1 +
      Math.round(Math.sqrt(Math.min(v, max) / Math.max(max, 1)) * (LEVELS - 1));

// Snaps cell `k` to device pixels and leaves a 1px gap on its right and
// bottom, unless it's too small to spare one.
export const cellBox = (L: Layout, k: number, dpr: number) => {
  const snap = (n: number) => Math.round(n * dpr) / dpr;
  const x0 = snap(L.x[k]);
  const y0 = snap(L.y[k]);
  let x1 = snap(L.x[k] + L.w[k]);
  let y1 = snap(L.y[k] + L.h[k]);
  if (x1 - x0 >= MIN_GAPPED && y1 - y0 >= MIN_GAPPED) {
    x1 -= 1;
    y1 -= 1;
  }
  return {
    x: x0,
    y: y0,
    w: Math.max(1 / dpr, x1 - x0),
    h: Math.max(1 / dpr, y1 - y0),
  };
};

// The cell of `L` under (px, py), or -1.
export const nodeAt = (L: Layout, px: number, py: number) => {
  for (let k = 0; k < L.item.length; k++) {
    if (
      px >= L.x[k] &&
      px < L.x[k] + L.w[k] &&
      py >= L.y[k] &&
      py < L.y[k] + L.h[k]
    ) {
      return k;
    }
  }
  return -1;
};

// The diagonal hatching that marks a group, made once per theme and pixel
// ratio.
export function makeHatch() {
  let cached: { key: string; p: CanvasPattern | null } = { key: '', p: null };
  return (ctx: CanvasRenderingContext2D, dark: boolean, dpr: number) => {
    const key = `${dark ? 'dark' : 'light'}-${dpr}`;
    if (cached.key === key) return cached.p;
    const size = Math.round(6 * dpr);
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    const t = tile.getContext('2d');
    if (!t) return null;
    t.strokeStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)';
    t.lineWidth = dpr;
    t.beginPath();
    for (const o of [-size, 0, size]) {
      t.moveTo(o, size);
      t.lineTo(o + size, 0);
    }
    t.stroke();
    const p = ctx.createPattern(tile, 'repeat');
    p?.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]));
    cached = { key, p };
    return p;
  };
}

// `text` cut short with an ellipsis to fit `room` pixels, or '' when not
// even a few letters fit.
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  room: number,
) {
  if (room <= 0) return '';
  if (ctx.measureText(text).width <= room) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid).trimEnd() + '…').width <= room) {
      lo = mid;
    } else hi = mid - 1;
  }
  // A stub of two or three letters says little and clutters small cells.
  return lo >= Math.min(4, text.length - 1)
    ? text.slice(0, lo).trimEnd() + '…'
    : '';
}

// The first of `options` that fits `room` pixels whole, or ''.
export function firstFit(
  ctx: CanvasRenderingContext2D,
  room: number,
  options: string[],
) {
  return options.find((t) => ctx.measureText(t).width <= room) ?? '';
}

export function Segmented<T extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
}: {
  label: string;
  // Name the group for screen readers only, when its options speak for
  // themselves.
  hideLabel?: boolean;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const id = React.useId();
  return (
    <div className={style.field}>
      {!hideLabel && <span id={id}>{label}</span>}
      <div
        role='radiogroup'
        aria-labelledby={hideLabel ? undefined : id}
        aria-label={hideLabel ? label : undefined}
        className={style.segmented}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type='button'
            role='radio'
            aria-checked={value === o.value}
            title={o.title}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
