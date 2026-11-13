import React from 'react';

import type { GenusDominanceData } from 'lib/fetchers/genus-dominance';

import type { Prepared, View } from './chart';

// One step of the guide: what it says, which genera it highlights, where the
// chart zooms to, and optionally a bar to point at with its tooltip.
export type TourStep = {
  text: React.ReactNode;
  select: number[];
  view: View;
  hover?: number;
};

// Years with fewer registrations than this are left out when picking the
// genera and numbers the guide talks about, so a handful of early hybrids
// can't make a genus look dominant.
const MIN_YEAR_TOTAL = 50;
// The guide's zoomed-in step looks at this many recent years.
const RECENT_YEARS = 30;
const COMPARE_YEAR = 1950;

const pct = (share: number) =>
  `${(share * 100).toFixed(share > 0 && share < 0.1 ? 1 : 0)}%`;

// The steps of the guide, worked out from the data: the genus that led
// early on, the one that leads now, and a third that's big today.
export function buildTour(
  p: Prepared,
  { start, end, genera }: GenusDominanceData,
): TourStep[] {
  if (!p.nYears) return [];
  const full: View = { x0: start, x1: end + 1, y0: 0, y1: 1 };
  // Genus names are italicized, as scientific names are.
  const name = (g: number) => <i>{genera[g].name}</i>;

  const busy: number[] = [];
  for (let y = 0; y < p.nYears; y++) {
    if (p.yearTotal[y] >= MIN_YEAR_TOTAL) busy.push(y);
  }
  if (!busy.length) for (let y = 0; y < p.nYears; y++) busy.push(y);

  const shareIn = (y: number, g: number) => {
    for (let i = p.yearOffset[y]; i < p.yearOffset[y + 1]; i++) {
      if (p.segGenus[i] === g) return p.segCount[i] / (p.yearTotal[y] || 1);
    }
    return 0;
  };
  const segIn = (y: number, g: number) => {
    for (let i = p.yearOffset[y]; i < p.yearOffset[y + 1]; i++) {
      if (p.segGenus[i] === g) return i;
    }
    return -1;
  };

  // The genus with the most registrations before COMPARE_YEAR (or in the
  // first half of the data, if it starts later), and the year it peaked.
  const compare = COMPARE_YEAR - start;
  const early = Math.max(
    busy[0] + 1,
    compare > 0 && compare < p.nYears ? compare : Math.ceil(p.nYears / 2),
  );
  const earlyTotals = new Map<number, number>();
  for (let i = 0; i < p.yearOffset[Math.min(early, p.nYears)]; i++) {
    const g = p.segGenus[i];
    earlyTotals.set(g, (earlyTotals.get(g) ?? 0) + p.segCount[i]);
  }
  let leaderThen = p.segGenus[p.yearOffset[busy[0]]];
  earlyTotals.forEach((n, g) => {
    if (n > (earlyTotals.get(leaderThen) ?? 0)) leaderThen = g;
  });
  const first = busy[0];
  let peakYear = first;
  for (const y of busy) {
    if (shareIn(y, leaderThen) > shareIn(peakYear, leaderThen)) peakYear = y;
  }
  const peakSeg = segIn(peakYear, leaderThen);

  const last = p.nYears - 1;
  const leaderNow = p.latestRanking[0] ?? leaderThen;
  const other = p.latestRanking.find(
    (g) => g !== leaderNow && g !== leaderThen,
  );

  // Fits the view to genera `gs` from year index `from` on.
  const fit = (gs: number[], from = 0): View => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const g of gs) {
      for (let k = p.byGenus.offset[g]; k < p.byGenus.offset[g + 1]; k++) {
        const i = p.byGenus.items[k];
        if (p.segYear[i] < from) continue;
        x0 = Math.min(x0, p.segYear[i]);
        x1 = Math.max(x1, p.segYear[i]);
        y0 = Math.min(y0, p.segY0[i]);
        y1 = Math.max(y1, p.segY1[i]);
      }
    }
    if (x0 > x1) return full;
    const pad = (y1 - y0) * 0.04;
    return { x0: start + x0, x1: start + x1 + 1, y0: y0 - pad, y1: y1 + pad };
  };

  const steps: TourStep[] = [];

  // 1. How to read it, pointing at the early leader's peak year.
  steps.push({
    text: (
      <>
        Each column is one year of orchid hybrids registered with the Royal
        Horticultural Society, split into a bar per genus by its share of the
        year. In {start + peakYear}, {name(leaderThen)} made up{' '}
        {pct(shareIn(peakYear, leaderThen))} of registrations.
      </>
    ),
    select: [],
    view: full,
    hover: peakSeg >= 0 ? peakSeg : undefined,
  });

  // 2. Rise and fall: the early leader against today's.
  const thenNow = shareIn(last, leaderThen);
  const fell = thenNow ? `shrank to ${pct(thenNow)}` : 'all but vanished';
  const since =
    compare > 0 && compare < last
      ? ` from ${pct(shareIn(compare, leaderNow))} in ${COMPARE_YEAR}`
      : '';
  steps.push({
    text:
      leaderThen === leaderNow ? (
        <>
          Follow a color to see a genus rise and fall. {name(leaderThen)} led
          early hybridizing and still leads, with {pct(thenNow)} of
          registrations in {end}.
        </>
      ) : (
        <>
          Follow a color to see a genus rise and fall. {name(leaderThen)} led
          early hybridizing but {fell} by {end}, while {name(leaderNow)} grew
          {since} to lead with {pct(shareIn(last, leaderNow))}.
        </>
      ),
    select: leaderThen === leaderNow ? [leaderThen] : [leaderThen, leaderNow],
    view: full,
  });

  // 3. Exploring: highlighting and zooming, shown on a genus big today.
  const focus = other ?? leaderNow;
  steps.push({
    text: (
      <>
        Highlight any genera you&rsquo;re curious about, then zoom in to compare
        them up close. Here&rsquo;s {name(focus)} over the last {RECENT_YEARS}{' '}
        years.
      </>
    ),
    select: [focus],
    view: fit([focus], Math.max(0, p.nYears - RECENT_YEARS)),
  });

  return steps;
}
