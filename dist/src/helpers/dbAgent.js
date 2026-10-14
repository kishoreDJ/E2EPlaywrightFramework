"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbAgent = void 0;
exports.getDbAgent = getDbAgent;
exports.closeAllDbAgents = closeAllDbAgents;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const pg_1 = require("pg");
const FORBIDDEN_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXEC|EXECUTE|CALL|MERGE|REPLACE)\b/i;
const SELECT_REQUIRED = /^\s*SELECT\b/i;
function assertSelectOnly(sql) {
    const trimmed = sql.trim();
    if (FORBIDDEN_KEYWORDS.test(trimmed)) {
        throw new Error(`[DbAgent] Forbidden SQL operation detected. Only SELECT is allowed.\nSQL: ${trimmed}`);
    }
    if (!SELECT_REQUIRED.test(trimmed)) {
        throw new Error(`[DbAgent] Only SELECT statements are permitted.\nSQL: ${trimmed}`);
    }
}
async function loadSchema(client, schemaNames) {
    const result = await client.query(`SELECT table_name, column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = ANY($1::text[])
     ORDER BY table_name, ordinal_position`, [schemaNames]);
    return result.rows;
}
function formatSchemaForPrompt(columns) {
    const tables = {};
    for (const col of columns) {
        if (!tables[col.table_name])
            tables[col.table_name] = [];
        const nullable = col.is_nullable === 'YES' ? '?' : '';
        tables[col.table_name].push(`  ${col.column_name}${nullable}: ${col.data_type}`);
    }
    return Object.entries(tables)
        .map(([table, cols]) => `Table: ${table}\n${cols.join('\n')}`)
        .join('\n\n');
}
class DbAgent {
    constructor(config) {
        this.cachedSchema = null;
        this.pool = new pg_1.Pool({
            connectionString: config.databaseUrl,
            max: config.maxPoolSize ?? 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        this.anthropic = new sdk_1.default({
            apiKey: config.apiKey ?? process.env.BEDROCK_API_KEY,
            baseURL: config.baseURL ?? process.env.BEDROCK_BASE_URL,
        });
        this.model = config.model ?? 'anthropic.claude-opus-5';
        this.schemaNames = config.schemaNames ?? ['public'];
        this.pool.on('error', (err) => {
            console.error('[DbAgent] Idle pool client error:', err.message);
        });
    }
    async query(naturalLanguageRequirement) {
        const schema = await this.getSchema();
        const sql = await this.generateSql(naturalLanguageRequirement, schema);
        assertSelectOnly(sql);
        return this.executeSelect(sql);
    }
    async rawQuery(sql, params) {
        assertSelectOnly(sql);
        return this.executeSelect(sql, params);
    }
    async refreshSchema() {
        this.cachedSchema = null;
        await this.getSchema();
    }
    async close() {
        await this.pool.end();
    }
    async getSchema() {
        if (this.cachedSchema)
            return this.cachedSchema;
        const client = await this.pool.connect();
        try {
            this.cachedSchema = await loadSchema(client, this.schemaNames);
            return this.cachedSchema;
        }
        finally {
            client.release();
        }
    }
    async generateSql(requirement, schema) {
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
    async executeSelect(sql, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return { rows: result.rows, rowCount: result.rowCount ?? 0, sql };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`[DbAgent] Query execution failed.\nSQL: ${sql}\nError: ${message}`);
        }
        finally {
            client.release();
        }
    }
}
exports.DbAgent = DbAgent;
const registry = new Map();
function getDbAgent(config) {
    const url = config?.databaseUrl ?? process.env.DATABASE_URL ?? '';
    if (!url)
        throw new Error('[DbAgent] DATABASE_URL is not set.');
    if (!registry.has(url)) {
        registry.set(url, new DbAgent({ databaseUrl: url, ...config }));
    }
    return registry.get(url);
}
async function closeAllDbAgents() {
    await Promise.all([...registry.values()].map((a) => a.close()));
    registry.clear();
}
