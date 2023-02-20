import { query } from 'lib/datasette2';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  return query(`SELECT * FROM rhs WHERE id = '${id}' limit 1`);
};
