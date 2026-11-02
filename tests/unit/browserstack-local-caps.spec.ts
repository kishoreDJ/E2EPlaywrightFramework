/**
 * Unit tests for BrowserStackConfigBuilder local-tunnel capability injection.
 * These tests do NOT connect to BrowserStack — they verify the built config object only.
 */

import { test, expect } from '@playwright/test';
import { BrowserStackConfigBuilder } from '../../src/browser/browserstack-config';

// Stub credentials so loadBrowserStackCredentials() doesn't throw
const stubEnv = (overrides: Record<string, string | undefined>) => {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
};

test.describe('BrowserStackConfigBuilder — local tunnel caps', () => {
  test('includes browserstack.local and localIdentifier when USE_BS_LOCAL=true', () => {
    const restore = stubEnv({
      BROWSERSTACK_USERNAME: 'test-user',
      BROWSERSTACK_ACCESS_KEY: 'test-key',
      USE_BS_LOCAL: 'true',
      BS_LOCAL_IDENTIFIER: 'my-tunnel',
    });

    try {
      const config = new BrowserStackConfigBuilder('chrome-windows-11')
        .setSessionName('local-test')
        .setBuild('test-build')
        .setProject('test-project')
        .enableLocal(true)
        .setLocalIdentifier(process.env.BS_LOCAL_IDENTIFIER || 'default')
        .build();

      expect(config.capabilities['browserstack.local']).toBe(true);
      expect(config.capabilities['browserstack.localIdentifier']).toBe('my-tunnel');
    } finally {
      restore();
    }
  });

  test('defaults localIdentifier to "default" when BS_LOCAL_IDENTIFIER is unset', () => {
    const restore = stubEnv({
      BROWSERSTACK_USERNAME: 'test-user',
      BROWSERSTACK_ACCESS_KEY: 'test-key',
      USE_BS_LOCAL: 'true',
      BS_LOCAL_IDENTIFIER: undefined,
    });

    try {
      const config = new BrowserStackConfigBuilder('chrome-windows-11')
        .enableLocal(true)
        .setLocalIdentifier(process.env.BS_LOCAL_IDENTIFIER || 'default')
        .build();

      expect(config.capabilities['browserstack.local']).toBe(true);
      expect(config.capabilities['browserstack.localIdentifier']).toBe('default');
    } finally {
      restore();
    }
  });

  test('omits browserstack.local when USE_BS_LOCAL is not set', () => {
    const restore = stubEnv({
      BROWSERSTACK_USERNAME: 'test-user',
      BROWSERSTACK_ACCESS_KEY: 'test-key',
      USE_BS_LOCAL: undefined,
    });

    try {
      const config = new BrowserStackConfigBuilder('chrome-windows-11').build();

      expect(config.capabilities['browserstack.local']).toBeUndefined();
      expect(config.capabilities['browserstack.localIdentifier']).toBeUndefined();
    } finally {
      restore();
    }
  });

  test('wsEndpoint contains browserstack.local when USE_BS_LOCAL=true', () => {
    const restore = stubEnv({
      BROWSERSTACK_USERNAME: 'test-user',
      BROWSERSTACK_ACCESS_KEY: 'test-key',
      USE_BS_LOCAL: 'true',
      BS_LOCAL_IDENTIFIER: 'ci-tunnel',
    });

    try {
      const endpoint = new BrowserStackConfigBuilder('chrome-windows-11')
        .enableLocal(true)
        .setLocalIdentifier(process.env.BS_LOCAL_IDENTIFIER || 'default')
        .buildWsEndpoint();

      const caps = JSON.parse(decodeURIComponent(new URL(endpoint).searchParams.get('caps')!));
      expect(caps['browserstack.local']).toBe(true);
      expect(caps['browserstack.localIdentifier']).toBe('ci-tunnel');
    } finally {
      restore();
    }
  });
});
