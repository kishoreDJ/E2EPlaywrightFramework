/**
 * Browser Types - Shared interfaces and types for browser management
 */

// ==========================================
// Browser Identity
// ==========================================

export type BrowserName = 'chrome' | 'firefox' | 'webkit' | 'edge';

export type BrowserChannel = 'chrome' | 'msedge';

// ==========================================
// Viewport
// ==========================================

export interface ViewportSize {
  width: number;
  height: number;
}

export const VIEWPORT_PRESETS: Record<string, ViewportSize> = {
  HD:        { width: 1280, height: 720 },
  FULL_HD:   { width: 1920, height: 1080 },
  WQHD:      { width: 2560, height: 1440 },
  MOBILE_S:  { width: 375, height: 667 },
  MOBILE_L:  { width: 414, height: 896 },
  TABLET:    { width: 768, height: 1024 },
};

// ==========================================
// Proxy / VPN
// ==========================================

export interface ProxyConfig {
  server: string;           // e.g. "http://proxy.example.com:8080"
  bypass?: string;          // comma-separated list of hosts to bypass
  username?: string;
  password?: string;
}

// ==========================================
// Browser Launch Options
// ==========================================

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
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  colorScheme?: 'light' | 'dark' | 'no-preference';
  ignoreHTTPSErrors?: boolean;
  recordVideo?: { dir: string; size?: ViewportSize };
  recordHar?: { path: string; mode?: 'full' | 'minimal' };
}

// ==========================================
// Pool
// ==========================================

export interface PoolConfig {
  maxSize: number;
  minIdle: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxUsageCount: number;
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxSize: 10,
  minIdle: 2,
  acquireTimeoutMs: 30_000,
  idleTimeoutMs: 300_000,
  maxUsageCount: 50,
};

export interface PoolStats {
  total: number;
  idle: number;
  inUse: number;
  queued: number;
  evicted: number;
}

// ==========================================
// BrowserStack
// ==========================================

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
