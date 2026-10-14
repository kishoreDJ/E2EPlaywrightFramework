"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pg_1 = require("pg");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
async function testDb() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const result = await pool.query('SELECT current_database(), current_user');
        console.log('✓ DB connected:', result.rows[0]);
    }
    finally {
        await pool.end();
    }
}
async function testClaude() {
    const client = new sdk_1.default({
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
    console.log('✓ Claude connected:', msg.content[0].text);
}
(async () => {
    await testDb().catch(e => console.error('✗ DB failed:', e.message));
    await testClaude().catch(e => console.error('✗ Claude failed:', e.message, e.status, JSON.stringify(e.headers)));
})();
