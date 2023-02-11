import { query } from 'lib/datasette';

export default async (req, res) => {
  const { query: q } = req;
  const data = await query(q.q);

  res.status(200).json(data);
};
