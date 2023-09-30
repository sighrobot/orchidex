import React from 'react';

import { Grex } from 'lib/types';
import { fetchGrexByName } from 'lib/hooks/useAncestry';
import { fetchGrex } from 'lib/hooks/useGrex';
import GrexView from './view';

export async function maybeGetGrex(g: string, e: string, id: string) {
  let grex: Grex | undefined;
  if (parseInt(id, 10)) {
    grex = await fetchGrex(id);
  } else if (g && e) {
    grex = await fetchGrexByName({ genus: g, epithet: e });
  }
  return grex;
}

export default async function GrexPage({
  params: { genus: g, params } = { genus: '', params: [] },
} = {}) {
  const [e, id] = params;
  const grex = await maybeGetGrex(g, e, id);

  if (grex) {
    return <GrexView grex={grex} />;
  }
}
