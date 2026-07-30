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

import { chromium, firefox, webkit, Browser, BrowserType } from '@playwright/test';
import type {
  BrowserName,
  BrowserLaunchConfig,
  PoolConfig,
  PoolStats,
} from './browser-types';
import { DEFAULT_POOL_CONFIG } from './browser-types';

// ==========================================
// Pool Entry
// ==========================================

interface PoolEntry {
  id: string;
  browser: Browser;
  inUse: boolean;
  usageCount: number;
  lastUsedAt: number;
  createdAt: number;
}

// ==========================================
// Pending Acquire Request
// ==========================================

interface PendingRequest {
  resolve: (browser: Browser) => void;
  reject: (err: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

// ==========================================
// BrowserPool
// ==========================================

export class BrowserPool {
  private entries: Map<string, PoolEntry> = new Map();
  private queue: PendingRequest[] = [];
  private evictedCount = 0;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private entryCounter = 0;

  constructor(
    private readonly browserName: BrowserName,
    private readonly launchOptions: Omit<BrowserLaunchConfig, 'channel'>,
    private readonly config: PoolConfig = DEFAULT_POOL_CONFIG
  ) {}

  // ==========================================
  // Public API
  // ==========================================

  /**
   * Initialise the pool: start idle eviction and pre-warm minIdle instances.
   */
  public async start(): Promise<void> {
    this.startIdleEviction();
    const preWarmCount = Math.min(this.config.minIdle, this.config.maxSize);
    await Promise.all(
      Array.from({ length: preWarmCount }, () => this.createEntry())
    );
  }

  /**
   * Acquire a browser instance from the pool.
   * Waits up to acquireTimeoutMs if the pool is at capacity.
   */
  public async acquire(): Promise<Browser> {
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
  public async release(browser: Browser): Promise<void> {
    const entry = this.findEntryByBrowser(browser);
    if (!entry) {
      return;
    }

    entry.lastUsedAt = Date.now();
    entry.inUse = false;

    if (entry.usageCount >= this.config.maxUsageCount) {
      await this.retire(entry);
    } else {
      this.drainQueue();
    }
  }

  /**
   * Close all browser instances and shut down the pool.
   */
  public async close(): Promise<void> {
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

    await Promise.all(
      Array.from(this.entries.values()).map((e) => e.browser.close().catch(() => {}))
    );
    this.entries.clear();
  }

  /**
   * Snapshot of current pool metrics.
   */
  public stats(): PoolStats {
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

  private browserType(): BrowserType {
    switch (this.browserName) {
      case 'chrome':
      case 'edge':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
    }
  }

  private async createEntry(): Promise<PoolEntry> {
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
    const entry: PoolEntry = {
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

  private checkoutEntry(entry: PoolEntry): Browser {
    entry.inUse = true;
    entry.usageCount++;
    entry.lastUsedAt = Date.now();
    return entry.browser;
  }

  private findIdleEntry(): PoolEntry | undefined {
    for (const entry of this.entries.values()) {
      if (!entry.inUse) {
        return entry;
      }
    }
    return undefined;
  }

  private findEntryByBrowser(browser: Browser): PoolEntry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.browser === browser) {
        return entry;
      }
    }
    return undefined;
  }

  private enqueue(): Promise<Browser> {
    return new Promise<Browser>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const idx = this.queue.findIndex((p) => p.timeoutHandle === timeoutHandle);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(
          new Error(
            `BrowserPool[${this.browserName}]: acquire timed out after ${this.config.acquireTimeoutMs}ms`
          )
        );
      }, this.config.acquireTimeoutMs);

      this.queue.push({ resolve, reject, timeoutHandle });
    });
  }

  private drainQueue(): void {
    if (this.queue.length === 0) return;
    const idleEntry = this.findIdleEntry();
    if (!idleEntry) return;

    const pending = this.queue.shift()!;
    clearTimeout(pending.timeoutHandle);
    pending.resolve(this.checkoutEntry(idleEntry));
  }

  private async retire(entry: PoolEntry): Promise<void> {
    this.entries.delete(entry.id);
    this.evictedCount++;
    await entry.browser.close().catch(() => {});

    if (this.queue.length > 0 && this.entries.size < this.config.maxSize) {
      const newEntry = await this.createEntry();
      const pending = this.queue.shift()!;
      clearTimeout(pending.timeoutHandle);
      pending.resolve(this.checkoutEntry(newEntry));
    } else {
      const idleCount = Array.from(this.entries.values()).filter((e) => !e.inUse).length;
      if (idleCount < this.config.minIdle && this.entries.size < this.config.maxSize) {
        await this.createEntry();
      }
    }
  }

  private startIdleEviction(): void {
    const interval = Math.min(this.config.idleTimeoutMs / 2, 60_000);
    this.idleTimer = setInterval(() => {
      this.evictIdleEntries().catch(() => {});
    }, interval);
  }

  private async evictIdleEntries(): Promise<void> {
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

// ==========================================
// BrowserPoolRegistry — one pool per browser type
// ==========================================

export class BrowserPoolRegistry {
  private static pools: Map<BrowserName, BrowserPool> = new Map();

  public static async getPool(
    browser: BrowserName,
    launchOptions: Omit<BrowserLaunchConfig, 'channel'>,
    poolConfig?: Partial<PoolConfig>
  ): Promise<BrowserPool> {
    if (!this.pools.has(browser)) {
      const pool = new BrowserPool(browser, launchOptions, {
        ...DEFAULT_POOL_CONFIG,
        ...poolConfig,
      });
      await pool.start();
      this.pools.set(browser, pool);
    }
    return this.pools.get(browser)!;
  }

  public static async closeAll(): Promise<void> {
    await Promise.all(Array.from(this.pools.values()).map((p) => p.close()));
    this.pools.clear();
  }

  public static allStats(): Record<string, PoolStats> {
    const result: Record<string, PoolStats> = {};
    this.pools.forEach((pool, name) => {
      result[name] = pool.stats();
    });
    return result;
  }
}
