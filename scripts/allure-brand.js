const fs = require('fs');
const path = require('path');

// Allure's sidebar hardcodes the "Allure" brand text in its compiled JS bundle,
// so there's no config option to change it. This injects a CSS override into
// the generated index.html to relabel it, without touching node_modules.
const reportDir = process.argv[2];
if (!reportDir) {
  console.error('Usage: node allure-brand.js <reportDir>');
  process.exit(1);
}

const appName = process.env.APP_NAME || 'DowJones';

// Title passed in explicitly (e.g. "DJCSS Regression Report") takes
// precedence; falls back to a generic app-level title when run standalone
// via the allure:generate* npm scripts, which have no suite context.
const reportTitle = process.argv[3] || `${appName} Report`;

// DJCSS blue, replacing Allure's default purple/violet accent throughout
// the sidebar, links, and focus states.
const BRAND_BLUE = '#0078D4';
const BRAND_BLUE_HOVER = '#005A9E';
const BRAND_BLUE_ACTIVE = '#004578';
const BRAND_BLUE_SUBTLE = '#E5F1FB';
const BRAND_BLUE_SUBTLE_HOVER = '#DCEAF8';

// Minimal DJCSS-branded mark (blue circle, white "D") as a data URI so it
// doesn't depend on a hashed asset filename that changes between builds.
// Used for the browser favicon only.
const BRAND_MARK_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<circle cx="16" cy="16" r="16" fill="${BRAND_BLUE}"/>` +
  `<text x="16" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">D</text>` +
  `</svg>`;
const FAVICON_DATA_URI = 'data:image/svg+xml,' + encodeURIComponent(BRAND_MARK_SVG);

// "DJ" badge for the sidebar icon, which otherwise keeps Allure's own
// purple/red/green gradient logo.
const BRAND_ICON_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<circle cx="16" cy="16" r="16" fill="${BRAND_BLUE}"/>` +
  `<text x="16" y="21" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle">DJ</text>` +
  `</svg>`;
const BRAND_ICON_DATA_URI = 'data:image/svg+xml,' + encodeURIComponent(BRAND_ICON_SVG);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const BRAND_STYLE_START = '<style data-allure-brand>';
const BRAND_STYLE = `${BRAND_STYLE_START}
.side-nav__brand-text{font-size:0!important}
.side-nav__brand-text::after{content:${JSON.stringify(appName)};font-size:var(--font-size-m,14px)}
:root{
  --color-nav-item-bg-active:${BRAND_BLUE_SUBTLE}!important;
  --color-nav-item-bg-active-hover:${BRAND_BLUE_SUBTLE_HOVER}!important;
  --color-nav-item-text-active:${BRAND_BLUE}!important;
  --color-nav-item-icon-active:${BRAND_BLUE}!important;
  --color-link-text:${BRAND_BLUE}!important;
  --color-link-text-hover:${BRAND_BLUE_HOVER}!important;
  --color-link-text-active:${BRAND_BLUE_ACTIVE}!important;
  --color-intent-primary-bg:${BRAND_BLUE}!important;
  --color-intent-primary-bg-hover:${BRAND_BLUE_HOVER}!important;
  --color-intent-primary-bg-active:${BRAND_BLUE_ACTIVE}!important;
  --color-intent-primary-text:${BRAND_BLUE}!important;
  --color-focus-ring:${BRAND_BLUE}!important;
}
.node__parameters{flex:0 0 auto!important;min-width:max-content!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important}
.side-nav__brand-icon{background-image:url(${BRAND_ICON_DATA_URI})!important}
.summary-widget__chart{display:flex!important;align-items:center!important;gap:16px!important}
.summary-widget__chart>div:first-child{flex:0 0 auto!important;width:160px!important}
.djcss-pie-legend{display:flex;flex-direction:column;gap:6px}
.djcss-pie-legend__row{display:flex;align-items:center;gap:6px;font-size:var(--font-size-m,14px);color:var(--color-text-primary)}
.djcss-pie-legend__dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto}
</style>`;

// The Overview pie chart is rendered client-side by Allure's JS bundle from
// widgets/summary.json, so unlike the title/favicon above there's no static
// markup to string-replace; this script fetches the same JSON and appends a
// counts legend next to the chart. A MutationObserver is needed because the
// chart (re)mounts via client-side routing whenever the Overview page loads.
const LEGEND_SCRIPT_START = '<script data-allure-pie-legend>';
const LEGEND_SCRIPT = `${LEGEND_SCRIPT_START}
(function () {
  var STATUSES = ['passed', 'failed', 'broken', 'skipped', 'unknown'];
  var LABELS = { passed: 'Passed', failed: 'Failed', broken: 'Broken', skipped: 'Skipped', unknown: 'Unknown' };

  function buildLegend(stat) {
    var legend = document.createElement('div');
    legend.className = 'djcss-pie-legend';
    STATUSES.forEach(function (status) {
      var count = stat[status];
      if (!count) return;
      var row = document.createElement('div');
      row.className = 'djcss-pie-legend__row';
      var dot = document.createElement('span');
      dot.className = 'djcss-pie-legend__dot';
      dot.style.background = 'var(--color-status-' + status + '-chart-fill)';
      row.appendChild(dot);
      row.appendChild(document.createTextNode(LABELS[status] + ': ' + count));
      legend.appendChild(row);
    });
    return legend;
  }

  function injectLegend(stat) {
    var chartColumns = document.querySelectorAll('.summary-widget__chart');
    chartColumns.forEach(function (col) {
      if (col.querySelector('.djcss-pie-legend')) return;
      col.appendChild(buildLegend(stat));
    });
  }

  function loadAndObserve() {
    fetch('widgets/summary.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var stat = (data && data.statistic) || {};
        injectLegend(stat);
        new MutationObserver(function () { injectLegend(stat); })
          .observe(document.body, { childList: true, subtree: true });
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndObserve);
  } else {
    loadAndObserve();
  }
})();
</script>`;

// The Trend widget on Overview renders Allure's own stacked-area/stream
// chart from widgets/history-trend.json, with no y-axis title and no bars.
// There's no config option to change the chart type, so like the pie legend
// above, this fetches the same JSON client-side and swaps in a labelled
// stacked bar chart. Allure's chart keeps its own resize observer on the
// container div and will redraw its original SVG into it on every resize;
// the MutationObserver here detects that and re-renders our bars on top of
// it, which doubles as our own resize handling for free.
const TREND_SCRIPT_START = '<script data-allure-trend-chart>';
const TREND_SCRIPT = `${TREND_SCRIPT_START}
(function () {
  var STATUS_ORDER = ['unknown', 'skipped', 'broken', 'failed', 'passed'];

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function formatBuildDate(ts) {
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
  }

  // widgets/history-trend.json has no per-build timestamp, so dates are
  // recovered from history/history.json: each test there keeps a per-run
  // items[] array ordered newest-first, aligned by index with the trend
  // array's build order. The latest timestamp across all tests at a given
  // index is taken as that build's run date.
  function computeBuildDates(history) {
    var maxByIndex = [];
    Object.keys(history || {}).forEach(function (key) {
      var items = (history[key] && history[key].items) || [];
      items.forEach(function (it, idx) {
        if (!it.time) return;
        var stop = it.time.stop;
        if (maxByIndex[idx] === undefined || stop > maxByIndex[idx]) {
          maxByIndex[idx] = stop;
        }
      });
    });
    return maxByIndex;
  }

  function niceMax(value) {
    if (!value) return 1;
    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var normalized = value / magnitude;
    var niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceNormalized * magnitude;
  }

  function renderBarChart(container, items, buildDates) {
    var width = container.clientWidth || 600;
    var height = container.clientHeight || 220;
    var padLeft = 46, padRight = 10, padTop = 10, padBottom = 34;
    var plotWidth = Math.max(width - padLeft - padRight, 0);
    var plotHeight = Math.max(height - padTop - padBottom, 0);

    var maxTotal = items.reduce(function (m, it) {
      return Math.max(m, (it.data && it.data.total) || 0);
    }, 0);
    var niceTop = niceMax(maxTotal);
    var tickCount = 5;
    var ticks = [];
    for (var i = 0; i <= tickCount; i++) {
      ticks.push(Math.round((niceTop / tickCount) * i));
    }

    function yFor(v) {
      return padTop + plotHeight - (v / niceTop) * plotHeight;
    }

    var slotWidth = items.length ? plotWidth / items.length : plotWidth;
    var barWidth = Math.max(2, Math.min(28, slotWidth * 0.6));

    var parts = [];
    parts.push(
      '<svg class="djcss-trend-svg" width="100%" height="100%" viewBox="0 0 ' + width + ' ' + height +
      '" preserveAspectRatio="none" style="position:absolute;top:0;left:0;">'
    );

    ticks.forEach(function (t) {
      var y = yFor(t);
      parts.push(
        '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (width - padRight) + '" y2="' + y +
        '" stroke="var(--color-border-subtle)" stroke-width="1" />'
      );
      parts.push(
        '<text x="' + (padLeft - 6) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" ' +
        'font-size="11" fill="var(--color-text-secondary)">' + t + '</text>'
      );
    });

    parts.push(
      '<text x="12" y="' + (padTop + plotHeight / 2) + '" text-anchor="middle" font-size="11" ' +
      'fill="var(--color-text-secondary)" transform="rotate(-90, 12, ' + (padTop + plotHeight / 2) +
      ')">Test Count</text>'
    );

    // Allure orders trend items newest-first; the chart reads left-to-right
    // as oldest-to-newest. Reversed items[] index maps to the (also
    // newest-first) buildDates array computed from history.json.
    var axisY = padTop + plotHeight;
    items.forEach(function (item, idx) {
      var slotX = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
      var cumulative = 0;
      STATUS_ORDER.forEach(function (status) {
        var val = (item.data && item.data[status]) || 0;
        if (!val) return;
        var yTop = yFor(cumulative + val);
        var yBottom = yFor(cumulative);
        parts.push(
          '<rect x="' + slotX + '" y="' + yTop + '" width="' + barWidth + '" height="' +
          Math.max(yBottom - yTop, 0) + '" fill="var(--color-status-' + status + '-chart-fill)">' +
          '<title>' + status + ': ' + val + '</title></rect>'
        );
        cumulative += val;
      });
      var dateTs = buildDates && buildDates[items.length - 1 - idx];
      var label = dateTs ? formatBuildDate(dateTs) : '#' + (items.length - idx);
      var labelX = slotX + barWidth / 2;
      var labelY = axisY + 10;
      parts.push(
        '<text x="' + labelX + '" y="' + labelY + '" text-anchor="end" ' +
        'font-size="11" fill="var(--color-text-secondary)" transform="rotate(-40, ' +
        labelX + ', ' + labelY + ')">' + label + '</text>'
      );
    });

    parts.push('</svg>');
    container.innerHTML = parts.join('');
  }

  function patchTrendCharts(items, buildDates) {
    var containers = document.querySelectorAll('.history-trend__chart > div');
    containers.forEach(function (container) {
      var firstChild = container.firstElementChild;
      if (firstChild && firstChild.classList.contains('djcss-trend-svg')) return;
      renderBarChart(container, items, buildDates);
    });
  }

  function loadAndObserve() {
    Promise.all([
      fetch('widgets/history-trend.json').then(function (res) { return res.json(); }),
      fetch('history/history.json').then(function (res) { return res.json(); }).catch(function () { return {}; })
    ])
      .then(function (results) {
        var items = Array.isArray(results[0]) ? results[0] : [];
        var buildDates = computeBuildDates(results[1]);
        patchTrendCharts(items, buildDates);
        new MutationObserver(function () { patchTrendCharts(items, buildDates); })
          .observe(document.body, { childList: true, subtree: true });
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndObserve);
  } else {
    loadAndObserve();
  }
})();
</script>`;

// The Graphs tab's Duration Trend widget renders Allure's own
// area/line/points chart from widgets/duration-trend.json, one point per
// historical run. Each run is a discrete, unrelated data point rather than
// a continuous series, so interpolating lines/areas between them implies a
// trend that isn't really there. Like the Overview Trend chart above, this
// swaps in a single-series bar chart built from the same JSON, reusing
// history/history.json for per-build dates (same build order/length as the
// other trend widgets, aligned by index).
const DURATION_TREND_SCRIPT_START = '<script data-allure-duration-trend-chart>';
const DURATION_TREND_SCRIPT = `${DURATION_TREND_SCRIPT_START}
(function () {
  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function formatBuildDate(ts) {
    var d = new Date(ts);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
  }

  function computeBuildDates(history) {
    var maxByIndex = [];
    Object.keys(history || {}).forEach(function (key) {
      var items = (history[key] && history[key].items) || [];
      items.forEach(function (it, idx) {
        if (!it.time) return;
        var stop = it.time.stop;
        if (maxByIndex[idx] === undefined || stop > maxByIndex[idx]) {
          maxByIndex[idx] = stop;
        }
      });
    });
    return maxByIndex;
  }

  function niceMax(value) {
    if (!value) return 1;
    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var normalized = value / magnitude;
    var niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceNormalized * magnitude;
  }

  function formatSeconds(v) {
    return (Math.round(v * 10) / 10) + 's';
  }

  function renderBarChart(container, items, buildDates) {
    var width = container.clientWidth || 600;
    var height = container.clientHeight || 220;
    var padLeft = 46, padRight = 10, padTop = 10, padBottom = 34;
    var plotWidth = Math.max(width - padLeft - padRight, 0);
    var plotHeight = Math.max(height - padTop - padBottom, 0);

    var values = items.map(function (it) { return ((it.data && it.data.duration) || 0) / 1000; });
    var maxValue = values.reduce(function (m, v) { return Math.max(m, v); }, 0);
    var niceTop = niceMax(maxValue);
    var tickCount = 5;
    var ticks = [];
    for (var i = 0; i <= tickCount; i++) {
      ticks.push(Math.round(((niceTop / tickCount) * i) * 10) / 10);
    }

    function yFor(v) {
      return padTop + plotHeight - (v / niceTop) * plotHeight;
    }

    var slotWidth = items.length ? plotWidth / items.length : plotWidth;
    var barWidth = Math.max(2, Math.min(28, slotWidth * 0.6));

    var parts = [];
    parts.push(
      '<svg class="djcss-trend-svg" width="100%" height="100%" viewBox="0 0 ' + width + ' ' + height +
      '" preserveAspectRatio="none" style="position:absolute;top:0;left:0;">'
    );

    ticks.forEach(function (t) {
      var y = yFor(t);
      parts.push(
        '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (width - padRight) + '" y2="' + y +
        '" stroke="var(--color-border-subtle)" stroke-width="1" />'
      );
      parts.push(
        '<text x="' + (padLeft - 6) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" ' +
        'font-size="11" fill="var(--color-text-secondary)">' + t + '</text>'
      );
    });

    parts.push(
      '<text x="12" y="' + (padTop + plotHeight / 2) + '" text-anchor="middle" font-size="11" ' +
      'fill="var(--color-text-secondary)" transform="rotate(-90, 12, ' + (padTop + plotHeight / 2) +
      ')">Duration (s)</text>'
    );

    var axisY = padTop + plotHeight;
    items.forEach(function (item, idx) {
      var slotX = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
      var value = values[idx];
      var yTop = yFor(value);
      parts.push(
        '<rect x="' + slotX + '" y="' + yTop + '" width="' + barWidth + '" height="' +
        Math.max(axisY - yTop, 0) + '" fill="${BRAND_BLUE}">' +
        '<title>' + formatSeconds(value) + '</title></rect>'
      );
      var dateTs = buildDates && buildDates[items.length - 1 - idx];
      var label = dateTs ? formatBuildDate(dateTs) : '#' + (items.length - idx);
      var labelX = slotX + barWidth / 2;
      var labelY = axisY + 10;
      parts.push(
        '<text x="' + labelX + '" y="' + labelY + '" text-anchor="end" ' +
        'font-size="11" fill="var(--color-text-secondary)" transform="rotate(-40, ' +
        labelX + ', ' + labelY + ')">' + label + '</text>'
      );
    });

    parts.push('</svg>');
    container.innerHTML = parts.join('');
  }

  function patchDurationTrendCharts(items, buildDates) {
    var containers = document.querySelectorAll('.duration-trend__chart > div');
    containers.forEach(function (container) {
      var firstChild = container.firstElementChild;
      if (firstChild && firstChild.classList.contains('djcss-trend-svg')) return;
      renderBarChart(container, items, buildDates);
    });
  }

  function loadAndObserve() {
    Promise.all([
      fetch('widgets/duration-trend.json').then(function (res) { return res.json(); }),
      fetch('history/history.json').then(function (res) { return res.json(); }).catch(function () { return {}; })
    ])
      .then(function (results) {
        var items = Array.isArray(results[0]) ? results[0] : [];
        var buildDates = computeBuildDates(results[1]);
        patchDurationTrendCharts(items, buildDates);
        new MutationObserver(function () { patchDurationTrendCharts(items, buildDates); })
          .observe(document.body, { childList: true, subtree: true });
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndObserve);
  } else {
    loadAndObserve();
  }
})();
</script>`;

// The Environment widget auto-wraps every value in <a href="VALUE">, on the
// assumption some values are URLs worth linking. Plain values like "dev" or
// "DJCSS" get treated as relative paths and 404 when clicked (there's no
// such page under the report folder). There's no config to opt a value out
// of this, so like the pie legend/trend chart above, this strips the anchor
// client-side once the widget renders. A MutationObserver re-applies it
// since Overview re-mounts the widget via client-side routing.
const ENV_UNLINK_SCRIPT_START = '<script data-allure-env-unlink>';
const ENV_UNLINK_SCRIPT = `${ENV_UNLINK_SCRIPT_START}
(function () {
  function unlinkEnvironmentWidget() {
    document.querySelectorAll('h2.widget__title').forEach(function (h2) {
      if (h2.textContent.trim() !== 'Environment') return;
      var table = h2.nextElementSibling;
      if (!table) return;
      table.querySelectorAll('a.link').forEach(function (a) {
        var span = document.createElement('span');
        span.textContent = a.textContent;
        a.replaceWith(span);
      });
    });
  }

  function loadAndObserve() {
    unlinkEnvironmentWidget();
    new MutationObserver(unlinkEnvironmentWidget).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndObserve);
  } else {
    loadAndObserve();
  }
})();
</script>`;

const indexPath = path.join(reportDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error(`index.html not found in report dir: ${reportDir}`);
}

const html = fs.readFileSync(indexPath, 'utf8');
const withoutPriorBrand = html
  .replace(new RegExp(`${BRAND_STYLE_START}[\\s\\S]*?</style>`), '')
  .replace(new RegExp(`${LEGEND_SCRIPT_START}[\\s\\S]*?</script>`), '')
  .replace(new RegExp(`${TREND_SCRIPT_START}[\\s\\S]*?</script>`), '')
  .replace(new RegExp(`${DURATION_TREND_SCRIPT_START}[\\s\\S]*?</script>`), '')
  .replace(new RegExp(`${ENV_UNLINK_SCRIPT_START}[\\s\\S]*?</script>`), '');

const withBrandStyle = withoutPriorBrand.replace('</head>', `${BRAND_STYLE}</head>`);
const withFavicon = withBrandStyle.replace(
  /<link rel="icon" href="[^"]*">/,
  `<link rel="icon" href="${FAVICON_DATA_URI}">`,
);
const withTitle = withFavicon.replace(
  /<title>[^<]*<\/title>/,
  `<title>${escapeHtml(reportTitle)}</title>`,
);
const withThemeColor = withTitle.replace(
  '</head>',
  `<meta name="theme-color" content="${BRAND_BLUE}"></head>`,
);
const withLegendScript = withThemeColor.replace('</body>', `${LEGEND_SCRIPT}</body>`);
const withTrendScript = withLegendScript.replace('</body>', `${TREND_SCRIPT}</body>`);
const withDurationTrendScript = withTrendScript.replace('</body>', `${DURATION_TREND_SCRIPT}</body>`);
const withEnvUnlinkScript = withDurationTrendScript.replace('</body>', `${ENV_UNLINK_SCRIPT}</body>`);

fs.writeFileSync(indexPath, withEnvUnlinkScript);
console.log(`Applied ${appName} branding to ${indexPath}`);
