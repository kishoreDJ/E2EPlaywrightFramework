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
import { Browser } from '@playwright/test';
import type { BrowserName, BrowserLaunchConfig, PoolConfig, PoolStats } from './browser-types';
export declare class BrowserPool {
    private readonly browserName;
    private readonly launchOptions;
    private readonly config;
    private entries;
    private queue;
    private evictedCount;
    private idleTimer;
    private closed;
    private entryCounter;
    constructor(browserName: BrowserName, launchOptions: Omit<BrowserLaunchConfig, 'channel'>, config?: PoolConfig);
    /**
     * Initialise the pool: start idle eviction and pre-warm minIdle instances.
     */
    start(): Promise<void>;
    /**
     * Acquire a browser instance from the pool.
     * Waits up to acquireTimeoutMs if the pool is at capacity.
     */
    acquire(): Promise<Browser>;
    /**
     * Return a browser instance to the pool.
     * If the instance has exceeded maxUsageCount it is retired and replaced.
     */
    release(browser: Browser): Promise<void>;
    /**
     * Close all browser instances and shut down the pool.
     */
    close(): Promise<void>;
    /**
     * Snapshot of current pool metrics.
     */
    stats(): PoolStats;
    private browserType;
    private createEntry;
    private checkoutEntry;
    private findIdleEntry;
    private findEntryByBrowser;
    private enqueue;
    private drainQueue;
    private retire;
    private startIdleEviction;
    private evictIdleEntries;
}
export declare class BrowserPoolRegistry {
    private static pools;
    static getPool(browser: BrowserName, launchOptions: Omit<BrowserLaunchConfig, 'channel'>, poolConfig?: Partial<PoolConfig>): Promise<BrowserPool>;
    static closeAll(): Promise<void>;
    static allStats(): Record<string, PoolStats>;
}
//# sourceMappingURL=browser-pool.d.ts.map