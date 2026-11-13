'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { H2 } from 'components/layout';
import GenusInput from 'components/genus-input';
import Tokens from 'components/viz/dominance/tokens';
import { useResolvedTheme } from 'lib/hooks/useResolvedTheme';

import type { GenusParentageData } from 'lib/fetchers/genus-parentage';

import {
  EMPTY_LAYOUT,
  gridSlots,
  layOut,
  type GridSlots,
  type Layout,
} from './layout';
import {
  cellBox,
  clamp,
  firstFit,
  fitText,
  fmt,
  levelFor,
  makeHatch,
  nodeAt,
  plural,
  Segmented,
  SLIDER_STEPS,
  sliderToValue,
  usePalette,
  valueToSlider,
} from './shared';
import style from './style.module.scss';

// What a genus's cell is sized by: the orchids registered in it, or how
// often its orchids are named as parents.
type Measure = 'registered' | 'parent';
type ParentFilter = 'any' | 'seed' | 'pollen';

const UNIT: Record<Measure, { one: string; many: string }> = {
  registered: { one: 'registration', many: 'registrations' },
  parent: { one: 'progeny', many: 'progeny' },
};

// A treemap of every genus, sized by registrations or by use as a parent.
// Each genus opens its own parentage map.
export default function GeneraChart({ data }: { data: GenusParentageData }) {
  const { genera, abbrs, registered, seed, pollen, outside, species } = data;
  const router = useRouter();
  const theme = useResolvedTheme();

  const [measure, setMeasure] = React.useState<Measure>('parent');
  const [parent, setParent] = React.useState<ParentFilter>('any');
  const [minValue, setMinValue] = React.useState(0);
  const [selected, setSelected] = React.useState<number[]>([]);
  // The value whose group is opened up, or null.
  const [drill, setDrill] = React.useState<number | null>(null);
  const [slots, setSlots] = React.useState<GridSlots>({ cols: 1, rows: 1 });

  const tokenItems = React.useMemo(
    () => genera.map((name, i) => ({ name, abbr: abbrs[i] })),
    [genera, abbrs],
  );

  const values = React.useMemo(
    () =>
      Int32Array.from(genera, (_, i) =>
        measure === 'registered'
          ? registered[i]
          : parent === 'seed'
            ? seed[i]
            : parent === 'pollen'
              ? pollen[i]
              : seed[i] + pollen[i],
      ),
    [genera, registered, seed, pollen, measure, parent],
  );
  const max = React.useMemo(
    () => values.reduce((m, v) => Math.max(m, v), 0),
    [values],
  );
  const ranked = React.useMemo(
    () => Int32Array.from(values).sort().reverse(),
    [values],
  );
  const rankOf = (v: number) => {
    let lo = 0;
    let hi = ranked.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ranked[mid] > v) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };

  // A new measure means new values: thresholds and open groups no longer
  // mean the same thing.
  React.useEffect(() => {
    setMinValue(0);
    setDrill(null);
  }, [measure, parent]);

  const filtered = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < genera.length; i++) {
      if (values[i] >= minValue) out.push(i);
    }
    return out.sort((a, b) => values[b] - values[a] || a - b);
  }, [genera, values, minValue]);

  const drilled = React.useMemo(
    () =>
      drill === null
        ? null
        : filtered
            .filter((i) => values[i] === drill)
            .sort((a, b) => genera[a].localeCompare(genera[b])),
    [drill, filtered, values, genera],
  );
  const openGroup = drilled?.length ? drill : null;
  const shown = openGroup !== null && drilled ? drilled : filtered;
  const capacity = slots.cols * slots.rows;

  const palette = usePalette(theme);
  const levelOf = React.useCallback((v: number) => levelFor(v, max), [max]);
  const colorOf = (i: number) => palette.fill[levelOf(values[i])];
  const unit = UNIT[measure];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const baseRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });
  const layoutRef = React.useRef<Layout>(EMPTY_LAYOUT);
  const hoverRef = React.useRef<{ node: number; x: number; y: number } | null>(
    null,
  );
  const hatchRef = React.useRef(makeHatch());
  const frameRef = React.useRef(0);
  const dirtyRef = React.useRef({ layout: true, base: true });

  // Everything the drawing code reads, so the stable callbacks below always
  // see fresh values.
  const stateRef = React.useRef(null as any);
  stateRef.current = {
    capacity,
    shown,
    values,
    openGroup,
    selected,
    palette,
    levelOf,
    genera,
    abbrs,
    registered,
    seed,
    pollen,
    outside,
    species,
    measure,
    parent,
    unit,
    filtered,
    rankOf,
  };

  const fontFamily = () =>
    containerRef.current
      ? getComputedStyle(containerRef.current).fontFamily
      : 'sans-serif';

  // Which cells are highlighted: the selected genera, and any group holding
  // one. Null when nothing is selected.
  const litCells = (L: Layout) => {
    const { selected: sel, values: vals } = stateRef.current;
    if (!sel.length) return null;
    const items = new Set<number>(sel);
    const groups = new Set<number>(sel.map((i: number) => vals[i]));
    const lit = new Uint8Array(L.item.length);
    for (let k = 0; k < L.item.length; k++) {
      lit[k] =
        L.item[k] >= 0
          ? +items.has(L.item[k])
          : +(L.grouped.has(L.value[k]) && groups.has(L.value[k]));
    }
    return lit;
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
    }
    const L = layoutRef.current;
    const pal = s.palette;
    const lit = litCells(L);
    const n = L.item.length;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // One path and one fill per color, faded or not.
    const level = new Int32Array(n);
    const boxes = Array.from({ length: n }, (_, k) => cellBox(L, k, dpr));
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
    const pattern = hatchRef.current(ctx, pal.dark, dpr);
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

    // Labels: the genus, or its abbreviation when the name doesn't fit, and
    // the count beneath when there's room. Groups say how many genera they
    // hold, at the smallest size, as quiet annotations.
    const font = fontFamily();
    ctx.textBaseline = 'top';
    const naturalSize = (b: { w: number; h: number }) =>
      clamp(Math.floor(Math.sqrt(b.w * b.h) / 8), 11, 22);
    const padFor = (size: number) => (size < 14 ? 3 : 5);
    const groupText = (k: number) => plural(L.members[k], 'genus', 'genera');

    for (let k = 0; k < n; k++) {
      const b = boxes[k];
      if (b.w < 22 || b.h < 15) continue;
      const i = L.item[k];
      const isGroup = i < 0;
      const size = isGroup ? 11 : naturalSize(b);
      const pad = padFor(size);
      if (b.h < size + pad * 2 - 2) continue;
      const room = b.w - pad * 2;
      ctx.font = `${isGroup ? '' : 'italic '}400 ${size}px ${font}`;
      let text: string;
      if (isGroup) {
        text = firstFit(ctx, room, [groupText(k)]);
      } else {
        text = fitText(ctx, s.genera[i], room);
        // A cut-short name reads worse than the whole abbreviation.
        if (text !== s.genera[i] && s.abbrs[i] !== s.genera[i]) {
          text = firstFit(ctx, room, [s.abbrs[i]]) || text;
        }
      }
      if (!text) continue;
      const dim = lit && !lit[k];
      ctx.fillStyle = (dim ? pal.fadedLabel : pal.label)[level[k]];
      ctx.fillText(text, b.x + pad, b.y + pad);

      // In an open group every genus has the same value, said above.
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
          ? [
              `${plural(v, s.unit.one, s.unit.many)} each`,
              `${fmt.format(v)} each`,
            ]
          : [plural(v, s.unit.one, s.unit.many), fmt.format(v)],
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
    const b = cellBox(L, hover.node, dpr);
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
      set('name', s.genera[i]);
      set('abbr', s.abbrs[i] !== s.genera[i] ? s.abbrs[i] : '');
      set('registered', fmt.format(s.registered[i]));
      set('total', fmt.format(s.seed[i] + s.pollen[i]));
      set('seed', fmt.format(s.seed[i]));
      set('pollen', fmt.format(s.pollen[i]));
      set('outside', fmt.format(s.outside[i]));
      set('species', fmt.format(s.species[i]));
      set(
        'rank',
        v > 0
          ? `#${fmt.format(s.rankOf(v))} of ${fmt.format(s.genera.length)}`
          : '—',
      );
      set('action', 'Click for its parentage map');
    } else {
      const members = (s.filtered as number[]).filter((j) => s.values[j] === v);
      set('group', plural(members.length, 'genus', 'genera'));
      set(
        'groupDetail',
        v === 0
          ? s.measure === 'registered'
            ? 'with no registrations, only named as parents'
            : `never used as ${parentWord(s.parent)}`
          : `with ${plural(v, s.unit.one, s.unit.many)} each`,
      );
      set(
        'groupSample',
        members
          .slice(0, 3)
          .map((j) => s.genera[j])
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

  // Hover, and click to open a genus or a group. On touch, the first tap
  // shows the tooltip and a second tap on the same cell opens it.
  React.useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const canOpen = (k: number) => {
      const L = layoutRef.current;
      return L.item[k] >= 0 || L.members[k] <= stateRef.current.capacity;
    };
    const hoverAt = (x: number, y: number) => {
      const node = nodeAt(layoutRef.current, x, y);
      hoverRef.current = node >= 0 ? { node, x, y } : null;
      canvas.style.cursor = node >= 0 && canOpen(node) ? 'pointer' : 'default';
      schedule(false);
    };
    const open = (k: number, newTab: boolean) => {
      if (!canOpen(k)) return;
      const L = layoutRef.current;
      const i = L.item[k];
      if (i < 0) {
        setDrill(L.value[k]);
        return;
      }
      const href = `/learn/parentage/${encodeURIComponent(
        stateRef.current.genera[i].toLowerCase(),
      )}`;
      if (newTab) window.open(href, '_blank', 'noopener');
      else router.push(href);
    };

    let touchNode = -1;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const { x, y } = local(e);
      hoverAt(x, y);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hoverRef.current = null;
      schedule(false);
    };
    const onClick = (e: MouseEvent) => {
      const { x, y } = local(e);
      const k = nodeAt(layoutRef.current, x, y);
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

  const reset = () => {
    setMeasure('parent');
    setParent('any');
    setMinValue(0);
    setDrill(null);
  };
  const isNeutral =
    measure === 'parent' &&
    parent === 'any' &&
    minValue === 0 &&
    openGroup === null;

  const measureOptions: { value: Measure; label: string; title: string }[] = [
    {
      value: 'parent',
      label: 'Parentage',
      title: 'Size each genus by how many hybrids its orchids are parents of',
    },
    {
      value: 'registered',
      label: 'Registrations',
      title: 'Size each genus by how many orchids are registered in it',
    },
  ];
  const parentOptions: { value: ParentFilter; label: string; title: string }[] =
    [
      {
        value: 'any',
        label: 'Either',
        title: 'Count hybrids with an orchid of this genus as either parent',
      },
      {
        value: 'seed',
        label: 'Seed',
        title: 'Count only hybrids with an orchid of this genus as seed parent',
      },
      {
        value: 'pollen',
        label: 'Pollen',
        title:
          'Count only hybrids with an orchid of this genus as pollen parent',
      },
    ];

  return (
    <div className={style.parentage}>
      <div className={style.pageHeader}>
        <H2>Parentage of all genera</H2>
        <div className={style.headerTools}>
          <GenusInput value='' basePath='/learn/parentage' />
        </div>
      </div>

      <div className={style.controls}>
        <Tokens
          items={tokenItems}
          noun='genera'
          italic
          selected={selected}
          colorOf={colorOf}
          onAdd={(i) => setSelected((s) => (s.includes(i) ? s : [...s, i]))}
          onRemove={(i) => setSelected((s) => s.filter((x) => x !== i))}
          onClear={() => setSelected([])}
        />

        <Segmented<Measure>
          label='Size by'
          options={measureOptions}
          value={measure}
          onChange={setMeasure}
        />
        {measure === 'parent' && (
          <Segmented<ParentFilter>
            label='Parent'
            options={parentOptions}
            value={parent}
            onChange={setParent}
          />
        )}

        <label className={style.threshold}>
          <span>
            At least <strong>{fmt.format(minValue)}</strong>
          </span>
          <input
            type='range'
            min={0}
            max={SLIDER_STEPS}
            step={1}
            value={valueToSlider(minValue, max)}
            aria-valuetext={`At least ${minValue} ${unit.many}`}
            onChange={(e) =>
              setMinValue(sliderToValue(Number(e.target.value), max))
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
            <Button
              variant='outline'
              size='sm'
              className={style.back}
              onClick={() => setDrill(null)}
            >
              <ArrowLeft />
              All genera
            </Button>
            <span>
              <strong>{plural(drilled?.length ?? 0, 'genus', 'genera')}</strong>{' '}
              with {plural(openGroup, unit.one, unit.many)} each, A to Z
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className={style.chart}>
        <canvas ref={baseRef} className={style.canvas} aria-hidden />
        <canvas
          ref={overlayRef}
          className={style.canvas}
          role='img'
          aria-label={`Treemap of orchid genera sized by ${measure === 'registered' ? 'registrations' : 'progeny'}`}
        />
        {!shown.length && (
          <p className={style.noMatch}>No genera match these filters.</p>
        )}
        <div ref={tooltipRef} className={style.tooltip} role='tooltip'>
          <div className={style.tooltipTitle}>
            <span data-k='swatch' className={style.swatch} />
            <span data-show='item'>
              <i data-k='name' /> <span data-k='abbr' className={style.muted} />
            </span>
            <strong data-show='group' data-k='group' />
          </div>
          <div data-show='group' className={style.muted} data-k='groupDetail' />
          <dl data-show='item'>
            <dt>Registrations</dt>
            <dd data-k='registered' />
            <dt>Progeny</dt>
            <dd data-k='total' />
            <dt>As seed parent</dt>
            <dd data-k='seed' />
            <dt>As pollen parent</dt>
            <dd data-k='pollen' />
            <dt>In other genera</dt>
            <dd data-k='outside' />
            <dt>Accepted species</dt>
            <dd data-k='species' />
            <dt>Rank</dt>
            <dd data-k='rank' />
          </dl>
          <div
            data-show='group'
            className={style.sample}
            data-k='groupSample'
          />
          <div className={style.action} data-k='action' />
        </div>
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
