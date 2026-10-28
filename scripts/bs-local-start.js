#!/usr/bin/env node
// Starts BrowserStack Local tunnel for routing QA/dev URLs through your machine.
// Usage: node scripts/bs-local-start.js
// The tunnel runs until the process exits; for detached use see bs-local-daemon.js.
const browserstack = require('browserstack-local');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const accessKey       = process.env.BROWSERSTACK_ACCESS_KEY;
const localIdentifier = process.env.BS_LOCAL_IDENTIFIER || 'default';

if (!accessKey) {
  console.error('[bs-local] BROWSERSTACK_ACCESS_KEY is not set.');
  process.exit(1);
}

const tunnel = new browserstack.Local();

const options = {
  key:             accessKey,
  localIdentifier: localIdentifier,
  verbose:         true,
  forceLocal:      true,  // route all traffic through local machine (not BrowserStack's network)
};

console.log(`[bs-local] Starting tunnel (identifier: ${localIdentifier}) ...`);

tunnel.start(options, (err) => {
  if (err) {
    console.error('[bs-local] Failed to start tunnel:', err);
    process.exit(1);
  }
  console.log(`[bs-local] Tunnel is running. BrowserStack workers can now reach local/QA URLs.`);
  console.log('[bs-local] Press Ctrl+C to stop.\n');
});

// Gracefully stop tunnel on Ctrl+C or process exit
function stopTunnel() {
  if (tunnel.isRunning()) {
    console.log('\n[bs-local] Stopping tunnel ...');
    tunnel.stop(() => {
      console.log('[bs-local] Tunnel stopped.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT',  stopTunnel);
process.on('SIGTERM', stopTunnel);
