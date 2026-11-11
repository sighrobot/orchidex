'use client';

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';
import { DARK_COLORS } from 'lib/theme';

import type { GenusDominanceData } from 'lib/fetchers/genus-dominance';

import style from './style.module.scss';

// The original chart's colours, in its order (royalblue appears twice there
// too). Each genus takes the colour at its all-time rank, cycling, so it
// keeps its colour however the chart is zoomed or labelled.
const PALETTE = [
  '#8a3ffc',
  '#33b1ff',
  '#007d79',
  '#ff7eb6',
  '#fa4d56',
  '#6fdc8c',
  '#4589ff',
  '#d12771',
  '#ffa500',
  '#40e0d0',
  '#08bdba',
  '#bae6ff',
  '#ee82ee',
  '#d4bbff',
  '#4169e1',
  '#4169e1',
  '#663399',
  '#a96af7',
];

// The right margin is sized to fit the genus labels; see drawBase.
const MARGIN = { top: 8, bottom: 26, left: 0 };
const LABEL_OFFSET = 17;
const LABEL_HEIGHT = 13;
const MIN_YEARS = 3;
// How far the smooth edge must pass a year before the drawn edge follows:
// three quarters of a year, or this many pixels when years are thin.
const SNAP_HYSTERESIS = 0.75;
const SNAP_HYSTERESIS_PX = 6;
const MIN_SHARE = 0.001;

type LabelMode = 'all' | 'current';
type View = { x0: number; x1: number; y0: number; y1: number };
type Hover = { seg: number; x: number; y: number } | null;

// Data laid out for drawing: one segment per genus per year, in typed arrays,
// indexed by year (for hit testing) and by colour (to fill in few batches).
function prepare({ start, end, genera, cells }: GenusDominanceData) {
  const nYears = Math.max(0, end - start + 1);
  const n = cells.length / 3;

  const segGenus = new Int32Array(n);
  const segYear = new Int32Array(n);
  const segCount = new Int32Array(n);
  const segY0 = new Float64Array(n);
  const segY1 = new Float64Array(n);
  const yearOffset = new Int32Array(nYears + 1);
  const yearTotal = new Int32Array(nYears);

  // Like the original chart, stack genera alphabetically by abbreviation:
  // A at the top, Z at the bottom.
  const stackPos = new Int32Array(genera.length);
  genera
    .map((g, i) => i)
    .sort((a, b) =>
      genera[a].abbr < genera[b].abbr
        ? 1
        : genera[a].abbr > genera[b].abbr
          ? -1
          : a - b,
    )
    .forEach((g, pos) => (stackPos[g] = pos));

  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) =>
      cells[a * 3 + 1] - cells[b * 3 + 1] ||
      stackPos[cells[a * 3]] - stackPos[cells[b * 3]],
  );

  for (let i = 0; i < n; i++) {
    const c = order[i] * 3;
    segGenus[i] = cells[c];
    segYear[i] = cells[c + 1];
    segCount[i] = cells[c + 2];
    yearOffset[segYear[i] + 1]++;
    yearTotal[segYear[i]] += segCount[i];
  }
  for (let y = 0; y < nYears; y++) yearOffset[y + 1] += yearOffset[y];

  // Stack each year bottom-up.
  for (let y = 0; y < nYears; y++) {
    let acc = 0;
    const total = yearTotal[y] || 1;
    for (let i = yearOffset[y]; i < yearOffset[y + 1]; i++) {
      segY0[i] = acc / total;
      acc += segCount[i];
      segY1[i] = acc / total;
    }
  }

  const group = (keyOf: (i: number) => number, size: number) => {
    const offset = new Int32Array(size + 1);
    for (let i = 0; i < n; i++) offset[keyOf(i) + 1]++;
    for (let k = 0; k < size; k++) offset[k + 1] += offset[k];
    const items = new Int32Array(n);
    const fill = offset.slice(0, size);
    for (let i = 0; i < n; i++) items[fill[keyOf(i)]++] = i;
    return { offset, items };
  };

  const byGenus = group((i) => segGenus[i], genera.length);
  const byColor = group((i) => segGenus[i] % PALETTE.length, PALETTE.length);

  // Top genera in the latest year, for the "current year" labels.
  const latest: number[] = [];
  if (nYears) {
    for (let i = yearOffset[nYears - 1]; i < yearOffset[nYears]; i++) {
      latest.push(i);
    }
    latest.sort((a, b) => segCount[b] - segCount[a]);
  }
  const latestRanking = latest.map((i) => segGenus[i]);

  return {
    nYears,
    segGenus,
    segYear,
    segCount,
    segY0,
    segY1,
    yearOffset,
    yearTotal,
    byGenus,
    byColor,
    latestRanking,
    stackPos,
  };
}

type Prepared = ReturnType<typeof prepare>;

// The segment for genus `g` in year `y`, or -1. Segments within a year are
// sorted by stack position.
function findSegment(p: Prepared, y: number, g: number) {
  let lo = p.yearOffset[y];
  let hi = p.yearOffset[y + 1] - 1;
  const target = p.stackPos[g];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const pos = p.stackPos[p.segGenus[mid]];
    if (pos === target) return mid;
    if (pos < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// The segment covering share `f` in year `y`, or -1.
function segmentAt(p: Prepared, y: number, f: number) {
  let lo = p.yearOffset[y];
  let hi = p.yearOffset[y + 1] - 1;
  if (lo > hi || f < 0 || f > 1) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (p.segY1[mid] <= f) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// Space between year bars, in CSS pixels, given each year's width. None when
// bars are thin enough that gaps would be noise; a single device pixel at the
// full view; widening to 3px as you zoom in. Whole device pixels, so every
// gap is the same width.
const barGap = (yearWidth: number, dpr: number) => {
  if (yearWidth < 4) return 0;
  const gap = clamp((yearWidth - 4) * 0.08, 1 / dpr, 3);
  return Math.max(1, Math.round(gap * dpr)) / dpr;
};

const fmt = new Intl.NumberFormat('en-US');

export default function GenusDominanceChart({
  data,
}: {
  data: GenusDominanceData;
}) {
  const { start, end, currentYear, genera } = data;
  const prepared = React.useMemo(() => prepare(data), [data]);
  const theme = useResolvedTheme();

  const [labelMode, setLabelMode] = React.useState<LabelMode>('all');
  const [zoomed, setZoomed] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const baseRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const rangeRef = React.useRef<HTMLSpanElement>(null);
  const hintRef = React.useRef<HTMLDivElement>(null);

  const full = React.useMemo<View>(
    () => ({ x0: start, x1: end + 1, y0: 0, y1: 1 }),
    [start, end],
  );
  const viewRef = React.useRef<View>(full);
  const hoverRef = React.useRef<Hover>(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const frameRef = React.useRef(0);
  const dirtyRef = React.useRef({ base: true, overlay: true });
  const rightRef = React.useRef(60);

  const ink = theme === 'dark' ? DARK_COLORS.fg : '#000000';
  const inkRgb = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
  const inkAlpha = (a: number) => `rgba(${inkRgb.join(',')},${a})`;

  // Everything draw() reads, so the stable callbacks below see fresh values.
  const stateRef = React.useRef({ prepared, labelMode, inkAlpha });
  stateRef.current = { prepared, labelMode, inkAlpha };

  // viewRef moves smoothly as you zoom and pan; what's drawn snaps to whole
  // years, so the edges always fall between bars and none are cut off.
  // Each edge has some hysteresis: it only moves once the smooth edge is
  // clearly past the next year, so a finger resting near a half-year doesn't
  // flip the range back and forth.
  const shownRef = React.useRef({ x0: full.x0, x1: full.x1 });
  const shownView = (): View => {
    const v = viewRef.current;
    const s = shownRef.current;
    const plotWidth = Math.max(
      1,
      sizeRef.current.width - MARGIN.left - rightRef.current,
    );
    const threshold = Math.max(
      SNAP_HYSTERESIS,
      (SNAP_HYSTERESIS_PX * (v.x1 - v.x0)) / plotWidth,
    );
    const snapEdge = (cur: number, edge: number) =>
      Math.abs(cur - edge) >= threshold ? Math.round(cur) : edge;
    let x0 = v.x0 <= full.x0 + 1e-9 ? full.x0 : snapEdge(v.x0, s.x0);
    let x1 = v.x1 >= full.x1 - 1e-9 ? full.x1 : snapEdge(v.x1, s.x1);
    const minSpan = Math.min(MIN_YEARS, full.x1 - full.x0);
    if (x1 - x0 < minSpan) {
      const mid = Math.round((v.x0 + v.x1) / 2 - minSpan / 2);
      x0 = mid;
      x1 = mid + minSpan;
    }
    x0 = clamp(x0, full.x0, full.x1 - minSpan);
    x1 = clamp(x1, x0 + minSpan, full.x1);
    shownRef.current = { x0, x1 };
    return { x0, x1, y0: v.y0, y1: v.y1 };
  };

  const plot = () => {
    const { width, height } = sizeRef.current;
    const left = MARGIN.left;
    const top = MARGIN.top;
    const w = Math.max(1, width - MARGIN.left - rightRef.current);
    const h = Math.max(1, height - MARGIN.top - MARGIN.bottom);
    const v = shownView();
    const kx = w / (v.x1 - v.x0);
    const ky = h / (v.y1 - v.y0);
    return {
      left,
      top,
      w,
      h,
      right: left + w,
      bottom: top + h,
      kx,
      ky,
      sx: (x: number) => left + (x - v.x0) * kx,
      sy: (y: number) => top + (v.y1 - y) * ky,
      wx: (px: number) => v.x0 + (px - left) / kx,
      wy: (py: number) => v.y1 - (py - top) / ky,
    };
  };

  const fontFamily = () =>
    containerRef.current
      ? getComputedStyle(containerRef.current).fontFamily
      : 'sans-serif';

  const drawBase = () => {
    const canvas = baseRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, dpr } = sizeRef.current;
    const { prepared: p, labelMode: mode, inkAlpha: ia } = stateRef.current;
    const v = shownView();
    const snap = (n: number) => Math.round(n * dpr) / dpr;
    const font = fontFamily();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!p.nYears) return;

    // Leave just enough room on the right for the widest label either label
    // mode could show, so switching modes doesn't resize the plot.
    ctx.font = `300 11px ${font}`;
    let widest = 0;
    for (const g of labelCandidates(p, 'all').concat(
      labelCandidates(p, 'current'),
    )) {
      widest = Math.max(widest, ctx.measureText(genera[g].abbr).width);
    }
    rightRef.current = Math.ceil(LABEL_OFFSET + widest + 2);
    const P = plot();

    // Visible years and their bar edges.
    const ya = clamp(Math.floor(v.x0 - start), 0, p.nYears - 1);
    const yb = clamp(Math.ceil(v.x1 - start) - 1, 0, p.nYears - 1);
    const gap = barGap(P.kx, dpr);
    const barX = new Float64Array(p.nYears);
    const barW = new Float64Array(p.nYears);
    for (let y = ya; y <= yb; y++) {
      const x0 = snap(P.sx(start + y));
      const x1 = snap(P.sx(start + y + 1)) - gap;
      barX[y] = x0;
      barW[y] = Math.max(1 / dpr, x1 - x0);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(P.left, P.top, P.w, P.h);
    ctx.clip();

    // One path and one fill per colour.
    const { offset, items } = p.byColor;
    for (let c = 0; c < PALETTE.length; c++) {
      ctx.fillStyle = PALETTE[c];
      ctx.beginPath();
      for (let k = offset[c]; k < offset[c + 1]; k++) {
        const i = items[k];
        const y = p.segYear[i];
        if (y < ya || y > yb) continue;
        const t = snap(P.sy(p.segY1[i]));
        const b = snap(P.sy(p.segY0[i]));
        if (b <= t || b < P.top || t > P.bottom) continue;
        ctx.rect(barX[y], t, barW[y], b - t);
      }
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = ia(0.75);
    ctx.strokeStyle = ia(0.5);
    ctx.lineWidth = 1;
    ctx.font = `300 11px ${font}`;

    // X axis: years.
    const steps = [1, 2, 5, 10, 20, 25, 50, 100];
    const xStep = steps.find((s) => s * P.kx >= 52) ?? 100;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    for (
      let year = Math.ceil((start + ya) / xStep) * xStep;
      year <= start + yb;
      year += xStep
    ) {
      const x = snap(P.sx(year + 0.5)) + 0.5 / dpr;
      const half = ctx.measureText(String(year)).width / 2;
      ctx.moveTo(x, P.bottom);
      ctx.lineTo(x, P.bottom + 5);
      ctx.fillText(String(year), Math.max(half, x), P.bottom + 8);
    }
    ctx.stroke();

    drawLabels(ctx, p, mode, P, yb, ia, font);
  };

  // The genera to label: the top ones all-time or in the latest year.
  const labelCandidates = (p: Prepared, mode: LabelMode) =>
    mode === 'all'
      ? genera.slice(0, 16).map((_, i) => i)
      : p.latestRanking.slice(0, 20);

  // Genus names down the right edge, beside their bands in the rightmost
  // visible year, nudged apart so they don't overlap.
  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    p: Prepared,
    mode: LabelMode,
    P: ReturnType<typeof plot>,
    year: number,
    ia: (a: number) => string,
    font: string,
  ) => {
    const candidates = labelCandidates(p, mode).slice(
      0,
      Math.floor(P.h / LABEL_HEIGHT),
    );

    const labels: { g: number; at: number; y: number }[] = [];
    for (const g of candidates) {
      const i = findSegment(p, year, g);
      if (i < 0) continue;
      const t = Math.max(P.top, P.sy(p.segY1[i]));
      const b = Math.min(P.bottom, P.sy(p.segY0[i]));
      if (b <= t) continue;
      labels.push({ g, at: (t + b) / 2, y: (t + b) / 2 });
    }
    if (!labels.length) return;

    labels.sort((a, b) => a.at - b.at);
    const first = P.top + LABEL_HEIGHT / 2;
    const last = P.bottom - LABEL_HEIGHT / 2;
    for (let i = 0; i < labels.length; i++) {
      const prev = i ? labels[i - 1].y + LABEL_HEIGHT : first;
      labels[i].y = Math.max(labels[i].at, prev);
    }
    for (let i = labels.length - 1; i >= 0; i--) {
      const next =
        i < labels.length - 1 ? labels[i + 1].y - LABEL_HEIGHT : last;
      labels[i].y = Math.min(labels[i].y, next);
    }

    const x = P.right;
    ctx.strokeStyle = ia(0.6);
    ctx.fillStyle = ia(0.9);
    ctx.font = `300 11px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    for (const l of labels) {
      ctx.moveTo(x + 1, l.at);
      ctx.lineTo(x + 5, l.at);
      ctx.lineTo(x + 11, l.y);
      ctx.lineTo(x + 14, l.y);
    }
    ctx.stroke();
    for (const l of labels) {
      ctx.fillText(genera[l.g].abbr, x + LABEL_OFFSET, l.y);
    }
  };

  const drawOverlay = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, dpr } = sizeRef.current;
    const { prepared: p, inkAlpha: ia } = stateRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const hover = hoverRef.current;
    const tip = tooltipRef.current;
    if (!hover) {
      if (tip) tip.style.visibility = 'hidden';
      return;
    }

    const P = plot();
    const v = shownView();
    const g = p.segGenus[hover.seg];
    const gap = barGap(P.kx, dpr);
    const snap = (n: number) => Math.round(n * dpr) / dpr;
    // The same edges as drawBase, so fills sit exactly over the bars. Thin
    // segments get a minimum height so they still show.
    const box = (i: number) => {
      const y = p.segYear[i];
      const x0 = snap(P.sx(start + y));
      const x1 = snap(P.sx(start + y + 1)) - gap;
      let t = snap(P.sy(p.segY1[i]));
      let b = snap(P.sy(p.segY0[i]));
      if (b - t < 2) {
        const mid = (t + b) / 2;
        t = mid - 1;
        b = mid + 1;
      }
      return { x0, t, w: Math.max(1 / dpr, x1 - x0), h: b - t };
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(P.left, P.top, P.w, P.h);
    ctx.clip();

    // Fill the genus in every visible year faintly, and the hovered bar solid.
    ctx.fillStyle = ia(0.4);
    ctx.beginPath();
    const { offset, items } = p.byGenus;
    for (let k = offset[g]; k < offset[g + 1]; k++) {
      const i = items[k];
      const year = start + p.segYear[i];
      if (year + 1 < v.x0 || year > v.x1 || i === hover.seg) continue;
      const r = box(i);
      ctx.rect(r.x0, r.t, r.w, r.h);
    }
    ctx.fill();

    const r = box(hover.seg);
    ctx.fillStyle = ia(1);
    ctx.fillRect(r.x0, r.t, r.w, r.h);
    ctx.restore();

    if (!tip) return;
    const genus = genera[g];
    const yi = p.segYear[hover.seg];
    const count = p.segCount[hover.seg];
    const total = p.yearTotal[yi];
    const set = (key: string, text: string) => {
      const el = tip.querySelector(`[data-k="${key}"]`);
      if (el) el.textContent = text;
    };
    set('name', genus.name);
    set('abbr', genus.abbr !== genus.name ? genus.abbr : '');
    set('year', String(start + yi));
    set('count', fmt.format(count));
    set(
      'share',
      `${((count / total) * 100).toFixed(count / total < 0.01 ? 2 : 1)}%`,
    );
    set('total', fmt.format(total));
    set('swatch', '');
    const swatch = tip.querySelector<HTMLElement>('[data-k="swatch"]');
    if (swatch) swatch.style.background = PALETTE[g % PALETTE.length];

    tip.style.visibility = 'visible';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const left = hover.x + 16 + tw > width ? hover.x - 16 - tw : hover.x + 16;
    const top = clamp(hover.y - th / 2, 0, Math.max(0, height - th));
    tip.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  };

  const schedule = (base: boolean) => {
    dirtyRef.current.overlay = true;
    if (base) dirtyRef.current.base = true;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const dirty = dirtyRef.current;
      if (dirty.base) drawBase();
      if (dirty.overlay) drawOverlay();
      dirtyRef.current = { base: false, overlay: false };
    });
  };

  const updateRange = () => {
    const v = shownView();
    const isZoomed = v.x1 - v.x0 < full.x1 - full.x0 || v.y1 - v.y0 < 1 - 1e-9;
    setZoomed(isZoomed);
    if (rangeRef.current) {
      const a = v.x0;
      const b = v.x1 - 1;
      const shares =
        v.y1 - v.y0 < 1 - 1e-9
          ? ` · ${(v.y0 * 100).toFixed(1)}–${(v.y1 * 100).toFixed(1)}%`
          : '';
      rangeRef.current.textContent = `${a}–${b}${shares}`;
    }
  };

  const setView = (next: View) => {
    const fw = full.x1 - full.x0;
    const xs = clamp(next.x1 - next.x0, Math.min(MIN_YEARS, fw), fw);
    const ys = clamp(next.y1 - next.y0, MIN_SHARE, 1);
    const x0 = clamp(next.x0, full.x0, full.x1 - xs);
    const y0 = clamp(next.y0, 0, 1 - ys);
    viewRef.current = { x0, x1: x0 + xs, y0, y1: y0 + ys };
    hoverRef.current = null;
    updateRange();
    schedule(true);
  };

  // Zoom by `fx`/`fy` (below 1 zooms in) keeping the point under (px, py).
  // Gestures work on the smooth view, not the snapped one, so a snap never
  // feeds back into the next step of a pinch or drag.
  const zoomAt = (fx: number, fy: number, px: number, py: number) => {
    const v = viewRef.current;
    const P = plot();
    const ax =
      v.x0 + ((clamp(px, P.left, P.right) - P.left) / P.w) * (v.x1 - v.x0);
    const ay = P.wy(clamp(py, P.top, P.bottom));
    setView({
      x0: ax - (ax - v.x0) * fx,
      x1: ax + (v.x1 - ax) * fx,
      y0: ay - (ay - v.y0) * fy,
      y1: ay + (v.y1 - ay) * fy,
    });
  };

  const panBy = (dx: number, dy: number) => {
    const v = viewRef.current;
    const P = plot();
    const wx = (dx / P.w) * (v.x1 - v.x0);
    const wy = dy / P.ky;
    setView({ x0: v.x0 - wx, x1: v.x1 - wx, y0: v.y0 + wy, y1: v.y1 + wy });
  };

  const hoverAt = (px: number, py: number) => {
    const P = plot();
    const p = stateRef.current.prepared;
    let seg = -1;
    if (px >= P.left && px <= P.right && py >= P.top && py <= P.bottom) {
      const y = Math.floor(P.wx(px)) - start;
      if (y >= 0 && y < p.nYears) seg = segmentAt(p, y, P.wy(py));
    }
    const prev = hoverRef.current;
    hoverRef.current = seg >= 0 ? { seg, x: px, y: py } : null;
    if (prev?.seg !== seg || seg >= 0) schedule(false);
  };

  // Size the canvases to the container, at device resolution.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width, height, dpr };
      for (const c of [baseRef.current, overlayRef.current]) {
        if (!c) continue;
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      schedule(true);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    viewRef.current = full;
    updateRange();
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  React.useEffect(() => {
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared, labelMode, theme]);

  // Pointer, wheel and touch handling.
  React.useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let moved = false;
    let hintTimer = 0;

    const local = (e: { clientX: number; clientY: number }) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onWheel = (e: WheelEvent) => {
      const { x, y } = local(e);
      const P = plot();
      const v = viewRef.current;
      const isZoomed =
        v.x1 - v.x0 < full.x1 - full.x0 - 1e-6 || v.y1 - v.y0 < 1 - 1e-9;

      // Ctrl/⌘ + wheel (and trackpad pinch, which sends ctrlKey) zooms. A
      // plain wheel scrolls the page, except sideways when zoomed, which pans.
      if (!(e.ctrlKey || e.metaKey)) {
        if (isZoomed && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          panBy(-e.deltaX, 0);
        } else if (hintRef.current && Math.abs(e.deltaY) > 0) {
          hintRef.current.dataset.show = 'true';
          clearTimeout(hintTimer);
          hintTimer = window.setTimeout(() => {
            if (hintRef.current) hintRef.current.dataset.show = 'false';
          }, 1200);
        }
        return;
      }

      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      // About 15% per mouse-wheel notch; trackpad pinches send small deltas.
      const f = Math.exp(clamp(e.deltaY * unit, -60, 60) * 0.0025);
      // Over the year axis, zoom only the years.
      zoomAt(f, y > P.bottom ? 1 : f, x, y);
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      moved = false;
    };

    const onMove = (e: PointerEvent) => {
      const pt = local(e);
      const prev = pointers.get(e.pointerId);
      if (!prev) {
        if (e.pointerType === 'mouse') hoverAt(pt.x, pt.y);
        return;
      }

      if (pointers.size === 1) {
        const dx = pt.x - prev.x;
        const dy = pt.y - prev.y;
        if (!moved && Math.hypot(dx, dy) < 3) return;
        moved = true;
        pointers.set(e.pointerId, pt);
        panBy(dx, dy);
        return;
      }

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.entries());
        const other = a[0] === e.pointerId ? b[1] : a[1];
        const before = Math.hypot(prev.x - other.x, prev.y - other.y);
        const after = Math.hypot(pt.x - other.x, pt.y - other.y);
        pointers.set(e.pointerId, pt);
        moved = true;
        if (before > 10 && after > 10) {
          const cx = (pt.x + other.x) / 2;
          const cy = (pt.y + other.y) / 2;
          const f = before / after;
          zoomAt(f, f, cx, cy);
          panBy((pt.x - prev.x) / 2, (pt.y - prev.y) / 2);
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      const pt = local(e);
      const wasTap = pointers.size === 1 && !moved;
      pointers.delete(e.pointerId);
      if (wasTap) hoverAt(pt.x, pt.y);
      else if (e.pointerType === 'mouse') hoverAt(pt.x, pt.y);
    };

    const onCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
    };

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || pointers.size) return;
      hoverRef.current = null;
      schedule(false);
    };

    const onDblClick = (e: MouseEvent) => {
      const { x, y } = local(e);
      const f = e.shiftKey ? 2 : 0.5;
      zoomAt(f, f, x, y);
    };

    // Two fingers on the chart always mean a pinch: stop the browser from
    // scrolling or zooming the page with them. (touch-action can't express
    // "scroll with one finger but not two".)
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault();
    };

    canvas.addEventListener('touchstart', onTouch, { passive: false });
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('dblclick', onDblClick);
    return () => {
      clearTimeout(hintTimer);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('touchstart', onTouch);
      canvas.removeEventListener('touchmove', onTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  const zoomCenter = (f: number) => {
    const P = plot();
    zoomAt(f, f, P.left + P.w / 2, P.top + P.h / 2);
  };

  if (!genera.length) {
    return <p className={style.empty}>No registration data to show.</p>;
  }

  const latestLabel =
    end === currentYear ? `Current year (${end})` : `Latest year (${end})`;

  return (
    <div>
      <div className={style.controls}>
        <label>
          Show labels for
          <select
            value={labelMode}
            onChange={(e) => setLabelMode(e.target.value as LabelMode)}
          >
            <option value='all'>All-time</option>
            <option value='current'>{latestLabel}</option>
          </select>
        </label>

        <div className={style.zoom}>
          <span ref={rangeRef} className={style.range} aria-live='polite' />
          <Button
            variant='outline'
            size='icon'
            aria-label='Zoom in'
            onClick={() => zoomCenter(0.5)}
          >
            <Plus />
          </Button>
          <Button
            variant='outline'
            size='icon'
            aria-label='Zoom out'
            disabled={!zoomed}
            onClick={() => zoomCenter(2)}
          >
            <Minus />
          </Button>
          <Button
            variant='outline'
            size='icon'
            aria-label='Reset zoom'
            disabled={!zoomed}
            onClick={() => setView(full)}
          >
            <RotateCcw />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className={style.chart}>
        <canvas ref={baseRef} className={style.canvas} aria-hidden />
        <canvas
          ref={overlayRef}
          className={style.canvas}
          data-zoomed={zoomed}
          role='img'
          aria-label={`Share of orchid hybrid registrations by genus each year, ${start} to ${end}`}
        />
        <div ref={tooltipRef} className={style.tooltip} role='tooltip'>
          <div className={style.tooltipTitle}>
            <span data-k='swatch' className={style.swatch} />
            <strong data-k='name' />
            <span data-k='abbr' className={style.muted} />
          </div>
          <dl>
            <dt>Year</dt>
            <dd data-k='year' />
            <dt>Registrations</dt>
            <dd data-k='count' />
            <dt>Share of year</dt>
            <dd>
              <span data-k='share' />{' '}
              <span className={style.muted}>
                of <span data-k='total' />
              </span>
            </dd>
          </dl>
        </div>
        <div ref={hintRef} className={style.hint} data-show='false'>
          Hold Ctrl or ⌘ and scroll to zoom
        </div>
      </div>

      <p className={style.help}>
        Hover or tap a bar for details. Pinch, or hold Ctrl/⌘ and scroll, to
        zoom; scroll over the years to zoom just them. Drag to pan, double-click
        to zoom in.
      </p>
    </div>
  );
}
