import { query } from 'lib/datasette2';
import { startCase } from 'lodash';
import type { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const g = searchParams.get('genus');
  const epithet = searchParams.get('epithet');
  const genus = startCase(g);

  if (epithet) {
    const q = `select * from wcvp where taxon_name = '${genus} ${epithet
      .replace(/ var /g, ' var. ')
      .replace(/{var}/g, 'var.')
      .replace(/ subsp. /g, ' var. ')
      .replace(/{subsp.}/g, 'subsp.')
      .trim()}'`;

    return query(q);
  }

  return query(`select
  *
from
  wcvp
where
  genus = '${genus}'
  AND taxon_rank = 'Species'
  and taxon_status = 'Accepted' ORDER BY taxon_name DESC`);
};
