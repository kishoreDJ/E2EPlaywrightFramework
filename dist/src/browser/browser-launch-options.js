"use strict";
/**
 * Browser Launch Options Manager
 * Centralises per-browser launch and context configuration.
 * Supports headless/headed mode, custom args, viewport presets, and proxy/VPN.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContextOptionsBuilder = exports.BrowserLaunchOptionsBuilder = exports.BrowserLaunchOptionsManager = void 0;
const browser_types_1 = require("./browser-types");
// ==========================================
// Per-browser defaults
// ==========================================
const BROWSER_DEFAULTS = {
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
class BrowserLaunchOptionsManager {
    /**
     * Returns the merged launch options for the given browser.
     * Playwright's `launchOptions` only accepts a subset of properties;
     * channel is passed separately in playwright.config.ts.
     */
    static getOptions(browser, overrides) {
        const defaults = BROWSER_DEFAULTS[browser];
        const storedOverrides = this.overrides[browser] ?? {};
        const merged = {
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
    static setBrowserOverride(browser, config) {
        this.overrides[browser] = { ...(this.overrides[browser] ?? {}), ...config };
    }
    /**
     * Set a proxy/VPN globally for all browsers.
     */
    static setGlobalProxy(proxy) {
        this.globalProxy = proxy;
    }
    /**
     * Clear the global proxy setting.
     */
    static clearGlobalProxy() {
        this.globalProxy = undefined;
    }
    /**
     * Set global default viewport (can still be overridden per browser/context).
     */
    static setGlobalViewport(viewport) {
        this.globalViewport = viewport;
    }
    /**
     * Build context-level options, applying viewport and proxy from config.
     */
    static getContextOptions(overrides) {
        const base = {
            viewport: this.globalViewport ?? browser_types_1.VIEWPORT_PRESETS.FULL_HD,
            ignoreHTTPSErrors: false,
            recordVideo: { dir: 'test-results/videos' },
        };
        return { ...base, ...overrides };
    }
}
exports.BrowserLaunchOptionsManager = BrowserLaunchOptionsManager;
BrowserLaunchOptionsManager.overrides = {};
// ==========================================
// BrowserLaunchOptionsBuilder — fluent per-browser builder
// ==========================================
class BrowserLaunchOptionsBuilder {
    constructor(browser) {
        this.config = { ...BrowserLaunchOptionsManager.getOptions(browser) };
    }
    setHeadless(headless) {
        this.config.headless = headless;
        return this;
    }
    setSlowMo(ms) {
        this.config.slowMo = ms;
        return this;
    }
    setTimeout(ms) {
        this.config.timeout = ms;
        return this;
    }
    addArg(arg) {
        this.config.args = [...(this.config.args ?? []), arg];
        return this;
    }
    setProxy(proxy) {
        this.config.proxy = proxy;
        return this;
    }
    setDownloadsPath(dir) {
        this.config.downloadsPath = dir;
        return this;
    }
    build() {
        const { channel: _c, ...rest } = this.config;
        return rest;
    }
}
exports.BrowserLaunchOptionsBuilder = BrowserLaunchOptionsBuilder;
// ==========================================
// BrowserContextOptionsBuilder — fluent context builder
// ==========================================
class BrowserContextOptionsBuilder {
    constructor() {
        this.config = {};
    }
    setViewport(width, height) {
        this.config.viewport = { width, height };
        return this;
    }
    useViewportPreset(preset) {
        this.config.viewport = browser_types_1.VIEWPORT_PRESETS[preset];
        return this;
    }
    setUserAgent(ua) {
        this.config.userAgent = ua;
        return this;
    }
    setLocale(locale) {
        this.config.locale = locale;
        return this;
    }
    setTimezone(tz) {
        this.config.timezoneId = tz;
        return this;
    }
    setColorScheme(scheme) {
        this.config.colorScheme = scheme;
        return this;
    }
    ignoreHTTPSErrors(ignore = true) {
        this.config.ignoreHTTPSErrors = ignore;
        return this;
    }
    grantPermissions(permissions) {
        this.config.permissions = permissions;
        return this;
    }
    setGeolocation(lat, lon, accuracy) {
        this.config.geolocation = { latitude: lat, longitude: lon, accuracy };
        return this;
    }
    recordVideo(dir, size) {
        this.config.recordVideo = { dir, size };
        return this;
    }
    build() {
        return { ...this.config };
    }
}
exports.BrowserContextOptionsBuilder = BrowserContextOptionsBuilder;
