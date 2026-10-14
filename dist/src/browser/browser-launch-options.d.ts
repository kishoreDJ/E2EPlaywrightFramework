/**
 * Browser Launch Options Manager
 * Centralises per-browser launch and context configuration.
 * Supports headless/headed mode, custom args, viewport presets, and proxy/VPN.
 */
import type { BrowserName, BrowserLaunchConfig, BrowserContextConfig, ProxyConfig, ViewportSize } from './browser-types';
import { VIEWPORT_PRESETS } from './browser-types';
export declare class BrowserLaunchOptionsManager {
    private static overrides;
    private static globalProxy;
    private static globalViewport;
    /**
     * Returns the merged launch options for the given browser.
     * Playwright's `launchOptions` only accepts a subset of properties;
     * channel is passed separately in playwright.config.ts.
     */
    static getOptions(browser: BrowserName, overrides?: Partial<BrowserLaunchConfig>): Omit<BrowserLaunchConfig, 'channel'>;
    /**
     * Persist a custom override for a browser so it applies on every getOptions call.
     */
    static setBrowserOverride(browser: BrowserName, config: Partial<BrowserLaunchConfig>): void;
    /**
     * Set a proxy/VPN globally for all browsers.
     */
    static setGlobalProxy(proxy: ProxyConfig): void;
    /**
     * Clear the global proxy setting.
     */
    static clearGlobalProxy(): void;
    /**
     * Set global default viewport (can still be overridden per browser/context).
     */
    static setGlobalViewport(viewport: ViewportSize): void;
    /**
     * Build context-level options, applying viewport and proxy from config.
     */
    static getContextOptions(overrides?: Partial<BrowserContextConfig>): BrowserContextConfig;
}
export declare class BrowserLaunchOptionsBuilder {
    private config;
    constructor(browser: BrowserName);
    setHeadless(headless: boolean): this;
    setSlowMo(ms: number): this;
    setTimeout(ms: number): this;
    addArg(arg: string): this;
    setProxy(proxy: ProxyConfig): this;
    setDownloadsPath(dir: string): this;
    build(): Omit<BrowserLaunchConfig, 'channel'>;
}
export declare class BrowserContextOptionsBuilder {
    private config;
    setViewport(width: number, height: number): this;
    useViewportPreset(preset: keyof typeof VIEWPORT_PRESETS): this;
    setUserAgent(ua: string): this;
    setLocale(locale: string): this;
    setTimezone(tz: string): this;
    setColorScheme(scheme: 'light' | 'dark' | 'no-preference'): this;
    ignoreHTTPSErrors(ignore?: boolean): this;
    grantPermissions(permissions: string[]): this;
    setGeolocation(lat: number, lon: number, accuracy?: number): this;
    recordVideo(dir: string, size?: ViewportSize): this;
    build(): BrowserContextConfig;
}
//# sourceMappingURL=browser-launch-options.d.ts.map