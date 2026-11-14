import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import DominanceChart from 'components/viz/dominance/chart';
import { APP_TITLE } from 'lib/constants';
import { fetchDominance, OTHER_KIND } from 'lib/fetchers/dominance';

import type { DominanceKind } from 'lib/fetchers/dominance';

// `by` is the kind the page is within (a genus or a registrant) and `name`
// is which one: /learn/dominance/genus/Phalaenopsis splits Phalaenopsis
// registrations by registrant.
type Params = Promise<{ by: string; name: string }>;

// Registrations change slowly; rebuild the counts once a day.
export const revalidate = 86400;

const KINDS: DominanceKind[] = ['genus', 'registrant'];

// Names can hold characters that arrive still percent-encoded.
const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const resolve = async (params: Params) => {
  const { by, name } = await params;
  if (!KINDS.includes(by as DominanceKind)) notFound();
  return { by: by as DominanceKind, name: decode(name) };
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { by, name } = await resolve(params);
  const title = by === 'genus' ? `${name} by registrant` : `${name} by genus`;
  return {
    title: `${title} - Dominance - Learn | ${APP_TITLE}`,
    description:
      by === 'genus'
        ? `Who has registered ${name} hybrids with the Royal Horticultural Society, year by year.`
        : `Which genera ${name} has registered hybrids in with the Royal Horticultural Society, year by year.`,
  };
}

export default async function DominanceWithin({ params }: { params: Params }) {
  const { by, name } = await resolve(params);
  const kind = OTHER_KIND[by];
  const data = await fetchDominance(kind, { kind: by, name });
  if (!data.groups.length) notFound();

  // Keyed so each breakdown starts a fresh chart, which picks up the years in
  // view from the layout's shared state.
  return (
    <DominanceChart
      key={`${by}/${name}`}
      data={data}
      kind={kind}
      within={{ kind: by, name }}
    />
  );
}
