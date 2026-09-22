const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Usage: node run-with-allure.js <resultsDir> <reportDir> -- <command> [args...]
const sepIndex = process.argv.indexOf('--');
if (sepIndex === -1) {
  console.error('Usage: node run-with-allure.js <resultsDir> <reportDir> -- <command> [args...]');
  process.exit(1);
}

const [resultsDir, reportDir] = process.argv.slice(2, sepIndex);
const [command, ...commandArgs] = process.argv.slice(sepIndex + 1);

const testRun = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ALLURE_RESULTS_DIR: resultsDir },
});

// Allure reads reportName from executor.json to set the report's header/title.
// Without it, the report falls back to the generic "Allure Report" title.
const appName = process.env.APP_NAME || 'DJCSS';
const suiteName = path.basename(resultsDir) === 'allure-results' ? '' : path.basename(resultsDir);
const reportTitle = suiteName
  ? `${appName} ${suiteName.charAt(0).toUpperCase()}${suiteName.slice(1)} Report`
  : `${appName} Report`;

fs.writeFileSync(
  path.join(resultsDir, 'executor.json'),
  JSON.stringify({ name: 'Local Run', type: 'other', reportName: reportTitle }, null, 2)
);

const generate = spawnSync('npx', ['allure', 'generate', resultsDir, '--clean', '-o', reportDir], {
  stdio: 'inherit',
  shell: true,
});

if (generate.status !== 0) {
  console.error(`Allure report generation failed (exit code ${generate.status}); preserving test exit code.`);
}

process.exit(testRun.status ?? 1);
