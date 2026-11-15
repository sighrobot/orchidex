'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { H2 } from 'components/layout';
import GenusInput, { type GenusOption } from 'components/genus-input';
import Toolbar from 'components/toolbar/toolbar';
import { makeHrefGrex } from 'components/link/grex';
import Tokens from 'components/viz/dominance/tokens';
import { Segmented } from 'components/viz/parentage/chart';
import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';
import { DARK_COLORS } from 'lib/theme';

import type { PrimaryData } from 'lib/fetchers/primary';

import style from './style.module.scss';

type Sort = 'crosses' | 'name';

const BASE_PATH = '/learn/primary-hybrids';
const hrefFor = (genus: string, cross?: string) =>
  cross && cross.toLowerCase() !== genus.toLowerCase()
    ? `${BASE_PATH}/${genus.toLowerCase()}/${cross.toLowerCase()}`
    : `${BASE_PATH}/${genus.toLowerCase()}`;

// The parentage chart's orchid, for registered crosses.
const ORCHID = 'rgb(218, 112, 214)';
// The smallest cell that gets a name beside it, and the most a cell grows.
const LABEL_MIN = 11;
const MAX_SCALE = 40;
// Cells at least this big get a gap between them.
const GRID_MIN = 6;
const ZOOM_STEP = 1.6;

const fmt = new Intl.NumberFormat('en-US');
const plural = (n: number, one: string, many: string) =>
  `${fmt.format(n)} ${n === 1 ? one : many}`;
const pct = (n: number, of: number) => {
  if (!of) return '0%';
  const p = (n / of) * 100;
  return `${p > 0 && p < 0.1 ? '<0.1' : p < 10 ? p.toFixed(1) : Math.round(p)}%`;
};
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const abbr = (genus: string) => GENUS_TO_ABBREVIATION[genus] || genus;

// Room for names beside the matrix: wider on bigger screens.
const marginsFor = (width: number) =>
  width < 520 ? { left: 92, top: 84 } : { left: 150, top: 120 };

type View = { scale: number; ox: number; oy: number };

// A matrix of every species in one genus against every species in another
// (or the same) genus, filled where a primary hybrid has been registered.
export default function PrimaryChart({ data }: { data: PrimaryData }) {
  const { genus, cross, rows, crosses, hybridGenera, partners } = data;
  const same = !data.cols;
  const cols = data.cols ?? rows;
  const nr = rows.names.length;
  const nc = cols.names.length;
  const router = useRouter();
  const theme = useResolvedTheme();

  const [sort, setSort] = React.useState<Sort>('crosses');
  // Picked species: rows first, then (across two genera) columns.
  const [selected, setSelected] = React.useState<number[]>([]);
  // Whether the view is zoomed past fitting the whole matrix.
  const [zoomed, setZoomed] = React.useState(false);

  // Registered crosses by cell (row species × nc + column species), both ways
  // round within a genus, and how many each species has.
  const { byCell, rowDeg, colDeg } = React.useMemo(() => {
    const byCell = new Map<number, number>();
    const rowDeg = new Int32Array(nr);
    const colDeg = same ? rowDeg : new Int32Array(nc);
    crosses.row.forEach((r, k) => {
      const c = crosses.col[k];
      byCell.set(r * nc + c, k);
      rowDeg[r]++;
      colDeg[c]++;
      if (same) byCell.set(c * nc + r, k);
    });
    return { byCell, rowDeg, colDeg };
  }, [crosses, nr, nc, same]);

  // Display order (position → species) and its inverse, for each axis.
  // Names arrive in alphabetical order.
  const order = React.useMemo(() => {
    const make = (n: number, deg: Int32Array) => {
      const at = Int32Array.from({ length: n }, (_, i) => i);
      if (sort === 'crosses') at.sort((a, b) => deg[b] - deg[a] || a - b);
      const pos = new Int32Array(n);
      at.forEach((s, p) => (pos[s] = p));
      return { at, pos };
    };
    const r = make(nr, rowDeg);
    return { rows: r, cols: same ? r : make(nc, colDeg) };
  }, [sort, nr, nc, rowDeg, colDeg, same]);

  // Every registered cell in display coordinates, flat [row, col, …].
  const cells = React.useMemo(() => {
    const out = new Int32Array(crosses.row.length * (same ? 4 : 2));
    let n = 0;
    crosses.row.forEach((r, k) => {
      const c = crosses.col[k];
      out[n++] = order.rows.pos[r];
      out[n++] = order.cols.pos[c];
      if (same) {
        out[n++] = order.rows.pos[c];
        out[n++] = order.cols.pos[r];
      }
    });
    return out;
  }, [crosses, order, same]);

  const registered = crosses.row.length;
  const possible = same ? (nr * (nr - 1)) / 2 : nr * nc;
  const neverCrossed = React.useMemo(() => {
    let n = 0;
    for (let i = 0; i < nr; i++) if (!rowDeg[i]) n++;
    if (!same) for (let j = 0; j < nc; j++) if (!colDeg[j]) n++;
    return n;
  }, [rowDeg, colDeg, nr, nc, same]);

  const paper = theme === 'dark' ? DARK_COLORS.bg : '#ffffff';
  const ink = theme === 'dark' ? DARK_COLORS.fg : '#000000';
  const palette = React.useMemo(() => {
    const dark = theme === 'dark';
    const rgb = dark ? '236,236,236' : '0,0,0';
    return {
      paper,
      ink,
      empty: `rgba(${rgb},${dark ? 0.1 : 0.07})`,
      band: `rgba(${rgb},${dark ? 0.1 : 0.06})`,
      label: `rgba(${rgb},0.75)`,
      faint: `rgba(${rgb},0.5)`,
      wash: dark ? 'rgba(25,25,25,0.75)' : 'rgba(255,255,255,0.75)',
    };
  }, [theme, paper, ink]);

  const tokenItems = React.useMemo(
    () =>
      same
        ? rows.names.map((name) => ({ name, abbr: name }))
        : [
            ...rows.names.map((name) => ({ name, abbr: abbr(genus) })),
            ...cols.names.map((name) => ({ name, abbr: abbr(cross) })),
          ],
    [same, rows, cols, genus, cross],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const baseRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const viewRef = React.useRef<View>({ scale: 1, ox: 0, oy: 0 });
  // Whether the whole matrix is in view, so a resize keeps it that way.
  const fitRef = React.useRef(true);
  // The hovered cell, in display coordinates, and the pointer.
  const hoverRef = React.useRef<{
    r: number;
    c: number;
    x: number;
    y: number;
  } | null>(null);
  const frameRef = React.useRef(0);
  const dirtyRef = React.useRef(true);

  // Everything the drawing code reads, so the stable handlers below always
  // see fresh values.
  const stateRef = React.useRef(null as any);
  stateRef.current = {
    genus,
    cross,
    same,
    rows,
    cols,
    nr,
    nc,
    order,
    cells,
    byCell,
    rowDeg,
    colDeg,
    crosses,
    hybridGenera,
    selected,
    palette,
  };

  const geometry = () => {
    const { width, height } = sizeRef.current;
    const m = marginsFor(width);
    return {
      left: m.left,
      top: m.top,
      w: Math.max(0, width - m.left),
      h: Math.max(0, height - m.top),
    };
  };
  const fitScale = () => {
    const g = geometry();
    const s = stateRef.current;
    if (!s.nr || !s.nc) return 1;
    return Math.min(g.w / s.nc, g.h / s.nr, MAX_SCALE);
  };
  // Keeps the matrix in view: pinned to the top left when it fits, never
  // pulled past its edges when it doesn't.
  const clampView = (v: View): View => {
    const g = geometry();
    const s = stateRef.current;
    const fit = fitScale();
    const scale = clamp(v.scale, fit, Math.max(fit, MAX_SCALE));
    const mw = s.nc * scale;
    const mh = s.nr * scale;
    return {
      scale,
      ox: mw <= g.w ? 0 : clamp(v.ox, g.w - mw, 0),
      oy: mh <= g.h ? 0 : clamp(v.oy, g.h - mh, 0),
    };
  };
  const setView = (v: View) => {
    const next = clampView(v);
    const prev = viewRef.current;
    if (
      next.scale === prev.scale &&
      next.ox === prev.ox &&
      next.oy === prev.oy
    ) {
      return false;
    }
    viewRef.current = next;
    fitRef.current = next.scale <= fitScale() * 1.001;
    setZoomed(next.scale > fitScale() * 1.001);
    hoverRef.current = null;
    schedule(true);
    return true;
  };
  // Zooms by `factor` keeping the point (px, py) on the canvas still.
  const zoomAt = (factor: number, px: number, py: number) => {
    const g = geometry();
    const v = viewRef.current;
    const fit = fitScale();
    const scale = clamp(v.scale * factor, fit, Math.max(fit, MAX_SCALE));
    const ax = px - g.left;
    const ay = py - g.top;
    setView({
      scale,
      ox: ax - ((ax - v.ox) * scale) / v.scale,
      oy: ay - ((ay - v.oy) * scale) / v.scale,
    });
  };
  const zoomCenter = (factor: number) => {
    const g = geometry();
    zoomAt(factor, g.left + g.w / 2, g.top + g.h / 2);
  };
  const resetView = () => setView({ scale: fitScale(), ox: 0, oy: 0 });

  const fontFamily = () =>
    containerRef.current
      ? getComputedStyle(containerRef.current).fontFamily
      : 'sans-serif';

  // The cell under (px, py), in display coordinates, or null.
  const cellAt = (px: number, py: number) => {
    const g = geometry();
    const v = viewRef.current;
    const s = stateRef.current;
    if (px < g.left || py < g.top) return null;
    const c = Math.floor((px - g.left - v.ox) / v.scale);
    const r = Math.floor((py - g.top - v.oy) / v.scale);
    if (r < 0 || c < 0 || r >= s.nr || c >= s.nc) return null;
    return { r, c };
  };

  // Display positions of the picked species: rows and columns to keep lit.
  const litBands = () => {
    const s = stateRef.current;
    const rowsLit: number[] = [];
    const colsLit: number[] = [];
    for (const t of s.selected as number[]) {
      if (s.same) {
        rowsLit.push(s.order.rows.pos[t]);
        colsLit.push(s.order.cols.pos[t]);
      } else if (t < s.nr) rowsLit.push(s.order.rows.pos[t]);
      else colsLit.push(s.order.cols.pos[t - s.nr]);
    }
    return { rowsLit, colsLit };
  };

  const drawBase = () => {
    const canvas = baseRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = sizeRef.current;
    const s = stateRef.current;
    const pal = s.palette;
    const g = geometry();
    const { scale, ox, oy } = viewRef.current;
    const snap = (n: number) => Math.round(n * dpr) / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!s.nr || !s.nc) return;

    const x0 = g.left + ox;
    const y0 = g.top + oy;
    // The rows and columns in view.
    const r0 = Math.max(0, Math.floor(-oy / scale));
    const r1 = Math.min(s.nr, Math.ceil((g.h - oy) / scale));
    const c0 = Math.max(0, Math.floor(-ox / scale));
    const c1 = Math.min(s.nc, Math.ceil((g.w - ox) / scale));

    ctx.save();
    ctx.beginPath();
    ctx.rect(g.left, g.top, g.w, g.h);
    ctx.clip();

    // Every cell, unregistered until filled.
    ctx.fillStyle = pal.empty;
    ctx.fillRect(
      snap(x0 + c0 * scale),
      snap(y0 + r0 * scale),
      snap(x0 + c1 * scale) - snap(x0 + c0 * scale),
      snap(y0 + r1 * scale) - snap(y0 + r0 * scale),
    );

    // A species crossed with itself isn't a hybrid: the diagonal is left
    // blank.
    if (s.same) {
      ctx.fillStyle = pal.paper;
      ctx.beginPath();
      for (let d = Math.max(r0, c0); d < Math.min(r1, c1); d++) {
        ctx.rect(snap(x0 + d * scale), snap(y0 + d * scale), scale, scale);
      }
      ctx.fill();
    }

    // Registered crosses, in one path. Never smaller than a pixel, so a
    // lone cross still shows when the whole matrix is in view.
    const cells: Int32Array = s.cells;
    ctx.fillStyle = ORCHID;
    ctx.beginPath();
    for (let k = 0; k < cells.length; k += 2) {
      const r = cells[k];
      const c = cells[k + 1];
      if (r < r0 || r >= r1 || c < c0 || c >= c1) continue;
      const x = snap(x0 + c * scale);
      const y = snap(y0 + r * scale);
      ctx.rect(
        x,
        y,
        Math.max(1, snap(x0 + (c + 1) * scale) - x),
        Math.max(1, snap(y0 + (r + 1) * scale) - y),
      );
    }
    ctx.fill();

    // Gaps between cells, once they're big enough to spare them.
    if (scale >= GRID_MIN) {
      ctx.strokeStyle = pal.paper;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const top = y0 + r0 * scale;
      const bottom = y0 + r1 * scale;
      const left = x0 + c0 * scale;
      const right = x0 + c1 * scale;
      for (let c = c0 + 1; c < c1; c++) {
        const x = snap(x0 + c * scale) - 0.5;
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
      }
      for (let r = r0 + 1; r < r1; r++) {
        const y = snap(y0 + r * scale) - 0.5;
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Names beside the rows and above the columns, when they fit.
    const font = fontFamily();
    if (scale >= LABEL_MIN) {
      const fs = Math.min(13, Math.floor(scale * 0.8));
      ctx.font = `italic 400 ${fs}px ${font}`;
      ctx.fillStyle = pal.label;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, g.top, g.left, g.h);
      ctx.clip();
      for (let r = r0; r < r1; r++) {
        const name = s.rows.names[s.order.rows.at[r]];
        ctx.fillText(
          fitText(ctx, name, g.left - 10),
          g.left - 6,
          y0 + (r + 0.5) * scale,
        );
      }
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(g.left, 0, g.w, g.top);
      ctx.clip();
      ctx.textAlign = 'left';
      for (let c = c0; c < c1; c++) {
        const name = s.cols.names[s.order.cols.at[c]];
        ctx.save();
        ctx.translate(x0 + (c + 0.5) * scale, g.top - 6);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(fitText(ctx, name, g.top - 10), 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Which genus runs which way, in the corner.
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = pal.faint;
    ctx.font = `italic 400 12px ${font}`;
    ctx.fillText(
      fitText(ctx, `${s.cross} →`, g.left - 10),
      g.left - 6,
      g.top - 24,
    );
    ctx.fillText(
      fitText(ctx, `${s.genus} ↓`, g.left - 10),
      g.left - 6,
      g.top - 8,
    );
  };

  const drawOverlay = () => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const s = stateRef.current;
    const tip = tooltipRef.current;
    if (!s.nr || !s.nc) return;
    const pal = s.palette;
    const g = geometry();
    const { scale, ox, oy } = viewRef.current;
    const x0 = g.left + ox;
    const y0 = g.top + oy;
    const mw = Math.min(s.nc * scale, g.w - Math.max(0, ox));
    const mh = Math.min(s.nr * scale, g.h - Math.max(0, oy));
    const left = Math.max(g.left, x0);
    const top = Math.max(g.top, y0);
    const band = Math.max(scale, 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(g.left, g.top, g.w, g.h);
    ctx.clip();

    // Picked species: everything else washes out.
    const { rowsLit, colsLit } = litBands();
    if (rowsLit.length || colsLit.length) {
      ctx.fillStyle = pal.wash;
      ctx.fillRect(left, top, mw, mh);
      for (const r of rowsLit) {
        ctx.clearRect(left, y0 + r * scale, mw, band);
      }
      for (const c of colsLit) {
        ctx.clearRect(x0 + c * scale, top, band, mh);
      }
    }

    const hover = hoverRef.current;
    if (hover) {
      // The hovered row and column, and the cell where they meet.
      ctx.fillStyle = pal.band;
      ctx.fillRect(left, y0 + hover.r * scale, mw, band);
      ctx.fillRect(x0 + hover.c * scale, top, band, mh);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      const sz = Math.max(scale, 6);
      const cx = x0 + (hover.c + 0.5) * scale - sz / 2;
      const cy = y0 + (hover.r + 0.5) * scale - sz / 2;
      ctx.strokeRect(cx + 1, cy + 1, sz - 2, sz - 2);
    }
    ctx.restore();

    if (!hover) {
      if (tip) tip.style.visibility = 'hidden';
      return;
    }

    // The hovered species' names, over whatever labels are there.
    const font = fontFamily();
    ctx.font = `italic 500 12px ${font}`;
    ctx.textBaseline = 'middle';
    const rowName = fitText(
      ctx,
      s.rows.names[s.order.rows.at[hover.r]],
      g.left - 14,
    );
    const colName = fitText(
      ctx,
      s.cols.names[s.order.cols.at[hover.c]],
      g.top - 14,
    );
    const ry = clamp(y0 + (hover.r + 0.5) * scale, g.top + 8, g.top + g.h - 8);
    const rw = ctx.measureText(rowName).width;
    ctx.fillStyle = pal.paper;
    ctx.fillRect(0, ry - 9, g.left - 2, 18);
    ctx.fillStyle = pal.ink;
    ctx.textAlign = 'right';
    ctx.fillText(rowName, g.left - 6, ry);
    const cx = clamp(
      x0 + (hover.c + 0.5) * scale,
      g.left + 8,
      g.left + g.w - 8,
    );
    const cw = ctx.measureText(colName).width;
    ctx.save();
    ctx.translate(cx, g.top - 6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = pal.paper;
    ctx.fillRect(-4, -9, Math.max(cw + 8, g.top - 2), 18);
    ctx.fillStyle = pal.ink;
    ctx.textAlign = 'left';
    ctx.fillText(colName, 0, 0);
    ctx.restore();

    if (tip) fillTooltip(tip, hover);
  };

  // Writes the hovered cell into the tooltip and places it by the pointer.
  const fillTooltip = (
    tip: HTMLDivElement,
    hover: { r: number; c: number; x: number; y: number },
  ) => {
    const s = stateRef.current;
    const ri = s.order.rows.at[hover.r];
    const ci = s.order.cols.at[hover.c];
    const k: number | undefined = s.byCell.get(ri * s.nc + ci);
    const self = s.same && ri === ci;
    const set = (key: string, text: string) => {
      const el = tip.querySelector<HTMLElement>(`[data-k="${key}"]`);
      if (el) el.textContent = text;
    };
    const show = (key: string, on: boolean) =>
      tip
        .querySelectorAll<HTMLElement>(`[data-show="${key}"]`)
        .forEach((el) => (el.style.display = on ? '' : 'none'));

    set('rowGenus', s.genus);
    set('rowName', s.rows.names[ri]);
    set('colGenus', s.cross);
    set('colName', s.cols.names[ci]);
    set(
      'status',
      self ? 'Same species' : k !== undefined ? 'Registered' : 'Not registered',
    );
    tip
      .querySelector<HTMLElement>('[data-k="status"]')
      ?.setAttribute('data-registered', k !== undefined ? 'true' : 'false');
    show('hybrid', k !== undefined);
    if (k !== undefined) {
      const epithet = s.crosses.epithet[k];
      set('hybridGenus', s.hybridGenera[s.crosses.genus[k]]);
      set('hybridName', epithet);
      tip
        .querySelector<HTMLElement>('[data-k="hybridName"]')
        ?.setAttribute('data-italic', s.crosses.natural[k] ? 'true' : 'false');
      const year = s.crosses.year[k];
      const n = s.crosses.count[k];
      set(
        'hybridMeta',
        [
          s.crosses.natural[k] ? 'Natural hybrid' : null,
          year ? `Registered ${year}` : null,
          n > 1
            ? `${plural(n - 1, 'other registration', 'other registrations')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · '),
      );
    }
    show('degrees', !self);
    set('rowLabel', `${abbr(s.genus)} ${s.rows.names[ri]}`);
    set('rowDeg', fmt.format(s.rowDeg[ri]));
    set('colLabel', `${abbr(s.cross)} ${s.cols.names[ci]}`);
    set('colDeg', fmt.format(s.colDeg[ci]));
    set(
      'action',
      self
        ? ''
        : k !== undefined
          ? 'Click to open'
          : s.rows.ids[ri] && s.cols.ids[ci]
            ? 'Click to try this cross in the Hybridizer'
            : 'Not in the registry as a species, so it can’t be crossed in the Hybridizer',
    );
    show('action', !self);

    tip.style.visibility = 'visible';
    const { width, height } = sizeRef.current;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = hover.x + 14;
    let y = hover.y + 14;
    if (x + tw > width) x = hover.x - tw - 14;
    if (y + th > height) y = hover.y - th - 14;
    tip.style.transform = `translate(${clamp(x, 0, Math.max(0, width - tw))}px, ${clamp(y, 0, Math.max(0, height - th))}px)`;
  };

  const schedule = (base: boolean) => {
    if (base) dirtyRef.current = true;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        drawBase();
      }
      drawOverlay();
    });
  };

  // Where a click on a cell goes: the registered hybrid, or the Hybridizer
  // with the two species picked. Null when there's nowhere to go.
  const hrefOfCell = (r: number, c: number) => {
    const s = stateRef.current;
    const ri = s.order.rows.at[r];
    const ci = s.order.cols.at[c];
    if (s.same && ri === ci) return null;
    const k = s.byCell.get(ri * s.nc + ci);
    if (k !== undefined) {
      return makeHrefGrex({
        id: s.crosses.id[k],
        genus: s.hybridGenera[s.crosses.genus[k]],
        epithet: s.crosses.epithet[k],
      });
    }
    const a = s.rows.ids[ri];
    const b = s.cols.ids[ci];
    return a && b ? `/learn/hybridize?s=${a}&p=${b}` : null;
  };

  // Size the canvases to the container, at device resolution.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      // As tall as the matrix at full width, up to most of the screen, so a
      // small one doesn't sit above a blank page.
      const s = stateRef.current;
      const m = marginsFor(el.clientWidth);
      const cell = Math.min((el.clientWidth - m.left) / s.nc, MAX_SCALE);
      const most = clamp(window.innerHeight * 0.75, 420, 800);
      el.style.height = `${Math.round(clamp(m.top + s.nr * cell + 2, m.top + 60, most))}px`;
      const { width, height } = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const prev = sizeRef.current;
      if (prev.width === width && prev.height === height && prev.dpr === dpr) {
        return;
      }
      sizeRef.current = { width, height, dpr };
      for (const c of [baseRef.current, overlayRef.current]) {
        if (!c) continue;
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      const v = viewRef.current;
      viewRef.current = clampView(
        fitRef.current ? { ...v, scale: fitScale() } : v,
      );
      setZoomed(viewRef.current.scale > fitScale() * 1.001);
      hoverRef.current = null;
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

  // A new order puts the matrix back at its top left.
  React.useEffect(() => {
    const v = viewRef.current;
    if (!setView({ ...v, ox: 0, oy: 0 })) schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  React.useEffect(() => {
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, selected]);

  // Pan with a drag, zoom with a pinch or a modified wheel, hover for
  // details, and click to open a cross. On touch, the first tap shows the
  // details and a second tap on the same cell opens it.
  React.useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const hoverAt = (x: number, y: number) => {
      const cell = cellAt(x, y);
      hoverRef.current = cell ? { ...cell, x, y } : null;
      canvas.style.cursor =
        cell && hrefOfCell(cell.r, cell.c)
          ? 'pointer'
          : zoomedNow()
            ? 'grab'
            : 'default';
      schedule(false);
    };
    const zoomedNow = () => viewRef.current.scale > fitScale() * 1.001;

    const pointers = new Map<number, { x: number; y: number }>();
    let drag: {
      x: number;
      y: number;
      ox: number;
      oy: number;
      moved: boolean;
    } | null = null;
    let pinch: { d: number; scale: number } | null = null;
    let touched: string | null = null;
    const spread = () => {
      const [a, b] = Array.from(pointers.values());
      return {
        d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const p = local(e);
      pointers.set(e.pointerId, p);
      canvas.setPointerCapture(e.pointerId);
      if (pointers.size === 1) {
        const v = viewRef.current;
        drag = { ...p, ox: v.ox, oy: v.oy, moved: false };
      } else if (pointers.size === 2) {
        drag = null;
        pinch = { d: spread().d, scale: viewRef.current.scale };
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (!pointers.has(e.pointerId)) {
        if (e.pointerType === 'mouse') hoverAt(p.x, p.y);
        return;
      }
      pointers.set(e.pointerId, p);
      if (pinch && pointers.size === 2) {
        const now = spread();
        const target = pinch.scale * (now.d / pinch.d);
        zoomAt(target / viewRef.current.scale, now.x, now.y);
        return;
      }
      if (!drag) return;
      const dx = p.x - drag.x;
      const dy = p.y - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      canvas.style.cursor = 'grabbing';
      setView({ ...viewRef.current, ox: drag.ox + dx, oy: drag.oy + dy });
    };
    const onUp = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      const p = local(e);
      if (pointers.size < 2) pinch = null;
      if (pointers.size > 0) {
        drag = null;
        return;
      }
      const wasDrag = !drag || drag.moved;
      drag = null;
      if (wasDrag) {
        if (e.pointerType === 'mouse') hoverAt(p.x, p.y);
        return;
      }
      const cell = cellAt(p.x, p.y);
      if (!cell) return;
      const key = `${cell.r},${cell.c}`;
      if (e.pointerType !== 'mouse' && touched !== key) {
        touched = key;
        hoverAt(p.x, p.y);
        return;
      }
      touched = null;
      const href = hrefOfCell(cell.r, cell.c);
      if (!href) return;
      if (e.metaKey || e.ctrlKey) window.open(href, '_blank', 'noopener');
      else router.push(href);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || pointers.size) return;
      hoverRef.current = null;
      schedule(false);
    };
    // Ctrl or ⌘ with the wheel (and trackpad pinches) zoom. A plain wheel
    // pans a zoomed matrix, and scrolls the page once it reaches an edge.
    const onWheel = (e: WheelEvent) => {
      const p = local(e);
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(Math.exp(-e.deltaY * unit * 0.01), p.x, p.y);
        return;
      }
      if (!zoomedNow()) return;
      const v = viewRef.current;
      const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit;
      const dy = (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * unit;
      if (setView({ ...v, ox: v.ox - dx, oy: v.oy - dy })) e.preventDefault();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Picking a species zooms in far enough to read names, if need be, and
  // brings its row (and column) into view.
  const reveal = (t: number) => {
    const s = stateRef.current;
    const g = geometry();
    const v = viewRef.current;
    const scale = Math.max(v.scale, LABEL_MIN + 3);
    const isRow = s.same || t < s.nr;
    const isCol = s.same || t >= s.nr;
    const r = isRow ? s.order.rows.pos[t] : -1;
    const c = isCol ? s.order.cols.pos[s.same ? t : t - s.nr] : -1;
    setView({
      scale,
      ox: c >= 0 ? g.w / 2 - (c + 0.5) * scale : (v.ox * scale) / v.scale,
      oy: r >= 0 ? g.h / 2 - (r + 0.5) * scale : (v.oy * scale) / v.scale,
    });
  };

  const genusEl = <i>{genus}</i>;
  const crossEl = <i>{cross}</i>;
  const partner = partners.find((p) => p.g === cross);

  const partnerOptions: GenusOption[] = React.useMemo(
    () =>
      partners.map((p) => ({
        g: p.g,
        c: p.c,
        a: GENUS_TO_ABBREVIATION[p.g] ?? null,
        note: p.via ? `via ${p.via}` : undefined,
      })),
    [partners],
  );

  const sortOptions: { value: Sort; label: string; title: string }[] = [
    {
      value: 'crosses',
      label: 'Most crossed',
      title: 'Species with the most registered crosses first',
    },
    { value: 'name', label: 'A–Z', title: 'Species in alphabetical order' },
  ];

  const pickers = (
    <div className={style.pickers}>
      <GenusInput value={genus.toLowerCase()} hrefOf={(g) => hrefFor(g)} />
      {partners.length > 0 && (
        <GenusInput
          label='Crossed with'
          value={cross.toLowerCase()}
          hrefOf={(g) => hrefFor(genus, g)}
          options={partnerOptions}
          heading={`Genera crossed with ${genus}`}
          countLabel='Hybrids'
        />
      )}
    </div>
  );

  const toolbar = (
    <Toolbar
      leading={pickers}
      search={
        nr > 0 &&
        nc > 0 && (
          <Tokens
            items={tokenItems}
            noun='species'
            italic
            selected={selected}
            colorOf={() => ORCHID}
            onAdd={(t) => {
              setSelected((s) => (s.includes(t) ? s : [...s, t]));
              reveal(t);
            }}
            onRemove={(t) => setSelected((s) => s.filter((x) => x !== t))}
            onClear={() => setSelected([])}
          />
        )
      }
      secondary={
        nr > 0 &&
        nc > 0 && (
          <Segmented<Sort>
            label='Sort'
            hideLabel
            options={sortOptions}
            value={sort}
            onChange={setSort}
          />
        )
      }
      end={
        nr > 0 &&
        nc > 0 && (
          <div className={style.zoom}>
            <Button
              variant='outline'
              size='icon'
              aria-label='Zoom in'
              title='Zoom in (or ⌘/Ctrl + scroll)'
              onClick={() => zoomCenter(ZOOM_STEP)}
            >
              <ZoomIn />
            </Button>
            <Button
              variant='outline'
              size='icon'
              aria-label='Zoom out'
              title='Zoom out'
              disabled={!zoomed}
              onClick={() => zoomCenter(1 / ZOOM_STEP)}
            >
              <ZoomOut />
            </Button>
            <Button
              variant='outline'
              size='icon'
              aria-label='Fit the whole matrix'
              title='Fit the whole matrix'
              disabled={!zoomed}
              onClick={resetView}
            >
              <Maximize2 />
            </Button>
          </div>
        )
      }
    />
  );

  const heading = (
    <H2 className='sr-only'>
      Primary hybrids of {genusEl}
      {!same && <> and {crossEl}</>}
    </H2>
  );

  // A hybrid genus has no species of its own; point to the genera behind it.
  if (data.composition.length) {
    return (
      <div className={style.primary}>
        {heading}
        {toolbar}
        <div className={style.empty}>
          <p>
            {genusEl} is a hybrid genus, so it has no species of its own to
            cross. Its hybrids descend from{' '}
            {data.composition.map((g, k) => (
              <React.Fragment key={g}>
                {k > 0 && (k === data.composition.length - 1 ? ' and ' : ', ')}
                <i>{g}</i>
              </React.Fragment>
            ))}
            .
          </p>
          {data.composition.length === 2 && (
            <p>
              <Link href={hrefFor(data.composition[0], data.composition[1])}>
                See primary hybrids of <i>{data.composition[0]}</i> ×{' '}
                <i>{data.composition[1]}</i>
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!nr || !nc) {
    return (
      <div className={style.primary}>
        {heading}
        {toolbar}
        <p className={style.empty}>
          No species found in {!nr ? genusEl : crossEl}.
        </p>
      </div>
    );
  }

  return (
    <div className={style.primary}>
      {heading}
      {toolbar}

      <div className={style.status}>
        <p className={style.summary}>
          <strong>{fmt.format(registered)}</strong> of{' '}
          {plural(possible, 'possible cross', 'possible crosses')} registered (
          {pct(registered, possible)})
          {neverCrossed > 0 && (
            <>
              {' · '}
              <strong>{fmt.format(neverCrossed)}</strong> species never crossed
              {same ? '' : ' with the other genus'}
            </>
          )}
        </p>
        <ul className={style.legend}>
          <li>
            <span className={style.swatch} style={{ background: ORCHID }} />
            Registered
          </li>
          <li>
            <span
              className={style.swatch}
              style={{ background: palette.empty }}
            />
            Not yet registered
          </li>
        </ul>
      </div>
      {!same && (
        <p className={style.evidence}>
          {partner?.c ? (
            <>
              {plural(partner.c, 'hybrid', 'hybrids')} of any kind registered
              between {genusEl} and {crossEl}, so any of these crosses may be
              possible.
            </>
          ) : partner?.via ? (
            <>
              No hybrids registered directly between {genusEl} and {crossEl},
              but <i>{partner.via}</i> hybrids descend from both, so these
              crosses may be possible.
            </>
          ) : (
            <>
              No registered hybrids link {genusEl} and {crossEl}; these crosses
              may not be possible.
            </>
          )}
        </p>
      )}

      <div ref={containerRef} className={style.chart}>
        <canvas ref={baseRef} className={style.canvas} aria-hidden />
        <canvas
          ref={overlayRef}
          className={style.canvas}
          role='img'
          aria-label={`Matrix of ${genus} species against ${cross} species, filled where a primary hybrid is registered`}
        />
        <div ref={tooltipRef} className={style.tooltip} role='tooltip'>
          <div className={style.tooltipTitle}>
            <span>
              <i data-k='rowGenus' /> <i data-k='rowName' /> ×{' '}
              <i data-k='colGenus' /> <i data-k='colName' />
            </span>
          </div>
          <div className={style.statusLine}>
            <span data-k='status' className={style.badge} />
          </div>
          <div data-show='hybrid' className={style.hybrid}>
            <div>
              <i data-k='hybridGenus' /> <span data-k='hybridName' />
            </div>
            <div className={style.muted} data-k='hybridMeta' />
          </div>
          <div data-show='degrees' className={style.degreesTitle}>
            Primary hybrids registered
          </div>
          <dl data-show='degrees'>
            <dt data-k='rowLabel' />
            <dd data-k='rowDeg' />
            <dt data-k='colLabel' />
            <dd data-k='colDeg' />
          </dl>
          <div data-show='action' className={style.action} data-k='action' />
        </div>
      </div>
      <p className={style.hint}>
        Drag to pan. Zoom with the buttons, a pinch, or ⌘/Ctrl + scroll to read
        species names.
      </p>
    </div>
  );
}

// `text` cut short with an ellipsis to fit `room` pixels.
function fitText(ctx: CanvasRenderingContext2D, text: string, room: number) {
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
  return lo ? text.slice(0, lo).trimEnd() + '…' : '';
}
