# Database Connectivity Guide

## Overview

This framework provides two ways to interact with the database:

| Helper | What it does | When to use |
|--------|-------------|-------------|
| `dbHelper.ts` | Runs raw SQL queries you write | When you know the SQL |
| `dbAgent.ts` | You describe what you want, Claude writes the SQL | When you want AI-generated queries |

---

## One-Time Setup (Per Project)

### 1. Configure Database URL

Add your database connection string to `.env` in the project root:

```
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

> `.env` is gitignored — never pushed to git.

### 2. Generate DB Schema

Run this once to read and save your database table structure locally:

```bash
npm run db:schema
```

This creates `db-schema.txt` in the project root containing all table and column definitions.

> `db-schema.txt` is gitignored — stays local, never pushed to git.

---

## Using dbHelper (Manual SQL)

Use when you want to write SQL yourself.

```typescript
import { query, closeDb } from '../helpers/dbHelper';

// Simple query
const rows = await query('SELECT * FROM subscriptions WHERE status = $1', ['active']);

// With type
interface Subscription {
  id: number;
  status: string;
}
const subs = await query<Subscription>('SELECT id, status FROM subscriptions');
```

---

## Using dbAgent (AI-Generated SQL)

Use when you want Claude to write the SQL based on your description.

> **Requires:** `BEDROCK_API_KEY` and `BEDROCK_BASE_URL` set in `.env`

```typescript
import { getDbAgent } from '../helpers/dbAgent';

const agent = getDbAgent();

// Claude reads db-schema.txt, writes the SQL, runs it, returns rows
const rows = await agent.query('get all active subscriptions created in the last 7 days');
```

### Configure Claude API in `.env`

```
BEDROCK_API_KEY=your-api-key-here
BEDROCK_BASE_URL=https://your-bedrock-proxy-url
```

---

## Schema Management

| Command | Description |
|---------|-------------|
| `npm run db:schema` | Generate `db-schema.txt` (skips if already exists) |
| `npm run db:schema:refresh` | Force regenerate `db-schema.txt` when schema changes |

---

## Complete Workflow

```
1. Add DATABASE_URL to .env
        ↓
2. Run: npm run db:schema
        ↓
3. db-schema.txt generated locally (gitignored)
        ↓
4. Add BEDROCK_API_KEY + BEDROCK_BASE_URL to .env
        ↓
5. Use dbAgent in tests — Claude reads schema, writes SQL, returns rows
```

---

## Files

| File | Purpose |
|------|---------|
| `src/helpers/dbHelper.ts` | Raw SQL query helper |
| `src/helpers/dbAgent.ts` | AI-powered SQL query helper |
| `src/helpers/readSchema.ts` | Reads DB schema and saves to `db-schema.txt` |
| `db-schema.txt` | Generated schema file (local only, gitignored) |
| `.env` | Environment variables (local only, gitignored) |

---

## Notes

- Never commit `.env` or `db-schema.txt` to git
- Run `npm run db:schema:refresh` whenever the database schema changes
- `dbAgent.ts` requires Claude API access to work
