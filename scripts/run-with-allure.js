const { spawnSync } = require('child_process');

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

const generate = spawnSync('npx', ['allure', 'generate', resultsDir, '--clean', '-o', reportDir], {
  stdio: 'inherit',
  shell: true,
});

if (generate.status !== 0) {
  console.error(`Allure report generation failed (exit code ${generate.status}); preserving test exit code.`);
}

process.exit(testRun.status ?? 1);
