import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

async function testDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query('SELECT current_database(), current_user');
    console.log('✓ DB connected:', result.rows[0]);
  } finally {
    await pool.end();
  }
}

async function testClaude() {
  const client = new Anthropic({
    apiKey: process.env.BEDROCK_API_KEY,
    baseURL: process.env.BEDROCK_BASE_URL,
    defaultHeaders: {
      'Authorization': `Bearer ${process.env.BEDROCK_API_KEY}`,
    },
  });
  const msg = await client.messages.create({
    model: 'anthropic.claude-opus-5',
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Say "connected" only.' }],
  });
  console.log('✓ Claude connected:', (msg.content[0] as { text: string }).text);
}

(async () => {
  await testDb().catch(e => console.error('✗ DB failed:', e.message));
  await testClaude().catch(e => console.error('✗ Claude failed:', e.message, e.status, JSON.stringify(e.headers)));
})();
