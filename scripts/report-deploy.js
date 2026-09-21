const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPORT_SOURCE =
"D:/DJCSS-Claude/E2EPlaywrightFramework/allure-report/regression";

const REPO_PATH =
"D:/GitHub/djcss-allure-reports";

const APP_NAME = "DJCSS";

const today = new Date()
  .toISOString()
  .split("T")[0];

const dateFolder =
path.join(
  REPO_PATH,
  APP_NAME,
  today
);

const latestFolder =
path.join(
  REPO_PATH,
  APP_NAME,
  "latest"
);

console.log("Deploying report...");

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

// Copy latest report
fs.cpSync(
 REPORT_SOURCE,
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
(
 (passed / total) * 100
).toFixed(2);

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

history = history.filter(
 r => r.executionDate !== today
);

history.unshift({

 application: APP_NAME,

 executionDate: today,

 environment: "QA",

 totalTests: total,

 passed: passed,

 failed: failed,

 passPercentage: passPct,

 duration: `${duration} mins`,

 reportUrl:
  `${APP_NAME}/${today}/`

});

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

const rows =
history.map(r => `

<tr>
<td>${r.application}</td>
<td>${r.executionDate}</td>
<td>${r.environment}</td>
<td>${r.totalTests}</td>
<td style="color:green;font-weight:bold;">
${r.passed}
</td>

<td style="color:red;font-weight:bold;">
${r.failed}
</td>

<td style="color:#0078D4;font-weight:bold;">
${r.passPercentage}%
</td>

<td>${r.duration}</td>

<td>
<a
 href="${r.reportUrl}"
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
}

th{
 background:#0078D4;
 color:white;
 padding:12px;
}

td{
 padding:12px;
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
<th>Execution Date</th>
<th>Environment</th>
<th>Total Tests</th>
<th>Passed</th>
<th>Failed</th>
<th>Pass %</th>
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

 execSync(
  `git commit -m "Add ${APP_NAME} report ${today}"`,
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