import { Grex } from 'lib/types';

import pool from 'lib/storage/pool';

// Pass user input through `values` ($1, $2, ...) rather than into `expr`.
export const query = async (expr: string, values?: unknown[]) => {
  if (!expr) return [];

  let rows: Grex[] = [];
  const client = await pool.connect();

  try {
    const r = await client.query(expr, values);
    rows = r.rows;
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
  }

  return rows;
};

// Like `query`, but lets database errors reach the caller instead of
// returning no rows.
export const queryOrThrow = async (expr: string, values?: unknown[]) => {
  const client = await pool.connect();

  try {
    const r = await client.query(expr, values);
    return r.rows as Grex[];
  } finally {
    client.release();
  }
};
