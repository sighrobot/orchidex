'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  CircleHelp,
  Focus,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { H2 } from 'components/layout';
import Toolbar from 'components/toolbar/toolbar';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';
import { DARK_COLORS } from 'lib/theme';

import type {
  DominanceData,
  DominanceKind,
  DominanceWithin,
} from 'lib/fetchers/dominance';

import { KINDS } from './kinds';
import { useDominanceShared } from './shared';
import Tokens from './tokens';
import { buildTour } from './tour';
import style from './style.module.scss';

import type { LabelMode } from './shared';

// The right margin is sized to fit the group labels; see drawBase.
// Year and group labels. Group labels are spaced a little more than a line
// apart, and the bottom margin fits the year labels.
const TICK_FONT_SIZE = 12;
// Longer labels (some registrants' names) are cut short with an ellipsis.
const MAX_LABEL_WIDTH = 150;
const MARGIN = { top: 8, bottom: 28, left: 0 };
const LABEL_OFFSET = 17;
const LABEL_HEIGHT = 14;
const MIN_YEARS = 3;
// How much each zoom button press zooms: two presses double or halve the view.
const ZOOM_STEP = Math.SQRT2;
// How far the smooth edge must pass a year before the drawn edge follows:
// three quarters of a year, or this many pixels when years are thin.
const SNAP_HYSTERESIS = 0.75;
const SNAP_HYSTERESIS_PX = 6;
const MIN_SHARE = 0.001;
// How the bands not highlighted fade: losing this much of their saturation
// (1 = a gray of the same brightness), then mixed this far toward the page
// color. On a dark page, mixing alone only darkens the colors, which look
// muddy, so there they're partly grayed too.
const FADE = {
  light: { mix: 0.75, desaturate: 0 },
  dark: { mix: 0.7, desaturate: 0.65 },
};
// How long the fade and each group's highlight take to come in or go out, in
// ms. Each moves at a steady rate and is drawn through an ease-in-out curve,
// so it starts and ends gently, and a change of direction midway is smooth.
const FADE_MS = 300;
const easeInOut = (t: number) => t * t * (3 - 2 * t);
// How long the guide's zooms take, in ms.
const VIEW_MS = 700;

export type View = { x0: number; x1: number; y0: number; y1: number };
type Hover = { seg: number; x: number; y: number } | null;

// Data laid out for drawing: one segment per group per year, in typed arrays,
// indexed by year (for hit testing) and by color (to fill in few batches).
function prepare({ start, end, groups, cells }: DominanceData, colors: number) {
  const nYears = Math.max(0, end - start + 1);
  const n = cells.length / 3;

  const segGroup = new Int32Array(n);
  const segYear = new Int32Array(n);
  const segCount = new Int32Array(n);
  const segY0 = new Float64Array(n);
  const segY1 = new Float64Array(n);
  const yearOffset = new Int32Array(nYears + 1);
  const yearTotal = new Int32Array(nYears);

  // Like the original charts, stack groups alphabetically by abbreviation:
  // A at the top, Z at the bottom.
  const stackPos = new Int32Array(groups.length);
  groups
    .map((g, i) => i)
    .sort((a, b) =>
      groups[a].abbr < groups[b].abbr
        ? 1
        : groups[a].abbr > groups[b].abbr
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
    segGroup[i] = cells[c];
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

  const byGroup = group((i) => segGroup[i], groups.length);
  const byColor = group((i) => segGroup[i] % colors, colors);

  // Top groups in the latest year, for the "current year" labels.
  const latest: number[] = [];
  if (nYears) {
    for (let i = yearOffset[nYears - 1]; i < yearOffset[nYears]; i++) {
      latest.push(i);
    }
    latest.sort((a, b) => segCount[b] - segCount[a]);
  }
  const latestRanking = latest.map((i) => segGroup[i]);

  return {
    nYears,
    segGroup,
    segYear,
    segCount,
    segY0,
    segY1,
    yearOffset,
    yearTotal,
    byGroup,
    byColor,
    latestRanking,
    stackPos,
  };
}

export type Prepared = ReturnType<typeof prepare>;

// The segment for group `g` in year `y`, or -1. Segments within a year are
// sorted by stack position.
function findSegment(p: Prepared, y: number, g: number) {
  let lo = p.yearOffset[y];
  let hi = p.yearOffset[y + 1] - 1;
  const target = p.stackPos[g];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const pos = p.stackPos[p.segGroup[mid]];
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

const rgbOf = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// The palette faded toward `paper`; see FADE.
function fadePalette(
  palette: string[],
  paper: string,
  { mix, desaturate }: typeof FADE.light,
) {
  const bg = rgbOf(paper);
  return palette.map((hex) => {
    const c = rgbOf(hex);
    const gray = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const out = c.map((v, k) => {
      const d = v + (gray - v) * desaturate;
      return Math.round(d + (bg[k] - d) * mix);
    });
    return `rgb(${out.join(',')})`;
  });
}

const KIND_ORDER: DominanceKind[] = ['genus', 'registrant'];

// A stacked bar chart of each year's registrations, split by genus or by
// registrant, normalized to the year's total. A switch in the toolbar moves
// between the two, keeping the years in view and the label choice.
//
// With `within`, only one genus's or registrant's registrations are shown,
// split the other way, and normalized to that genus's or registrant's total
// for the year. A picked group's card links to its own breakdown, so you can go
// from a genus to its registrants, to one registrant's genera, and so on.
export default function DominanceChart({
  data,
  kind,
  within,
}: {
  data: DominanceData;
  kind: DominanceKind;
  within?: DominanceWithin;
}) {
  const { start, end, currentYear, groups } = data;
  const cfg = KINDS[kind];
  const { palette, one, many } = cfg;
  // The genus or registrant this chart is within, as it reads in text.
  const withinName =
    within &&
    (KINDS[within.kind].italic ? <i>{within.name}</i> : <>{within.name}</>);
  // A picked group's registrations, split the other way.
  const breakdown = (g: number) => {
    const name = groups[g].name;
    return {
      href: `/learn/dominance/${kind}/${encodeURIComponent(name)}`,
      label: kind === 'genus' ? 'See its registrants' : 'See their genera',
    };
  };
  const colorOf = (g: number) => palette[g % palette.length];
  const prepared = React.useMemo(
    () => prepare(data, palette.length),
    [data, palette],
  );
  const theme = useResolvedTheme();

  const { carried, labelMode, setLabelMode } = useDominanceShared();
  const [zoomed, setZoomed] = React.useState(false);
  // Groups kept highlighted, in the order they were picked.
  const [selected, setSelected] = React.useState<number[]>([]);
  // The step of the guide being shown, or null when it's closed.
  const [tour, setTour] = React.useState<number | null>(null);
  // The group whose card is open, and the point in the chart it's pinned to.
  // The card is where you go from a group to its registrations split the
  // other way.
  const [pin, setPin] = React.useState<{
    g: number;
    x: number;
    y: number;
  } | null>(null);
  const toggleGroup = (g: number) =>
    setSelected((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  const containerRef = React.useRef<HTMLDivElement>(null);
  const baseRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const hintRef = React.useRef<HTMLDivElement>(null);

  const full = React.useMemo<View>(
    () => ({ x0: start, x1: end + 1, y0: 0, y1: 1 }),
    [start, end],
  );
  const viewRef = React.useRef<View>(full);
  const hoverRef = React.useRef<Hover>(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const frameRef = React.useRef(0);
  // The animated state of the highlight: how far the fade has come in, and
  // how bright each group is drawn over it (0 to 1).
  const fadeRef = React.useRef({
    wash: 0,
    levels: new Map<number, number>(),
    time: 0,
  });
  const dirtyRef = React.useRef({ base: true, overlay: true });
  const rightRef = React.useRef(60);

  const ink = theme === 'dark' ? DARK_COLORS.fg : '#000000';
  const inkRgb = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
  const inkAlpha = (a: number) => `rgba(${inkRgb.join(',')},${a})`;
  // The page background, which faded bands are mixed toward.
  const paper = theme === 'dark' ? DARK_COLORS.bg : '#ffffff';
  const faded = React.useMemo(
    () =>
      fadePalette(palette, paper, theme === 'dark' ? FADE.dark : FADE.light),
    [palette, paper, theme],
  );

  // Everything draw() reads, so the stable callbacks below see fresh values.
  const stateRef = React.useRef({
    tour,
    prepared,
    labelMode,
    inkAlpha,
    faded,
    selected,
    toggleGroup,
    pin,
  });
  stateRef.current = {
    tour,
    prepared,
    labelMode,
    inkAlpha,
    faded,
    selected,
    toggleGroup,
    pin,
  };

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
  const labelFont = (font: string) =>
    `${cfg.italic ? 'italic ' : ''}300 ${TICK_FONT_SIZE}px ${font}`;

  // Group `g`'s label, cut short to fit `limit` pixels in the current font.
  const labelText = (
    ctx: CanvasRenderingContext2D,
    g: number,
    limit = MAX_LABEL_WIDTH,
  ) => {
    const text = groups[g].abbr;
    if (ctx.measureText(text).width <= limit) return text;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      const fits =
        ctx.measureText(text.slice(0, mid).trimEnd() + '…').width <= limit;
      if (fits) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo).trimEnd() + '…';
  };

  // Fills every visible bar, each in `colors[its group's palette index]`:
  // one path and one fill per color. Returns the visible years.
  const fillBars = (
    ctx: CanvasRenderingContext2D,
    p: Prepared,
    P: ReturnType<typeof plot>,
    colors: string[],
  ) => {
    const { dpr } = sizeRef.current;
    const snap = (n: number) => Math.round(n * dpr) / dpr;
    const v = shownView();
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

    // One path and one fill per color.
    const { offset, items } = p.byColor;
    for (let c = 0; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
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
    return { ya, yb };
  };

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
    // mode shows at the full view, so switching modes doesn't resize the
    // plot. Labels for other years are cut short to fit.
    ctx.font = labelFont(font);
    let widest = 0;
    const lastYear = p.nYears - 1;
    for (const g of labelCandidates(p, 'all', lastYear).concat(
      labelCandidates(p, 'current', lastYear),
    )) {
      widest = Math.max(widest, ctx.measureText(labelText(ctx, g)).width);
    }
    rightRef.current = Math.ceil(LABEL_OFFSET + widest + 2);
    const P = plot();

    const { ya, yb } = fillBars(ctx, p, P, palette);

    ctx.fillStyle = ia(0.75);
    ctx.strokeStyle = ia(0.5);
    ctx.lineWidth = 1;
    ctx.font = `300 ${TICK_FONT_SIZE}px ${font}`;

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

    const isZoomed = v.x1 - v.x0 < full.x1 - full.x0 || v.y1 - v.y0 < 1 - 1e-9;
    drawLabels(ctx, p, mode, P, yb, ia, font, isZoomed);
  };

  // The groups to label: the top ones all-time or in the latest year. All-time
  // takes the top ones of those in `year` (the labels' year), so there are
  // always 16 when there are that many: most of the top registrants of all
  // time registered nothing in recent years. Group indices are all-time ranks.
  const labelCandidates = (p: Prepared, mode: LabelMode, year: number) => {
    if (mode === 'current') return p.latestRanking.slice(0, 20);
    const inYear: number[] = [];
    for (let i = p.yearOffset[year]; i < p.yearOffset[year + 1]; i++) {
      inYear.push(p.segGroup[i]);
    }
    return inYear.sort((a, b) => a - b).slice(0, 16);
  };

  // Group names down the right edge, beside their bands in the rightmost
  // visible year. The top groups always get a label, nudged apart so they
  // don't overlap. Once zoomed in, other groups are added where there's room.
  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    p: Prepared,
    mode: LabelMode,
    P: ReturnType<typeof plot>,
    year: number,
    ia: (a: number) => string,
    font: string,
    isZoomed: boolean,
  ) => {
    const candidates = labelCandidates(p, mode, year).slice(
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

    ctx.font = labelFont(font);
    if (isZoomed) addExtraLabels(p, P, year, labels, first, last);

    // Every label is cut short to fit the right margin, which is sized for
    // the full view and shouldn't change mid-zoom.
    const room = rightRef.current - LABEL_OFFSET - 2;
    const x = P.right;
    ctx.strokeStyle = ia(0.6);
    ctx.fillStyle = ia(0.9);
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
      ctx.fillText(labelText(ctx, l.g, room), x + LABEL_OFFSET, l.y);
    }
  };

  // Adds labels for groups beyond the top ones, biggest band first. Each sits
  // exactly beside its band, so it's only added if the band is at least a
  // label tall and it doesn't touch a label already placed.
  const addExtraLabels = (
    p: Prepared,
    P: ReturnType<typeof plot>,
    year: number,
    labels: { g: number; at: number; y: number }[],
    first: number,
    last: number,
  ) => {
    const taken = new Set(labels.map((l) => l.g));
    const extras: { g: number; at: number; size: number }[] = [];
    for (let i = p.yearOffset[year]; i < p.yearOffset[year + 1]; i++) {
      const g = p.segGroup[i];
      if (taken.has(g)) continue;
      const t = Math.max(P.top, P.sy(p.segY1[i]));
      const b = Math.min(P.bottom, P.sy(p.segY0[i]));
      if (b - t < LABEL_HEIGHT) continue;
      extras.push({ g, at: (t + b) / 2, size: b - t });
    }
    extras.sort((a, b) => b.size - a.size);

    for (const e of extras) {
      if (e.at < first || e.at > last) continue;
      if (labels.some((l) => Math.abs(l.y - e.at) < LABEL_HEIGHT)) continue;
      labels.push({ g: e.g, at: e.at, y: e.at });
    }
  };

  const drawOverlay = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, dpr } = sizeRef.current;
    const { prepared: p, inkAlpha: ia, faded, selected } = stateRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const hover = hoverRef.current;
    const tip = tooltipRef.current;
    if (!hover && tip) tip.style.visibility = 'hidden';

    // The selected groups stay bright, and so does the hovered one.
    const lit = new Set(selected);
    if (hover) lit.add(p.segGroup[hover.seg]);

    // Ease the wash and each group's brightness toward their targets.
    const fade = fadeRef.current;
    const now = performance.now();
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const dt = fade.time ? Math.min(now - fade.time, 50) : 16;
    const k = reduce ? 1 : dt / FADE_MS;
    const step = (from: number, to: number) =>
      from < to ? Math.min(to, from + k) : Math.max(to, from - k);
    let moving = false;
    const target = lit.size ? 1 : 0;
    fade.wash = step(fade.wash, target);
    if (fade.wash !== target) moving = true;
    for (const g of Array.from(lit)) {
      if (!fade.levels.has(g)) fade.levels.set(g, 0);
    }
    fade.levels.forEach((level, g) => {
      const target = lit.has(g) ? 1 : 0;
      const next = step(level, target);
      if (next !== target) moving = true;
      if (next === 0 && !target) fade.levels.delete(g);
      else fade.levels.set(g, next);
    });
    fade.time = moving ? now : 0;
    if (moving) requestOverlay();
    if (!fade.wash && !fade.levels.size) return;

    const P = plot();
    const v = shownView();
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

    // Fade every band by drawing it over in its faded color, then redraw the lit
    // groups on top at full strength, and outline the hovered bar.
    ctx.globalAlpha = easeInOut(fade.wash);
    fillBars(ctx, p, P, faded);
    ctx.globalAlpha = 1;

    const { offset, items } = p.byGroup;
    fade.levels.forEach((level, lg) => {
      ctx.globalAlpha = easeInOut(level);
      ctx.fillStyle = colorOf(lg);
      ctx.beginPath();
      for (let k = offset[lg]; k < offset[lg + 1]; k++) {
        const i = items[k];
        const year = start + p.segYear[i];
        if (year + 1 < v.x0 || year > v.x1) continue;
        const r = box(i);
        ctx.rect(r.x0, r.t, r.w, r.h);
      }
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (hover) {
      const r = box(hover.seg);
      ctx.strokeStyle = ia(0.9);
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x0 + 0.5, r.t + 0.5, r.w - 1, r.h - 1);
    }
    ctx.restore();

    // An open card stands in for the tooltip.
    if (tip && stateRef.current.pin) tip.style.visibility = 'hidden';
    if (!tip || !hover || stateRef.current.pin) return;
    const g = p.segGroup[hover.seg];
    const group = groups[g];
    const yi = p.segYear[hover.seg];
    const count = p.segCount[hover.seg];
    const total = p.yearTotal[yi];
    const set = (key: string, text: string) => {
      const el = tip.querySelector(`[data-k="${key}"]`);
      if (el) el.textContent = text;
    };
    set('name', group.name);
    set('abbr', group.abbr !== group.name ? group.abbr : '');
    set('year', String(start + yi));
    set('count', fmt.format(count));
    set(
      'share',
      `${((count / total) * 100).toFixed(count / total < 0.01 ? 2 : 1)}%`,
    );
    set('total', fmt.format(total));
    set('swatch', '');
    const swatch = tip.querySelector<HTMLElement>('[data-k="swatch"]');
    if (swatch) swatch.style.background = colorOf(g);

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
      // Cleared first, so a draw can ask for another frame (to animate).
      dirtyRef.current = { base: false, overlay: false };
      if (dirty.base) drawBase();
      if (dirty.overlay) drawOverlay();
    });
  };
  const requestOverlay = () => schedule(false);

  const updateZoomed = () => {
    const v = shownView();
    const isZoomed = v.x1 - v.x0 < full.x1 - full.x0 || v.y1 - v.y0 < 1 - 1e-9;
    setZoomed(isZoomed);
  };

  const setView = (next: View) => {
    const fw = full.x1 - full.x0;
    const xs = clamp(next.x1 - next.x0, Math.min(MIN_YEARS, fw), fw);
    const ys = clamp(next.y1 - next.y0, MIN_SHARE, 1);
    const x0 = clamp(next.x0, full.x0, full.x1 - xs);
    const y0 = clamp(next.y0, 0, 1 - ys);
    viewRef.current = { x0, x1: x0 + xs, y0, y1: y0 + ys };
    // Remembered for the other chart; the full range is remembered as none.
    carried.current.years =
      xs < fw - 1e-6 ? { x0, x1: viewRef.current.x1 } : null;
    hoverRef.current = null;
    updateZoomed();
    schedule(true);
  };

  // Zoom by `fx`/`fy` (below 1 zooms in) keeping the point under (px, py).
  // Gestures work on the smooth view, not the snapped one, so a snap never
  // feeds back into the next step of a pinch or drag.
  const zoomAt = (fx: number, fy: number, px: number, py: number) => {
    cancelAnimationFrame(animRef.current);
    // The card would no longer sit on its bar.
    setPin(null);
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
    cancelAnimationFrame(animRef.current);
    // The card would no longer sit on its bar.
    setPin(null);
    const v = viewRef.current;
    const P = plot();
    const wx = (dx / P.w) * (v.x1 - v.x0);
    const wy = dy / P.ky;
    setView({ x0: v.x0 - wx, x1: v.x1 - wx, y0: v.y0 + wy, y1: v.y1 + wy });
  };

  // The segment under a point in the plot, or -1.
  const segmentUnder = (px: number, py: number) => {
    const P = plot();
    const p = stateRef.current.prepared;
    if (px < P.left || px > P.right || py < P.top || py > P.bottom) return -1;
    const y = Math.floor(P.wx(px)) - start;
    return y >= 0 && y < p.nYears ? segmentAt(p, y, P.wy(py)) : -1;
  };

  // Moves the view smoothly to `to`, zooming at a steady rate (each edge's
  // span eases in log space, so zooms don't rush at one end), then calls
  // `done`.
  const animRef = React.useRef(0);
  const animateView = (to: View, done?: () => void) => {
    cancelAnimationFrame(animRef.current);
    const from = { ...viewRef.current };
    const t0 = performance.now();
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const along = (
      a0: number,
      a1: number,
      b0: number,
      b1: number,
      e: number,
    ) => {
      const span = Math.exp(
        Math.log(a1 - a0) + (Math.log(b1 - b0) - Math.log(a1 - a0)) * e,
      );
      const mid = (a0 + a1) / 2 + ((b0 + b1) / 2 - (a0 + a1) / 2) * e;
      return [mid - span / 2, mid + span / 2];
    };
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - t0) / VIEW_MS);
      const e = easeInOut(t);
      const [x0, x1] = along(from.x0, from.x1, to.x0, to.x1, e);
      const [y0, y1] = along(from.y0, from.y1, to.y0, to.y1, e);
      setView(t < 1 ? { x0, x1, y0, y1 } : to);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
      else done?.();
    };
    animRef.current = requestAnimationFrame(tick);
  };

  // Points at segment `seg` as if hovered, with its tooltip.
  const showHover = (seg: number) => {
    const p = stateRef.current.prepared;
    const P = plot();
    const x = P.sx(start + p.segYear[seg] + 0.5);
    const y = P.sy((p.segY0[seg] + p.segY1[seg]) / 2);
    hoverRef.current = { seg, x, y };
    schedule(false);
  };

  const hoverAt = (px: number, py: number) => {
    const seg = segmentUnder(px, py);
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

  // Start at the full view, or at the years the other chart was showing.
  React.useEffect(() => {
    const years = carried.current.years;
    shownRef.current = { x0: full.x0, x1: full.x1 };
    if (years) setView({ ...full, ...years });
    else viewRef.current = full;
    updateZoomed();
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  React.useEffect(() => {
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared, labelMode, theme]);

  React.useEffect(() => {
    schedule(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, pin]);

  // A card closes with its group's highlight, and on Esc.
  React.useEffect(() => {
    if (pin && !selected.includes(pin.g)) setPin(null);
  }, [pin, selected]);
  React.useEffect(() => {
    if (!pin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPin(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin]);

  // Opens group g's card on its bar in the latest year in view, if it has
  // one there, as when it's picked from the search.
  const pinGroup = (g: number) => {
    const p = prepared;
    const v = shownView();
    const P = plot();
    const last = Math.min(p.nYears, Math.ceil(v.x1) - start) - 1;
    const first = Math.max(0, Math.floor(v.x0) - start);
    for (let y = last; y >= first; y--) {
      const seg = findSegment(p, y, g);
      if (seg < 0) continue;
      const mid = (p.segY0[seg] + p.segY1[seg]) / 2;
      if (mid < v.y0 || mid > v.y1) continue;
      setPin({ g, x: P.sx(start + y + 0.5), y: P.sy(mid) });
      return;
    }
  };

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
        // The guide points at bars itself; don't let the mouse take over.
        if (e.pointerType === 'mouse' && stateRef.current.tour === null) {
          hoverAt(pt.x, pt.y);
        }
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
      if (stateRef.current.tour !== null) return;
      // A click or tap on a bar selects (or deselects) its group.
      if (wasTap) {
        const seg = segmentUnder(pt.x, pt.y);
        if (seg >= 0) {
          const {
            prepared: p,
            toggleGroup,
            selected: picked,
          } = stateRef.current;
          const g = p.segGroup[seg];
          toggleGroup(g);
          // Picking a group opens its card where you clicked; unpicking it
          // closes the card.
          setPin(picked.includes(g) ? null : { g, x: pt.x, y: pt.y });
        } else {
          setPin(null);
        }
      }
      if (wasTap || e.pointerType === 'mouse') hoverAt(pt.x, pt.y);
    };

    const onCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
    };

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || pointers.size) return;
      if (stateRef.current.tour !== null) return;
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

  // Zooms to the selected groups: from the first year any of them was
  // registered to the last, and the range of shares their bands cover then,
  // with a little room above and below.
  const zoomToSelected = () => {
    const { offset, items } = prepared.byGroup;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const g of selected) {
      for (let k = offset[g]; k < offset[g + 1]; k++) {
        const i = items[k];
        x0 = Math.min(x0, prepared.segYear[i]);
        x1 = Math.max(x1, prepared.segYear[i]);
        y0 = Math.min(y0, prepared.segY0[i]);
        y1 = Math.max(y1, prepared.segY1[i]);
      }
    }
    if (x0 > x1) return;
    const pad = (y1 - y0) * 0.04;
    setView({
      x0: start + x0,
      x1: start + x1 + 1,
      y0: y0 - pad,
      y1: y1 + pad,
    });
  };

  // The guide: steps worked out from the data, each setting the selection
  // and zooming the chart. What was selected and in view before is put back
  // when it closes.
  const steps = React.useMemo(
    () =>
      buildTour(
        prepared,
        data,
        cfg,
        within ? (
          within.kind === 'genus' ? (
            <>{withinName} hybrids</>
          ) : (
            <>hybrids from {withinName}</>
          )
        ) : undefined,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prepared, data, cfg, within?.kind, within?.name],
  );
  const beforeTourRef = React.useRef<{ selected: number[]; view: View }>(null);
  const tourCardRef = React.useRef<HTMLDivElement>(null);

  const startTour = () => {
    if (!steps.length) return;
    setPin(null);
    beforeTourRef.current = { selected, view: { ...viewRef.current } };
    setTour(0);
  };
  const endTour = () => {
    setTour(null);
    hoverRef.current = null;
    const before = beforeTourRef.current;
    beforeTourRef.current = null;
    if (before) {
      setSelected(before.selected);
      animateView(before.view);
    }
  };
  const goTo = (step: number) => {
    if (step < 0) return;
    if (step >= steps.length) endTour();
    else setTour(step);
  };

  React.useEffect(() => {
    if (tour === null) return;
    const step = steps[tour];
    setSelected(step.select);
    hoverRef.current = null;
    schedule(false);
    animateView(step.view, () => {
      if (step.hover !== undefined) showHover(step.hover);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, steps]);

  // Focus the guide when it opens, and let the arrow keys and Esc drive it.
  const open = tour !== null;
  React.useEffect(() => {
    if (!open) return;
    tourCardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select')) return;
      const at = stateRef.current.tour;
      if (at === null) return;
      if (e.key === 'Escape') endTour();
      else if (e.key === 'ArrowRight') goTo(at + 1);
      else if (e.key === 'ArrowLeft') goTo(at - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The section strip names the page, so the title is for screen readers.
  const heading = (
    <H2 className='sr-only'>
      {within ? (
        <>
          {withinName} by {one}
        </>
      ) : (
        <>Dominance by {one}</>
      )}
    </H2>
  );

  // At the start of the toolbar: the switch between the kinds of chart, or,
  // within one genus or registrant, the way back to all of them.
  const leading = within ? (
    <nav aria-label='Breakdown' className={style.crumbs}>
      <Link href={`/learn/dominance/${within.kind}`} scroll={false}>
        <ChevronLeft size={16} />
        All {KINDS[within.kind].many}
      </Link>
      <strong title={within.name}>{withinName}</strong>
    </nav>
  ) : (
    <nav aria-label='Split registrations by' className={style.segmented}>
      {KIND_ORDER.map((k) => (
        <Link
          key={k}
          href={`/learn/dominance/${k}`}
          scroll={false}
          aria-current={k === kind ? 'page' : undefined}
        >
          {KINDS[k].one}
        </Link>
      ))}
    </nav>
  );

  // The open card, beside the point it's pinned to (or on the other side, if
  // it would run off the chart).
  const CARD_WIDTH = 220;
  const pinCard =
    pin &&
    groups[pin.g] &&
    (() => {
      const { width, height } = sizeRef.current;
      const g = groups[pin.g];
      const left =
        pin.x + 12 + CARD_WIDTH > width ? pin.x - 12 - CARD_WIDTH : pin.x + 12;
      const top = clamp(pin.y - 28, 0, Math.max(0, height - 120));
      const { href, label } = breakdown(pin.g);
      return (
        <div
          className={style.card}
          style={{ left: Math.max(0, left), top, width: CARD_WIDTH }}
          role='group'
          aria-label={g.name}
        >
          <div className={style.tooltipTitle}>
            <span
              className={style.swatch}
              style={{ background: colorOf(pin.g) }}
            />
            <strong data-italic={cfg.italic}>{g.name}</strong>
            <button
              type='button'
              className={style.cardClose}
              aria-label='Close'
              onClick={() => setPin(null)}
            >
              <X size={14} />
            </button>
          </div>
          <p className={style.muted}>
            {fmt.format(g.total)} registrations
            {within && <> of {withinName}</>}
          </p>
          <Button asChild size='sm' className={style.cardAction}>
            <Link href={href} scroll={false}>
              {label}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      );
    })();

  if (!groups.length) {
    return (
      <div>
        {heading}
        <p className={style.empty}>No registration data to show.</p>
      </div>
    );
  }

  // Which groups get a label at the right edge: the top ones all-time, or
  // in the latest year. Each option says exactly what it picks.
  const allCount = Math.min(16, groups.length);
  const latestCount = Math.min(20, prepared.latestRanking.length);
  const yearWord = end === currentYear ? 'this year' : `in ${end}`;
  const labelOptions: {
    value: LabelMode;
    label: React.ReactNode;
    title: string;
  }[] = [
    {
      value: 'all',
      label: 'All-time',
      title: `The ${allCount} ${many} with the most registrations ever, of those in the last year shown`,
    },
    {
      value: 'current',
      label: (
        <>
          <span className={style.long}>In </span>
          {end}
        </>
      ),
      title: `The ${latestCount} ${many} with the most registrations ${yearWord}`,
    },
  ];

  return (
    <div>
      {heading}

      {/* The search on the left, the guide's button at the far end, and the
          label and zoom controls between them, or on a line below. The
          switch between genus and registrant leads. */}
      <Toolbar
        leading={leading}
        search={
          <Tokens
            items={groups}
            noun={many}
            italic={cfg.italic}
            selected={selected}
            colorOf={colorOf}
            onAdd={(g) => {
              setSelected((s) => (s.includes(g) ? s : [...s, g]));
              pinGroup(g);
            }}
            onRemove={(g) => setSelected((s) => s.filter((x) => x !== g))}
            onClear={() => setSelected([])}
          />
        }
        secondary={
          <>
            <div className={style.labelMode}>
              <span id='label-mode'>
                <span className={style.long}>Label top {many}</span>
                <span className={style.short}>Labels</span>
              </span>
              <div
                role='radiogroup'
                aria-labelledby='label-mode'
                className={style.segmented}
              >
                {labelOptions.map((o) => (
                  <button
                    key={o.value}
                    type='button'
                    role='radio'
                    aria-checked={labelMode === o.value}
                    title={o.title}
                    onClick={() => setLabelMode(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={style.zoom}>
              <Button
                variant='outline'
                size='icon'
                aria-label={`Zoom to selected ${many}`}
                title={`Zoom to selected ${many}`}
                disabled={!selected.length}
                onClick={zoomToSelected}
              >
                <Focus />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Zoom in'
                onClick={() => zoomCenter(1 / ZOOM_STEP)}
              >
                <Plus />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label='Zoom out'
                disabled={!zoomed}
                onClick={() => zoomCenter(ZOOM_STEP)}
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
          </>
        }
        end={
          <Button
            // Filled while the guide is open.
            variant={open ? 'default' : 'outline'}
            size='icon'
            className={style.helpButton}
            aria-label='How to read this chart'
            title='How to read this chart'
            aria-pressed={open}
            onClick={open ? endTour : startTour}
          >
            <CircleHelp />
          </Button>
        }
      />

      <div ref={containerRef} className={style.chart}>
        <canvas ref={baseRef} className={style.canvas} aria-hidden />
        <canvas
          ref={overlayRef}
          className={style.canvas}
          data-zoomed={zoomed}
          role='img'
          aria-label={`Share of ${within ? `${within.name} ` : 'orchid hybrid '}registrations by ${one} each year, ${start} to ${end}`}
        />
        <div ref={tooltipRef} className={style.tooltip} role='tooltip'>
          <div className={style.tooltipTitle}>
            <span data-k='swatch' className={style.swatch} />
            <strong data-k='name' data-italic={cfg.italic} />
            <span
              data-k='abbr'
              data-italic={cfg.italic}
              className={style.muted}
            />
          </div>
          <dl>
            <dt>Year</dt>
            <dd data-k='year' />
            <dt>Registrations</dt>
            <dd data-k='count' />
            <dt>{within ? <>Share of {withinName}</> : 'Share of year'}</dt>
            <dd>
              <span data-k='share' />{' '}
              <span className={style.muted}>
                of <span data-k='total' />
              </span>
            </dd>
          </dl>
          <p className={style.tipHint}>
            {kind === 'genus'
              ? 'Click to highlight it and see its registrants'
              : 'Click to highlight them and see their genera'}
          </p>
        </div>
        {pinCard}
        {open && (
          <div
            ref={tourCardRef}
            className={style.tour}
            role='dialog'
            aria-label='How to read this chart'
            tabIndex={-1}
          >
            <div className={style.tourHead}>
              <span>
                {tour + 1} of {steps.length}
              </span>
              <button type='button' aria-label='Close guide' onClick={endTour}>
                <X size={16} />
              </button>
            </div>
            <p aria-live='polite'>{steps[tour].text}</p>
            <div className={style.tourNav}>
              <Button
                variant='outline'
                size='sm'
                disabled={tour === 0}
                onClick={() => goTo(tour - 1)}
              >
                Back
              </Button>
              <Button size='sm' onClick={() => goTo(tour + 1)}>
                {tour === steps.length - 1 ? 'Done' : 'Next'}
              </Button>
            </div>
          </div>
        )}
        <div ref={hintRef} className={style.hint} data-show='false'>
          Hold Ctrl or ⌘ and scroll to zoom
        </div>
      </div>
    </div>
  );
}
