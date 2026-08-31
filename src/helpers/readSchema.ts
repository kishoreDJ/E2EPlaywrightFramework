import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function readSchema() {
  const outPath = path.join(process.cwd(), 'db-schema.txt');
  if (fs.existsSync(outPath)) {
    console.log('Schema already exists at db-schema.txt — skipping. Delete the file to regenerate.');
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name, ordinal_position
    `);

    const tables: Record<string, string[]> = {};
    for (const row of result.rows) {
      const key = `${row.table_schema}.${row.table_name}`;
      if (!tables[key]) tables[key] = [];
      tables[key].push(`  ${row.column_name} (${row.data_type}${row.is_nullable === 'YES' ? ', nullable' : ''})`);
    }

    let output = '';
    for (const [table, cols] of Object.entries(tables)) {
      output += `\nTable: ${table}\n${cols.join('\n')}\n`;
    }
    output += `\nTotal tables: ${Object.keys(tables).length}\n`;

    fs.writeFileSync(outPath, output);
    console.log(`Schema saved to db-schema.txt (${Object.keys(tables).length} tables)`);
  } finally {
    await pool.end();
  }
}

readSchema().catch(console.error);
