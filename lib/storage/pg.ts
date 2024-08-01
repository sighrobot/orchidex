import { Grex } from 'lib/types';

import pool from 'lib/storage/pool';

export const query = async (expr: string) => {
  if (!expr) return [];

  let rows: Grex[] = [];
  const client = await pool.connect();

  try {
    const r = await client.query(expr);
    rows = r.rows;
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
  }

  return rows;
};
