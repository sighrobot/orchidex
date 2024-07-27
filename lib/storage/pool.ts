import { Pool } from 'pg';

if (!global.pool) {
  global.pool = new Pool({ connectionString: process.env.SB_PG_POOL_URL });
}

export default global.pool;
