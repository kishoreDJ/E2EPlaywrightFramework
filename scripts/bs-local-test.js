// Starts BrowserStack Local tunnel, runs Playwright tests, then stops tunnel.
// Usage: node scripts/bs-local-test.js -- npx playwright test --project=BS-Chrome-Windows11
// Exits with the test process exit code so CI can detect failures.
const browserstack   = require('browserstack-local');
const { spawnSync }  = require('child_process');
const path           = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const accessKey       = process.env.BROWSERSTACK_ACCESS_KEY;
const localIdentifier = process.env.BS_LOCAL_IDENTIFIER || 'default';

if (!accessKey) {
  console.error('[bs-local] BROWSERSTACK_ACCESS_KEY is not set.');
  process.exit(1);
}

// Parse args: node bs-local-test.js -- <command> [args...]
const sepIndex = process.argv.indexOf('--');
if (sepIndex === -1 || process.argv.length <= sepIndex + 1) {
  console.error('Usage: node scripts/bs-local-test.js -- <command> [args...]');
  process.exit(1);
}
const [command, ...commandArgs] = process.argv.slice(sepIndex + 1);

const tunnel = new browserstack.Local();

const options = {
  key:             accessKey,
  localIdentifier: localIdentifier,
  verbose:         false,
  forceLocal:      true,
};

console.log(`[bs-local] Starting tunnel (identifier: ${localIdentifier}) ...`);

tunnel.start(options, (err) => {
  if (err) {
    console.error('[bs-local] Failed to start tunnel:', err);
    process.exit(1);
  }

  console.log('[bs-local] Tunnel is running. Starting tests ...\n');

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  });

  const exitCode = result.status ?? 1;

  console.log('\n[bs-local] Tests finished. Stopping tunnel ...');
  tunnel.stop(() => {
    console.log('[bs-local] Tunnel stopped.');
    process.exit(exitCode);
  });
});
