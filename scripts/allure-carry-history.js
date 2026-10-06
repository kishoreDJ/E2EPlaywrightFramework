const fs = require('fs');
const path = require('path');

const resultsDirName = process.argv[2] || process.env.ALLURE_RESULTS_DIR || 'allure-results';
const reportDirName = process.argv[3] || process.env.ALLURE_REPORT_DIR || 'allure-report';

const resultsDir = path.resolve(__dirname, '..', resultsDirName);
const historySrc = path.resolve(__dirname, '..', reportDirName, 'history');
const historyDest = path.resolve(resultsDir, 'history');

// Clear stale results from previous runs so they don't get mixed into the next report.
fs.rmSync(resultsDir, { recursive: true, force: true });
fs.mkdirSync(resultsDir, { recursive: true });
console.log('Cleared stale Allure results.');

if (fs.existsSync(historySrc)) {
  fs.mkdirSync(historyDest, { recursive: true });
  fs.cpSync(historySrc, historyDest, { recursive: true });
  console.log('Carried forward Allure history for trend charts.');
} else {
  console.log('No previous Allure history found; trend charts will start fresh.');
}
