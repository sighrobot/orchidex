import { query } from 'lib/datasette2';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export default async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('d');
  const limit = searchParams.get('limit');

  let expr = '';

  if (date) {
    expr += `SELECT * FROM rhs WHERE date_of_registration = '${date}'`;
  } else {
    const d = new Date();
    d.setDate(d.getDate() - 9);

    expr += `SELECT * FROM rhs WHERE date(date_of_registration) >= '${d
      .toISOString()
      .slice(0, 10)}' ORDER BY date_of_registration DESC`;
  }

  if (limit) {
    expr += ` LIMIT ${limit}`;
  }

  return query(expr);
};
