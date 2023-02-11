import { query } from 'lib/datasette';
import { getStatSql } from 'lib/stats';
import { Grex, Stat } from 'lib/types';

export default async (req, res) => {
  const data = JSON.parse(req.body);
  const grex: Grex = data.grex;
  const stat: Stat = data.stat;

  const q = getStatSql({ stat, grex });

  if (q) {
    const data = await query(q);
    return res.status(200).json(data);
  }

  return res.status(500).json({ error: `unknown stat: ${stat}` });
};
