import { query } from 'lib/datasette';

export default async (req, res) => {
  const { id } = req.query;
  const d = await query(`SELECT * FROM rhs WHERE id like '${id}' limit 1`);
  res.status(200).json(d[0] ?? null);
};
