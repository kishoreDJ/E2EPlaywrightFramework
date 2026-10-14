"use strict";
/**
 * BrowserStack Configuration
 * Builds the WebSocket endpoint URL and capability set used to connect
 * Playwright to a remote BrowserStack Automate session.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserStackConfigBuilder = exports.BS_CAPABILITY_PRESETS = void 0;
exports.loadBrowserStackCredentials = loadBrowserStackCredentials;
exports.buildBrowserStackWsEndpoint = buildBrowserStackWsEndpoint;
const BS_CDP_URL = 'wss://cdp.browserstack.com/playwright';
// ==========================================
// Credential loader
// ==========================================
/**
 * Reads BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY from env.
 * Throws early with a clear message so misconfigured CI fails fast.
 */
function loadBrowserStackCredentials() {
    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
        throw new Error('BrowserStack credentials missing. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.');
    }
    return { username, accessKey };
}
// ==========================================
// Endpoint builder
// ==========================================
/**
 * Encodes capabilities as a JSON string in the query param and returns
 * the full wss:// URL that playwright.connect() accepts.
 */
function buildBrowserStackWsEndpoint(config) {
    const caps = JSON.stringify({
        ...config.capabilities,
        'browserstack.username': config.credentials.username,
        'browserstack.accessKey': config.credentials.accessKey,
    });
    return `${BS_CDP_URL}?caps=${encodeURIComponent(caps)}`;
}
// ==========================================
// Default capability presets
// ==========================================
exports.BS_CAPABILITY_PRESETS = {
    'chrome-windows-11': {
        browser: 'chrome',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '11',
        'browserstack.debug': true,
        'browserstack.networkLogs': true,
        'browserstack.video': true,
    },
    'chrome-mac-sequoia': {
        browser: 'chrome',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'Sequoia',
        'browserstack.debug': true,
        'browserstack.video': true,
    },
    'firefox-windows-11': {
        browser: 'playwright-firefox',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '11',
        'browserstack.debug': true,
        'browserstack.video': true,
    },
    'edge-windows-11': {
        browser: 'edge',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '11',
        'browserstack.debug': true,
        'browserstack.video': true,
    },
};
// ==========================================
// BrowserStackConfigBuilder — fluent builder
// ==========================================
class BrowserStackConfigBuilder {
    constructor(presetKey) {
        this.creds = loadBrowserStackCredentials();
        this.caps = presetKey
            ? { ...exports.BS_CAPABILITY_PRESETS[presetKey] }
            : {
                browser: 'chrome',
                browser_version: 'latest',
                os: 'Windows',
                os_version: '11',
            };
    }
    setBrowser(browser) {
        this.caps.browser = browser;
        return this;
    }
    setBrowserVersion(version) {
        this.caps.browser_version = version;
        return this;
    }
    setOS(os, version) {
        this.caps.os = os;
        this.caps.os_version = version;
        return this;
    }
    setDevice(device, realMobile = true) {
        this.caps.device = device;
        this.caps.real_mobile = realMobile;
        return this;
    }
    setSessionName(name) {
        this.caps.name = name;
        return this;
    }
    setBuild(build) {
        this.caps.build = build;
        return this;
    }
    setProject(project) {
        this.caps.project = project;
        return this;
    }
    enableLocal(enable = true) {
        this.caps['browserstack.local'] = enable;
        return this;
    }
    enableDebug(enable = true) {
        this.caps['browserstack.debug'] = enable;
        return this;
    }
    enableNetworkLogs(enable = true) {
        this.caps['browserstack.networkLogs'] = enable;
        return this;
    }
    enableVideo(enable = true) {
        this.caps['browserstack.video'] = enable;
        return this;
    }
    build() {
        return {
            credentials: { ...this.creds },
            capabilities: { ...this.caps },
        };
    }
    buildWsEndpoint() {
        return buildBrowserStackWsEndpoint(this.build());
    }
}
exports.BrowserStackConfigBuilder = BrowserStackConfigBuilder;
