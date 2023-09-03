import { query } from 'lib/pg';
import { capitalize } from 'lib/utils';

import type { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async function GetWcvp(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const g = searchParams.get('genus');
  const epithet = searchParams.get('epithet');
  const genus = capitalize(g);

  let q = '';

  if (epithet) {
    q = `select * from wcvp where taxon_name = '${genus} ${epithet
      .replace(/ var /g, ' var. ')
      .replace(/{var}/g, 'var.')
      .replace(/ subsp. /g, ' var. ')
      .replace(/{subsp.}/g, 'subsp.')
      .trim()}'`;
  } else {
    q = `select
  *
from
  wcvp
where
  genus = '${genus}'
  AND taxon_rank = 'Species'
  and taxon_status = 'Accepted' ORDER BY taxon_name DESC`;
  }

  const json = await query(q);

  return new Response(JSON.stringify(json));
}
