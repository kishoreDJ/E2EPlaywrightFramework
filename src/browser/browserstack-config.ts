/**
 * BrowserStack Configuration
 * Builds the WebSocket endpoint URL and capability set used to connect
 * Playwright to a remote BrowserStack Automate session.
 */

import type {
  BrowserStackCredentials,
  BrowserStackCapabilities,
  BrowserStackConfig,
} from './browser-types';

const BS_CDP_URL = 'wss://cdp.browserstack.com/playwright';

// ==========================================
// Credential loader
// ==========================================

/**
 * Reads BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY from env.
 * Throws early with a clear message so misconfigured CI fails fast.
 */
export function loadBrowserStackCredentials(): BrowserStackCredentials {
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;

  if (!username || !accessKey) {
    throw new Error(
      'BrowserStack credentials missing. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.'
    );
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
export function buildBrowserStackWsEndpoint(config: BrowserStackConfig): string {
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

export const BS_CAPABILITY_PRESETS: Record<string, BrowserStackCapabilities> = {
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
    browser: 'firefox',
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

export class BrowserStackConfigBuilder {
  private caps: BrowserStackCapabilities;
  private creds: BrowserStackCredentials;

  constructor(presetKey?: keyof typeof BS_CAPABILITY_PRESETS) {
    this.creds = loadBrowserStackCredentials();
    this.caps = presetKey
      ? { ...BS_CAPABILITY_PRESETS[presetKey] }
      : {
          browser: 'chrome',
          browser_version: 'latest',
          os: 'Windows',
          os_version: '11',
        };
  }

  public setBrowser(browser: BrowserStackCapabilities['browser']): this {
    this.caps.browser = browser;
    return this;
  }

  public setBrowserVersion(version: string): this {
    this.caps.browser_version = version;
    return this;
  }

  public setOS(os: BrowserStackCapabilities['os'], version: string): this {
    this.caps.os = os;
    this.caps.os_version = version;
    return this;
  }

  public setDevice(device: string, realMobile = true): this {
    this.caps.device = device;
    this.caps.real_mobile = realMobile;
    return this;
  }

  public setSessionName(name: string): this {
    this.caps.name = name;
    return this;
  }

  public setBuild(build: string): this {
    this.caps.build = build;
    return this;
  }

  public setProject(project: string): this {
    this.caps.project = project;
    return this;
  }

  public enableLocal(enable = true): this {
    this.caps['browserstack.local'] = enable;
    return this;
  }

  public enableDebug(enable = true): this {
    this.caps['browserstack.debug'] = enable;
    return this;
  }

  public enableNetworkLogs(enable = true): this {
    this.caps['browserstack.networkLogs'] = enable;
    return this;
  }

  public enableVideo(enable = true): this {
    this.caps['browserstack.video'] = enable;
    return this;
  }

  public build(): BrowserStackConfig {
    return {
      credentials: { ...this.creds },
      capabilities: { ...this.caps },
    };
  }

  public buildWsEndpoint(): string {
    return buildBrowserStackWsEndpoint(this.build());
  }
}
