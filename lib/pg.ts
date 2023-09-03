import { sql } from '@vercel/postgres';

export const query = async (expr: string) => {
  if (!expr) return null;

  const { rows } = await sql.query(expr);

  return rows;
};
