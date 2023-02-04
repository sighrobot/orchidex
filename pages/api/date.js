import { query } from 'lib/datasette';

export default async (req, res) => {
  const { d: date } = req.query;
  const expr = date
    ? `SELECT * FROM rhs WHERE date_of_registration = '${date}'`
    : `SELECT * FROM rhs ORDER BY date_of_registration DESC limit 100`;

  const d = await query(expr);

  res.status(200).json(d);
};
