import { query } from 'lib/datasette2';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

export const getByDate = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('d');
  const limit = searchParams.get('limit');

  let expr = '';

  if (date) {
    expr += `SELECT * FROM rhs WHERE epithet != '' AND date_of_registration = '${date}'`;
  } else {
    expr += `SELECT * FROM rhs WHERE epithet != '' AND date(date_of_registration) != '' ORDER BY date_of_registration DESC`;
  }

  if (limit) {
    expr += ` LIMIT ${limit}`;
  } else {
    expr += ' LIMIT 80';
  }

  return query(expr);
};

export default getByDate;
