import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.SB_PG_POOL_URL });

if (!global.pool) {
  global.pool = {
    query: async (sql: string) => {
      const client = await pool.connect();
      let response;
      try {
        response = await client.query(sql);
      } finally {
        client.release();
      }
      return response;
    },
  };
}

export default global.pool;
