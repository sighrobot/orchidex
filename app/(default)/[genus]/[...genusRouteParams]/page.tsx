import React, { cache } from 'react';

import { Grex } from 'lib/types';
import { queryGrexById } from 'lib/queries/grex';
import { UNKNOWN_CHAR, repairMalformedNaturalHybridEpithet } from 'lib/string';
import { querySearch } from 'lib/queries/search';
import { find } from 'lodash';
import GrexView from './view';

const fetchGrexByName = async ({
  genus,
  epithet,
}): Promise<Grex | undefined> => {
  if (!genus || !epithet) return;

  const quotedGenus = `"${genus}"`;
  const quotedEpithet = epithet.includes(UNKNOWN_CHAR)
    ? epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_')
    : `"${repairMalformedNaturalHybridEpithet({ epithet })}"`;

  try {
    const json = await querySearch({
      genus: quotedGenus,
      epithet: quotedEpithet,
    });

    let match: Grex;

    if (json.length === 1) {
      match = json[0];
    } else {
      match = find(json, (g) => g.epithet.length === epithet.length);
    }

    return match;
  } catch (e) {
    return;
  }
};

export const maybeGetGrex = cache(async function maybeGetGrex(g: string, e: string, id: string) {
  let grex: Grex | undefined;
  if (parseInt(id, 10)) {
    [grex] = await queryGrexById(id);
  } else if (g && e) {
    grex = await fetchGrexByName({ genus: g, epithet: e });
  }
  return grex;
});

export type GrexPageParams = Promise<{
  genus: string;
  genusRouteParams: [string, string];
}>;

export default async function GrexPage({ params }: { params: GrexPageParams }) {
  const { genus: g, genusRouteParams } = await params;
  const [e, id] = genusRouteParams;
  const grex = await maybeGetGrex(g, e, id);

  if (grex) {
    return <GrexView grex={grex} />;
  }
}
