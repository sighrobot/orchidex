import React from 'react';

// What a guide step sets up: the filters, the orchids highlighted, and what
// to point at with its tooltip: an orchid, or the block of orchids never
// used as a parent.
export type TourStep = {
  text: React.ReactNode;
  type: 'all' | 'species' | 'hybrid';
  select: number[];
  point?: { item: number } | { zero: true };
};

const fmt = new Intl.NumberFormat('en-US');
const pct = (n: number, of: number) => `${Math.round((n / of) * 100)}%`;

// The steps of the guide, worked out from the genus's data: its most-used
// parent, how many of its orchids have never been used, and its most-used
// hybrid (or species, if it has no hybrids in use).
export function buildTour({
  genus,
  names,
  seed,
  pollen,
  species,
}: {
  genus: string;
  names: string[];
  seed: number[];
  pollen: number[];
  species: Uint8Array;
}): TourStep[] {
  const n = names.length;
  if (!n) return [];
  const total = (i: number) => seed[i] + pollen[i];
  const G = <i>{genus}</i>;
  const name = (i: number) =>
    species[i] ? (
      <>
        {G} <i>{names[i]}</i>
      </>
    ) : (
      <>
        {G} {names[i]}
      </>
    );
  const progeny = (i: number) =>
    `${fmt.format(total(i))} ${total(i) === 1 ? 'hybrid' : 'hybrids'}`;

  // `names` comes sorted by progeny, most first.
  const top = 0;
  let zeros = 0;
  for (let i = 0; i < n; i++) if (!total(i)) zeros++;
  // The most-used orchid of the other kind from the top one, for the last
  // step.
  const otherKind = species[top] ? 0 : 1;
  let pick = -1;
  for (let i = 0; i < n; i++) {
    if (species[i] === otherKind && total(i) > 0) {
      pick = i;
      break;
    }
  }

  // How much of all parentage the most-used few account for, and the share
  // at which that's worth pointing out.
  const FEW = 10;
  const CONCENTRATED = 0.3;
  let all = 0;
  let few = 0;
  for (let i = 0; i < n; i++) {
    all += total(i);
    if (i < FEW) few += total(i);
  }
  const used = n - zeros;

  const steps: TourStep[] = [];

  // 1. What size means, on the most-used parent.
  steps.push({
    text: total(top) ? (
      <>
        Each box is one {G} species or hybrid, sized by how many registered
        hybrids name it as a parent. {name(top)} leads, a parent of{' '}
        {progeny(top)}.
      </>
    ) : (
      <>
        Each box is one {G} species or hybrid, sized by how many registered
        hybrids name it as a parent. None has been used as one yet.
      </>
    ),
    type: 'all',
    select: total(top) ? [top] : [],
    point: total(top) ? { item: top } : undefined,
  });

  // 2. The long tail: most orchids are never crossed, and in some genera
  // crosses lean on a few favorites.
  const concentrated = used > FEW && few / all >= CONCENTRATED;
  steps.push({
    text:
      zeros > 1 ? (
        <>
          Most orchids are never used in a cross: {fmt.format(zeros)} of{' '}
          {fmt.format(n)} {G} orchids ({pct(zeros, n)}) have no registered
          progeny.
          {concentrated && (
            <>
              {' '}
              Crosses lean on a few favorites, with the {FEW} most used behind{' '}
              {pct(few, all)} of all {G} parentage.
            </>
          )}
        </>
      ) : concentrated ? (
        <>
          Crosses lean on a few favorites: the {FEW} most used {G} orchids are
          behind {pct(few, all)} of all its parentage.
        </>
      ) : (
        <>
          Parentage is spread widely: no handful of {G} orchids dominates its
          registered hybrids.
        </>
      ),
    type: 'all',
    select: [],
    point: zeros > 1 ? { zero: true } : undefined,
  });

  // 3. Species and hybrids as parents.
  steps.push({
    text:
      pick >= 0 && !otherKind ? (
        <>
          Hybrids are crossed too, so new hybrids build on earlier ones over
          generations. Among hybrids, {name(pick)} is the most used, a parent of{' '}
          {progeny(pick)}.
        </>
      ) : pick >= 0 ? (
        <>
          Species are where every line starts, and they are still crossed for
          traits hybrids have lost. Among species, {name(pick)} is the most
          used, a parent of {progeny(pick)}.
        </>
      ) : (
        <>
          Hybrids are crossed too, so new hybrids build on earlier ones over
          generations, while species are where every line starts.
        </>
      ),
    type: pick >= 0 ? (otherKind ? 'species' : 'hybrid') : 'all',
    select: pick >= 0 ? [pick] : [],
    point: pick >= 0 ? { item: pick } : undefined,
  });

  return steps;
}
