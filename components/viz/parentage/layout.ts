// Orchids whose cells would be smaller than this many square pixels are
// drawn together, one cell for all with the same number of progeny.
const MIN_CELL_AREA = 64;
// Cells narrower than this get no gap around them, so they don't vanish.
export const MIN_GAPPED = 4;
// The smallest cell in an open group: room for a short name, with a border.
// Groups too big to show at this size can't be opened.
const GRID_CELL = { w: 90, h: 24 };
const GRID_ASPECT = GRID_CELL.w / GRID_CELL.h;

export type GridSlots = { cols: number; rows: number };

// How many of the smallest open-group cells fit width × height: the most
// orchids a group can hold and still be opened.
export const gridSlots = (width: number, height: number): GridSlots => ({
  cols: Math.max(1, Math.floor(width / GRID_CELL.w)),
  rows: Math.max(1, Math.floor(height / GRID_CELL.h)),
});

// The cells as laid out: each one orchid, or a group of orchids that share
// a number of progeny and are too small to draw one by one.
export type Layout = {
  // Item index, or -1 for a group.
  item: Int32Array;
  // Each orchid's progeny in the cell.
  value: Int32Array;
  // How many orchids the cell holds.
  members: Int32Array;
  x: Float64Array;
  y: Float64Array;
  w: Float64Array;
  h: Float64Array;
  // The progeny counts that were grouped.
  grouped: Set<number>;
};

export const EMPTY_LAYOUT: Layout = {
  item: new Int32Array(0),
  value: new Int32Array(0),
  members: new Int32Array(0),
  x: new Float64Array(0),
  y: new Float64Array(0),
  w: new Float64Array(0),
  h: new Float64Array(0),
  grouped: new Set(),
};

// Lays out `items` (sorted, most progeny first) to fill width × height.
// Every orchid takes area for at least one progeny, as in the original
// chart, so those without any still show.
//
// With `condense`, orchids too small to draw one by one are grouped by
// their progeny. The single orchids are laid out as one block, which sits
// beside the groups, so the change from one to the other can't squeeze the
// last single orchids into a sliver. If any single orchid still comes out
// too thin to have a border, the smallest progeny count left is grouped too,
// and the layout tried again.
export function layOut(
  items: number[],
  valueOf: (i: number) => number,
  width: number,
  height: number,
  condense: boolean,
): Layout {
  if (!items.length || width <= 0 || height <= 0) return EMPTY_LAYOUT;

  if (!condense) {
    const n = items.length;
    return {
      item: Int32Array.from(items),
      value: Int32Array.from(items, valueOf),
      members: new Int32Array(n).fill(1),
      // An open group's orchids are all the same size, so they read better
      // as a grid in alphabetical order, left to right, than as a treemap.
      ...grid(n, width, height),
      grouped: new Set(),
    };
  }

  let units = 0;
  const bucket = new Map<number, number>();
  for (const i of items) {
    const v = valueOf(i);
    units += Math.max(v, 1);
    bucket.set(v, (bucket.get(v) ?? 0) + 1);
  }
  const pxPerUnit = (width * height) / units;
  const areaOf = (v: number, members: number) =>
    Math.max(v, 1) * members * pxPerUnit;

  const grouped = new Set<number>();
  // Orchids never used as a parent are always grouped, however much room
  // there is: one by one they'd only be a field of identical gray cells.
  // Others are grouped when they'd be too small to draw one by one.
  bucket.forEach((count, v) => {
    if (count > 1 && (v === 0 || areaOf(v, 1) < MIN_CELL_AREA)) grouped.add(v);
  });
  // Counts that could be grouped next if single orchids come out too thin,
  // smallest first.
  const next = Array.from(bucket.keys())
    .filter((v) => !grouped.has(v) && (bucket.get(v) ?? 0) > 1)
    .sort((a, b) => a - b);

  for (;;) {
    const layout = attempt(
      items,
      valueOf,
      bucket,
      grouped,
      areaOf,
      width,
      height,
    );
    if (!next.length || !hasSliver(layout)) return layout;
    grouped.add(next.shift()!);
  }
}

function attempt(
  items: number[],
  valueOf: (i: number) => number,
  bucket: Map<number, number>,
  grouped: Set<number>,
  areaOf: (v: number, members: number) => number,
  width: number,
  height: number,
): Layout {
  const singles = items.filter((i) => !grouped.has(valueOf(i)));
  const groups = Array.from(grouped);
  const n = singles.length + groups.length;

  const item = new Int32Array(n);
  const value = new Int32Array(n);
  const members = new Int32Array(n);
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const w = new Float64Array(n);
  const h = new Float64Array(n);

  type Rect = { x: number; y: number; w: number; h: number };
  // Splits `rect` among `areas` (which fill it), in order.
  const split = (rect: Rect, areas: number[]): Rect[] => {
    const r = squarify(Float64Array.from(areas), rect.w, rect.h);
    return areas.map((_, m) => ({
      x: rect.x + r.x[m],
      y: rect.y + r.y[m],
      w: r.w[m],
      h: r.h[m],
    }));
  };
  let k = 0;
  const put = (rect: Rect, i: number, v: number, count: number) => {
    item[k] = i;
    value[k] = v;
    members[k] = count;
    x[k] = rect.x;
    y[k] = rect.y;
    w[k] = rect.w;
    h[k] = rect.h;
    k++;
  };

  // Nested blocks, each laid out in order. A squarified layout always gives
  // its last cell the bottom-right corner, so:
  //   - the single orchids come first, putting the biggest parents top left;
  //   - the groups follow, most progeny first so they read in order, and
  //     the orchids never used as a parent come last, at the base of the chart. The other groups share a
  //     block of their own before it, so the smallest of them aren't
  //     squeezed in beside it.
  const singleAreas = singles.map((i) => areaOf(valueOf(i), 1));
  const others = groups
    .filter((v) => v !== 0)
    .map((v) => ({ v, area: areaOf(v, bucket.get(v) ?? 0) }))
    .sort((a, b) => b.v - a.v);
  const otherAreas = others.map((o) => o.area);
  const zeroArea = grouped.has(0) ? areaOf(0, bucket.get(0) ?? 0) : 0;
  const sum = (a: number[]) => a.reduce((t, v) => t + v, 0);

  const outer: { area: number; draw: (r: Rect) => void }[] = [];
  if (singles.length) {
    outer.push({
      area: sum(singleAreas),
      draw: (r) =>
        split(r, singleAreas).forEach((c, m) =>
          put(c, singles[m], valueOf(singles[m]), 1),
        ),
    });
  }
  const drawOthers = (r: Rect) =>
    split(r, otherAreas).forEach((c, m) =>
      put(c, -1, others[m].v, bucket.get(others[m].v) ?? 0),
    );
  if (others.length || zeroArea) {
    outer.push({
      area: sum(otherAreas) + zeroArea,
      draw: (r) => {
        if (!zeroArea) return drawOthers(r);
        if (!others.length) return put(r, -1, 0, bucket.get(0) ?? 0);
        const [a, b] = split(r, [sum(otherAreas), zeroArea]);
        drawOthers(a);
        put(b, -1, 0, bucket.get(0) ?? 0);
      },
    });
  }
  split(
    { x: 0, y: 0, w: width, h: height },
    outer.map((o) => o.area),
  ).forEach((r, j) => outer[j].draw(r));

  return { item, value, members, x, y, w, h, grouped: new Set(grouped) };
}

// Whether any single orchid is too thin to be drawn with a border.
function hasSliver(L: Layout) {
  for (let k = 0; k < L.item.length; k++) {
    if (L.item[k] >= 0 && Math.min(L.w[k], L.h[k]) < MIN_GAPPED) return true;
  }
  return false;
}

// `n` equal cells filling width × height, row by row, in as many columns as
// keep them about GRID_ASPECT wide.
function grid(n: number, width: number, height: number) {
  const cols = Math.max(
    1,
    Math.min(n, Math.round(Math.sqrt((n * width) / (height * GRID_ASPECT)))),
  );
  const rows = Math.ceil(n / cols);
  const cw = width / cols;
  const ch = height / rows;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const w = new Float64Array(n).fill(cw);
  const h = new Float64Array(n).fill(ch);
  for (let k = 0; k < n; k++) {
    x[k] = (k % cols) * cw;
    y[k] = Math.floor(k / cols) * ch;
  }
  return { x, y, w, h };
}

// Squarified treemap layout (Bruls, Huizing & van Wijk): fills a width ×
// height rectangle with one rectangle per area, in order, laying out rows
// along the shorter side and closing a row once adding to it would make its
// rectangles less square. `areas` should sum to width × height and are best
// sorted largest first.
function squarify(areas: Float64Array, width: number, height: number) {
  const n = areas.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const w = new Float64Array(n);
  const h = new Float64Array(n);

  let rx = 0;
  let ry = 0;
  let rw = width;
  let rh = height;
  let i = 0;

  while (i < n) {
    const side = Math.min(rw, rh);
    const side2 = side * side;
    let sum = 0;
    let min = Infinity;
    let max = 0;
    let worst = Infinity;
    let j = i;

    while (j < n) {
      const a = areas[j];
      const s = sum + a;
      const lo = Math.min(min, a);
      const hi = Math.max(max, a);
      const s2 = s * s;
      const next = Math.max((side2 * hi) / s2, s2 / (side2 * lo));
      if (j > i && next > worst) break;
      worst = next;
      sum = s;
      min = lo;
      max = hi;
      j++;
    }

    // The last row takes whatever space is left, so rounding never leaves a
    // sliver.
    const last = j === n;
    if (rw >= rh) {
      // A column on the left.
      const thick = last ? rw : sum / rh;
      let at = ry;
      for (let k = i; k < j; k++) {
        const len = k === j - 1 ? ry + rh - at : (areas[k] / sum) * rh;
        x[k] = rx;
        y[k] = at;
        w[k] = thick;
        h[k] = len;
        at += len;
      }
      rx += thick;
      rw -= thick;
    } else {
      // A row along the top.
      const thick = last ? rh : sum / rw;
      let at = rx;
      for (let k = i; k < j; k++) {
        const len = k === j - 1 ? rx + rw - at : (areas[k] / sum) * rw;
        x[k] = at;
        y[k] = ry;
        w[k] = len;
        h[k] = thick;
        at += len;
      }
      ry += thick;
      rh -= thick;
    }
    i = j;
  }

  return { x, y, w, h };
}
