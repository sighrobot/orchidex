import { Grex } from 'lib/types';

import pool from 'lib/storage/pool';

export const query = async (expr: string) => {
  if (!expr) return [];

  let rows: Grex[] = [];
  try {
    const r = await pool.query(expr);
    rows = r.rows;
  } catch (e) {
    console.error(e);
  }

  return rows;
};
