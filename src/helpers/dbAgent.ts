import Anthropic from '@anthropic-ai/sdk';
import { Pool, PoolClient } from 'pg';

export interface ColumnMeta {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface DbAgentConfig {
  databaseUrl: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxPoolSize?: number;
  schemaNames?: string[];
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
  sql: string;
}

const FORBIDDEN_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXEC|EXECUTE|CALL|MERGE|REPLACE)\b/i;
const SELECT_REQUIRED = /^\s*SELECT\b/i;

function assertSelectOnly(sql: string): void {
  const trimmed = sql.trim();
  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    throw new Error(`[DbAgent] Forbidden SQL operation detected. Only SELECT is allowed.\nSQL: ${trimmed}`);
  }
  if (!SELECT_REQUIRED.test(trimmed)) {
    throw new Error(`[DbAgent] Only SELECT statements are permitted.\nSQL: ${trimmed}`);
  }
}

async function loadSchema(client: PoolClient, schemaNames: string[]): Promise<ColumnMeta[]> {
  const result = await client.query<ColumnMeta>(
    `SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = ANY($1::text[])
     ORDER BY table_name, ordinal_position`,
    [schemaNames]
  );
  return result.rows;
}

function formatSchemaForPrompt(columns: ColumnMeta[]): string {
  const tables: Record<string, string[]> = {};
  for (const col of columns) {
    if (!tables[col.table_name]) tables[col.table_name] = [];
    const nullable = col.is_nullable === 'YES' ? '?' : '';
    tables[col.table_name].push(`  ${col.column_name}${nullable}: ${col.data_type}`);
  }
  return Object.entries(tables)
    .map(([table, cols]) => `Table: ${table}\n${cols.join('\n')}`)
    .join('\n\n');
}

export class DbAgent {
  private pool: Pool;
  private anthropic: Anthropic;
  private model: string;
  private schemaNames: string[];
  private cachedSchema: ColumnMeta[] | null = null;

  constructor(config: DbAgentConfig) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      max: config.maxPoolSize ?? 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    this.anthropic = new Anthropic({
      apiKey: config.apiKey ?? process.env.BEDROCK_API_KEY,
      baseURL: config.baseURL ?? process.env.BEDROCK_BASE_URL,
    });
    this.model = config.model ?? 'anthropic.claude-opus-5';
    this.schemaNames = config.schemaNames ?? ['public'];
    this.pool.on('error', (err) => {
      console.error('[DbAgent] Idle pool client error:', err.message);
    });
  }

  async query<T = Record<string, unknown>>(naturalLanguageRequirement: string): Promise<QueryResult<T>> {
    const schema = await this.getSchema();
    const sql = await this.generateSql(naturalLanguageRequirement, schema);
    assertSelectOnly(sql);
    return this.executeSelect<T>(sql);
  }

  async rawQuery<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    assertSelectOnly(sql);
    return this.executeSelect<T>(sql, params);
  }

  async refreshSchema(): Promise<void> {
    this.cachedSchema = null;
    await this.getSchema();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async getSchema(): Promise<ColumnMeta[]> {
    if (this.cachedSchema) return this.cachedSchema;
    const client = await this.pool.connect();
    try {
      this.cachedSchema = await loadSchema(client, this.schemaNames);
      return this.cachedSchema;
    } finally {
      client.release();
    }
  }

  private async generateSql(requirement: string, schema: ColumnMeta[]): Promise<string> {
    const schemaText = formatSchemaForPrompt(schema);
    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a read-only SQL assistant. Given the database schema below, write the minimal SELECT query that satisfies the test requirement.

RULES:
- Output ONLY the raw SQL query — no markdown, no explanation, no code fences.
- ONLY use SELECT. Never use INSERT, UPDATE, DELETE, DROP, or any mutating statement.
- Use table and column names exactly as they appear in the schema.
- Keep the query as simple as possible to satisfy the requirement.

DATABASE SCHEMA:
${schemaText}

TEST REQUIREMENT:
${requirement}`,
      }],
    });
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('[DbAgent] Unexpected response type from Claude.');
    }
    return content.text.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
  }

  private async executeSelect<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0, sql };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[DbAgent] Query execution failed.\nSQL: ${sql}\nError: ${message}`);
    } finally {
      client.release();
    }
  }
}

const registry = new Map<string, DbAgent>();

export function getDbAgent(config?: Partial<DbAgentConfig>): DbAgent {
  const url = config?.databaseUrl ?? process.env.DATABASE_URL ?? '';
  if (!url) throw new Error('[DbAgent] DATABASE_URL is not set.');
  if (!registry.has(url)) {
    registry.set(url, new DbAgent({ databaseUrl: url, ...config }));
  }
  return registry.get(url)!;
}

export async function closeAllDbAgents(): Promise<void> {
  await Promise.all([...registry.values()].map((a) => a.close()));
  registry.clear();
}
