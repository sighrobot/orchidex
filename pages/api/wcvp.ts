import { query } from 'lib/datasette2';
import type { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const genus = searchParams.get('genus');
  const epithet = searchParams.get('epithet');

  const q = `select * from wcvp where taxon_name = '${genus} ${epithet
    .replace(/ var /g, ' var. ')
    .replace(/{var}/g, 'var.')
    .replace(/ subsp. /g, ' var. ')
    .replace(/{subsp.}/g, 'subsp.')
    .trim()}'`;

  return query(q);
};
