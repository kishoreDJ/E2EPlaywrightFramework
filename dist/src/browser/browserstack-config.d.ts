/**
 * BrowserStack Configuration
 * Builds the WebSocket endpoint URL and capability set used to connect
 * Playwright to a remote BrowserStack Automate session.
 */
import type { BrowserStackCredentials, BrowserStackCapabilities, BrowserStackConfig } from './browser-types';
/**
 * Reads BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY from env.
 * Throws early with a clear message so misconfigured CI fails fast.
 */
export declare function loadBrowserStackCredentials(): BrowserStackCredentials;
/**
 * Encodes capabilities as a JSON string in the query param and returns
 * the full wss:// URL that playwright.connect() accepts.
 */
export declare function buildBrowserStackWsEndpoint(config: BrowserStackConfig): string;
export declare const BS_CAPABILITY_PRESETS: Record<string, BrowserStackCapabilities>;
export declare class BrowserStackConfigBuilder {
    private caps;
    private creds;
    constructor(presetKey?: keyof typeof BS_CAPABILITY_PRESETS);
    setBrowser(browser: BrowserStackCapabilities['browser']): this;
    setBrowserVersion(version: string): this;
    setOS(os: BrowserStackCapabilities['os'], version: string): this;
    setDevice(device: string, realMobile?: boolean): this;
    setSessionName(name: string): this;
    setBuild(build: string): this;
    setProject(project: string): this;
    enableLocal(enable?: boolean): this;
    enableDebug(enable?: boolean): this;
    enableNetworkLogs(enable?: boolean): this;
    enableVideo(enable?: boolean): this;
    build(): BrowserStackConfig;
    buildWsEndpoint(): string;
}
//# sourceMappingURL=browserstack-config.d.ts.map