import { query } from 'lib/datasette2';
import type { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const genus = searchParams.get('genus');
  const e = searchParams.get('epithet');
  const epithet = e.replace(/'/g, "''");

  return query(
    `SELECT * FROM rhs WHERE (seed_parent_genus = '${genus}' and seed_parent_epithet = '${epithet}') or (pollen_parent_genus = '${genus}' and pollen_parent_epithet = '${epithet}')`,
  );
};
