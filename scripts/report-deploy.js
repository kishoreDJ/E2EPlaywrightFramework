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

history.unshift({

 application: APP_NAME,

 suite: SUITE,

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

// Group by application + suite, newest run first within each group,
// so the dashboard shows a clean trend line per app/suite instead of
// interleaving every app's runs by publish time.
const sortedForDisplay =
[...history].sort((a, b) => {

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

const rows =
sortedForDisplay.map(r => `

<tr>
<td>${escapeHtml(r.application)}</td>
<td>${escapeHtml(r.suite || "Regression")}</td>
<td>${escapeHtml(formatExecutedAt(r.executionDate, r.executionTime))}</td>
<td>${escapeHtml(r.environment)}</td>
<td>
<span style="color:green;font-weight:bold;">${escapeHtml(r.passed)} P</span>
 /
<span style="color:red;font-weight:bold;">${escapeHtml(r.failed)} F</span>
<br>
<span style="color:#0078D4;font-weight:bold;">${escapeHtml(r.totalTests)} TOTAL</span>
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

`).join("");


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