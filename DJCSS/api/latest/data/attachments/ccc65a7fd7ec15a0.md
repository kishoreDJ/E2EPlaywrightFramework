# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data-privacy/do-not-sell.spec.ts >> Do Not Sell (DSAR_DONOTSELL) API Tests >> POST DNS-021: invalid email format in additionalEmailAddresses returns 400
- Location: tests/data-privacy/do-not-sell.spec.ts:603:7

# Error details

```
"beforeAll" hook timeout of 90000ms exceeded.
```

```
Error: connect ETIMEDOUT 10.160.59.42:5432
```

# Test source

```ts
  1  | import * as dotenv from 'dotenv';
  2  | import { Pool } from 'pg';
  3  | 
  4  | dotenv.config();
  5  | 
  6  | let pool: Pool | null = null;
  7  | 
  8  | function getPool(): Pool {
  9  |   if (!pool) {
  10 |     const connectionString = process.env.CSM_DATABASE_URL;
  11 |     if (!connectionString) {
  12 |       throw new Error('CSM_DATABASE_URL is not set in .env');
  13 |     }
  14 |     pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  15 |   }
  16 |   return pool;
  17 | }
  18 | 
  19 | export async function csmQuery<T = Record<string, unknown>>(
  20 |   sql: string,
  21 |   params: unknown[] = [],
  22 | ): Promise<T[]> {
> 23 |   const client = await getPool().connect();
     |                  ^ Error: connect ETIMEDOUT 10.160.59.42:5432
  24 |   try {
  25 |     const result = await client.query(sql, params);
  26 |     return result.rows as T[];
  27 |   } finally {
  28 |     client.release();
  29 |   }
  30 | }
  31 | 
  32 | export async function closeCsmDb(): Promise<void> {
  33 |   if (pool) {
  34 |     await pool.end();
  35 |     pool = null;
  36 |   }
  37 | }
  38 | 
  39 | /**
  40 |  * Returns N random distinct UUIDs for subscribers in the given subscription state.
  41 |  * Uses ORDER BY RANDOM() so results differ on every call.
  42 |  * @param stateId - subscription state (e.g. 5 = active)
  43 |  * @param count   - number of UUIDs to return (default 20)
  44 |  */
  45 | export async function getRandomUuidsBySubscriptionState(
  46 |   stateId: number,
  47 |   count = 20,
  48 | ): Promise<string[]> {
  49 |   const rows = await csmQuery<{ uuid: string }>(
  50 |     `SELECT uuid FROM (
  51 |        SELECT DISTINCT i."uuid"
  52 |        FROM subscription s
  53 |          JOIN delivery_address_info dai ON s.subscription_id = dai.subscription_id
  54 |          JOIN subscription_term st     ON s.subscription_id = st.subscription_id
  55 |          JOIN contact c                ON c.contact_id = dai.contact_id
  56 |          JOIN identity i               ON s.subscriber_identity_id = i.identity_id
  57 |          JOIN orders o                 ON s.subscriber_identity_id = o.subscriber_identity_id
  58 |          JOIN payer_account pa         ON s.subscriber_identity_id = pa.subscriber_identity_id
  59 |        WHERE s.state_id = $1
  60 |      ) distinct_uuids
  61 |      ORDER BY RANDOM()
  62 |      LIMIT $2`,
  63 |     [stateId, count],
  64 |   );
  65 |   if (rows.length === 0) throw new Error(`No UUIDs found in CSM for state_id=${stateId}`);
  66 |   return rows.map((r) => r.uuid);
  67 | }
  68 | 
```