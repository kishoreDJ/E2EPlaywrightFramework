/**
 * Browser Types - Shared interfaces and types for browser management
 */
export type BrowserName = 'chrome' | 'firefox' | 'webkit' | 'edge';
export type BrowserChannel = 'chrome' | 'msedge';
export interface ViewportSize {
    width: number;
    height: number;
}
export declare const VIEWPORT_PRESETS: Record<string, ViewportSize>;
export interface ProxyConfig {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
}
export interface BrowserLaunchConfig {
    headless?: boolean;
    slowMo?: number;
    timeout?: number;
    args?: string[];
    ignoreDefaultArgs?: string[];
    proxy?: ProxyConfig;
    downloadsPath?: string;
    tracesDir?: string;
    channel?: BrowserChannel;
}
export interface BrowserContextConfig {
    viewport?: ViewportSize | null;
    userAgent?: string;
    locale?: string;
    timezoneId?: string;
    permissions?: string[];
    geolocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
    colorScheme?: 'light' | 'dark' | 'no-preference';
    ignoreHTTPSErrors?: boolean;
    recordVideo?: {
        dir: string;
        size?: ViewportSize;
    };
    recordHar?: {
        path: string;
        mode?: 'full' | 'minimal';
    };
}
export interface PoolConfig {
    maxSize: number;
    minIdle: number;
    acquireTimeoutMs: number;
    idleTimeoutMs: number;
    maxUsageCount: number;
}
export declare const DEFAULT_POOL_CONFIG: PoolConfig;
export interface PoolStats {
    total: number;
    idle: number;
    inUse: number;
    queued: number;
    evicted: number;
}
export interface BrowserStackCredentials {
    username: string;
    accessKey: string;
}
export interface BrowserStackCapabilities {
    browser: 'chrome' | 'firefox' | 'edge' | 'playwright-chromium' | 'playwright-firefox' | 'playwright-webkit';
    browser_version?: string;
    os: 'Windows' | 'OS X';
    os_version: string;
    device?: string;
    real_mobile?: boolean;
    name?: string;
    build?: string;
    project?: string;
    'browserstack.local'?: boolean;
    'browserstack.debug'?: boolean;
    'browserstack.networkLogs'?: boolean;
    'browserstack.video'?: boolean;
    'browserstack.console'?: 'errors' | 'warnings' | 'info' | 'verbose' | 'disable';
}
export interface BrowserStackConfig {
    credentials: BrowserStackCredentials;
    capabilities: BrowserStackCapabilities;
}
//# sourceMappingURL=browser-types.d.ts.map