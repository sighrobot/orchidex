import { query } from 'lib/datasette2';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('r');
  const r = raw.replace(/'/g, "''");

  return query(
    `SELECT * FROM rhs WHERE epithet != '' AND (registrant_name = '${r}' OR originator_name = '${r}') ORDER BY date_of_registration DESC`,
  );
};
