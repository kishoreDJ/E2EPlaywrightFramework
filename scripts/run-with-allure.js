const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Usage: node run-with-allure.js <resultsDir> <reportDir> -- <command> [args...]
const sepIndex = process.argv.indexOf('--');
if (sepIndex === -1) {
  console.error('Usage: node run-with-allure.js <resultsDir> <reportDir> -- <command> [args...]');
  process.exit(1);
}

const [resultsDir, reportDir] = process.argv.slice(2, sepIndex);
const [command, ...commandArgs] = process.argv.slice(sepIndex + 1);

// --last-failed reruns only the previous run's failures; flag it so the
// dashboard can nest it under the full run it retested instead of showing
// it as an unrelated, tiny-looking run.
const isRetest = commandArgs.includes('--last-failed');

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

const buildUrl = process.env.BUILD_URL || '';
const buildNumber = process.env.BUILD_NUMBER || '';
fs.writeFileSync(
  path.join(resultsDir, 'executor.json'),
  JSON.stringify({
    name: process.env.EXECUTOR_NAME || 'Local Run',
    type: process.env.CI ? 'jenkins' : 'other',
    url: buildUrl,
    buildOrder: buildNumber ? parseInt(buildNumber, 10) : undefined,
    buildName: buildNumber ? `#${buildNumber}` : undefined,
    buildUrl: buildUrl,
    reportName: reportTitle,
  }, null, 2)
);

// report-deploy.js reads this to link a retest to the full run it retested.
fs.writeFileSync(
  path.join(resultsDir, 'run-meta.json'),
  JSON.stringify({ isRetest }, null, 2)
);

// allure-playwright hardcodes a "Project" parameter for the Playwright project
// (browser) name with no reporter option to rename it; relabel it here so the
// report reads "Browser: Chrome" instead of the ambiguous "Project: Chrome".
for (const file of fs.readdirSync(resultsDir)) {
  if (!file.endsWith('-result.json')) continue;
  const resultPath = path.join(resultsDir, file);
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  let changed = false;
  for (const parameter of result.parameters || []) {
    if (parameter.name === 'Project') {
      parameter.name = 'Browser';
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(resultPath, JSON.stringify(result));
  }
}

// Populates the report's Environment widget, which is otherwise empty.
fs.writeFileSync(
  path.join(resultsDir, 'environment.properties'),
  [`Application=${appName}`, `Environment=${process.env.TEST_ENV || 'dev'}`].join('\n'),
);

const generate = spawnSync('npx', ['allure', 'generate', resultsDir, '--clean', '-o', reportDir], {
  stdio: 'inherit',
  shell: true,
});

if (generate.status !== 0) {
  console.error(`Allure report generation failed (exit code ${generate.status}); preserving test exit code.`);
} else {
  spawnSync('node', [path.join(__dirname, 'allure-brand.js'), reportDir, reportTitle], { stdio: 'inherit' });

  // Allure's generate step only copies files it recognizes, so run-meta.json
  // has to be written into reportDir directly for report-deploy.js to find it.
  fs.writeFileSync(
    path.join(reportDir, 'run-meta.json'),
    JSON.stringify({ isRetest }, null, 2)
  );
}

process.exit(testRun.status ?? 1);
