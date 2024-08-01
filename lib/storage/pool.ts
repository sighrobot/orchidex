import { Pool } from 'pg';

if (!process.env.SB_PG_POOL_URL) {
  throw new Error('Invalid/Missing environment variable: "SB_PG_POOL_URL"');
}

let pool: Pool;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithPg = global as typeof globalThis & {
    _pgPool?: Pool;
  };

  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({
      connectionString: process.env.SB_PG_POOL_URL,
    });
  }
  pool = globalWithPg._pgPool;
} else {
  // In production mode, it's best to not use a global variable.
  pool = new Pool({
    connectionString: process.env.SB_PG_POOL_URL,
  });
}

// Export a module-scoped pool. By doing this in a
// separate module, the pool can be shared across functions.
export default pool;
