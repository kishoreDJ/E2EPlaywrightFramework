const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");

const APP_NAME =
process.argv[2] || process.env.APP_NAME || "DJCSS";

const SUITE =
process.argv[3] || process.env.SUITE || "Regression";

// Folder names stay lowercase to match the local allure-report/<suite>
// convention (allure-report/regression, allure-report/smoke); SUITE itself
// keeps its display casing for the dashboard/history.
const SUITE_FOLDER = SUITE.toLowerCase();

const REPORT_SOURCE =
process.env.REPORT_SOURCE ||
path.join(__dirname, "..", "allure-report", SUITE_FOLDER);

const REPO_PATH = process.env.REPORT_REPO_PATH;

if (!REPO_PATH) {
 throw new Error(
  "REPORT_REPO_PATH is not set. Export it before running, e.g.\n" +
  '  REPORT_REPO_PATH="D:/GitHub/djcss-allure-reports" npm run publish:report'
 );
}

const RETENTION_DAYS =
parseInt(process.env.REPORT_RETENTION_DAYS || "90", 10);

function escapeHtml(value) {
 return String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
}

const MONTH_NAMES = [
 "Jan", "Feb", "Mar", "Apr", "May", "Jun",
 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// executionDate/executionTime are stored as "YYYY-MM-DD"/"HH-MM-SS" for
// sorting and folder-safety; this formats them for display only, e.g.
// "17 Sep 26, 12:04 PM".
function formatExecutedAt(executionDate, executionTime) {
 const [year, month, day] = executionDate.split("-").map(Number);
 const [hour, minute] = (executionTime || "00-00-00").split("-").map(Number);

 const hour12 = hour % 12 === 0 ? 12 : hour % 12;
 const ampm = hour < 12 ? "AM" : "PM";

 return `${day} ${MONTH_NAMES[month - 1]} ${pad(year % 100)}, ` +
  `${hour12}:${pad(minute)} ${ampm}`;
}

// Sync with remote before reading/updating shared files (history.json,
// index.html) to reduce the chance of overwriting another run's update.
try {

 execFileSync(
  "git",
  ["pull", "--rebase"],
  {
   cwd: REPO_PATH,
   stdio: "inherit"
  }
 );

}
catch(error){

 console.log(
  "git pull failed or nothing to pull, continuing with local state."
 );

}

const now = new Date();

const pad = n => String(n).padStart(2, "0");

const today =
`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// e.g. "14-30-05" — colon-free so it's safe as a folder name, and in
// local time so it matches the machine's wall clock, not UTC.
const runTime =
`${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

const dateFolder =
path.join(
  REPO_PATH,
  APP_NAME,
  SUITE_FOLDER,
  today,
  runTime
);

const latestFolder =
path.join(
  REPO_PATH,
  APP_NAME,
  SUITE_FOLDER,
  "latest"
);

console.log("Deploying report...");

if (!fs.existsSync(REPORT_SOURCE)) {
 throw new Error(
  `Report source not found: ${REPORT_SOURCE}. Did the Allure report generate successfully?`
 );
}

fs.mkdirSync(
 path.dirname(dateFolder),
 { recursive:true }
);

// Remove old latest folder
fs.rmSync(
 latestFolder,
 {
   recursive:true,
   force:true
 }
);

// Copy historical report
fs.cpSync(
 REPORT_SOURCE,
 dateFolder,
 {
   recursive:true
 }
);

// Mirror it as "latest" (copy from the historical folder, not the source,
// so both stay byte-for-byte identical without reading the source twice)
fs.cpSync(
 dateFolder,
 latestFolder,
 {
   recursive:true
 }
);

console.log("Files copied");

console.log("Reading summary.json...");

// ====================================
// Read Allure summary.json
// ====================================

const summaryPath =
path.join(
 latestFolder,
 "widgets",
 "summary.json"
);

if (!fs.existsSync(summaryPath)) {
 throw new Error(`Allure summary.json not found: ${summaryPath}`);
}

const summary =
JSON.parse(
 fs.readFileSync(
   summaryPath,
   "utf8"
 )
);

const total =
summary.statistic.total;

const passed =
summary.statistic.passed;

const failed =
summary.statistic.failed +
(summary.statistic.broken || 0);

const passPct =
total > 0
 ? ((passed / total) * 100).toFixed(2)
 : "0.00";

const duration =
Math.round(
 summary.time.duration /
 1000 / 60
);

console.log(`
----------------------------------
Execution Metrics
----------------------------------
Total Tests : ${total}
Passed      : ${passed}
Failed      : ${failed}
Pass %      : ${passPct}
Duration    : ${duration} mins
----------------------------------
`);


// ====================================
// Detect retests (--last-failed runs) so they can be linked to the full
// run they retested instead of showing up as an unrelated, tiny-looking row.
// ====================================

const runMetaPath =
path.join(
 latestFolder,
 "run-meta.json"
);

const isRetest =
fs.existsSync(runMetaPath) &&
JSON.parse(fs.readFileSync(runMetaPath, "utf8")).isRetest === true;

const runId = `${APP_NAME}-${SUITE}-${today}-${runTime}`;


// ====================================
// Update report-history.json
// ====================================

const historyFile =
path.join(
 REPO_PATH,
 "report-history.json"
);

let history = [];

if(fs.existsSync(historyFile))
{
 history =
 JSON.parse(
  fs.readFileSync(
   historyFile,
   "utf8"
  )
 );
}

// Older entries predate the id field; backfill from their own
// date/time so parent lookups still work against historical data.
history = history.map(r => ({
 id: r.id ||
  `${r.application}-${r.suite || "Regression"}-${r.executionDate}-${r.executionTime}`,
 ...r
}));

// Link to the most recent full (non-retest) run for this app + suite.
let parentId = null;

if (isRetest) {
 const parent = history.find(r =>
  r.application === APP_NAME &&
  (r.suite || "Regression") === SUITE &&
  !r.isRetest
 );

 if (parent) {
  parentId = parent.id;
 }
 else {
  console.log(
   "Retest run: no prior full run found to link to; publishing as standalone."
  );
 }
}

history.unshift({

 id: runId,

 application: APP_NAME,

 suite: SUITE,

 isRetest,

 parentId,

 executionDate: today,

 executionTime: runTime,

 environment: "QA",

 totalTests: total,

 passed: passed,

 failed: failed,

 passPercentage: passPct,

 duration: `${duration} mins`,

 reportUrl:
  `${APP_NAME}/${SUITE_FOLDER}/${today}/${runTime}/`

});

// ====================================
// Prune history/report folders older than retention window
// ====================================

const cutoff = new Date(now);
cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
const cutoffDate =
`${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;

const expired = history.filter(r => r.executionDate < cutoffDate);
history = history.filter(r => r.executionDate >= cutoffDate);

for (const r of expired) {
 const folder = path.join(
  REPO_PATH,
  r.application,
  (r.suite || "Regression").toLowerCase(),
  r.executionDate
 );
 fs.rmSync(folder, { recursive: true, force: true });
}

if (expired.length > 0) {
 console.log(
  `Pruned ${expired.length} run(s) older than ${RETENTION_DAYS} days.`
 );
}

fs.writeFileSync(
 historyFile,
 JSON.stringify(
  history,
  null,
  2
 )
);

console.log(
 "report-history.json updated"
);


// ====================================
// Generate Dashboard HTML
// ====================================

// Retests (--last-failed runs) are linked to the full run they retested via
// parentId. Group them under their parent here so the dashboard reads like
// BrowserStack's "Related Jobs" view instead of showing the retest's small
// pass/fail counts as an unrelated run.
const retestsByParentId = new Map();

for (const r of history) {
 if (!r.isRetest || !r.parentId) continue;
 if (!retestsByParentId.has(r.parentId)) {
  retestsByParentId.set(r.parentId, []);
 }
 retestsByParentId.get(r.parentId).push(r);
}

// Parent rows are every run that isn't itself a linked retest; orphaned
// retests (parent since pruned/not found) fall back to being their own
// top-level row so they're never silently dropped from the dashboard.
const parentRows = history.filter(r => !r.isRetest || !r.parentId);

// Group by application + suite, newest run first within each group,
// so the dashboard shows a clean trend line per app/suite instead of
// interleaving every app's runs by publish time.
const sortedForDisplay =
[...parentRows].sort((a, b) => {

 if (a.application !== b.application) {
  return a.application.localeCompare(b.application);
 }

 const suiteA = a.suite || "Regression";
 const suiteB = b.suite || "Regression";
 if (suiteA !== suiteB) {
  return suiteA.localeCompare(suiteB);
 }

 const stampA = `${a.executionDate}T${a.executionTime}`;
 const stampB = `${b.executionDate}T${b.executionTime}`;
 return stampB.localeCompare(stampA);

});

// A retest only reruns the parent's previously-failed tests, so any test
// that passes on retest moves from failed to passed in the parent's
// displayed totals (total stays the same — it's the same test set, not
// new tests). Applied oldest-to-newest across all retests so an earlier
// retest's gains aren't lost when a later retest reruns a smaller set.
function computeEffectiveResult(parent, retests) {

 const chronological =
  [...retests].sort((a, b) => {
   const stampA = `${a.executionDate}T${a.executionTime}`;
   const stampB = `${b.executionDate}T${b.executionTime}`;
   return stampA.localeCompare(stampB);
  });

 let remainingFailed = parent.failed;

 for (const r of chronological) {
  remainingFailed -= Math.min(r.passed, remainingFailed);
 }

 return {
  passed: parent.totalTests - remainingFailed,
  failed: remainingFailed,
  totalTests: parent.totalTests
 };

}

function renderRow(r, { indent, effective } = {}) {

 const labelPrefix = indent
  ? `<span style="color:#0078D4;font-weight:bold;">&#8627; Retest&nbsp;</span>`
  : "";

 // When retests have cleared prior failures, show the parent's updated
 // totals with the original counts struck through alongside them, so the
 // improvement is visible without losing the historical numbers.
 const result = effective
  ? `
<span style="color:#999;text-decoration:line-through;">${escapeHtml(r.passed)} P / ${escapeHtml(r.failed)} F</span>
<br>
<span style="color:green;font-weight:bold;">${escapeHtml(effective.passed)} P</span>
 /
<span style="color:red;font-weight:bold;">${escapeHtml(effective.failed)} F</span>
<br>
<span style="color:#0078D4;font-weight:bold;">${escapeHtml(effective.totalTests)} TOTAL</span>
`
  : `
<span style="color:green;font-weight:bold;">${escapeHtml(r.passed)} P</span>
 /
<span style="color:red;font-weight:bold;">${escapeHtml(r.failed)} F</span>
<br>
<span style="color:#0078D4;font-weight:bold;">${escapeHtml(r.totalTests)} TOTAL</span>
`;

 return `

<tr${indent ? ' style="background:#f7fbff;"' : ""}>
<td>${escapeHtml(r.application)}</td>
<td>${labelPrefix}${escapeHtml(r.suite || "Regression")}</td>
<td>${escapeHtml(formatExecutedAt(r.executionDate, r.executionTime))}</td>
<td>${escapeHtml(r.environment)}</td>
<td>
${result}
</td>

<td>${escapeHtml(r.duration)}</td>

<td>
<a
 href="${escapeHtml(r.reportUrl)}"
 style="
 background:#28a745;
 color:white;
 padding:6px 12px;
 text-decoration:none;
 border-radius:5px;"
>
View
</a>
</td>

</tr>

`;
}

const rows =
sortedForDisplay.map(parent => {

 const retests =
  (retestsByParentId.get(parent.id) || [])
   .sort((a, b) => {
    const stampA = `${a.executionDate}T${a.executionTime}`;
    const stampB = `${b.executionDate}T${b.executionTime}`;
    return stampB.localeCompare(stampA);
   });

 const effective =
  retests.length > 0
   ? computeEffectiveResult(parent, retests)
   : null;

 return (
  renderRow(parent, { effective }) +
  retests.map(r => renderRow(r, { indent: true })).join("")
 );

}).join("");


const dashboard = `

<!DOCTYPE html>

<html>

<head>

<title>QA Automation Report Portal</title>

<style>

body{
 font-family:Arial;
 background:#f4f8fc;
 margin:30px;
}

.header{
 background:linear-gradient(
  90deg,
  #0078D4,
  #00B4D8
 );

 color:white;
 padding:20px;
 border-radius:10px;
 margin-bottom:20px;
}

table{
 width:100%;
 border-collapse:collapse;
 background:white;
 box-shadow:0 2px 10px rgba(0,0,0,.1);
 font-size:13px;
}

th{
 background:#0078D4;
 color:white;
 padding:8px;
}

td{
 padding:8px;
 border-bottom:1px solid #eee;
 text-align:center;
}

tr:hover{
 background:#f7fbff;
}

</style>

</head>

<body>

<div class="header">

<h1>
🚀 QA Automation Report Portal
</h1>

<p>
Historical Allure Reports Dashboard
</p>

</div>

<table>

<tr>

<th>Application</th>
<th>Suite</th>
<th>Executed At</th>
<th>Environment</th>
<th>Result</th>
<th>Duration</th>
<th>Report</th>

</tr>

${rows}

</table>

</body>
</html>

`;

fs.writeFileSync(
 path.join(
  REPO_PATH,
  "index.html"
 ),
 dashboard
);

console.log(
 "Dashboard updated"
);


// ====================================
// Git Commit & Push
// ====================================

execSync(
 "git add .",
 {
  cwd: REPO_PATH,
  stdio: "inherit"
 }
);

try {

 execFileSync(
  "git",
  ["commit", "-m", `Add ${APP_NAME} ${SUITE} report ${today} ${runTime}`],
  {
   cwd: REPO_PATH,
   stdio: "inherit"
  }
 );

}
catch(error){

 console.log(
  "No changes found. Skipping commit."
 );

}

execSync(
 "git push",
 {
  cwd: REPO_PATH,
  stdio: "inherit"
 }
);

console.log("Published!");