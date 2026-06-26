import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXAMPLE_REPORTS } from '../examples/manifest.js';
import {
  FILE_ERROR_TOO_LARGE,
  FILE_ERROR_UNSUPPORTED,
  MAX_SAFE_FILE_SIZE_BYTES,
  validateReportFile,
} from '../src/fileValidation.js';
import {
  createInitialAppState,
  createParsedStatusMessage,
  startNewReportState,
  withParsedReport,
  withPrivacyMode,
  withStatus,
} from '../src/appState.js';
import { detectFileType } from '../src/parsers/detect.js';
import { parseInput } from '../src/parsers/index.js';
import {
  REPORT_SIZE_LEVELS,
  REPORT_SIZE_THRESHOLDS,
  getReportSizeMetrics,
  getSectionSizeMetrics,
  isLargeReport,
  isLargeSection,
  summarizeReportSize,
  summarizeSectionSize,
} from '../src/models/reportSize.js';
import { filterSectionsByQuery } from '../src/search/filterSections.js';
import { serializeSectionForCopy } from '../src/clipboard/serializeSection.js';
import { getVisibleSectionForCopy } from '../src/clipboard/visibleSection.js';
import {
  findCrashedThreadName,
  getLimitedRows,
  groupRowsByThread,
  isLargeKextTable,
} from '../src/ui/denseTables.js';
import { TABLE_VIEW_MODES, getTableView } from '../src/ui/tableView.js';
import { getCoreAnalyticsView, parseTableSummary } from '../src/ui/coreAnalyticsView.js';
import { createSectionNavItems } from '../src/ui/renderSectionNav.js';
import { sanitizeText } from '../src/privacy/sanitize.js';

const ipsText = await readFile(new URL('./fixtures/example.ips', import.meta.url), 'utf8');
const fullIpsText = await readFile(new URL('./fixtures/example-full.ips', import.meta.url), 'utf8');
const metadataIpsText = await readFile(new URL('./fixtures/example-metadata.ips', import.meta.url), 'utf8');
const visibleSectionSource = await readFile(new URL('../src/clipboard/visibleSection.js', import.meta.url), 'utf8');
const searchSource = await readFile(new URL('../src/search/filterSections.js', import.meta.url), 'utf8');
const renderAppSource = await readFile(new URL('../src/ui/renderApp.js', import.meta.url), 'utf8');
const renderCoreAnalyticsOverviewSource = await readFile(new URL('../src/ui/renderCoreAnalyticsOverview.js', import.meta.url), 'utf8');
const renderSectionSource = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const crashText = await readFile(new URL('./fixtures/example.crash', import.meta.url), 'utf8');
const fullCrashText = await readFile(new URL('./fixtures/example-full.crash', import.meta.url), 'utf8');
const watchdogText = await readFile(new URL('./fixtures/example-watchdog.ips', import.meta.url), 'utf8');
const jetsamText = await readFile(new URL('./fixtures/example-jetsam.ips', import.meta.url), 'utf8');
const realSchemaJetsamText = await readFile(new URL('./fixtures/example-jetsam-real-schema.ips', import.meta.url), 'utf8');
const panicText = await readFile(new URL('./fixtures/example.panic-full', import.meta.url), 'utf8');
const jsonPanicText = await readFile(new URL('./fixtures/example-panic-json.ips', import.meta.url), 'utf8');
const analyticsText = await readFile(new URL('./fixtures/example-analytics.txt', import.meta.url), 'utf8');
const coreAnalyticsSmallText = await readFile(new URL('./fixtures/example-coreanalytics-small.ips.ca.synced', import.meta.url), 'utf8');
const coreAnalyticsMediumText = await readFile(new URL('./fixtures/example-coreanalytics-medium.ips.ca.synced', import.meta.url), 'utf8');
const coreAnalyticsLargeText = await readFile(new URL('./fixtures/example-coreanalytics-large.ips.ca.synced', import.meta.url), 'utf8');
const indexHtmlText = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorkerText = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
const mainScriptText = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const renderSectionText = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const styleText = await readFile(new URL('../styles/main.css', import.meta.url), 'utf8');

assert.match(indexHtmlText, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, 'viewport supports mobile Safari safe-area rendering without disabling zoom');
assert.match(indexHtmlText, /<input id="file-input" type="file">/, 'file picker does not restrict iOS analytics file extensions with accept filters');
assert.doesNotMatch(indexHtmlText, /id="file-input"[^>]*accept=/, 'file picker has no accept attribute that could grey out .ips files on Safari');
assert.match(indexHtmlText, /Install for quick access\. Installation saves the app shell, not\s+your reports\./, 'install guidance clarifies reports are not saved');
assert.match(indexHtmlText, /On iPhone or iPad, tap Share, then Add to Home Screen\./, 'install guidance includes iPhone and iPad Add to Home Screen steps');
assert.match(indexHtmlText, /<div id="offline-status" class="offline-status" role="status" aria-live="polite" hidden><\/div>/, 'offline status supports accessible text and actions');
assert.doesNotMatch(serviceWorkerText, /cache\.put/, 'service worker does not dynamically cache network responses');
assert.doesNotMatch(serviceWorkerText, /tests\/fixtures/, 'service worker does not cache test fixtures');
assert.match(serviceWorkerText, /\.\/src\/fileValidation\.js/, 'service worker precaches the file validation module');
assert.match(serviceWorkerText, /bump CACHE_VERSION/, 'service worker documents the cache-version reminder for precached asset changes');
assert.match(serviceWorkerText, /index\.html, styles\/main\.css, src modules, examples,/, 'service worker cache reminder lists key precached asset groups');
assert.match(serviceWorkerText, /v0\.5\.0-alpha-slice3b-coreanalytics-overview-2026-06-26/, 'service worker cache version reflects the current CoreAnalytics overview precache update');
assert.match(serviceWorkerText, /event\.waitUntil\(self\.skipWaiting\(\)\)/, 'service worker keeps the SKIP_WAITING activation request alive');
assert.doesNotMatch(serviceWorkerText, /(?:SyncManager|periodicSync|PushManager|pushManager|share_target|file_handlers)/, 'service worker avoids background and file-handler APIs');
assert.match(serviceWorkerText, /\.\/src\/ui\/renderCoreAnalyticsOverview\.js/, 'service worker precaches the CoreAnalytics overview renderer');
assert.match(serviceWorkerText, /\.\/src\/ui\/coreAnalyticsView\.js/, 'service worker precaches the CoreAnalytics view helper');
assert.match(serviceWorkerText, /\.\/src\/models\/reportSize\.js/, 'service worker precaches report-size helper dependencies');
assert.match(serviceWorkerText, /\.\/src\/ui\/tableView\.js/, 'service worker precaches shared table-view helper dependencies');
assert.doesNotMatch(`${serviceWorkerText}\n${mainScriptText}`, /(?:localStorage|sessionStorage|indexedDB|document\.cookie)/, 'app shell avoids persistent report storage APIs');
assert.match(mainScriptText, /new URL\('\.\.\/service-worker\.js', import\.meta\.url\)/, 'service worker registration uses a GitHub Pages-safe relative script URL');
assert.match(mainScriptText, /new URL\('\.\.\/', import\.meta\.url\)/, 'service worker registration derives scope from the current module URL');
assert.match(mainScriptText, /Offline app shell ready\. Examples can open offline\. Reports are still not saved\./, 'offline-ready status uses the approved copy');
assert.match(mainScriptText, /Offline setup unavailable\. Online parsing still works\./, 'offline setup failure uses the approved copy');
assert.match(mainScriptText, /Update ready\. Reload when done with the current report\./, 'update-ready status uses the approved copy');
assert.match(mainScriptText, /label: 'Reload app'/, 'update-ready status includes a keyboard-accessible reload action');
assert.match(mainScriptText, /Example unavailable offline\. Reconnect once to refresh offline examples\./, 'offline example failure uses the approved copy');
assert.match(mainScriptText, /lastOfflineStatusKey/, 'offline status avoids repeated DOM announcements for unchanged messages');
assert.match(mainScriptText, /function reloadForWaitingUpdate\(\)[^]*reloadAfterControllerChange = true;[^]*postMessage\(\{ type: 'SKIP_WAITING' \}\)/, 'reload is initiated only by the explicit update button handler');
assert.match(mainScriptText, /controllerchange[^]*if \(!reloadAfterControllerChange\) return;[^]*window\.location\.reload\(\)/, 'controllerchange reload is gated behind user-requested update flow');
assert.match(renderSectionText, /document\.createElement\('div'\)/, 'raw section text renders inside a block wrapper');
assert.match(renderSectionText, /raw-note raw-note--wrap/, 'raw section text uses the mobile wrapping class');
const rawWrapRule = styleText.match(/\.raw-note--wrap\s*{(?<body>[^}]*)}/s)?.groups?.body ?? '';
assert.match(rawWrapRule, /white-space:\s*pre-wrap;/, 'raw wrapping class preserves panic string line breaks');
assert.match(rawWrapRule, /overflow-wrap:\s*anywhere;/, 'raw wrapping class allows arbitrary token wrapping');
assert.match(rawWrapRule, /word-break:\s*break-word;/, 'raw wrapping class breaks long fallback tokens');
assert.match(rawWrapRule, /line-break:\s*anywhere;/, 'raw wrapping class handles iOS slash-heavy panic tokens');
assert.match(rawWrapRule, /max-width:\s*100%;/, 'raw wrapping class stays inside the card width');
assert.match(rawWrapRule, /min-width:\s*0;/, 'raw wrapping class can shrink inside grid and flex parents');

assert.deepEqual(
  EXAMPLE_REPORTS.map((example) => example.type),
  ['ips', 'crash', 'ips-watchdog-stackshot', 'jetsam', 'panic', 'analytics'],
  'production examples cover each supported file type once'
);
assert.equal(new Set(EXAMPLE_REPORTS.map((example) => example.id)).size, 6, 'production example IDs are unique');
for (const example of EXAMPLE_REPORTS) {
  assert.match(example.path, /^\.\/examples\//, 'production example files live in examples/');
  assert.doesNotMatch(example.path, /tests\/fixtures/, 'production UI does not load test fixtures');
  assert.match(example.sourceLabel, /^Example: /, 'production examples use explicit source labels');

  const exampleText = await readFile(new URL(`../${example.path.slice(2)}`, import.meta.url), 'utf8');
  assert.equal(detectFileType(exampleText), example.type, `${example.label} production example detects correctly`);
  assert.ok(parseInput(exampleText).length > 0, `${example.label} production example parses into sections`);
}

function mockFile(name, type = '', size = 1024) {
  return { name, type, size };
}

assert.equal(validateReportFile(mockFile('Crash.ips')).ok, true, 'file validation allows .ips reports without MIME help');
assert.equal(validateReportFile(mockFile('Legacy.crash')).ok, true, 'file validation allows .crash reports');
assert.equal(validateReportFile(mockFile('panic-full-2024.ips.panic-full')).ok, true, 'file validation allows panic-full reports');
assert.equal(
  validateReportFile(mockFile('Analytics.ips.ca.synced', 'application/octet-stream')).ok,
  true,
  'file validation allows known CoreAnalytics extension even when Safari reports octet-stream'
);
assert.equal(validateReportFile(mockFile('Report.synced')).ok, true, 'file validation allows .synced reports');
assert.equal(validateReportFile(mockFile('diagnostic.unknown', 'text/plain')).ok, true, 'file validation allows unknown text/plain files');
assert.equal(validateReportFile(mockFile('diagnostic.data', 'application/json')).ok, true, 'file validation allows unknown application/json files');
assert.deepEqual(
  validateReportFile(mockFile('photo.jpg', 'image/jpeg')),
  { ok: false, reason: 'unsupported', message: FILE_ERROR_UNSUPPORTED },
  'file validation rejects images before reading'
);
assert.equal(validateReportFile(mockFile('movie.mov', 'video/quicktime')).ok, false, 'file validation rejects videos before reading');
assert.equal(validateReportFile(mockFile('voice.m4a', 'audio/mp4')).ok, false, 'file validation rejects audio before reading');
assert.equal(validateReportFile(mockFile('manual.pdf', 'application/pdf')).ok, false, 'file validation rejects PDFs before reading');
assert.equal(validateReportFile(mockFile('archive.zip', 'application/zip')).ok, false, 'file validation rejects archives before reading');
assert.equal(validateReportFile(mockFile('unknown.bin', 'application/octet-stream')).ok, false, 'file validation rejects octet-stream without a known safe extension');
assert.deepEqual(
  validateReportFile(mockFile('huge.ips', 'text/plain', MAX_SAFE_FILE_SIZE_BYTES + 1)),
  { ok: false, reason: 'too-large', message: FILE_ERROR_TOO_LARGE },
  'file validation rejects oversized files before reading'
);
assert.equal(
  validateReportFile(mockFile('limit.ips', 'text/plain', MAX_SAFE_FILE_SIZE_BYTES)).ok,
  true,
  'file validation allows files at the configured safe size limit'
);

function rows(count) {
  return Array.from({ length: count }, (_, index) => ({ frame: index }));
}

function fields(count) {
  return Array.from({ length: count }, (_, index) => ({ label: `Field ${index}`, value: index }));
}

assert.deepEqual(
  REPORT_SIZE_THRESHOLDS,
  {
    tableRows: { medium: 100, large: 500 },
    fields: { medium: 25, large: 100 },
    rawCharacters: { medium: 10000, large: 100000 },
    chartItems: { medium: 100, large: 500 },
    sections: { medium: 12, large: 30 },
  },
  'large report thresholds are centralized and stable for future slices'
);

assert.deepEqual(
  getSectionSizeMetrics({
    table: rows(2),
    fields: fields(3),
    raw: 'hello',
    chart: { items: rows(4) },
  }),
  { tableRows: 2, fields: 3, rawCharacters: 5, chartItems: 4 },
  'section size metrics count rows, fields, raw text, and chart items'
);
assert.deepEqual(
  summarizeSectionSize({ id: 'empty', title: 'Empty' }),
  {
    id: 'empty',
    title: 'Empty',
    level: REPORT_SIZE_LEVELS.empty,
    isLarge: false,
    metrics: { tableRows: 0, fields: 0, rawCharacters: 0, chartItems: 0 },
    reasons: [],
  },
  'empty sections summarize as empty'
);
assert.equal(
  summarizeSectionSize({ id: 'small', table: rows(REPORT_SIZE_THRESHOLDS.tableRows.medium - 1) }).level,
  REPORT_SIZE_LEVELS.small,
  'sections below medium thresholds summarize as small'
);
assert.deepEqual(
  summarizeSectionSize({ id: 'medium', table: rows(REPORT_SIZE_THRESHOLDS.tableRows.medium) }),
  {
    id: 'medium',
    title: '',
    level: REPORT_SIZE_LEVELS.medium,
    isLarge: false,
    metrics: { tableRows: REPORT_SIZE_THRESHOLDS.tableRows.medium, fields: 0, rawCharacters: 0, chartItems: 0 },
    reasons: [
      {
        metric: 'tableRows',
        label: 'table rows',
        value: REPORT_SIZE_THRESHOLDS.tableRows.medium,
        level: REPORT_SIZE_LEVELS.medium,
        threshold: REPORT_SIZE_THRESHOLDS.tableRows.medium,
      },
    ],
  },
  'sections at medium row threshold summarize as medium'
);
assert.deepEqual(
  summarizeSectionSize({
    id: 'large',
    title: 'Large',
    fields: fields(REPORT_SIZE_THRESHOLDS.fields.large),
  }),
  {
    id: 'large',
    title: 'Large',
    level: REPORT_SIZE_LEVELS.large,
    isLarge: true,
    metrics: { tableRows: 0, fields: REPORT_SIZE_THRESHOLDS.fields.large, rawCharacters: 0, chartItems: 0 },
    reasons: [
      {
        metric: 'fields',
        label: 'fields',
        value: REPORT_SIZE_THRESHOLDS.fields.large,
        level: REPORT_SIZE_LEVELS.large,
        threshold: REPORT_SIZE_THRESHOLDS.fields.large,
      },
    ],
  },
  'sections at large field threshold summarize as large'
);
assert.equal(
  summarizeSectionSize({ raw: 'x'.repeat(REPORT_SIZE_THRESHOLDS.rawCharacters.large) }).level,
  REPORT_SIZE_LEVELS.large,
  'large raw text sections summarize as large'
);
assert.equal(
  summarizeSectionSize({ chart: { items: rows(REPORT_SIZE_THRESHOLDS.chartItems.medium) } }).level,
  REPORT_SIZE_LEVELS.medium,
  'medium chart sections summarize as medium'
);
assert.equal(isLargeSection({ table: rows(REPORT_SIZE_THRESHOLDS.tableRows.large) }), true, 'isLargeSection detects large table sections');
assert.equal(isLargeSection({ table: rows(REPORT_SIZE_THRESHOLDS.tableRows.large - 1) }), false, 'isLargeSection does not flag near-large table sections');
assert.deepEqual(
  getSectionSizeMetrics({
    id: 123,
    title: null,
    table: 'not rows',
    fields: { label: 'not an array' },
    raw: 12345,
    chart: { items: 'not items' },
  }),
  { tableRows: 0, fields: 0, rawCharacters: 0, chartItems: 0 },
  'malformed section-like inputs do not throw and count as empty'
);
assert.deepEqual(
  summarizeSectionSize(null),
  {
    id: '',
    title: '',
    level: REPORT_SIZE_LEVELS.empty,
    isLarge: false,
    metrics: { tableRows: 0, fields: 0, rawCharacters: 0, chartItems: 0 },
    reasons: [],
  },
  'null section input summarizes safely'
);

const reportSizeSections = [
  { id: 'summary', fields: fields(2) },
  { id: 'events', table: rows(REPORT_SIZE_THRESHOLDS.tableRows.medium) },
  { id: 'notes', raw: 'short' },
];
assert.deepEqual(
  getReportSizeMetrics(reportSizeSections),
  { sections: 3, tableRows: REPORT_SIZE_THRESHOLDS.tableRows.medium, fields: 2, rawCharacters: 5, chartItems: 0 },
  'report size metrics aggregate section metrics'
);
assert.equal(summarizeReportSize([]).level, REPORT_SIZE_LEVELS.empty, 'empty report summarizes as empty');
assert.equal(summarizeReportSize(rows(REPORT_SIZE_THRESHOLDS.sections.medium).map((row) => ({ id: String(row.frame) }))).level, REPORT_SIZE_LEVELS.medium, 'reports at medium section-count threshold summarize as medium');
assert.equal(
  summarizeReportSize([
    { id: 'one', table: rows(300) },
    { id: 'two', table: rows(200) },
  ]).level,
  REPORT_SIZE_LEVELS.large,
  'large reports can be identified by aggregate table row count'
);
assert.equal(
  summarizeReportSize([{ id: 'large-section', table: rows(REPORT_SIZE_THRESHOLDS.tableRows.large) }]).sectionLargeCount,
  1,
  'report summaries count large sections'
);
assert.equal(isLargeReport([{ id: 'large-section', table: rows(REPORT_SIZE_THRESHOLDS.tableRows.large) }]), true, 'isLargeReport flags reports containing a large section');
assert.equal(isLargeReport([{ id: 'small-section', table: rows(1) }]), false, 'isLargeReport does not flag small reports');
assert.equal(isLargeReport(null), false, 'isLargeReport handles malformed report input');

function sectionById(sections, id) {
  return sections.find((section) => section.id === id);
}

function fieldValue(section, label) {
  return section.fields.find((field) => field.label === label)?.value;
}

assert.equal(detectFileType(ipsText), 'ips', 'detects a standard app crash IPS report');
assert.equal(detectFileType(fullIpsText), 'ips', 'detects a full standard app crash IPS report');
assert.equal(detectFileType(metadataIpsText), 'ips', 'detects a standard IPS report with metadata line');
assert.equal(
  detectFileType(watchdogText),
  'ips-watchdog-stackshot',
  'detects a two-object watchdog stackshot IPS report'
);
assert.equal(detectFileType(crashText), 'crash', 'detects a legacy crash report');
assert.equal(detectFileType(fullCrashText), 'crash', 'detects a full legacy crash report');
assert.equal(detectFileType(jetsamText), 'jetsam', 'detects a JetsamEvent report');
assert.equal(detectFileType(realSchemaJetsamText), 'jetsam', 'detects a real-schema JetsamEvent report');
assert.equal(
  detectFileType(panicText),
  'panic',
  'detects panic-full text'
);
assert.equal(detectFileType(jsonPanicText), 'panic', 'detects JSON-wrapped panic-full IPS');
assert.equal(detectFileType(analyticsText), 'analytics', 'detects generic analytics text');
assert.equal(detectFileType(coreAnalyticsSmallText), 'coreanalytics', 'detects CoreAnalytics newline-delimited JSON');
assert.equal(
  detectFileType('{"not":"coreanalytics"}\n{"still":"not-coreanalytics"}'),
  'unknown',
  'malformed brace-starting JSON that is not CoreAnalytics remains unknown'
);

const ipsSections = parseInput(ipsText);
assert.deepEqual(
  createSectionNavItems(ipsSections),
  ipsSections.map((section) => ({ id: section.id, label: section.title, href: `#${section.id}` })),
  'section nav items use section IDs and titles as jump-link labels'
);
assert.deepEqual(
  parseInput(realSchemaJetsamText),
  parseInput(realSchemaJetsamText, { sanitize: true }),
  'parseInput(text) matches explicit sanitized parsing'
);
assert.equal(
  fieldValue(sectionById(parseInput(realSchemaJetsamText), 'summary'), 'Incident ID'),
  '[identifier redacted]',
  'parseInput sanitizes sensitive identifiers by default'
);
assert.equal(
  fieldValue(sectionById(parseInput(realSchemaJetsamText, { sanitize: false }), 'summary'), 'Incident ID'),
  'C2D7624C-69D5-43C1-BBCF-922926A98333',
  'parseInput can preserve raw values when sanitization is explicitly disabled'
);
assert.equal(
  fieldValue(sectionById(parseInput(jsonPanicText, { sanitize: false }), 'system-info'), 'Incident ID'),
  'ACA545E6-9828-4065-BF5E-3FF1C8125455',
  'panic parsing preserves raw incident IDs only when sanitization is explicitly disabled'
);
assert.deepEqual(
  ipsSections.slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'IPS Phase 1 core sections remain first'
);
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'Bundle ID'), 'com.example.demoapp');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Type'), 'EXC_BAD_ACCESS');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Signal'), 'SIGSEGV');
assert.equal(sectionById(ipsSections, 'crashed-thread').table[0].symbol, 'doThing + 18');

const fullIpsSections = parseInput(fullIpsText);
assert.equal(findCrashedThreadName(fullIpsSections), 'Thread 0', 'dense table UI infers crashed thread from section title');
assert.deepEqual(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: {},
    forceExpanded: false,
  }).map((group) => ({
    thread: group.thread,
    frameCount: group.frameCount,
    expanded: group.expanded,
    stateLabel: group.stateLabel,
  })),
  [
    { thread: 'Thread 0', frameCount: 2, expanded: true, stateLabel: 'expanded' },
    { thread: 'Thread 1', frameCount: 1, expanded: false, stateLabel: 'collapsed' },
  ],
  'all threads are grouped by thread with crashed thread expanded by default'
);
assert.deepEqual(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: { 'Thread 1': true },
    forceExpanded: false,
  }).map((group) => ({ thread: group.thread, expanded: group.expanded })),
  [
    { thread: 'Thread 0', expanded: true },
    { thread: 'Thread 1', expanded: true },
  ],
  'thread group expansion can be controlled by UI state'
);
assert.equal(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: { 'Thread 1': false },
    forceExpanded: true,
  }).every((group) => group.expanded),
  true,
  'search force-expanded sections keep matching thread groups visible'
);

const sixtyProcessRows = Array.from({ length: 60 }, (_, index) => ({ process: `Process ${index}` }));
assert.deepEqual(
  getLimitedRows(sixtyProcessRows, { limit: 50, forceExpanded: false }),
  {
    rows: sixtyProcessRows.slice(0, 50),
    shown: 50,
    total: 60,
    summary: '50 of 60 rows shown',
    allShown: false,
  },
  'Jetsam-style row limits show the first 50 rows initially'
);
assert.equal(
  getLimitedRows(sixtyProcessRows, { limit: 50, forceExpanded: true }).shown,
  60,
  'search force-expanded sections bypass row limits'
);
assert.equal(isLargeKextTable({ id: 'loaded-kexts', table: sixtyProcessRows }), true, 'large kext tables collapse by default');

const plainTableRows = rows(3);
assert.deepEqual(
  getTableView({ id: 'plain-table', table: plainTableRows }),
  {
    mode: TABLE_VIEW_MODES.plain,
    rows: plainTableRows,
    totalRows: 3,
    shownRows: 3,
    summary: '3 of 3 rows shown',
    allShown: true,
    compact: false,
    expanded: true,
    collapsed: false,
    groups: [],
    tableColumns: null,
  },
  'table view models plain tables as all rows visible'
);
assert.equal(
  getTableView(sectionById(fullIpsSections, 'binary-images')).mode,
  TABLE_VIEW_MODES.compact,
  'table view models binary images as compact tables'
);
assert.equal(
  getTableView(sectionById(fullIpsSections, 'binary-images')).shownRows,
  sectionById(fullIpsSections, 'binary-images').table.length,
  'compact binary image table view keeps all rows visible'
);
assert.deepEqual(
  getTableView({ id: 'process-table', table: sixtyProcessRows }),
  {
    mode: TABLE_VIEW_MODES.limited,
    rows: sixtyProcessRows.slice(0, 50),
    totalRows: 60,
    shownRows: 50,
    summary: '50 of 60 rows shown',
    allShown: false,
    compact: false,
    expanded: true,
    collapsed: false,
    groups: [],
    tableColumns: null,
    limit: 50,
    nextLimit: 60,
    canShowMore: true,
    canShowAll: true,
  },
  'table view models process-table default row limit'
);
assert.equal(
  getTableView(
    { id: 'process-table', table: sixtyProcessRows },
    { denseTableState: { rowLimits: { 'process-table': 25 } } }
  ).shownRows,
  25,
  'table view models custom process-table row limits from dense state'
);
assert.deepEqual(
  getTableView({ id: 'process-table', table: sixtyProcessRows }, { forceExpanded: true }),
  {
    mode: TABLE_VIEW_MODES.limited,
    rows: sixtyProcessRows,
    totalRows: 60,
    shownRows: 60,
    summary: '60 of 60 rows shown',
    allShown: true,
    compact: false,
    expanded: true,
    collapsed: false,
    groups: [],
    tableColumns: null,
    limit: 50,
    nextLimit: 60,
    canShowMore: false,
    canShowAll: false,
  },
  'table view forceExpanded returns all process-table rows'
);
assert.deepEqual(
  getTableView({ id: 'loaded-kexts', table: sixtyProcessRows }),
  {
    mode: TABLE_VIEW_MODES.collapsed,
    rows: [],
    totalRows: 60,
    shownRows: 0,
    summary: '0 of 60 rows shown',
    allShown: false,
    compact: false,
    expanded: false,
    collapsed: true,
    groups: [],
    tableColumns: null,
    canToggle: true,
  },
  'table view models large loaded kext tables as collapsed by default'
);
assert.equal(
  getTableView(
    { id: 'loaded-kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: { 'loaded-kexts': true } } }
  ).shownRows,
  60,
  'table view models expanded loaded kext tables'
);
assert.equal(
  getTableView({ id: 'loaded-kexts', table: sixtyProcessRows }, { forceExpanded: true }).shownRows,
  60,
  'table view forceExpanded returns all loaded kext rows'
);
const defaultThreadView = getTableView(sectionById(fullIpsSections, 'all-threads'), { allSections: fullIpsSections });
assert.equal(defaultThreadView.mode, TABLE_VIEW_MODES.grouped, 'table view models all-threads as grouped');
assert.deepEqual(
  defaultThreadView.groups.map((group) => ({ thread: group.thread, expanded: group.expanded, frameCount: group.frameCount })),
  [
    { thread: 'Thread 0', expanded: true, frameCount: 2 },
    { thread: 'Thread 1', expanded: false, frameCount: 1 },
  ],
  'table view expands crashed thread by default'
);
assert.deepEqual(
  defaultThreadView.rows.map((row) => row.thread),
  ['Thread 0', 'Thread 0'],
  'grouped table view returns rows for expanded thread groups'
);
assert.deepEqual(
  getTableView(sectionById(fullIpsSections, 'all-threads'), {
    allSections: fullIpsSections,
    denseTableState: {
      expandedThreadGroups: {
        'all-threads:Thread 0': false,
        'all-threads:Thread 1': true,
      },
    },
  }).rows.map((row) => row.thread),
  ['Thread 1'],
  'table view respects explicit all-threads expansion state'
);
assert.equal(
  getTableView(sectionById(fullIpsSections, 'all-threads'), {
    allSections: fullIpsSections,
    denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': false } },
    forceExpanded: true,
  }).shownRows,
  3,
  'table view forceExpanded expands all thread groups'
);
assert.deepEqual(
  getTableView(null),
  {
    mode: TABLE_VIEW_MODES.plain,
    rows: [],
    totalRows: 0,
    shownRows: 0,
    summary: '0 of 0 rows shown',
    allShown: true,
    compact: false,
    expanded: true,
    collapsed: false,
    groups: [],
    tableColumns: null,
  },
  'table view handles null section input without throwing'
);
assert.equal(
  getTableView({ id: 'malformed', table: 'not rows' }).shownRows,
  0,
  'table view handles malformed table input without throwing'
);

const uikitSearch = filterSectionsByQuery(fullIpsSections, 'UIKitCore');
assert.equal(uikitSearch.active, true, 'search is active for non-empty queries');
assert.ok(uikitSearch.totalMatches >= 1, 'search reports a visible match count');
assert.equal(sectionById(uikitSearch.sections, 'summary'), undefined, 'search hides sections with zero matches');
assert.equal(
  sectionById(uikitSearch.sections, 'binary-images').forceExpanded,
  true,
  'search marks matching sections to override collapse state'
);
assert.equal(sectionById(uikitSearch.sections, 'binary-images').table.length, 1, 'search shows matching table rows only');
assert.equal(
  sectionById(uikitSearch.sections, 'binary-images').tableSummary,
  `1 of ${sectionById(fullIpsSections, 'binary-images').table.length} rows shown`,
  'search annotates filtered table row counts'
);
assert.ok(fullIpsSections.find((section) => section.id === 'binary-images').table.length > 1, 'search does not mutate parser output');

const noSearchMatches = filterSectionsByQuery(fullIpsSections, 'definitely-not-present');
assert.equal(noSearchMatches.totalMatches, 0, 'search reports zero matches');
assert.deepEqual(noSearchMatches.sections, [], 'search returns no sections when nothing matches');

const inactiveSearch = filterSectionsByQuery(fullIpsSections, '   ');
assert.equal(inactiveSearch.active, false, 'blank search is inactive');
assert.equal(inactiveSearch.sections, fullIpsSections, 'blank search returns original parsed sections');

assert.equal(
  serializeSectionForCopy({
    title: 'Diagnostics',
    fields: [
      { label: 'App', value: 'DemoApp' },
      { label: 'Reason', value: 'EXC_BAD_ACCESS' },
    ],
    tableColumns: [
      { key: 'frame', label: 'Frame' },
      { key: 'symbol', label: 'Symbol' },
    ],
    table: [
      { frame: 0, symbol: 'doThing + 18' },
      { frame: 1, symbol: 'viewDidLoad + 44' },
    ],
    raw: 'Raw panic line',
    chart: {
      title: 'Memory chart',
      items: [
        { label: 'free', value: 12 },
        { label: 'wired', value: 34 },
      ],
    },
  }),
  [
    'Diagnostics',
    '',
    'App: DemoApp',
    'Reason: EXC_BAD_ACCESS',
    '',
    'Frame\tSymbol',
    '0\tdoThing + 18',
    '1\tviewDidLoad + 44',
    '',
    'Raw panic line',
    '',
    'Memory chart',
    'free\t12',
    'wired\t34',
  ].join('\n'),
  'copy serialization includes title, fields, TSV tables, raw text, and chart data'
);
assert.match(
  visibleSectionSource,
  /getTableView/,
  'copy visibility path delegates table row decisions to the shared table-view helper'
);
assert.match(
  renderSectionSource,
  /getTableView/,
  'render path delegates table row decisions to the shared table-view helper'
);
assert.match(
  renderSectionSource,
  /TABLE_VIEW_MODES/,
  'render path dispatches table rendering from shared table-view modes'
);
assert.equal(
  /getLimitedRows|groupRowsByThread|findCrashedThreadName|isLargeKextTable/.test(renderSectionSource),
  false,
  'render path no longer duplicates dense-table row decision helpers'
);
assert.match(mainScriptText, /getCoreAnalyticsView/, 'main app computes the CoreAnalytics overview view model');
assert.match(mainScriptText, /getCoreAnalyticsView\(appState\.sections\)/, 'CoreAnalytics overview uses original parsed sections, not search-filtered sections');
assert.match(renderAppSource, /renderCoreAnalyticsOverview/, 'results rendering can prepend the CoreAnalytics overview without mutating sections');
assert.match(renderAppSource, /searchActive:\s*options\.searchActive === true/, 'CoreAnalytics overview receives search-active state from render options');
assert.match(renderCoreAnalyticsOverviewSource, /Tables show rendered capped rows only\. Full raw JSON bodies are not rendered\./, 'CoreAnalytics overview explains rendered capped rows');
assert.match(renderCoreAnalyticsOverviewSource, /Search and copy operate on rendered rows only\./, 'CoreAnalytics overview explains search and copy row boundaries');
assert.match(renderCoreAnalyticsOverviewSource, /Overview hidden while search is active\./, 'CoreAnalytics overview has explicit search-active copy');
assert.doesNotMatch(
  renderCoreAnalyticsOverviewSource,
  /parseInput|filterSectionsByQuery|localStorage|sessionStorage|indexedDB|navigator\.clipboard|sourceText/,
  'CoreAnalytics overview renderer stays DOM-only without parser, search, storage, clipboard, or source-text access'
);
assert.doesNotMatch(searchSource, /renderCoreAnalyticsOverview|coreAnalyticsView/, 'search module does not import or count the CoreAnalytics overview UI');
const plainCopySection = {
  id: 'plain-copy',
  title: 'Plain Copy',
  tableColumns: [{ key: 'frame', label: 'Frame' }],
  table: plainTableRows,
};
assert.deepEqual(
  getVisibleSectionForCopy(plainCopySection),
  plainCopySection,
  'copy leaves plain tables unchanged'
);
assert.deepEqual(
  getVisibleSectionForCopy(sectionById(fullIpsSections, 'binary-images')),
  sectionById(fullIpsSections, 'binary-images'),
  'copy leaves compact binary image tables unchanged'
);
assert.equal(
  getVisibleSectionForCopy({
    id: 'process-table',
    title: 'Process Table',
    tableColumns: [{ key: 'process', label: 'Process' }],
    table: sixtyProcessRows,
  }).table.length,
  50,
  'copy applies the default Jetsam process-table row limit'
);
assert.equal(
  serializeSectionForCopy(
    getVisibleSectionForCopy(
      {
        id: 'process-table',
        title: 'Process Table',
        tableColumns: [{ key: 'process', label: 'Process' }],
        table: sixtyProcessRows,
      },
      { denseTableState: { rowLimits: { 'process-table': 50 } } }
    )
  ).split('\n').filter((line) => /^Process \d+$/.test(line)).length,
  50,
  'copy respects Jetsam row limits'
);
assert.equal(
  getVisibleSectionForCopy(
    {
      id: 'process-table',
      title: 'Process Table',
      tableColumns: [{ key: 'process', label: 'Process' }],
      table: sixtyProcessRows,
    },
    { denseTableState: { rowLimits: { 'process-table': 25 } } }
  ).table.length,
  25,
  'copy respects custom Jetsam process-table row limits'
);
assert.deepEqual(
  getVisibleSectionForCopy({
    id: 'process-table',
    title: 'Process Table',
    forceExpanded: true,
    tableColumns: [{ key: 'process', label: 'Process' }],
    table: sixtyProcessRows,
  }).table,
  getTableView({ id: 'process-table', forceExpanded: true, table: sixtyProcessRows }).rows,
  'copy forceExpanded process tables use shared table-view visible rows'
);
assert.deepEqual(
  getVisibleSectionForCopy(
    sectionById(fullIpsSections, 'all-threads'),
    {
      denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': false } },
      allSections: fullIpsSections,
    }
  ).table.map((row) => row.thread),
  ['Thread 0', 'Thread 0'],
  'copy respects collapsed thread groups'
);
assert.deepEqual(
  getVisibleSectionForCopy(
    sectionById(fullIpsSections, 'all-threads'),
    {
      denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': true } },
      allSections: fullIpsSections,
    }
  ).table.map((row) => row.thread),
  ['Thread 0', 'Thread 0', 'Thread 1'],
  'copy respects expanded thread groups'
);
assert.equal(
  getVisibleSectionForCopy(
    { ...sectionById(fullIpsSections, 'all-threads'), forceExpanded: true },
    {
      denseTableState: {
        expandedThreadGroups: {
          'all-threads:Thread 0': false,
          'all-threads:Thread 1': false,
        },
      },
      allSections: fullIpsSections,
    }
  ).table.length,
  sectionById(fullIpsSections, 'all-threads').table.length,
  'copy forceExpanded all-threads includes all currently visible search rows'
);
assert.equal(
  getVisibleSectionForCopy(
    { id: 'loaded-kexts', title: 'Loaded Kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: {} } }
  ).table.length,
  0,
  'copy respects collapsed panic kext tables'
);
assert.equal(
  getVisibleSectionForCopy(
    { id: 'loaded-kexts', title: 'Loaded Kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: { 'loaded-kexts': true } } }
  ).table.length,
  60,
  'copy respects expanded panic kext tables'
);
assert.equal(
  getVisibleSectionForCopy(
    { id: 'loaded-kexts', title: 'Loaded Kexts', forceExpanded: true, table: sixtyProcessRows },
    { denseTableState: { expandedTables: {} } }
  ).table.length,
  60,
  'copy forceExpanded loaded kext tables includes all currently visible search rows'
);

assert.deepEqual(
  fullIpsSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread', 'all-threads', 'binary-images'],
  'full IPS includes all threads and binary images'
);
assert.equal(sectionById(fullIpsSections, 'all-threads').tableColumns[0].key, 'thread');
assert.equal(sectionById(fullIpsSections, 'all-threads').table[2].thread, 'Thread 1');
assert.equal(sectionById(fullIpsSections, 'all-threads').table[2].symbol, 'mach_msg_trap + 8');
assert.equal(sectionById(fullIpsSections, 'binary-images').table[1].name, 'UIKitCore');
assert.equal(sectionById(fullIpsSections, 'binary-images').table[1].uuid, 'BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF');

const metadataIpsSections = parseInput(metadataIpsText);
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'App'), 'MetadataApp');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Bundle ID'), 'com.example.metadata');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Version'), '9.9.9');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Build'), '999');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'OS Version'), 'iPhone OS 27.0 (24A5370h)');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Incident ID'), 'FAKE-METADATA-INCIDENT');

const crashSections = parseInput(crashText);
assert.deepEqual(
  crashSections.slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'legacy crash Phase 1 core sections remain first'
);
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'Version'), '2.1.4 (318)');
assert.equal(fieldValue(sectionById(crashSections, 'exception'), 'Termination Reason'), 'Namespace SIGNAL, Code 11 Segmentation fault: 11');
assert.equal(sectionById(crashSections, 'crashed-thread').table[1].symbol, 'viewDidLoad + 44');

const fullCrashSections = parseInput(fullCrashText);
assert.deepEqual(
  fullCrashSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread', 'all-threads', 'binary-images'],
  'full legacy crash includes all threads and binary images'
);
assert.equal(sectionById(fullCrashSections, 'all-threads').table[2].thread, 'Thread 1');
assert.equal(sectionById(fullCrashSections, 'all-threads').table[2].binary, 'libsystem_kernel.dylib');
assert.equal(sectionById(fullCrashSections, 'binary-images').table[1].name, 'UIKitCore');
assert.equal(sectionById(fullCrashSections, 'binary-images').table[1].arch, 'arm64');

const watchdogSections = parseInput(watchdogText);
assert.deepEqual(
  watchdogSections.map((section) => section.id),
  ['summary', 'termination', 'main-thread-stackshot'],
  'watchdog stackshot Phase 1 output contains summary, termination, and main thread stackshot'
);
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'App'), 'WatchdogApp');
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'Bundle ID'), 'com.example.watchdog');
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'Device'), 'iPhone18,1');
assert.equal(fieldValue(sectionById(watchdogSections, 'termination'), 'Namespace'), 'SPRINGBOARD');
assert.match(
  fieldValue(sectionById(watchdogSections, 'termination'), 'Details'),
  /scene-update watchdog transgression/
);
assert.equal(sectionById(watchdogSections, 'main-thread-stackshot').table[0].symbol, 'WatchdogApp + 128');
assert.equal(sectionById(watchdogSections, 'main-thread-stackshot').table[1].symbol, 'UIKitCore + 456');

const jetsamSections = parseInput(jetsamText);
assert.deepEqual(
  jetsamSections.map((section) => section.id),
  ['summary', 'victim', 'process-table', 'system-memory', 'limits'],
  'JetsamEvent includes summary, victim, process table, system memory, and limits'
);
assert.equal(fieldValue(sectionById(jetsamSections, 'summary'), 'Reason'), 'per-process-limit');
assert.equal(fieldValue(sectionById(jetsamSections, 'victim'), 'Process'), 'MemoryHog');
assert.equal(sectionById(jetsamSections, 'process-table').table[0].process, 'MemoryHog');
assert.equal(sectionById(jetsamSections, 'process-table').table[1].process, 'Maps');
assert.equal(sectionById(jetsamSections, 'system-memory').chart.type, 'memory-bars');
assert.equal(fieldValue(sectionById(jetsamSections, 'limits'), 'Per-process Limit'), '600 MB');

const realSchemaJetsamSections = parseInput(realSchemaJetsamText);
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Timestamp'), '2026-06-23 01:23:24.00 +0700');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'OS Version'), 'iPhone OS 27.0 (24A5370h)');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Device'), 'iPhone18,1');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Incident ID'), '[identifier redacted]');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Bug Type'), '298');
assert.equal(sectionById(realSchemaJetsamSections, 'victim').title, 'Victim / Likely Culprit');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'victim'), 'Process'), 'lowmemoryd');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'victim'), 'Reason'), 'highwater');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].process, 'LargeApp');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].footprint, '1024 MB');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].pages, '65536');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[1].process, 'Messenger');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].process, 'lowmemoryd');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].role, 'daemon, idle');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].reason, 'highwater');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'limits'), 'Per-process Limit'), 'Not available');

const panicSections = parseInput(panicText);
assert.deepEqual(
  panicSections.map((section) => section.id),
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info'],
  'panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.match(sectionById(panicSections, 'panic-string').raw, /userspace watchdog timeout/);
assert.equal(sectionById(panicSections, 'kernel-backtrace').table[0].returnAddress, '0xfffffff007123456');
assert.equal(sectionById(panicSections, 'loaded-kexts').table[0].name, 'com.apple.driver.ExampleKext');

const jsonPanicSections = parseInput(jsonPanicText);
assert.deepEqual(
  jsonPanicSections.map((section) => section.id),
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info'],
  'JSON-wrapped panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.match(sectionById(jsonPanicSections, 'panic-string').raw, /LLC Bus error from cpu3/);
assert.equal(fieldValue(sectionById(jsonPanicSections, 'panic-flags'), 'Flags'), '0x802');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'OS / Build'), 'iPhone OS 18.2 (22C152)');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Product'), 'iPhone17,1');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Bug Type'), '210');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Incident ID'), '[identifier redacted]');
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].lr, '0xfffffff05046e9cc');
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].fp, '0xffffffef16ceb5f0');
assert.equal(sectionById(jsonPanicSections, 'loaded-kexts').table[0].name, 'com.apple.driver.AppleARMPlatform');
assert.equal(sectionById(jsonPanicSections, 'loaded-kexts').table[1].name, 'com.apple.iokit.IOReportFamily');
assert.ok(
  sectionById(jsonPanicSections, 'loaded-kexts').table.some((row) => row.name === 'com.apple.driver.AppleIDAMInterface'),
  'renders loaded kext block rows'
);

const analyticsSections = parseInput(analyticsText);
assert.deepEqual(
  analyticsSections.map((section) => section.id),
  ['analytics-summary', 'analytics-sections'],
  'generic analytics fallback groups timestamped and delimiter sections'
);
assert.equal(fieldValue(sectionById(analyticsSections, 'analytics-summary'), 'Detected Sections'), '3');
assert.match(sectionById(analyticsSections, 'analytics-sections').table[0].content, /Launch started/);

const coreAnalyticsSections = parseInput(coreAnalyticsMediumText);
assert.deepEqual(
  coreAnalyticsSections.map((section) => section.id),
  [
    'coreanalytics-summary',
    'coreanalytics-configuration',
    'coreanalytics-record-overview',
    'coreanalytics-event-types',
    'coreanalytics-sample-records',
    'coreanalytics-parser-notes',
  ],
  'CoreAnalytics parser returns the expected sections'
);
const coreAnalyticsSearch = filterSectionsByQuery(coreAnalyticsSections, 'com.example.launch');
assert.equal(coreAnalyticsSearch.active, true, 'CoreAnalytics search behavior remains active for event terms');
assert.ok(
  coreAnalyticsSearch.sections.every((section) => section.id.startsWith('coreanalytics-')),
  'CoreAnalytics search returns parser sections only, not the overview panel'
);
assert.doesNotMatch(
  serializeSectionForCopy(sectionById(coreAnalyticsSections, 'coreanalytics-event-types')),
  /CoreAnalytics Overview/,
  'CoreAnalytics copy behavior remains tied to existing sections only'
);
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Bug Type'), '211');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Timestamp'), '2026-06-23 08:00:00.00 +0700');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'OS Version'), 'iPhone OS 27.0 (24A5370h)');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Roots Installed'), '0');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Incident ID'), '[identifier redacted]');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Total Records'), '9');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Parsed Records'), '8');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-summary'), 'Invalid Records'), '1');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-record-overview'), 'Total event records'), '5');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-record-overview'), 'Unique message count'), '3');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-record-overview'), 'Unique name count'), '3');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-record-overview'), 'Aggregation periods observed'), 'daily, weekly');
assert.equal(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-record-overview'), 'Sampling values observed'), '100, 50, 25');
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-event-types').table[0].message, 'com.example.launch');
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-event-types').table[0].name, 'launchCount');
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-event-types').table[0].count, '2');
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-event-types').tableSummary, '3 of 3 event groups shown');
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-sample-records').table.length, 5);
assert.equal(sectionById(coreAnalyticsSections, 'coreanalytics-sample-records').tableSummary, '5 of 5 event records shown');
assert.match(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-parser-notes'), 'Invalid Lines'), /1 invalid/);
assert.match(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-parser-notes'), 'Row Caps'), /100/);
assert.match(fieldValue(sectionById(coreAnalyticsSections, 'coreanalytics-parser-notes'), 'Privacy'), /omitted\/redacted/);

const sanitizedCoreAnalyticsText = coreAnalyticsSections.flatMap((section) => [
  ...(section.fields ?? []).map((field) => `${field.label}: ${field.value}`),
  ...(section.table ?? []).flatMap((row) => Object.values(row)),
]).join('\n');
assert.doesNotMatch(sanitizedCoreAnalyticsText, /22222222-3333-4444-5555-666666666666/);
assert.doesNotMatch(sanitizedCoreAnalyticsText, /DEVICE-COREANALYTICS-0002/);
assert.doesNotMatch(sanitizedCoreAnalyticsText, /BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF/);
assert.doesNotMatch(sanitizedCoreAnalyticsText, /SESSION-COREANALYTICS-0002/);
assert.match(sanitizedCoreAnalyticsText, /\[identifier redacted\]/);

const rawCoreAnalyticsSections = parseInput(coreAnalyticsMediumText, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawCoreAnalyticsSections, 'coreanalytics-summary'), 'Incident ID'),
  '22222222-3333-4444-5555-666666666666',
  'CoreAnalytics raw mode preserves fictional incident ID'
);
assert.equal(
  fieldValue(sectionById(rawCoreAnalyticsSections, 'coreanalytics-configuration'), 'Session ID'),
  'SESSION-COREANALYTICS-0002',
  'CoreAnalytics raw mode preserves fictional session ID'
);

const largeCoreAnalyticsSections = parseInput(coreAnalyticsLargeText);
assert.equal(sectionById(largeCoreAnalyticsSections, 'coreanalytics-event-types').table.length, 100, 'CoreAnalytics grouped rows are capped');
assert.equal(sectionById(largeCoreAnalyticsSections, 'coreanalytics-sample-records').table.length, 100, 'CoreAnalytics sample rows are capped');
assert.equal(sectionById(largeCoreAnalyticsSections, 'coreanalytics-event-types').tableSummary, '100 of 200 event groups shown');
assert.equal(sectionById(largeCoreAnalyticsSections, 'coreanalytics-sample-records').tableSummary, '100 of 200 event records shown');
assert.equal(fieldValue(sectionById(largeCoreAnalyticsSections, 'coreanalytics-record-overview'), 'Total event records'), '200');

const coreAnalyticsView = getCoreAnalyticsView(coreAnalyticsSections);
assert.equal(coreAnalyticsView.isCoreAnalytics, true, 'CoreAnalytics view detects complete CoreAnalytics section sets');
assert.equal(coreAnalyticsView.fields.summary.byLabel['Bug Type'], '211', 'CoreAnalytics view exposes summary fields by label');
assert.equal(coreAnalyticsView.fields.configuration.byLabel['Session ID'], '[identifier redacted]', 'CoreAnalytics view exposes configuration fields by label');
assert.equal(coreAnalyticsView.fields.recordOverview.byLabel['Total event records'], '5', 'CoreAnalytics view exposes overview fields by label');
assert.equal(coreAnalyticsView.tables.eventTypes.rows[0].message, 'com.example.launch', 'CoreAnalytics view exposes event type rows');
assert.equal(coreAnalyticsView.tables.eventTypes.columns[0].key, 'message', 'CoreAnalytics view exposes event type columns');
assert.equal(coreAnalyticsView.tables.eventTypes.tableSummary, '3 of 3 event groups shown', 'CoreAnalytics view preserves event type table summary');
assert.deepEqual(
  coreAnalyticsView.tables.eventTypes.counts,
  { known: true, shown: 3, total: 3 },
  'CoreAnalytics view parses event type visible and total counts'
);
assert.equal(coreAnalyticsView.tables.eventTypes.capped, false, 'CoreAnalytics view does not mark uncapped event tables as capped');
assert.deepEqual(
  coreAnalyticsView.tables.sampleRecords.counts,
  { known: true, shown: 5, total: 5 },
  'CoreAnalytics view parses sample record visible and total counts'
);
assert.deepEqual(
  parseTableSummary('100 of 200 event records shown'),
  { known: true, shown: 100, total: 200 },
  'CoreAnalytics summary parser handles visible and total count text'
);
assert.deepEqual(
  parseTableSummary('not a count summary'),
  { known: false, shown: null, total: null },
  'CoreAnalytics summary parser treats malformed summaries as unknown'
);
assert.match(coreAnalyticsView.warnings.join('\n'), /1 invalid line ignored/, 'CoreAnalytics view extracts parser-note warning text');
assert.equal(coreAnalyticsView.facets.source, 'rendered/capped rows only', 'CoreAnalytics view labels facets as rendered-row only');
assert.deepEqual(
  coreAnalyticsView.facets.values.message.slice(0, 3),
  [
    { value: 'com.example.launch', count: 3 },
    { value: 'com.example.session', count: 3 },
    { value: 'com.example.network', count: 2 },
  ],
  'CoreAnalytics view builds message facets from rendered rows only'
);
assert.deepEqual(
  coreAnalyticsView.facets.values.aggregationPeriod,
  [
    { value: 'daily', count: 5 },
    { value: 'weekly', count: 3 },
  ],
  'CoreAnalytics view builds aggregation period facets from rendered rows only'
);
assert.equal(coreAnalyticsView.size.metrics.sections, 6, 'CoreAnalytics view includes report size summary by default');

const largeCoreAnalyticsView = getCoreAnalyticsView(largeCoreAnalyticsSections);
assert.equal(largeCoreAnalyticsView.tables.eventTypes.capped, true, 'CoreAnalytics view marks capped grouped event tables');
assert.equal(largeCoreAnalyticsView.tables.sampleRecords.capped, true, 'CoreAnalytics view marks capped sample record tables');
assert.deepEqual(
  largeCoreAnalyticsView.tables.eventTypes.counts,
  { known: true, shown: 100, total: 200 },
  'CoreAnalytics view parses capped grouped event counts'
);

const nonCoreAnalyticsView = getCoreAnalyticsView(ipsSections);
assert.equal(nonCoreAnalyticsView.isCoreAnalytics, false, 'CoreAnalytics view returns false for non-CoreAnalytics reports');
assert.deepEqual(nonCoreAnalyticsView.tables.eventTypes.rows, [], 'CoreAnalytics view returns empty table models for non-CoreAnalytics reports');
assert.deepEqual(nonCoreAnalyticsView.facets.values.message, [], 'CoreAnalytics view returns empty facets for non-CoreAnalytics reports');

const missingCoreAnalyticsSectionView = getCoreAnalyticsView(coreAnalyticsSections.filter((section) => section.id !== 'coreanalytics-parser-notes'));
assert.equal(missingCoreAnalyticsSectionView.isCoreAnalytics, false, 'CoreAnalytics view requires expected CoreAnalytics section IDs');

const malformedCoreAnalyticsSections = coreAnalyticsSections.map((section) =>
  section.id === 'coreanalytics-event-types'
    ? { ...section, fields: [{ label: 'Ignored', value: 'field' }, { value: 'missing label' }], table: 'not rows', tableColumns: 'not columns', tableSummary: 'summary unavailable' }
    : section
);
const malformedCoreAnalyticsView = getCoreAnalyticsView(malformedCoreAnalyticsSections);
assert.equal(malformedCoreAnalyticsView.isCoreAnalytics, true, 'CoreAnalytics view tolerates malformed table payloads when section IDs are present');
assert.deepEqual(malformedCoreAnalyticsView.tables.eventTypes.rows, [], 'CoreAnalytics view handles malformed event type table rows');
assert.deepEqual(malformedCoreAnalyticsView.tables.eventTypes.columns, [], 'CoreAnalytics view handles malformed event type columns');
assert.deepEqual(malformedCoreAnalyticsView.tables.eventTypes.counts, { known: false, shown: null, total: null }, 'CoreAnalytics view handles malformed table summaries');
assert.equal(malformedCoreAnalyticsView.tables.eventTypes.capped, false, 'CoreAnalytics view does not mark unknown counts as capped');

const emptyCoreAnalyticsSections = coreAnalyticsSections.map((section) =>
  section.id === 'coreanalytics-sample-records' ? { ...section, table: [], tableSummary: '0 of 0 event records shown' } : section
);
const emptyCoreAnalyticsView = getCoreAnalyticsView(emptyCoreAnalyticsSections);
assert.deepEqual(emptyCoreAnalyticsView.tables.sampleRecords.rows, [], 'CoreAnalytics view handles empty sample tables');
assert.deepEqual(emptyCoreAnalyticsView.tables.sampleRecords.counts, { known: true, shown: 0, total: 0 }, 'CoreAnalytics view parses empty table summaries');

const coreAnalyticsBeforeView = JSON.stringify(coreAnalyticsSections);
getCoreAnalyticsView(coreAnalyticsSections);
assert.equal(JSON.stringify(coreAnalyticsSections), coreAnalyticsBeforeView, 'CoreAnalytics view does not mutate input sections');

const sanitizedCoreAnalyticsViewText = [
  ...Object.values(coreAnalyticsView.fields).flatMap((model) => model.items.map((field) => `${field.label}: ${field.value}`)),
  ...Object.values(coreAnalyticsView.tables).flatMap((model) => model.rows.flatMap((row) => Object.values(row))),
  ...Object.values(coreAnalyticsView.facets.values).flatMap((items) => items.map((item) => item.value)),
].join('\n');
assert.doesNotMatch(sanitizedCoreAnalyticsViewText, /22222222-3333-4444-5555-666666666666/, 'CoreAnalytics view does not expose sanitized incident IDs');
assert.doesNotMatch(sanitizedCoreAnalyticsViewText, /DEVICE-COREANALYTICS-0002/, 'CoreAnalytics view does not expose sanitized device IDs');
assert.doesNotMatch(sanitizedCoreAnalyticsViewText, /BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF/, 'CoreAnalytics view does not expose sanitized UUIDs');
assert.doesNotMatch(sanitizedCoreAnalyticsViewText, /SESSION-COREANALYTICS-0002/, 'CoreAnalytics view does not expose sanitized session IDs');

const sanitized = sanitizeText(
  'Email tester@example.com UDID 99999999-9999-9999-9999-999999999999 phone +1 (415) 555-1212 path C:\\Users\\Alice\\Desktop\\log.ips bundle com.example.demoapp uuid AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
);
assert.match(sanitized, /\[email redacted\]/);
assert.match(sanitized, /\[identifier redacted\]/);
assert.match(sanitized, /\[phone redacted\]/);
assert.match(sanitized, /C:\\Users\\\[user redacted\]\\Desktop\\log\.ips/);
assert.match(sanitized, /com\.example\.demoapp/);
assert.match(sanitized, /AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/);
assert.equal(
  sanitizeText('timestamp 2026-06-21 10:56:49.4455 +0700 code 2343432205'),
  'timestamp 2026-06-21 10:56:49.4455 +0700 code 2343432205',
  'does not redact timestamps or numeric termination codes as phone numbers'
);

const initialState = createInitialAppState();
const parsedState = withParsedReport(initialState, {
  sourceText: 'raw local source',
  sourceLabel: 'fixture.ips',
  detectedType: 'ips',
  sections: ipsSections,
});
assert.equal(initialState.sanitize, true, 'app state defaults to sanitized mode');
assert.equal(withPrivacyMode(initialState, false).sanitize, false, 'app state can switch to raw local parsing');
assert.equal(withPrivacyMode(withPrivacyMode(initialState, false), true).sanitize, true, 'app state can switch back to sanitized parsing');
assert.equal(startNewReportState(withPrivacyMode(parsedState, false)).sanitize, true, 'loading a new report resets raw mode to sanitized');
assert.match(
  createParsedStatusMessage('fixture.ips', 'ips', true),
  /Sanitized view/,
  'status text reflects sanitized mode'
);
assert.match(
  createParsedStatusMessage('fixture.ips', 'ips', false),
  /Raw local view/,
  'status text reflects raw mode'
);
assert.doesNotMatch(
  createParsedStatusMessage('fixture.ips', 'ips', false),
  /Sanitized view/,
  'status text never claims sanitized mode while raw content is rendered'
);
assert.equal(parsedState.sourceText, 'raw local source', 'app state keeps current source text in memory');
assert.equal(parsedState.detectedType, 'ips', 'app state tracks current detected type');
assert.equal(parsedState.sections, ipsSections, 'app state tracks current parsed sections');
assert.deepEqual(
  withStatus(parsedState, { message: 'Paste a report before parsing.', tone: 'error', clearSections: true }),
  {
    ...parsedState,
    sections: [],
    statusMessage: 'Paste a report before parsing.',
    statusTone: 'error',
  },
  'app state can update status and clear rendered sections without changing source text'
);
assert.deepEqual(createInitialAppState(), initialState, 'new initial state wipes current report state');

console.log('Phase 2 parser tests passed');
