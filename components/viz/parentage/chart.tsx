'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CircleHelp, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { H2 } from 'components/layout';
import GenusInput from 'components/genus-input';
import { makeHrefGrex } from 'components/link/grex';
import Tokens from 'components/viz/dominance/tokens';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';
import { DARK_COLORS } from 'lib/theme';

import type { ParentageData } from 'lib/fetchers/parentage';

import {
  EMPTY_LAYOUT,
  gridSlots,
  layOut,
  MIN_GAPPED,
  type GridSlots,
  type Layout,
} from './layout';
import style from './style.module.scss';
import { buildTour } from './tour';

type TypeFilter = 'all' | 'species' | 'hybrid';
type ParentFilter = 'any' | 'seed' | 'pollen';

const NOUNS: Record<TypeFilter, { one: string; many: string }> = {
  all: { one: 'orchid', many: 'orchids' },
  species: { one: 'species', many: 'species' },
  hybrid: { one: 'hybrid', many: 'hybrids' },
};

// The original chart's color: orchid, from a quarter to fully opaque as an
// orchid's progeny grow, and a faint gray for orchids with none.
const ORCHID = [218, 112, 214];
const MIN_ALPHA = 0.25;
const NONE_ALPHA = 0.1;
// Steps of the color scale, so cells can be filled a color at a time.
const LEVELS = 48;
// How far cells that aren't highlighted are mixed toward the page.
const FADE = { light: 0.75, dark: 0.7 };
const SLIDER_STEPS = 200;

// Parent epithets only expose a name, so species are told apart the same way
// `isSpecies` does for a full grex: a lowercase, non-numeric first character.
const isSpeciesName = (name: string) =>
  !!name &&
  name[0].toLowerCase() === name[0] &&
  !Number.isInteger(parseInt(name[0], 10));

const fmt = new Intl.NumberFormat('en-US');
const plural = (n: number, one: string, many: string) =>
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

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// The slider moves on a log scale, so small thresholds are as easy to pick as
// large ones. Position 0 is no threshold.
const sliderToValue = (pos: number, max: number) =>
  pos <= 0
    ? 0
    : Math.max(
        1,
        Math.round(Math.expm1((pos / SLIDER_STEPS) * Math.log1p(max))),
      );
const valueToSlider = (v: number, max: number) =>
  v <= 0 || max <= 0
    ? 0
    : Math.round((Math.log1p(v) / Math.log1p(max)) * SLIDER_STEPS);

// A treemap of every orchid in a genus, sized by how many hybrids name it as
// a parent.
export default function ParentageChart({ data }: { data: ParentageData }) {
  const { genus, names, seed, pollen } = data;
  const router = useRouter();
  const theme = useResolvedTheme();

  const [type, setType] = React.useState<TypeFilter>('all');
  const [parent, setParent] = React.useState<ParentFilter>('any');
  const [minProgeny, setMinProgeny] = React.useState(0);
  const [selected, setSelected] = React.useState<number[]>([]);
  // The progeny count whose group is opened up, or null.
  const [drill, setDrill] = React.useState<number | null>(null);
  // The step of the guide being shown, or null when it's closed.
  const [tour, setTour] = React.useState<number | null>(null);
  // Which side of the chart the guide's card sits on: away from what it's
  // pointing at.
  const [cardSide, setCardSide] = React.useState<'left' | 'right'>('left');
  // How many cells fit when a group is opened. Bigger groups can't be
  // opened: their orchids would be too small to read or tell apart.
  const [slots, setSlots] = React.useState<GridSlots>({ cols: 1, rows: 1 });

  const species = React.useMemo(
    () => Uint8Array.from(names, (n) => (isSpeciesName(n) ? 1 : 0)),
    [names],
  );
  const tokenItems = React.useMemo(
    () => names.map((name) => ({ name, abbr: name })),
    [names],
  );

  const values = React.useMemo(
    () =>
      Int32Array.from(names, (_, i) =>
        parent === 'seed'
          ? seed[i]
          : parent === 'pollen'
            ? pollen[i]
            : seed[i] + pollen[i],
      ),
    [names, seed, pollen, parent],
  );
  // The most progeny any orchid has, whatever the type filter, so colors
  // stay put as you filter.
  const max = React.useMemo(
    () => values.reduce((m, v) => Math.max(m, v), 0),
    [values],
  );
  // Every value, most first, for ranking an orchid against the genus.
  const ranked = React.useMemo(
    () => Int32Array.from(values).sort().reverse(),
    [values],
  );
  const rankOf = (v: number) => {
    // The number of orchids with more progeny, plus one.
    let lo = 0;
    let hi = ranked.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ranked[mid] > v) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };

  const matches = React.useCallback(
    (i: number) =>
      (type === 'all' || (type === 'species') === !!species[i]) &&
      values[i] >= minProgeny,
    [type, species, values, minProgeny],
  );

  // The orchids that pass the filters, most progeny first.
  const filtered = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < names.length; i++) if (matches(i)) out.push(i);
    return out.sort((a, b) => values[b] - values[a] || a - b);
  }, [names, matches, values]);

  // When a group is open, just its orchids, in alphabetical order since they
  // all have the same progeny.
  const drilled = React.useMemo(
    () =>
      drill === null
        ? null
        : filtered
            .filter((i) => values[i] === drill)
            .sort((a, b) => names[a].localeCompare(names[b])),
    [drill, filtered, values, names],
  );
  // A filter change can empty the open group; close it then.
  const openGroup = drilled?.length ? drill : null;
  const shown = openGroup !== null && drilled ? drilled : filtered;
  const capacity = slots.cols * slots.rows;

  // Colors, for this theme.
  const paper = theme === 'dark' ? DARK_COLORS.bg : '#ffffff';
  const ink = theme === 'dark' ? DARK_COLORS.fg : '#000000';
  const palette = React.useMemo(() => {
    const bg = rgbOf(paper);
    const fg = rgbOf(ink);
    const fade = theme === 'dark' ? FADE.dark : FADE.light;
    const dark = theme === 'dark';
    const top = dark ? maxMix(bg, DARK_MAX_LUMINANCE) : 1;
    const levels = Array.from({ length: LEVELS }, (_, l) =>
      mix(bg, ORCHID, MIN_ALPHA + ((top - MIN_ALPHA) * l) / (LEVELS - 1)),
    );
    const none = mix(bg, fg, NONE_ALPHA);
    // Index 0 is "no progeny"; 1..LEVELS climb the scale.
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
  }, [paper, ink, theme]);

  // The color step for `v` progeny. The scale runs on the square root of
  // progeny, so the many orchids with a few dozen still differ from those
  // with one.
  const levelOf = React.useCallback(
    (v: number) =>
      v <= 0
        ? 0
        : 1 +
          Math.round(
            Math.sqrt(Math.min(v, max) / Math.max(max, 1)) * (LEVELS - 1),
          ),
    [max],
  );
  const colorOf = (i: number) => palette.fill[levelOf(values[i])];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const baseRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const layoutRef = React.useRef<Layout>(EMPTY_LAYOUT);
  const hoverRef = React.useRef<{ node: number; x: number; y: number } | null>(
    null,
  );
  const groupCacheRef = React.useRef<{
    layout: Layout | null;
    value: number;
    members: number[];
  }>({ layout: null, value: -1, members: [] });
  // What the open guide step points at, found again after every layout.
  const tourPointRef = React.useRef<{ item: number } | { zero: true } | null>(
    null,
  );
  const frameRef = React.useRef(0);
  const dirtyRef = React.useRef({ layout: true, base: true });

  // What groups of orchids are called: "orchids", or more precisely when
  // only species or only hybrids are shown.
  const noun = NOUNS[type];

  // Everything the drawing code reads, so the stable callbacks below always
  // see fresh values.
  const stateRef = React.useRef(null as any);
  stateRef.current = {
    tour,
    noun,
    type,
    capacity,
    shown,
    values,
    openGroup,
    selected,
    palette,
    levelOf,
    names,
    species,
    seed,
    pollen,
    parent,
    filtered,
    rankOf,
    genus,
    matches,
  };

  const fontFamily = () =>
    containerRef.current
      ? getComputedStyle(containerRef.current).fontFamily
      : 'sans-serif';

  // Snaps a cell to device pixels and leaves a 1px gap on its right and
  // bottom, unless it's too small to spare one.
  const cellBox = (L: Layout, k: number) => {
    const { dpr } = sizeRef.current;
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

  // Which cells are highlighted: the selected orchids, and any group holding
  // one. Null when nothing is selected.
  const litCells = (L: Layout) => {
    const { selected: sel, values: vals, matches: ok } = stateRef.current;
    if (!sel.length) return null;
    const items = new Set<number>(sel);
    const groups = new Set<number>();
    for (const i of sel) if (ok(i)) groups.add(vals[i]);
    const lit = new Uint8Array(L.item.length);
    for (let k = 0; k < L.item.length; k++) {
      lit[k] =
        L.item[k] >= 0
          ? +items.has(L.item[k])
          : +(L.grouped.has(L.value[k]) && groups.has(L.value[k]));
    }
    return lit;
  };

  // The diagonal hatching that marks a group.
  const hatchRef = React.useRef<{ key: string; p: CanvasPattern | null }>({
    key: '',
    p: null,
  });
  // Reads the theme from the current palette, not this render's `theme`:
  // a draw can run from an earlier render's closure, such as the first one
  // after mounting, before the dark theme has been detected.
  const hatch = (ctx: CanvasRenderingContext2D) => {
    const { dpr } = sizeRef.current;
    const dark = stateRef.current.palette.dark;
    const key = `${dark ? 'dark' : 'light'}-${dpr}`;
    if (hatchRef.current.key === key) return hatchRef.current.p;
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
    hatchRef.current = { key, p };
    return p;
  };

  // Points the tooltip at the open guide step's target, as if hovered, and
  // moves the guide's card to the other side of the chart.
  const pointAtTourTarget = () => {
    const target = tourPointRef.current;
    if (!target) return;
    const L = layoutRef.current;
    let k = -1;
    for (let j = 0; j < L.item.length && k < 0; j++) {
      if (
        'item' in target
          ? L.item[j] === target.item
          : L.item[j] < 0 && L.value[j] === 0
      ) {
        k = j;
      }
    }
    if (k < 0) {
      hoverRef.current = null;
      return;
    }
    const x = L.x[k] + Math.min(L.w[k] / 2, 60);
    const y = L.y[k] + Math.min(L.h[k] / 2, 40);
    hoverRef.current = { node: k, x, y };
    setCardSide(
      L.x[k] + L.w[k] / 2 < sizeRef.current.width / 2 ? 'right' : 'left',
    );
  };

  const drawBase = () => {
    const canvas = baseRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = sizeRef.current;
    const s = stateRef.current;
    if (dirtyRef.current.layout) {
      layoutRef.current = layOut(
        s.shown,
        (i) => s.values[i],
        width,
        height,
        s.openGroup === null,
      );
      dirtyRef.current.layout = false;
      pointAtTourTarget();
    }
    const L = layoutRef.current;
    const pal = s.palette;
    const lit = litCells(L);
    const n = L.item.length;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // One path and one fill per color, faded or not.
    const level = new Int32Array(n);
    const boxes = Array.from({ length: n }, (_, k) => cellBox(L, k));
    const batches: number[][] = Array.from(
      { length: pal.fill.length * 2 },
      () => [],
    );
    for (let k = 0; k < n; k++) {
      level[k] = s.levelOf(L.value[k]);
      const faded = lit && !lit[k] ? pal.fill.length : 0;
      batches[faded + level[k]].push(k);
    }
    batches.forEach((cells, c) => {
      if (!cells.length) return;
      ctx.beginPath();
      for (const k of cells) {
        const b = boxes[k];
        ctx.rect(b.x, b.y, b.w, b.h);
      }
      ctx.fillStyle =
        c < pal.fill.length ? pal.fill[c] : pal.faded[c - pal.fill.length];
      ctx.fill();
    });

    // Hatch the groups.
    const pattern = hatch(ctx);
    if (pattern) {
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        if (L.item[k] >= 0) continue;
        const b = boxes[k];
        ctx.rect(b.x, b.y, b.w, b.h);
      }
      ctx.fillStyle = pattern;
      ctx.fill();
    }

    // Outline the highlighted cells.
    if (lit) {
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        if (!lit[k]) continue;
        const b = boxes[k];
        ctx.rect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5);
      }
      ctx.stroke();
    }

    // Labels: the name, and the progeny count beneath when there's room.
    // Bigger cells get bigger type, except groups: their labels all take the
    // smallest label size in this view, so they read as quiet annotations
    // rather than shouting by area.
    const font = fontFamily();
    ctx.textBaseline = 'top';
    const naturalSize = (b: { w: number; h: number }) =>
      clamp(Math.floor(Math.sqrt(b.w * b.h) / 8), 11, 22);
    const padFor = (size: number) => (size < 14 ? 3 : 5);
    const groupText = (k: number) =>
      plural(L.members[k], s.noun.one, s.noun.many);
    // The largest size up to its natural one at which group `k`'s count fits
    // whole, or 0 if it doesn't fit even at the smallest.
    const groupFit = (k: number) => {
      const b = boxes[k];
      const text = groupText(k);
      for (let size = naturalSize(b); size >= 11; size--) {
        const pad = padFor(size);
        if (b.h < size + pad * 2 - 2) continue;
        ctx.font = `400 ${size}px ${font}`;
        if (ctx.measureText(text).width <= b.w - pad * 2) return size;
      }
      return 0;
    };
    // The smallest size of any label drawn, orchid or group. Every group
    // that fits at all fits at this size too.
    let groupSize = Infinity;
    const groupFits = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      const b = boxes[k];
      if (b.w < 22 || b.h < 15) continue;
      const i = L.item[k];
      if (i < 0) {
        const fit = groupFit(k);
        if (!fit) continue;
        groupFits[k] = 1;
        groupSize = Math.min(groupSize, fit);
        continue;
      }
      const size = naturalSize(b);
      if (size >= groupSize) continue;
      const pad = padFor(size);
      if (b.h < size + pad * 2 - 2) continue;
      ctx.font = `${s.species[i] ? 'italic ' : ''}400 ${size}px ${font}`;
      if (fitText(ctx, s.names[i], b.w - pad * 2)) groupSize = size;
    }

    for (let k = 0; k < n; k++) {
      const b = boxes[k];
      if (b.w < 22 || b.h < 15) continue;
      const i = L.item[k];
      const isGroup = i < 0;
      // A group's count is never cut short, and a bare number would read as
      // progeny: it's labeled whole at the shared size, or not at all.
      if (isGroup && !groupFits[k]) continue;
      const size = isGroup ? groupSize : naturalSize(b);
      const pad = padFor(size);
      if (b.h < size + pad * 2 - 2) continue;
      const room = b.w - pad * 2;
      const italic = !isGroup && s.species[i];
      ctx.font = `${italic ? 'italic ' : ''}400 ${size}px ${font}`;
      const text = isGroup ? groupText(k) : fitText(ctx, s.names[i], room);
      if (!text) continue;
      const dim = lit && !lit[k];
      ctx.fillStyle = (dim ? pal.fadedLabel : pal.label)[level[k]];
      ctx.fillText(text, b.x + pad, b.y + pad);

      // In an open group every orchid has the same progeny, said above.
      if (s.openGroup !== null) continue;
      const sub = Math.max(10, Math.round(size * 0.75));
      if (b.h < pad * 2 + size + sub + 2) continue;
      const v = L.value[k];
      ctx.font = `300 ${sub}px ${font}`;
      // Numbers are never cut short: the wording shrinks, then goes.
      const line = firstFit(
        ctx,
        room,
        isGroup
          ? [`${plural(v, 'progeny', 'progeny')} each`, `${fmt.format(v)} each`]
          : [plural(v, 'progeny', 'progeny'), fmt.format(v)],
      );
      if (line) ctx.fillText(line, b.x + pad, b.y + pad + size + 2);
    }
  };

  const drawOverlay = () => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const tip = tooltipRef.current;
    const hover = hoverRef.current;
    const L = layoutRef.current;
    if (!hover || hover.node >= L.item.length) {
      if (tip) tip.style.visibility = 'hidden';
      return;
    }
    const s = stateRef.current;
    const b = cellBox(L, hover.node);
    ctx.strokeStyle = s.palette.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      b.x + 1,
      b.y + 1,
      Math.max(0, b.w - 2),
      Math.max(0, b.h - 2),
    );
    if (tip) fillTooltip(tip, hover.node, hover.x, hover.y);
  };

  // Writes the hovered cell into the tooltip and places it by the pointer,
  // inside the chart.
  const fillTooltip = (
    tip: HTMLDivElement,
    k: number,
    px: number,
    py: number,
  ) => {
    const s = stateRef.current;
    const L = layoutRef.current;
    const i = L.item[k];
    const v = L.value[k];
    const set = (key: string, text: string) => {
      const el = tip.querySelector<HTMLElement>(`[data-k="${key}"]`);
      if (el) el.textContent = text;
    };
    const show = (key: string, on: boolean) => {
      tip
        .querySelectorAll<HTMLElement>(`[data-show="${key}"]`)
        .forEach((el) => (el.style.display = on ? '' : 'none'));
    };
    const swatch = tip.querySelector<HTMLElement>('[data-k="swatch"]');
    if (swatch) swatch.style.background = s.palette.fill[s.levelOf(v)];

    if (i >= 0) {
      const name = tip.querySelector<HTMLElement>('[data-k="name"]');
      if (name) name.dataset.italic = s.species[i] ? 'true' : 'false';
      set('genus', s.genus);
      set('name', s.names[i]);
      set('kind', s.species[i] ? 'Species' : 'Hybrid');
      set('seed', fmt.format(s.seed[i]));
      set('pollen', fmt.format(s.pollen[i]));
      set('total', fmt.format(s.seed[i] + s.pollen[i]));
      set(
        'rank',
        v > 0
          ? `#${fmt.format(s.rankOf(v))} of ${fmt.format(s.names.length)}`
          : 'Never used',
      );
      set('action', 'Click to open');
    } else {
      // The group's orchids, worked out once per group while hovering.
      const cache = groupCacheRef.current;
      if (cache.layout !== L || cache.value !== v) {
        cache.layout = L;
        cache.value = v;
        cache.members = (s.filtered as number[]).filter(
          (j) => s.values[j] === v,
        );
      }
      const members = cache.members;
      const nSpecies = members.reduce((a, j) => a + s.species[j], 0);
      set('group', plural(members.length, s.noun.one, s.noun.many));
      set(
        'groupDetail',
        v === 0
          ? `never used as ${parentWord(s.parent)}`
          : `with ${plural(v, 'progeny', 'progeny')} each`,
      );
      set('groupSpecies', fmt.format(nSpecies));
      set('groupHybrids', fmt.format(members.length - nSpecies));
      set(
        'groupSample',
        members
          .slice(0, 3)
          .map((j) => s.names[j])
          .join(', ') + (members.length > 3 ? '…' : ''),
      );
      set(
        'action',
        members.length <= s.capacity
          ? 'Click to see them all'
          : 'Too many to show one by one. Search to find one.',
      );
    }
    show('item', i >= 0);
    show('group', i < 0);
    // The split is only news when both species and hybrids are shown.
    show('split', i < 0 && s.type === 'all');

    tip.style.visibility = 'visible';
    const { width, height } = sizeRef.current;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = px + 14;
    let y = py + 14;
    if (x + tw > width) x = px - tw - 14;
    if (y + th > height) y = py - th - 14;
    tip.style.transform = `translate(${clamp(x, 0, Math.max(0, width - tw))}px, ${clamp(y, 0, Math.max(0, height - th))}px)`;
  };

  const schedule = (base: boolean) => {
    if (base) dirtyRef.current.base = true;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      if (dirtyRef.current.base) {
        dirtyRef.current.base = false;
        drawBase();
      }
      drawOverlay();
    });
  };
  const relayout = () => {
    dirtyRef.current.layout = true;
    hoverRef.current = null;
    schedule(true);
  };

  // The cell under (px, py), or -1.
  const nodeAt = (px: number, py: number) => {
    const L = layoutRef.current;
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

  // Size the canvases to the container, at device resolution.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const prev = sizeRef.current;
      if (prev.width === width && prev.height === height && prev.dpr === dpr) {
        return;
      }
      sizeRef.current = { width, height, dpr };
      const next = gridSlots(width, height);
      setSlots((cur) =>
        cur.cols === next.cols && cur.rows === next.rows ? cur : next,
      );
      for (const c of [baseRef.current, overlayRef.current]) {
        if (!c) continue;
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      relayout();
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
    relayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, values, openGroup]);

  React.useEffect(() => {
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, palette, levelOf]);

  // Escape closes an open group.
  React.useEffect(() => {
    if (openGroup === null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'Escape') setDrill(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openGroup]);

  // Hover, and click to open an orchid or a group. On touch, the first tap
  // shows the tooltip and a second tap on the same cell opens it.
  React.useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const hoverAt = (x: number, y: number) => {
      const node = nodeAt(x, y);
      hoverRef.current = node >= 0 ? { node, x, y } : null;
      canvas.style.cursor = node >= 0 && canOpen(node) ? 'pointer' : 'default';
      schedule(false);
    };
    // Every orchid can be opened, and every group small enough to show its
    // orchids at a readable size.
    const canOpen = (k: number) => {
      const L = layoutRef.current;
      return L.item[k] >= 0 || L.members[k] <= stateRef.current.capacity;
    };
    const open = (k: number, newTab: boolean) => {
      if (!canOpen(k)) return;
      const s = stateRef.current;
      const L = layoutRef.current;
      const i = L.item[k];
      if (i < 0) {
        setDrill(L.value[k]);
        return;
      }
      // Lowercase, like the site's other genus URLs and the original chart's
      // links.
      const href = makeHrefGrex({
        id: '',
        genus: s.genus.toLowerCase(),
        epithet: s.names[i],
      });
      if (newTab) window.open(href, '_blank', 'noopener');
      else router.push(href);
    };

    let touchNode = -1;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || stateRef.current.tour !== null) return;
      const { x, y } = local(e);
      hoverAt(x, y);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || stateRef.current.tour !== null) return;
      hoverRef.current = null;
      schedule(false);
    };
    const onClick = (e: MouseEvent) => {
      if (stateRef.current.tour !== null) return;
      const { x, y } = local(e);
      const k = nodeAt(x, y);
      if (k < 0) return;
      const touch = (e as PointerEvent).pointerType === 'touch';
      if (touch && touchNode !== k) {
        touchNode = k;
        hoverAt(x, y);
        return;
      }
      touchNode = -1;
      open(k, e.metaKey || e.ctrlKey);
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // The guide: steps worked out from the data, each setting the filters and
  // highlight and pointing at a box. What was set before is put back when it
  // closes.
  const steps = React.useMemo(
    () => buildTour({ genus, names, seed, pollen, species }),
    [genus, names, seed, pollen, species],
  );
  const beforeTourRef = React.useRef<{
    type: TypeFilter;
    parent: ParentFilter;
    minProgeny: number;
    selected: number[];
    drill: number | null;
  }>(null);
  const tourCardRef = React.useRef<HTMLDivElement>(null);

  const startTour = () => {
    if (!steps.length) return;
    beforeTourRef.current = { type, parent, minProgeny, selected, drill };
    setTour(0);
  };
  const endTour = () => {
    setTour(null);
    tourPointRef.current = null;
    hoverRef.current = null;
    const before = beforeTourRef.current;
    beforeTourRef.current = null;
    if (before) {
      setType(before.type);
      setParent(before.parent);
      setMinProgeny(before.minProgeny);
      setSelected(before.selected);
      setDrill(before.drill);
    }
    schedule(false);
  };
  const goTo = (step: number) => {
    if (step < 0) return;
    if (step >= steps.length) endTour();
    else setTour(step);
  };

  React.useEffect(() => {
    if (tour === null) return;
    const step = steps[tour];
    setType(step.type);
    setParent('any');
    setMinProgeny(0);
    setDrill(null);
    setSelected(step.select);
    tourPointRef.current = step.point ?? null;
    if (!step.point) setCardSide('left');
    // Point now if the layout is unchanged; a new one points again.
    pointAtTourTarget();
    schedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, steps]);

  // Focus the guide when it opens, and let the arrow keys and Esc drive it.
  const tourOpen = tour !== null;
  React.useEffect(() => {
    if (!tourOpen) return;
    tourCardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
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
  }, [tourOpen]);

  const reset = () => {
    setType('all');
    setParent('any');
    setMinProgeny(0);
    setDrill(null);
  };
  const isFiltered = type !== 'all' || minProgeny > 0;
  const isNeutral = !isFiltered && parent === 'any' && openGroup === null;
  const genusEl = <em>{genus}</em>;

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'species', label: 'Species' },
    { value: 'hybrid', label: 'Hybrids' },
  ];
  const parentOptions: { value: ParentFilter; label: string; title: string }[] =
    [
      {
        value: 'any',
        label: 'Either',
        title: 'Count hybrids with this orchid as either parent',
      },
      {
        value: 'seed',
        label: 'Seed',
        title: 'Count only hybrids with this orchid as the seed parent',
      },
      {
        value: 'pollen',
        label: 'Pollen',
        title: 'Count only hybrids with this orchid as the pollen parent',
      },
    ];

  const header = (
    <div className={style.pageHeader}>
      <H2>{genusEl} parentage</H2>
      <div className={style.headerTools}>
        <GenusInput value={genus.toLowerCase()} basePath='/learn/parentage' />
        {names.length > 0 && (
          <Button
            // Filled while the guide is open.
            variant={tourOpen ? 'default' : 'outline'}
            size='icon'
            aria-label='How to read this chart'
            title='How to read this chart'
            aria-pressed={tourOpen}
            onClick={tourOpen ? endTour : startTour}
          >
            <CircleHelp />
          </Button>
        )}
      </div>
    </div>
  );

  if (!names.length) {
    return (
      <div className={style.parentage}>
        {header}
        <p className={style.empty}>No orchids found in the genus {genusEl}.</p>
      </div>
    );
  }

  return (
    <div className={style.parentage}>
      {header}

      <div className={style.controls}>
        <Tokens
          items={tokenItems}
          noun={`${genus} orchids`}
          italic={(i) => !!species[i]}
          selected={selected}
          colorOf={colorOf}
          onAdd={(i) => setSelected((s) => (s.includes(i) ? s : [...s, i]))}
          onRemove={(i) => setSelected((s) => s.filter((x) => x !== i))}
          onClear={() => setSelected([])}
        />

        <Segmented<TypeFilter>
          label='Show'
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        <Segmented<ParentFilter>
          label='As parent'
          options={parentOptions}
          value={parent}
          onChange={setParent}
        />

        <label className={style.threshold}>
          <span>
            At least <strong>{fmt.format(minProgeny)}</strong> progeny
          </span>
          <input
            type='range'
            min={0}
            max={SLIDER_STEPS}
            step={1}
            value={valueToSlider(minProgeny, max)}
            aria-valuetext={`At least ${minProgeny} progeny`}
            onChange={(e) =>
              setMinProgeny(sliderToValue(Number(e.target.value), max))
            }
          />
        </label>

        <Button
          variant='outline'
          size='icon'
          className={style.resetButton}
          aria-label='Reset filters'
          title='Reset filters'
          disabled={isNeutral}
          onClick={reset}
        >
          <RotateCcw />
        </Button>
      </div>

      {openGroup !== null && (
        <div className={style.status}>
          <div className={style.summary}>
            <>
              <Button
                variant='outline'
                size='sm'
                className={style.back}
                onClick={() => setDrill(null)}
              >
                <ArrowLeft />
                All {noun.many}
              </Button>
              <span>
                <strong>
                  {plural(drilled?.length ?? 0, noun.one, noun.many)}
                </strong>{' '}
                {openGroup === 0
                  ? `never used as ${parentWord(parent)}`
                  : `with ${plural(openGroup, 'progeny', 'progeny')} each`}
                , A to Z
              </span>
            </>
          </div>
        </div>
      )}

      <div ref={containerRef} className={style.chart}>
        <canvas ref={baseRef} className={style.canvas} aria-hidden />
        <canvas
          ref={overlayRef}
          className={style.canvas}
          role='img'
          aria-label={`Treemap of ${genus} orchids sized by their number of progeny`}
        />
        {!shown.length && (
          <p className={style.noMatch}>No orchids match these filters.</p>
        )}
        <div ref={tooltipRef} className={style.tooltip} role='tooltip'>
          <div className={style.tooltipTitle}>
            <span data-k='swatch' className={style.swatch} />
            <span data-show='item'>
              <i data-k='genus' /> <span data-k='name' />
            </span>
            <strong data-show='group' data-k='group' />
            <span data-show='item' data-k='kind' className={style.badge} />
          </div>
          <div data-show='group' className={style.muted} data-k='groupDetail' />
          <dl data-show='item'>
            <dt>Progeny</dt>
            <dd data-k='total' />
            <dt>As seed parent</dt>
            <dd data-k='seed' />
            <dt>As pollen parent</dt>
            <dd data-k='pollen' />
            <dt>Rank</dt>
            <dd data-k='rank' />
          </dl>
          <dl data-show='split'>
            <dt>Species</dt>
            <dd data-k='groupSpecies' />
            <dt>Hybrids</dt>
            <dd data-k='groupHybrids' />
          </dl>
          <div
            data-show='group'
            className={style.sample}
            data-k='groupSample'
          />
          <div className={style.action} data-k='action' />
        </div>
        {tourOpen && (
          <div
            ref={tourCardRef}
            className={style.tour}
            data-side={cardSide}
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
      </div>
    </div>
  );
}

const parentWord = (parent: ParentFilter) =>
  parent === 'seed'
    ? 'a seed parent'
    : parent === 'pollen'
      ? 'a pollen parent'
      : 'a parent';

// `text` cut short with an ellipsis to fit `room` pixels, or '' when not
// even a few letters fit.
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
  // A stub of two or three letters says little and clutters small cells.
  return lo >= Math.min(4, text.length - 1)
    ? text.slice(0, lo).trimEnd() + '…'
    : '';
}

// The first of `options` that fits `room` pixels whole, or ''.
function firstFit(
  ctx: CanvasRenderingContext2D,
  room: number,
  options: string[],
) {
  return options.find((t) => ctx.measureText(t).width <= room) ?? '';
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const id = React.useId();
  return (
    <div className={style.field}>
      <span id={id}>{label}</span>
      <div role='radiogroup' aria-labelledby={id} className={style.segmented}>
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
