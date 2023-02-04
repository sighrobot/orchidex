import { query } from 'lib/datasette';

export default async (req, res) => {
  const { r: raw } = req.query;
  const r = raw.replace(/'/g, "''");

  const d = await query(`SELECT * FROM rhs WHERE registrant_name = '${r}'`);

  res.status(200).json(d);
};
