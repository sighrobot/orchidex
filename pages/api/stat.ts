import { query } from 'lib/pg';
import { getStatSql } from 'lib/stats';
import { Grex, Stat } from 'lib/types';

export default async function GetStat(req, res) {
  const data = JSON.parse(req.body);

  const grex: Grex = data.grex;
  const stat: Stat = data.stat;

  const q = getStatSql({ stat, grex });

  if (q) {
    const json = await query(q);
    return res.status(200).json(json);
  }

  return res.status(200).json([]);
}
