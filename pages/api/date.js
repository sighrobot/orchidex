import { query } from 'lib/datasette';

export default async (req, res) => {
  const { d: date } = req.query;
  let expr = '';
  if (date) {
    expr += `SELECT * FROM rhs WHERE date_of_registration = '${date}'`;
  } else {
    const d = new Date();
    d.setDate(d.getDate() - 7);

    expr += `SELECT * FROM rhs WHERE date(date_of_registration) >= '${d
      .toISOString()
      .slice(0, 4)}' ORDER BY date_of_registration DESC`;
  }

  const d = await query(expr);

  res.status(200).json(d);
};
