/**
 * Browser Launch Options Manager
 * Centralises per-browser launch and context configuration.
 * Supports headless/headed mode, custom args, viewport presets, and proxy/VPN.
 */

import type {
  BrowserName,
  BrowserLaunchConfig,
  BrowserContextConfig,
  ProxyConfig,
  ViewportSize,
} from './browser-types';
import { VIEWPORT_PRESETS } from './browser-types';

// ==========================================
// Per-browser defaults
// ==========================================

const BROWSER_DEFAULTS: Record<BrowserName, BrowserLaunchConfig> = {
  chrome: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
    ],
    channel: 'chrome',
  },
  edge: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    channel: 'msedge',
  },
  firefox: {
    headless: true,
    args: [],
  },
  webkit: {
    headless: true,
    args: [],
  },
};

// ==========================================
// BrowserLaunchOptionsManager
// ==========================================

export class BrowserLaunchOptionsManager {
  private static overrides: Partial<Record<BrowserName, Partial<BrowserLaunchConfig>>> = {};
  private static globalProxy: ProxyConfig | undefined;
  private static globalViewport: ViewportSize | undefined;

  /**
   * Returns the merged launch options for the given browser.
   * Playwright's `launchOptions` only accepts a subset of properties;
   * channel is passed separately in playwright.config.ts.
   */
  public static getOptions(
    browser: BrowserName,
    overrides?: Partial<BrowserLaunchConfig>
  ): Omit<BrowserLaunchConfig, 'channel'> {
    const defaults = BROWSER_DEFAULTS[browser];
    const storedOverrides = this.overrides[browser] ?? {};

    const merged: BrowserLaunchConfig = {
      ...defaults,
      ...storedOverrides,
      ...overrides,
      args: [
        ...(defaults.args ?? []),
        ...(storedOverrides.args ?? []),
        ...(overrides?.args ?? []),
      ],
    };

    if (this.globalProxy && !merged.proxy) {
      merged.proxy = this.globalProxy;
    }

    const { channel: _channel, ...launchOptions } = merged;
    return launchOptions;
  }

  /**
   * Persist a custom override for a browser so it applies on every getOptions call.
   */
  public static setBrowserOverride(
    browser: BrowserName,
    config: Partial<BrowserLaunchConfig>
  ): void {
    this.overrides[browser] = { ...(this.overrides[browser] ?? {}), ...config };
  }

  /**
   * Set a proxy/VPN globally for all browsers.
   */
  public static setGlobalProxy(proxy: ProxyConfig): void {
    this.globalProxy = proxy;
  }

  /**
   * Clear the global proxy setting.
   */
  public static clearGlobalProxy(): void {
    this.globalProxy = undefined;
  }

  /**
   * Set global default viewport (can still be overridden per browser/context).
   */
  public static setGlobalViewport(viewport: ViewportSize): void {
    this.globalViewport = viewport;
  }

  /**
   * Build context-level options, applying viewport and proxy from config.
   */
  public static getContextOptions(
    overrides?: Partial<BrowserContextConfig>
  ): BrowserContextConfig {
    const base: BrowserContextConfig = {
      viewport: this.globalViewport ?? VIEWPORT_PRESETS.FULL_HD,
      ignoreHTTPSErrors: false,
    };

    return { ...base, ...overrides };
  }
}

// ==========================================
// BrowserLaunchOptionsBuilder — fluent per-browser builder
// ==========================================

export class BrowserLaunchOptionsBuilder {
  private config: BrowserLaunchConfig;

  constructor(browser: BrowserName) {
    this.config = { ...BrowserLaunchOptionsManager.getOptions(browser) };
  }

  public setHeadless(headless: boolean): this {
    this.config.headless = headless;
    return this;
  }

  public setSlowMo(ms: number): this {
    this.config.slowMo = ms;
    return this;
  }

  public setTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  public addArg(arg: string): this {
    this.config.args = [...(this.config.args ?? []), arg];
    return this;
  }

  public setProxy(proxy: ProxyConfig): this {
    this.config.proxy = proxy;
    return this;
  }

  public setDownloadsPath(dir: string): this {
    this.config.downloadsPath = dir;
    return this;
  }

  public build(): Omit<BrowserLaunchConfig, 'channel'> {
    const { channel: _c, ...rest } = this.config;
    return rest;
  }
}

// ==========================================
// BrowserContextOptionsBuilder — fluent context builder
// ==========================================

export class BrowserContextOptionsBuilder {
  private config: BrowserContextConfig = {};

  public setViewport(width: number, height: number): this {
    this.config.viewport = { width, height };
    return this;
  }

  public useViewportPreset(preset: keyof typeof VIEWPORT_PRESETS): this {
    this.config.viewport = VIEWPORT_PRESETS[preset];
    return this;
  }

  public setUserAgent(ua: string): this {
    this.config.userAgent = ua;
    return this;
  }

  public setLocale(locale: string): this {
    this.config.locale = locale;
    return this;
  }

  public setTimezone(tz: string): this {
    this.config.timezoneId = tz;
    return this;
  }

  public setColorScheme(scheme: 'light' | 'dark' | 'no-preference'): this {
    this.config.colorScheme = scheme;
    return this;
  }

  public ignoreHTTPSErrors(ignore: boolean = true): this {
    this.config.ignoreHTTPSErrors = ignore;
    return this;
  }

  public grantPermissions(permissions: string[]): this {
    this.config.permissions = permissions;
    return this;
  }

  public setGeolocation(lat: number, lon: number, accuracy?: number): this {
    this.config.geolocation = { latitude: lat, longitude: lon, accuracy };
    return this;
  }

  public recordVideo(dir: string, size?: ViewportSize): this {
    this.config.recordVideo = { dir, size };
    return this;
  }

  public build(): BrowserContextConfig {
    return { ...this.config };
  }
}
