import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.CSM_DATABASE_URL;
    if (!connectionString) {
      throw new Error('CSM_DATABASE_URL is not set in .env');
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function csmQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function closeCsmDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Returns N random distinct UUIDs for subscribers in the given subscription state.
 * Uses ORDER BY RANDOM() so results differ on every call.
 * @param stateId - subscription state (e.g. 5 = active)
 * @param count   - number of UUIDs to return (default 20)
 */
export async function getRandomUuidsBySubscriptionState(
  stateId: number,
  count = 20,
): Promise<string[]> {
  const rows = await csmQuery<{ uuid: string }>(
    `SELECT uuid FROM (
       SELECT DISTINCT i."uuid"
       FROM subscription s
         JOIN delivery_address_info dai ON s.subscription_id = dai.subscription_id
         JOIN subscription_term st     ON s.subscription_id = st.subscription_id
         JOIN contact c                ON c.contact_id = dai.contact_id
         JOIN identity i               ON s.subscriber_identity_id = i.identity_id
         JOIN orders o                 ON s.subscriber_identity_id = o.subscriber_identity_id
         JOIN payer_account pa         ON s.subscriber_identity_id = pa.subscriber_identity_id
       WHERE s.state_id = $1
     ) distinct_uuids
     ORDER BY RANDOM()
     LIMIT $2`,
    [stateId, count],
  );
  if (rows.length === 0) throw new Error(`No UUIDs found in CSM for state_id=${stateId}`);
  return rows.map((r) => r.uuid);
}
