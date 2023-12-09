import { Grex } from 'lib/types';
import { Pool } from 'pg';

export const query = async (expr: string) => {
  if (!expr) return [];

  const pool = new Pool({ connectionString: process.env.SB_PG_URL });

  let rows: Grex[] = [];
  try {
    const r = await pool.query(expr);
    rows = r.rows;
  } catch (e) {
    console.error(e);
  }

  return rows;
};
