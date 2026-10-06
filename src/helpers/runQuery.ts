import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query(
      'SELECT subscription_state_id, name, code FROM coresub.subscription_state ORDER BY name'
    );
    console.table(result.rows);
    console.log(`\nTotal: ${result.rowCount} rows`);
  } finally {
    await pool.end();
  }
}

run().catch(console.error);
