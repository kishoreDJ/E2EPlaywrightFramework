"use strict";
/**
 * Browser Instance Pool
 * Manages a bounded pool of Playwright Browser instances for parallel execution.
 *
 * Design goals:
 *  - Reuse browser instances across tests (cold-start cost paid once per slot)
 *  - Enforce a hard cap (maxSize) so 50+ concurrent tests don't exhaust system RAM
 *  - Idle-timeout eviction prevents leaked instances after a long idle period
 *  - Per-instance usage counter retires instances that have been used heavily
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserPoolRegistry = exports.BrowserPool = void 0;
const test_1 = require("@playwright/test");
const browser_types_1 = require("./browser-types");
// ==========================================
// BrowserPool
// ==========================================
class BrowserPool {
    constructor(browserName, launchOptions, config = browser_types_1.DEFAULT_POOL_CONFIG) {
        this.browserName = browserName;
        this.launchOptions = launchOptions;
        this.config = config;
        this.entries = new Map();
        this.queue = [];
        this.evictedCount = 0;
        this.idleTimer = null;
        this.closed = false;
        this.entryCounter = 0;
    }
    // ==========================================
    // Public API
    // ==========================================
    /**
     * Initialise the pool: start idle eviction and pre-warm minIdle instances.
     */
    async start() {
        this.startIdleEviction();
        const preWarmCount = Math.min(this.config.minIdle, this.config.maxSize);
        await Promise.all(Array.from({ length: preWarmCount }, () => this.createEntry()));
    }
    /**
     * Acquire a browser instance from the pool.
     * Waits up to acquireTimeoutMs if the pool is at capacity.
     */
    async acquire() {
        if (this.closed) {
            throw new Error('BrowserPool has been closed');
        }
        const idleEntry = this.findIdleEntry();
        if (idleEntry) {
            return this.checkoutEntry(idleEntry);
        }
        if (this.entries.size < this.config.maxSize) {
            const entry = await this.createEntry();
            return this.checkoutEntry(entry);
        }
        return this.enqueue();
    }
    /**
     * Return a browser instance to the pool.
     * If the instance has exceeded maxUsageCount it is retired and replaced.
     */
    async release(browser) {
        const entry = this.findEntryByBrowser(browser);
        if (!entry) {
            return;
        }
        entry.lastUsedAt = Date.now();
        entry.inUse = false;
        if (entry.usageCount >= this.config.maxUsageCount) {
            await this.retire(entry);
        }
        else {
            this.drainQueue();
        }
    }
    /**
     * Close all browser instances and shut down the pool.
     */
    async close() {
        this.closed = true;
        if (this.idleTimer !== null) {
            clearInterval(this.idleTimer);
            this.idleTimer = null;
        }
        // Reject any waiting callers
        for (const pending of this.queue) {
            clearTimeout(pending.timeoutHandle);
            pending.reject(new Error('BrowserPool closed while waiting for instance'));
        }
        this.queue = [];
        await Promise.all(Array.from(this.entries.values()).map((e) => e.browser.close().catch(() => { })));
        this.entries.clear();
    }
    /**
     * Snapshot of current pool metrics.
     */
    stats() {
        let idle = 0;
        let inUse = 0;
        for (const e of this.entries.values()) {
            e.inUse ? inUse++ : idle++;
        }
        return {
            total: this.entries.size,
            idle,
            inUse,
            queued: this.queue.length,
            evicted: this.evictedCount,
        };
    }
    // ==========================================
    // Internal helpers
    // ==========================================
    browserType() {
        switch (this.browserName) {
            case 'chrome':
            case 'edge':
                return test_1.chromium;
            case 'firefox':
                return test_1.firefox;
            case 'webkit':
                return test_1.webkit;
        }
    }
    async createEntry() {
        const browser = await this.browserType().launch({
            headless: this.launchOptions.headless ?? true,
            slowMo: this.launchOptions.slowMo,
            timeout: this.launchOptions.timeout,
            args: this.launchOptions.args,
            proxy: this.launchOptions.proxy
                ? {
                    server: this.launchOptions.proxy.server,
                    bypass: this.launchOptions.proxy.bypass,
                    username: this.launchOptions.proxy.username,
                    password: this.launchOptions.proxy.password,
                }
                : undefined,
            downloadsPath: this.launchOptions.downloadsPath,
            tracesDir: this.launchOptions.tracesDir,
        });
        const id = `${this.browserName}-${++this.entryCounter}`;
        const entry = {
            id,
            browser,
            inUse: false,
            usageCount: 0,
            lastUsedAt: Date.now(),
            createdAt: Date.now(),
        };
        this.entries.set(id, entry);
        return entry;
    }
    checkoutEntry(entry) {
        entry.inUse = true;
        entry.usageCount++;
        entry.lastUsedAt = Date.now();
        return entry.browser;
    }
    findIdleEntry() {
        for (const entry of this.entries.values()) {
            if (!entry.inUse) {
                return entry;
            }
        }
        return undefined;
    }
    findEntryByBrowser(browser) {
        for (const entry of this.entries.values()) {
            if (entry.browser === browser) {
                return entry;
            }
        }
        return undefined;
    }
    enqueue() {
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                const idx = this.queue.findIndex((p) => p.timeoutHandle === timeoutHandle);
                if (idx !== -1)
                    this.queue.splice(idx, 1);
                reject(new Error(`BrowserPool[${this.browserName}]: acquire timed out after ${this.config.acquireTimeoutMs}ms`));
            }, this.config.acquireTimeoutMs);
            this.queue.push({ resolve, reject, timeoutHandle });
        });
    }
    drainQueue() {
        if (this.queue.length === 0)
            return;
        const idleEntry = this.findIdleEntry();
        if (!idleEntry)
            return;
        const pending = this.queue.shift();
        clearTimeout(pending.timeoutHandle);
        pending.resolve(this.checkoutEntry(idleEntry));
    }
    async retire(entry) {
        this.entries.delete(entry.id);
        this.evictedCount++;
        await entry.browser.close().catch(() => { });
        if (this.queue.length > 0 && this.entries.size < this.config.maxSize) {
            const newEntry = await this.createEntry();
            const pending = this.queue.shift();
            clearTimeout(pending.timeoutHandle);
            pending.resolve(this.checkoutEntry(newEntry));
        }
        else {
            const idleCount = Array.from(this.entries.values()).filter((e) => !e.inUse).length;
            if (idleCount < this.config.minIdle && this.entries.size < this.config.maxSize) {
                await this.createEntry();
            }
        }
    }
    startIdleEviction() {
        const interval = Math.min(this.config.idleTimeoutMs / 2, 60000);
        this.idleTimer = setInterval(() => {
            this.evictIdleEntries().catch(() => { });
        }, interval);
    }
    async evictIdleEntries() {
        const now = Date.now();
        const idleEntries = Array.from(this.entries.values()).filter((e) => !e.inUse);
        const excessIdle = idleEntries.length - this.config.minIdle;
        for (let i = 0; i < excessIdle; i++) {
            const entry = idleEntries[i];
            const idleDuration = now - entry.lastUsedAt;
            if (idleDuration >= this.config.idleTimeoutMs) {
                await this.retire(entry);
            }
        }
    }
}
exports.BrowserPool = BrowserPool;
// ==========================================
// BrowserPoolRegistry — one pool per browser type
// ==========================================
class BrowserPoolRegistry {
    static async getPool(browser, launchOptions, poolConfig) {
        if (!this.pools.has(browser)) {
            const pool = new BrowserPool(browser, launchOptions, {
                ...browser_types_1.DEFAULT_POOL_CONFIG,
                ...poolConfig,
            });
            await pool.start();
            this.pools.set(browser, pool);
        }
        return this.pools.get(browser);
    }
    static async closeAll() {
        await Promise.all(Array.from(this.pools.values()).map((p) => p.close()));
        this.pools.clear();
    }
    static allStats() {
        const result = {};
        this.pools.forEach((pool, name) => {
            result[name] = pool.stats();
        });
        return result;
    }
}
exports.BrowserPoolRegistry = BrowserPoolRegistry;
BrowserPoolRegistry.pools = new Map();
