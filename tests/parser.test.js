import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXAMPLE_REPORTS } from '../examples/manifest.js';
import {
  FILE_ERROR_TOO_LARGE,
  FILE_ERROR_UNSUPPORTED,
  MAX_SAFE_FILE_SIZE_MB,
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
import { classifyDiagnostic, getUnsupportedDiagnosticMessage } from '../src/parsers/classifyDiagnostic.js';
import { parseAccessoryCrash } from '../src/parsers/parseAccessoryCrash.js';
import { parseCpuResource } from '../src/parsers/parseCpuResource.js';
import { parseDiskWritesResource } from '../src/parsers/parseDiskWritesResource.js';
import { parseResourceStackshot } from '../src/parsers/parseResourceStackshot.js';
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
import { getSearchMetadata } from '../src/search/searchMetadata.js';
import { getCopyMetadata } from '../src/clipboard/copyMetadata.js';
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
import {
  EXPLANATION_SECTION_ID,
  createExplanationSection,
  getDiagnosticExplanation,
} from '../src/explanations/diagnosticExplanations.js';

const ipsText = await readFile(new URL('./fixtures/example.ips', import.meta.url), 'utf8');
const fullIpsText = await readFile(new URL('./fixtures/example-full.ips', import.meta.url), 'utf8');
const metadataIpsText = await readFile(new URL('./fixtures/example-metadata.ips', import.meta.url), 'utf8');
const visibleSectionSource = await readFile(new URL('../src/clipboard/visibleSection.js', import.meta.url), 'utf8');
const searchSource = await readFile(new URL('../src/search/filterSections.js', import.meta.url), 'utf8');
const searchMetadataSource = await readFile(new URL('../src/search/searchMetadata.js', import.meta.url), 'utf8');
const copyMetadataSource = await readFile(new URL('../src/clipboard/copyMetadata.js', import.meta.url), 'utf8');
const renderAppSource = await readFile(new URL('../src/ui/renderApp.js', import.meta.url), 'utf8');
const renderCoreAnalyticsOverviewSource = await readFile(new URL('../src/ui/renderCoreAnalyticsOverview.js', import.meta.url), 'utf8');
const renderSectionSource = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const parserIndexSource = await readFile(new URL('../src/parsers/index.js', import.meta.url), 'utf8');
const diagnosticExplanationsSource = await readFile(new URL('../src/explanations/diagnosticExplanations.js', import.meta.url), 'utf8');
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
const manifestText = await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8');
const serviceWorkerText = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
const mainScriptText = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const renderSectionText = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const styleText = await readFile(new URL('../styles/main.css', import.meta.url), 'utf8');
const manifest = JSON.parse(manifestText);
const precacheBody = serviceWorkerText.match(/const PRECACHE_URLS = \[(?<body>[^]*?)\];/)?.groups?.body ?? '';
const precacheUrls = [...precacheBody.matchAll(/'([^']+)'/g)].map((match) => match[1]);

assert.match(indexHtmlText, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, 'viewport supports mobile Safari safe-area rendering without disabling zoom');
assert.match(indexHtmlText, /<link rel="manifest" href=".\/manifest.webmanifest">/, 'page links the manifest with a GitHub Pages-safe relative path');
assert.match(indexHtmlText, /<link rel="apple-touch-icon" href=".\/icons\/apple-touch-icon.png">/, 'page links the Apple touch icon with a GitHub Pages-safe relative path');
assert.match(indexHtmlText, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/, 'page includes a keyboard skip link to main content');
assert.match(indexHtmlText, /<main id="main-content" class="app-shell">/, 'main content exposes a stable skip-link target');
assert.match(indexHtmlText, /<input id="file-input" type="file" aria-label="Choose report file">/, 'file picker has an explicit accessible name without extension filters');
assert.doesNotMatch(indexHtmlText, /id="file-input"[^>]*accept=/, 'file picker has no accept attribute that could grey out .ips files on Safari');
assert.match(indexHtmlText, /Install for quick access\. Installation saves the app shell, not\s+your reports\./, 'install guidance clarifies reports are not saved');
assert.match(indexHtmlText, /On iPhone or iPad, tap Share, then Add to Home Screen\./, 'install guidance includes iPhone and iPad Add to Home Screen steps');
assert.match(indexHtmlText, /<div id="offline-status" class="offline-status" role="status" aria-live="polite" hidden><\/div>/, 'offline status supports accessible text and actions');
assert.match(indexHtmlText, /id="privacy-toggle"[^>]*aria-describedby="privacy-mode-label"/, 'privacy toggle is associated with the current privacy mode label');
assert.match(indexHtmlText, /id="result-search"[^>]*aria-describedby="search-count"/, 'search input is associated with calm search status text');
assert.deepEqual(
  {
    name: manifest.name,
    shortName: manifest.short_name,
    startUrl: manifest.start_url,
    scope: manifest.scope,
    display: manifest.display,
    backgroundColor: manifest.background_color,
    themeColor: manifest.theme_color,
  },
  {
    name: 'iOS Analytics File Parser',
    shortName: 'iOS Parser',
    startUrl: './',
    scope: './',
    display: 'standalone',
    backgroundColor: '#0d0d0f',
    themeColor: '#0d0d0f',
  },
  'manifest keeps the expected install identity and GitHub Pages-safe launch scope'
);
assert.equal(manifest.prefer_related_applications, false, 'manifest does not steer users toward related native apps');
assert.ok(
  manifest.icons.some((icon) => icon.src === './icons/maskable-512.png' && icon.purpose === 'maskable'),
  'manifest includes a maskable icon for install surfaces'
);
assert.ok(
  manifest.icons.every((icon) => icon.src.startsWith('./icons/') && !/^(?:https?:)?\/\//.test(icon.src)),
  'manifest icon paths are local relative URLs'
);
assert.ok(precacheUrls.length > 0, 'service worker exposes a static precache allowlist');
assert.equal(new Set(precacheUrls).size, precacheUrls.length, 'service worker precache allowlist has no duplicate entries');
assert.ok(precacheUrls.every((asset) => asset === './' || asset.startsWith('./')), 'service worker precaches only relative app-shell assets');
assert.equal(precacheUrls.some((asset) => /^(?:https?:)?\/\//.test(asset)), false, 'service worker precache allowlist has no external URLs');
assert.equal(precacheUrls.some((asset) => asset.includes('tests/fixtures')), false, 'service worker precache allowlist excludes test fixtures');
assert.match(serviceWorkerText, /const ALLOWLIST_URLS = new Set\(PRECACHE_URLS\.map/, 'service worker derives runtime fetch boundaries from the explicit precache allowlist');
assert.match(serviceWorkerText, /if \(request\.method !== 'GET'\) return false;[^]*if \(url\.origin !== self\.location\.origin\) return false;[^]*ALLOWLIST_URLS\.has\(normalizeHref\(url\)\)/, 'service worker allowlist rejects non-GET, cross-origin, and non-precached requests');
assert.match(serviceWorkerText, /if \(isAllowedRequest\(request\)\) \{[^]*event\.respondWith\(cacheFirstAllowedAsset\(request\)\)/, 'service worker serves only allowlisted assets through cache-first handling');
assert.match(serviceWorkerText, /if \(request\.mode === 'navigate'\) \{[^]*event\.respondWith\(navigationFallback\(request\)\)/, 'service worker only uses navigation fallback for navigation requests');
assert.match(serviceWorkerText, /const ROOT_URL = normalizeHref\(new URL\('\.\/', self\.location\.href\)\)/, 'service worker tracks the app scope root for safe navigation fallback');
assert.match(serviceWorkerText, /if \(requestUrl !== ROOT_URL && requestUrl !== INDEX_URL\) \{[^]*Response\.redirect\(ROOT_URL, 302\)/, 'service worker redirects unsupported nested navigations to the app root before relative assets resolve');
assert.match(serviceWorkerText, /cache\.match\(INDEX_URL\)/, 'service worker navigation fallback uses cached index.html');
assert.match(serviceWorkerText, /cacheName\.startsWith\(CACHE_PREFIX\) && cacheName !== CACHE_NAME[^]*caches\.delete\(cacheName\)/, 'service worker activation deletes older app caches for the same cache prefix');
assert.match(serviceWorkerText, /caches\.open\(CACHE_NAME\)\.then\(\(cache\) => cache\.addAll\(PRECACHE_URLS\)\)/, 'service worker install precaches exactly the explicit app-shell allowlist');
assert.doesNotMatch(serviceWorkerText, /cache\.put/, 'service worker does not dynamically cache network responses');
assert.doesNotMatch(serviceWorkerText, /cache\.add\(/, 'service worker does not add individual runtime requests to cache');
assert.doesNotMatch(serviceWorkerText, /tests\/fixtures/, 'service worker does not cache test fixtures');
assert.match(serviceWorkerText, /\.\/src\/fileValidation\.js/, 'service worker precaches the file validation module');
assert.match(serviceWorkerText, /bump CACHE_VERSION/, 'service worker documents the cache-version reminder for precached asset changes');
assert.match(serviceWorkerText, /index\.html, styles\/main\.css, src modules, examples,/, 'service worker cache reminder lists key precached asset groups');
assert.match(serviceWorkerText, /v0\.8\.0-alpha-slice8d-platform-hardening-2026-07-02/, 'service worker cache version reflects Slice 8D platform hardening');
assert.match(serviceWorkerText, /event\.waitUntil\(self\.skipWaiting\(\)\)/, 'service worker keeps the SKIP_WAITING activation request alive');
assert.doesNotMatch(serviceWorkerText, /(?:SyncManager|periodicSync|PushManager|pushManager|share_target|file_handlers)/, 'service worker avoids background and file-handler APIs');
assert.match(serviceWorkerText, /\.\/src\/ui\/renderCoreAnalyticsOverview\.js/, 'service worker precaches the CoreAnalytics overview renderer');
assert.match(serviceWorkerText, /\.\/src\/ui\/coreAnalyticsView\.js/, 'service worker precaches the CoreAnalytics view helper');
assert.match(serviceWorkerText, /\.\/src\/parsers\/classifyDiagnostic\.js/, 'service worker precaches the diagnostic classification helper');
assert.match(serviceWorkerText, /\.\/src\/parsers\/parseAccessoryCrash\.js/, 'service worker precaches the AccessoryCrash parser');
assert.match(serviceWorkerText, /\.\/src\/parsers\/parseCpuResource\.js/, 'service worker precaches the CPU Resource parser');
assert.match(serviceWorkerText, /\.\/src\/parsers\/parseDiskWritesResource\.js/, 'service worker precaches the Disk Writes Resource parser');
assert.match(serviceWorkerText, /\.\/src\/parsers\/parseResourceStackshot\.js/, 'service worker precaches the Stackshot Resource parser');
assert.match(serviceWorkerText, /\.\/src\/explanations\/diagnosticExplanations\.js/, 'service worker precaches the diagnostic explanations helper');
assert.match(serviceWorkerText, /\.\/src\/search\/searchMetadata\.js/, 'service worker precaches the search metadata helper');
assert.match(parserIndexSource, /import \{ classifyDiagnostic \} from '\.\/classifyDiagnostic\.js';/, 'parseInput imports diagnostic classification metadata');
assert.match(parserIndexSource, /getDiagnosticExplanation/, 'parseInput imports diagnostic explanation helpers');
assert.match(parserIndexSource, /import \{ parseAccessoryCrash \} from '\.\/parseAccessoryCrash\.js';/, 'parseInput imports the AccessoryCrash parser');
assert.match(parserIndexSource, /import \{ parseCpuResource \} from '\.\/parseCpuResource\.js';/, 'parseInput imports the CPU Resource parser');
assert.match(parserIndexSource, /import \{ parseDiskWritesResource \} from '\.\/parseDiskWritesResource\.js';/, 'parseInput imports the Disk Writes Resource parser');
assert.match(parserIndexSource, /import \{ parseResourceStackshot \} from '\.\/parseResourceStackshot\.js';/, 'parseInput imports the Stackshot Resource parser');
assert.doesNotMatch(parserIndexSource, /detectFileType/, 'parseInput no longer depends on detectFileType compatibility routing');
assert.match(parserIndexSource, /classification\.parserType/, 'parseInput routes with classification parserType metadata');
assert.match(parserIndexSource, /withDiagnosticExplanation/, 'parseInput wraps supported parser output with diagnostic explanation insertion');
assert.match(parserIndexSource, /type === 'accessory-crash'[^]*parseAccessoryCrash\(parsed\.body, parsed\.metadata, options\)/, 'parseInput routes AccessoryCrash containers through the AccessoryCrash parser');
assert.match(parserIndexSource, /type === 'resource-cpu'[^]*parseCpuResource\(input, options\)/, 'parseInput routes CPU Resource input through the CPU Resource parser');
assert.match(parserIndexSource, /type === 'resource-diskwrites'[^]*parseDiskWritesResource\(input, options\)/, 'parseInput routes Disk Writes Resource input through the Disk Writes Resource parser');
assert.match(parserIndexSource, /type === 'resource-stackshot'[^]*parseResourceStackshot\(input, options\)/, 'parseInput routes Stackshot Resource input through the Stackshot Resource parser');
assert.match(mainScriptText, /classifyDiagnostic\(sourceText\)/, 'main app classifies reports before unsupported UI messaging');
assert.match(mainScriptText, /getUnsupportedDiagnosticMessage\(classification\)/, 'main app uses safe recognized-unsupported diagnostic messages');
assert.match(
  mainScriptText,
  /Unsupported or unknown report format\. Try a \.ips, \.crash, panic-full, JetsamEvent, or analytics text file\./,
  'main app keeps the generic unknown-format fallback message'
);
assert.match(serviceWorkerText, /\.\/src\/clipboard\/copyMetadata\.js/, 'service worker precaches the copy metadata helper');
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
assert.match(renderSectionText, /section-copy__feedback[^]*feedback\.setAttribute\('role', 'status'\)/, 'copy feedback uses a scoped status role');
assert.match(renderSectionText, /thread-group__toggle[^]*aria-label[^]*Toggle \$\{group\.thread\} thread group/, 'thread group toggles expose explicit accessible names');
assert.match(renderSectionText, /table-toggle[^]*aria-label[^]*Toggle loaded kexts table/, 'collapsible loaded-kext controls expose explicit accessible names');
assert.match(renderSectionText, /renderTableButton\('Show more'[^]*Show more rows in \$\{section\.title\}/, 'limited table Show more control has contextual accessible text');
assert.match(renderSectionText, /renderTableButton\('Show all'[^]*Show all rows in \$\{section\.title\}/, 'limited table Show all control has contextual accessible text');
const rawWrapRule = styleText.match(/\.raw-note--wrap\s*{(?<body>[^}]*)}/s)?.groups?.body ?? '';
assert.match(rawWrapRule, /white-space:\s*pre-wrap;/, 'raw wrapping class preserves panic string line breaks');
assert.match(rawWrapRule, /overflow-wrap:\s*anywhere;/, 'raw wrapping class allows arbitrary token wrapping');
assert.match(rawWrapRule, /word-break:\s*break-word;/, 'raw wrapping class breaks long fallback tokens');
assert.match(rawWrapRule, /line-break:\s*anywhere;/, 'raw wrapping class handles iOS slash-heavy panic tokens');
assert.match(rawWrapRule, /max-width:\s*100%;/, 'raw wrapping class stays inside the card width');
assert.match(rawWrapRule, /min-width:\s*0;/, 'raw wrapping class can shrink inside grid and flex parents');
assert.match(styleText, /html\s*{[^}]*overflow-x:\s*clip;/s, 'root element clips accidental page-level horizontal overflow');
assert.match(styleText, /body\s*{[^}]*overflow-x:\s*clip;/s, 'body clips accidental page-level horizontal overflow');
assert.match(styleText, /env\(safe-area-inset-bottom\)/, 'mobile layout preserves safe-area bottom padding');
assert.match(styleText, /\.table-scroll\s*{[^}]*overflow-x:\s*auto;/s, 'tables keep horizontal scrolling inside table-scroll wrappers');
assert.match(styleText, /\.search-count\s*{[^}]*max-width:\s*100%;[^}]*overflow-wrap:\s*anywhere;/s, 'search status wraps inside narrow mobile cards');
assert.match(styleText, /\.section-copy__feedback\s*{[^}]*max-width:\s*100%;[^}]*overflow-wrap:\s*anywhere;/s, 'copy feedback wraps without widening section cards');
assert.match(styleText, /\.coreanalytics-overview__chip\s*{[^}]*max-width:\s*100%;[^}]*overflow-wrap:\s*anywhere;/s, 'CoreAnalytics facet chips wrap long rendered values');
assert.match(styleText, /\.section-nav__link\s*{[^}]*min-height:\s*44px;/s, 'section nav chips have practical mobile touch targets');
assert.match(styleText, /button\s*{[^}]*touch-action:\s*manipulation;/s, 'buttons opt into touch-friendly manipulation behavior');
assert.match(styleText, /\.skip-link\s*{[^}]*transform:\s*translateY\(-160%\);/s, 'skip link is visually hidden until focused');
assert.match(styleText, /\.skip-link:focus-visible\s*{[^}]*transform:\s*translateY\(0\);[^}]*outline:/s, 'skip link becomes visible with a focus outline');
assert.match(styleText, /@media \(prefers-reduced-motion:\s*reduce\)/, 'reduced-motion users receive motion guardrails');
assert.match(styleText, /\.file-picker span,\s*\.clear-report,\s*\.parse-paste\s*{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s, 'primary input actions share practical touch sizing and alignment');
assert.match(styleText, /\.section-copy__button\s*{[^}]*min-height:\s*44px;/s, 'copy buttons have practical mobile touch targets');
assert.match(styleText, /\.clear-search\s*{[^}]*min-height:\s*44px;/s, 'clear search button has a practical mobile touch target');
assert.match(styleText, /\.privacy-toggle\s*{[^}]*min-height:\s*44px;/s, 'privacy toggle has a practical mobile touch target');
assert.match(styleText, /\.thread-group__toggle,\s*\.table-toggle,\s*\.table-control-button\s*{[^}]*min-height:\s*44px;/s, 'dense table controls have practical mobile touch targets');
assert.match(styleText, /\.frame-table:not\(\.frame-table--compact\) th,\s*\.frame-table:not\(\.frame-table--compact\) td\s*{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s, 'non-compact report tables wrap long text inside their scroll containers');
assert.doesNotMatch(
  `${searchMetadataSource}\n${copyMetadataSource}`,
  /(?:localStorage|sessionStorage|indexedDB|document\.cookie)/,
  'search and copy metadata helpers avoid persistent storage APIs'
);
assert.doesNotMatch(
  `${searchMetadataSource}\n${copyMetadataSource}`,
  /(?:sourceText|raw JSON|navigator\.clipboard|parseInput)/,
  'search and copy metadata helpers do not inspect source text, raw JSON bodies, clipboard, or parser input'
);

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
assert.equal(MAX_SAFE_FILE_SIZE_MB, 20, 'file validation uses the official 20 MB safety limit');
assert.equal(MAX_SAFE_FILE_SIZE_BYTES, 20 * 1024 * 1024, 'file validation byte limit matches 20 MB');
assert.equal(FILE_ERROR_TOO_LARGE, 'This file exceeds the 20 MB safety limit and was not opened.', 'file validation too-large message is exact');
assert.doesNotMatch(FILE_ERROR_TOO_LARGE, /\$\{/, 'file validation too-large message does not expose an uninterpolated template placeholder');
assert.deepEqual(
  validateReportFile(mockFile('huge.ips', 'text/plain', 21 * 1024 * 1024)),
  { ok: false, reason: 'too-large', message: FILE_ERROR_TOO_LARGE },
  'file validation rejects 21 MB files before reading'
);
assert.equal(
  validateReportFile(mockFile('limit.ips', 'text/plain', 20 * 1024 * 1024)).ok,
  true,
  'file validation allows files exactly at the 20 MB safety limit'
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

function serializeSectionsForCopy(sections) {
  return sections.map((section) => serializeSectionForCopy(getVisibleSectionForCopy(section))).join('\n');
}

function assertNoSearchMatches(sections, values, message) {
  for (const value of values) {
    assert.equal(filterSectionsByQuery(sections, value).totalMatches, 0, `${message}: ${value}`);
  }
}

function assertClassification(input, expected, message) {
  const classification = classifyDiagnostic(input);
  assert.deepEqual(
    {
      type: classification.type,
      family: classification.family,
      subtype: classification.subtype,
      supported: classification.supported,
      parserType: classification.parserType,
      legacyType: classification.legacyType,
      bugType: classification.bugType,
    },
    expected,
    message
  );
}

function assertUnsupportedFamilyDetection(input, expectedType, message) {
  assert.equal(classifyDiagnostic(input).type, expectedType, `${message} classifier type`);
  assert.equal(detectFileType(input), 'unknown', `${message} detectFileType compatibility result`);
  assert.throws(
    () => parseInput(input),
    /Unsupported or unrecognized file type\./,
    `${message} parseInput fails safely`
  );
}

function supportedClassification(type) {
  return {
    type,
    supported: true,
  };
}

function unsupportedClassification(type) {
  return {
    type,
    supported: false,
  };
}

function exceptionSections(fields) {
  return [
    {
      id: 'exception',
      title: 'Exception',
      priority: 'critical',
      fields: Object.entries(fields).map(([label, value]) => ({ label, value })),
    },
  ];
}

function explanationOutput(explanation) {
  return JSON.stringify(createExplanationSection(explanation));
}

function withoutExplanationSection(sections) {
  return sections.filter((section) => section.id !== EXPLANATION_SECTION_ID);
}

function explanationSectionFrom(sections) {
  return sectionById(sections, EXPLANATION_SECTION_ID);
}

function assertExplanationDoesNotLeak(sections, leakPattern, message) {
  const explanationSection = explanationSectionFrom(sections);
  assert.ok(explanationSection, `${message}: explanation section exists`);
  assert.doesNotMatch(JSON.stringify(explanationSection), leakPattern, `${message}: explanation section stays generic`);
}

function assertExplanationAfterSummary(sections, expectedRuleId, message) {
  const ids = sections.map((section) => section.id);
  const explanationIndex = ids.indexOf(EXPLANATION_SECTION_ID);
  assert.notEqual(explanationIndex, -1, `${message}: explanation section exists`);
  assert.equal(ids.indexOf(EXPLANATION_SECTION_ID, explanationIndex + 1), -1, `${message}: explanation section is not duplicated`);
  assert.ok(explanationIndex > 0, `${message}: explanation section is not first`);

  const previousSection = sections[explanationIndex - 1];
  const previousId = String(previousSection?.id ?? '').toLowerCase();
  const previousTitle = String(previousSection?.title ?? '').toLowerCase();
  assert.ok(
    previousId === 'summary' || previousId.endsWith('-summary') || previousTitle === 'summary' || previousTitle.endsWith(' summary'),
    `${message}: explanation section follows a summary-like section`
  );

  assert.equal(
    fieldValue(sectionById(sections, EXPLANATION_SECTION_ID), 'Category'),
    EXPLANATIONS_BY_RULE[expectedRuleId],
    `${message}: explanation category matches expected rule`
  );
}

const EXPLANATIONS_BY_RULE = {
  'exc-breakpoint': 'Runtime trap or breakpoint',
  'exc-bad-access': 'Invalid memory access',
  'exc-crash': 'Abort or crash signal',
  'exc-resource': 'Resource limit report',
  'exc-guard': 'System guard violation',
  watchdog: 'Watchdog termination',
  jetsam: 'Memory pressure termination',
  panic: 'System panic report',
  'accessory-crash': 'Accessory crash or fault',
  'resource-cpu': 'CPU resource limit',
  'resource-diskwrites': 'Disk write resource limit',
  'resource-stackshot': 'Resource stackshot summary',
};

const cautiousExplanationPattern = /\b(usually|often|may indicate|commonly means|check)\b/i;
const overconfidentExplanationPattern = /\b(root cause|definitely|proves|was caused by|the fix is)\b/i;
const sensitiveExplanationPattern =
  /11111111-2222-3333-4444-555555555555|REQ-EXPLANATION-12345|FICTIONAL-SERIAL-EXPLANATION|AA:BB:CC:DD:EE:FF|0x1234567890ABCDEF|\/private\/var\/mobile|C:\\Users\\Example|0xfffffff012345678|_sensitiveFrameSymbol|NESTED-EXPLANATION-SENTINEL/;

assert.doesNotMatch(
  diagnosticExplanationsSource,
  /parseInput|parseIpsContainer|sourceText|localStorage|sessionStorage|indexedDB|document\.|navigator\.clipboard|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/,
  'diagnostic explanation helper stays pure and does not inspect parser source text, DOM, clipboard, storage, network, or analytics APIs'
);
assert.doesNotMatch(searchSource, /document\.|window\.|navigator\.clipboard/, 'search filtering stays data-only and does not require DOM or clipboard access');

const explanationCases = [
  {
    label: 'EXC_BREAKPOINT',
    classification: supportedClassification('app-crash'),
    sections: exceptionSections({ Type: 'EXC_BREAKPOINT', Signal: 'SIGTRAP' }),
    ruleId: 'exc-breakpoint',
  },
  {
    label: 'EXC_BAD_ACCESS',
    classification: supportedClassification('app-crash'),
    sections: exceptionSections({ Type: 'EXC_BAD_ACCESS', Signal: 'SIGSEGV' }),
    ruleId: 'exc-bad-access',
  },
  {
    label: 'EXC_CRASH',
    classification: supportedClassification('crash-legacy'),
    sections: exceptionSections({ Type: 'EXC_CRASH', Signal: 'SIGABRT' }),
    ruleId: 'exc-crash',
  },
  {
    label: 'EXC_RESOURCE',
    classification: supportedClassification('app-crash'),
    sections: exceptionSections({ Type: 'EXC_RESOURCE', Signal: 'SIGKILL' }),
    ruleId: 'exc-resource',
  },
  {
    label: 'EXC_GUARD',
    classification: supportedClassification('app-crash'),
    sections: exceptionSections({ Type: 'EXC_GUARD', Codes: 'GUARD_TYPE_FD' }),
    ruleId: 'exc-guard',
  },
  {
    label: 'Watchdog',
    classification: supportedClassification('watchdog'),
    sections: [{ id: 'termination', title: 'Termination', fields: [{ label: 'Code', value: '0x8badf00d' }] }],
    ruleId: 'watchdog',
  },
  {
    label: 'Jetsam',
    classification: supportedClassification('jetsam'),
    sections: [{ id: 'victim', title: 'Victim', fields: [{ label: 'Reason', value: 'highwater' }] }],
    ruleId: 'jetsam',
  },
  {
    label: 'Panic',
    classification: supportedClassification('panic-full'),
    sections: [{ id: 'panic-string', title: 'Panic String', raw: 'panic string omitted from explanation' }],
    ruleId: 'panic',
  },
  {
    label: 'AccessoryCrash',
    classification: supportedClassification('accessory-crash'),
    sections: [{ id: 'accessory-crash-summary', title: 'Accessory Crash Summary', fields: [{ label: 'Bug Type', value: '305' }] }],
    ruleId: 'accessory-crash',
  },
  {
    label: 'CPU Resource',
    classification: supportedClassification('resource-cpu'),
    sections: [{ id: 'resource-cpu-summary', title: 'CPU Resource Summary', fields: [{ label: 'Bug Type', value: '202' }] }],
    ruleId: 'resource-cpu',
  },
  {
    label: 'Disk Writes Resource',
    classification: supportedClassification('resource-diskwrites'),
    sections: [{ id: 'resource-diskwrites-summary', title: 'Disk Writes Resource Summary', fields: [{ label: 'Bug Type', value: '142' }] }],
    ruleId: 'resource-diskwrites',
  },
  {
    label: 'Stackshot Resource',
    classification: supportedClassification('resource-stackshot'),
    sections: [{ id: 'resource-stackshot-summary', title: 'Stackshot Resource Summary', fields: [{ label: 'Bug Type', value: '288' }] }],
    ruleId: 'resource-stackshot',
  },
];

for (const explanationCase of explanationCases) {
  const explanation = getDiagnosticExplanation(explanationCase.sections, explanationCase.classification);
  assert.equal(explanation?.ruleId, explanationCase.ruleId, `${explanationCase.label} selects the expected explanation rule`);

  const section = createExplanationSection(explanation);
  assert.equal(section?.id, EXPLANATION_SECTION_ID, `${explanationCase.label} creates the standard explanation section`);
  assert.match(explanationOutput(explanation), cautiousExplanationPattern, `${explanationCase.label} uses cautious explanation wording`);
  assert.doesNotMatch(explanationOutput(explanation), overconfidentExplanationPattern, `${explanationCase.label} avoids overconfident root-cause wording`);
}

for (const type of ['app-usage-metrics', 'wifi-connectivity', 'diagnostic-request', 'unknown']) {
  assert.equal(
    getDiagnosticExplanation([{ id: 'summary', title: 'Summary' }], unsupportedClassification(type)),
    null,
    `${type} does not receive an explanation when unsupported`
  );
}

assert.equal(getDiagnosticExplanation(null, supportedClassification('app-crash')), null, 'malformed sections return no explanation');
assert.equal(
  getDiagnosticExplanation([{ id: 'exception', title: 'Exception', fields: 'malformed' }], supportedClassification('app-crash')),
  null,
  'malformed exception fields return no crash explanation'
);
assert.equal(
  getDiagnosticExplanation([], supportedClassification('resource-cpu')),
  null,
  'missing parsed resource sections return no explanation'
);
assert.equal(createExplanationSection(null), null, 'null explanation does not create a section');

const sensitiveExplanation = getDiagnosticExplanation(
  [
    {
      id: 'exception',
      title: 'Exception',
      fields: [
        {
          label: 'Type',
          value: 'EXC_BAD_ACCESS',
        },
        {
          label: 'Codes',
          value:
            '11111111-2222-3333-4444-555555555555 REQ-EXPLANATION-12345 FICTIONAL-SERIAL-EXPLANATION AA:BB:CC:DD:EE:FF 0x1234567890ABCDEF /private/var/mobile C:\\Users\\Example 0xfffffff012345678 _sensitiveFrameSymbol NESTED-EXPLANATION-SENTINEL',
        },
      ],
      table: [{ symbol: '_sensitiveFrameSymbol', address: '0xfffffff012345678' }],
    },
  ],
  supportedClassification('app-crash')
);

assert.doesNotMatch(
  explanationOutput(sensitiveExplanation),
  sensitiveExplanationPattern,
  'explanation output does not echo identifiers, paths, addresses, raw stack details, or nested payload sentinels'
);

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

assertClassification(
  ipsText,
  {
    type: 'app-crash',
    family: 'crash',
    subtype: 'app',
    supported: true,
    parserType: 'ips',
    legacyType: 'ips',
    bugType: '309',
  },
  'classifies a standard app crash IPS report'
);
assertClassification(
  crashText,
  {
    type: 'crash-legacy',
    family: 'crash',
    subtype: 'legacy',
    supported: true,
    parserType: 'crash',
    legacyType: 'crash',
    bugType: '',
  },
  'classifies a legacy crash report'
);
assertClassification(
  watchdogText,
  {
    type: 'watchdog',
    family: 'watchdog',
    subtype: 'stackshot',
    supported: true,
    parserType: 'ips-watchdog-stackshot',
    legacyType: 'ips-watchdog-stackshot',
    bugType: '509',
  },
  'classifies a watchdog stackshot report'
);
assertClassification(
  realSchemaJetsamText,
  {
    type: 'jetsam',
    family: 'resource',
    subtype: 'memory',
    supported: true,
    parserType: 'jetsam',
    legacyType: 'jetsam',
    bugType: '298',
  },
  'classifies a JetsamEvent report'
);
assertClassification(
  panicText,
  {
    type: 'panic-full',
    family: 'panic',
    subtype: 'full',
    supported: true,
    parserType: 'panic',
    legacyType: 'panic',
    bugType: '',
  },
  'classifies a panic-full text report'
);
assertClassification(
  coreAnalyticsSmallText,
  {
    type: 'coreanalytics',
    family: 'analytics',
    subtype: 'coreanalytics',
    supported: true,
    parserType: 'coreanalytics',
    legacyType: 'coreanalytics',
    bugType: '211',
  },
  'classifies a CoreAnalytics report'
);
assertClassification(
  analyticsText,
  {
    type: 'analytics-generic',
    family: 'analytics',
    subtype: 'generic',
    supported: true,
    parserType: 'analytics',
    legacyType: 'analytics',
    bugType: '',
  },
  'classifies generic analytics text'
);

const accessoryCrashClassificationFixture = [
  JSON.stringify({ bug_type: '305', timestamp: '2026-06-28 10:00:00 +0000', os_version: 'iPhone OS 27.0', incident_id: 'FICTIONAL-ACCESSORY-INCIDENT' }),
  JSON.stringify({
    bug_type: '305',
    accessory_type: 'audio',
    accessory_os_version: '1A100',
    crashlogs: [{ summary: 'fictional accessory reset' }],
  }),
].join('\n');
const accessoryCrashParserMetadata = {
  bug_type: '305',
  timestamp: '2026-06-28 10:00:00 +0000',
  os_version: 'iPhone OS 27.0 (24A999)',
  device_model: 'iPhone19,1',
  incident_id: '11111111-2222-3333-4444-555555555555',
};
const accessoryCrashParserBody = {
  bug_type: '305',
  date: '2026-06-28 10:00:01 +0000',
  accessory_type: 'AudioAccessory',
  accessory_os_train: 'AccessoryOS 3A',
  accessory_os_version: '3.1.0',
  accessory_pid: 4242,
  accessory_machine_config: 'Model=FictionalDock, Board=DemoBoard, Serial=FICTIONAL-SERIAL-12345',
  'application-info': {
    process: 'DemoHostApp',
    bundleID: 'com.example.demo-host',
    version: '1.2.3',
    build: '123',
    requestID: 'REQ-FICTIONAL-12345',
    path: '/private/var/mobile/Containers/Bundle/Application/FICTIONAL-APP-UUID/DemoHostApp.app',
  },
  crashlogs: [
    {
      identifier: 'CRASHLOG-FICTIONAL-001',
      uuid: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
      process: 'AccessoryDaemon',
      type: 'firmware-reset',
      reason: 'Fictional accessory watchdog timeout',
      timestamp: '2026-06-28 10:00:02 +0000',
      frames: [{ symbol: 'AccessoryMain + 24' }, { symbol: 'TransportRunLoop + 88' }],
    },
    {
      identifier: 'CRASHLOG-FICTIONAL-002',
      process: 'AccessoryTransport',
      type: 'assertion',
      summary: 'Fictional transport assertion',
      timestamp: '2026-06-28 10:00:03 +0000',
      frames: [],
    },
  ],
  panicString: 'panic: fictional accessory fault at 0xfffffff012345678',
  faultReason: 'Fictional accessory watchdog timeout',
  crashReporterKey: 'abcdef12-3456-7890-abcd-ef1234567890',
};
const accessoryCrashParserFixture = [
  JSON.stringify(accessoryCrashParserMetadata),
  JSON.stringify(accessoryCrashParserBody),
].join('\n');
const accessoryCrashPrivacyBody = {
  ...accessoryCrashParserBody,
  accessory_machine_config:
    'Model=FictionalDock, MAC=AA:BB:CC:DD:EE:FF, BluetoothAddress=11:22:33:44:55:66, WiFiAddress=22:33:44:55:66:77, HardwareAddress=33:44:55:66:77:88, ECID=0x1234567890ABCDEF, UniqueChipID=0xABCDEF1234567890, ChipID=0xDEADBEEF12345678, Serial=FICTIONAL-SERIAL-12345',
  AccessoryIdentifier: 'ACCESSORY-ID-FICTIONAL-999',
  DeviceID: 'DEVICE-ID-FICTIONAL-999',
  device_id: 'DEVICE-ID-FICTIONAL-LOWER',
  'application-info': {
    process: 'DemoHostApp',
    bundleID: 'com.example.demo-host',
    version: '1.2.3',
    build: '123',
    RequestID: 'REQ-MIXED-67890',
    CrashReporterKey: 'CRASHKEY-MIXED-12345',
    path: '/var/mobile/Containers/Bundle/Application/FICTIONAL-APP-UUID/DemoHostApp.app',
    fileUrl: 'file:///private/var/root/secret.log',
    windowsPath: 'C:\\ProgramData\\Apple\\Diagnostics\\secret.log',
  },
  crashlogs: [
    {
      identifier: 'CRASHLOG-FICTIONAL-001',
      uuid: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
      process: 'AccessoryDaemon',
      type: 'firmware-reset',
      reason: 'Fictional reason UUID 99999999-8888-7777-6666-555555555555 MAC AA:BB:CC:DD:EE:FF',
      timestamp: '2026-06-28 10:00:02 +0000',
      frames: [
        { address: '0xfffffff012345678', symbol: 'AccessoryMain + 24' },
        { address: '0xfffffff087654321', symbol: 'TransportRunLoop + 88' },
      ],
      metadata: {
        uuid: 'BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF',
        path: '/var/root/private.log',
      },
      unexpectedArray: ['SHOULD-NOT-LEAK'],
    },
    'PRIMITIVE-CRASHLOG-SHOULD-NOT-LEAK',
  ],
  panicString:
    'panic: fictional accessory fault file:///private/var/root/secret.log UUID 99999999-8888-7777-6666-555555555555 MAC AA:BB:CC:DD:EE:FF',
  faultReason: 'Fault ECID 0x1234567890ABCDEF UniqueChipID 0xABCDEF1234567890',
  faultText: ['ARRAY-FAULT-SHOULD-NOT-LEAK'],
  CrashReporterKey: 'abcdef12-3456-7890-abcd-ef1234567890',
  serial: 'FICTIONAL-SERIAL-99999',
};
const accessoryCrashPrivacyFixture = [
  JSON.stringify(accessoryCrashParserMetadata),
  JSON.stringify(accessoryCrashPrivacyBody),
].join('\n');
const accessoryCrashPrivacyLeakPattern =
  /AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|99999999-8888-7777-6666-555555555555|REQ-MIXED-67890|CRASHKEY-MIXED-12345|\/var\/mobile|\/var\/root|file:\/\/\/|C:\\ProgramData|CRASHLOG-FICTIONAL-001|abcdef12-3456-7890-abcd-ef1234567890|FICTIONAL-SERIAL-12345|FICTIONAL-SERIAL-99999|AA:BB:CC:DD:EE:FF|11:22:33:44:55:66|22:33:44:55:66:77|33:44:55:66:77:88|0x1234567890ABCDEF|0xABCDEF1234567890|0xDEADBEEF12345678|ACCESSORY-ID-FICTIONAL-999|DEVICE-ID-FICTIONAL-999|DEVICE-ID-FICTIONAL-LOWER|PRIMITIVE-CRASHLOG-SHOULD-NOT-LEAK|SHOULD-NOT-LEAK|0xfffffff012345678|0xfffffff087654321/;
const accessoryCrashRawLeakPattern =
  /AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|99999999-8888-7777-6666-555555555555|CRASHKEY-MIXED-12345|\/var\/mobile|\/var\/root|file:\/\/\/|C:\\ProgramData|CRASHLOG-FICTIONAL-001|abcdef12-3456-7890-abcd-ef1234567890|FICTIONAL-SERIAL-12345|FICTIONAL-SERIAL-99999|AA:BB:CC:DD:EE:FF|11:22:33:44:55:66|22:33:44:55:66:77|33:44:55:66:77:88|0x1234567890ABCDEF|0xABCDEF1234567890|0xDEADBEEF12345678|ACCESSORY-ID-FICTIONAL-999|DEVICE-ID-FICTIONAL-999|DEVICE-ID-FICTIONAL-LOWER|PRIMITIVE-CRASHLOG-SHOULD-NOT-LEAK|SHOULD-NOT-LEAK|0xfffffff012345678|0xfffffff087654321/;
const cpuResourceClassificationFixture = [
  JSON.stringify({ bug_type: '202', timestamp: '2026-06-28 10:00:00 +0000', incident_id: 'FICTIONAL-CPU-INCIDENT' }),
  'Date/Time: 2026-06-28 10:00:00 +0000',
  'Action taken: none',
  'CPU limit: 80%',
].join('\n');
const cpuResourceParserFixture = [
  JSON.stringify({
    bug_type: '202',
    timestamp: '2026-06-28 10:00:00 +0000',
    os_version: 'iPhone OS 27.0 (24A999)',
    device_model: 'iPhone19,1',
    incident_id: 'FICTIONAL-CPU-INCIDENT-001',
  }),
  [
    'Date/Time: 2026-06-28 10:00:01 +0000',
    'OS Version: iPhone OS 27.0 (24A999)',
    'Process: DemoCPUApp [123]',
    'Bundle ID: com.example.cpu',
    'Path: /private/var/containers/Bundle/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/DemoCPUApp.app/DemoCPUApp',
    'Command: /private/var/mobile/Containers/Bundle/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/DemoCPUApp.app/DemoCPUApp --foreground',
    'Executable: /usr/bin/DemoCPUApp',
    'Action taken: none',
    'CPU limit: 80%',
    'CPU used: 94%',
    'CPU duration: 182 seconds',
    'CPU time: 88.2 seconds',
    'Wakeups: 1234',
    'Thread Count: 12',
    'Window: 60 seconds',
    'Threshold: 80%',
    'Limit Status: exceeded',
    'Reason: CPU runaway requestID=REQ-CPU-FICTIONAL-123 uuid 11111111-2222-3333-4444-555555555555 address 0xfffffff012345678 serial FICTIONAL-SERIAL-CPU mac AA:BB:CC:DD:EE:FF ECID 0x1234567890ABCDEF volume VOLUME-FICTIONAL-CPU CrashReporterKey CRASHKEY-CPU-123',
  ].join('\n'),
].join('\n');
const cpuResourceLeakPattern =
  /FICTIONAL-CPU-INCIDENT-001|REQ-CPU-FICTIONAL-123|11111111-2222-3333-4444-555555555555|\/private\/var\/containers|\/private\/var\/mobile|\/usr\/bin\/DemoCPUApp|0xfffffff012345678|FICTIONAL-SERIAL-CPU|AA:BB:CC:DD:EE:FF|0x1234567890ABCDEF|VOLUME-FICTIONAL-CPU|CRASHKEY-CPU-123/;
const cpuNestedPrivacyFixture = [
  JSON.stringify({
    bug_type: '202',
    timestamp: '2026-06-28 10:30:00 +0000',
    incident_id: 'FICTIONAL-CPU-NESTED-INCIDENT',
  }),
  JSON.stringify({
    bug_type: '202',
    process: 'NestedCPUApp [124]',
    cpuLimit: '75%',
    cpuUsed: '96%',
    reason:
      'Nested CPU reason requestID=REQ-CPU-NESTED-123 uuid 12121212-3434-5656-7878-909090909090 path /private/var/mobile/nested.cpu address 0xfffffff087654321 serial FICTIONAL-SERIAL-CPU-NESTED mac 10:20:30:40:50:60 ECID 0xABCDEF1234567890 CrashReporterKey CRASHKEY-CPU-NESTED-123',
    nestedPayload: {
      sentinel: 'NESTED-CPU-SENTINEL',
      path: '/private/var/mobile/Library/Logs/nested.cpu',
      frames: [{ symbol: '_cpuNestedFrameSymbol', address: '0xfffffff011111111' }],
    },
  }),
].join('\n');
const cpuNestedLeakPattern =
  /FICTIONAL-CPU-NESTED-INCIDENT|REQ-CPU-NESTED-123|12121212-3434-5656-7878-909090909090|\/private\/var\/mobile|0xfffffff087654321|0xfffffff011111111|FICTIONAL-SERIAL-CPU-NESTED|10:20:30:40:50:60|0xABCDEF1234567890|CRASHKEY-CPU-NESTED-123|NESTED-CPU-SENTINEL|_cpuNestedFrameSymbol/;
const cpuResourceJsonFixture = [
  JSON.stringify({
    bug_type: '202',
    timestamp: '2026-06-28 11:00:00 +0000',
    os_version: 'iPhone OS 27.0 (24A999)',
    device_model: 'iPhone19,2',
    incident_id: 'FICTIONAL-CPU-JSON-INCIDENT',
  }),
  JSON.stringify({
    bug_type: '202',
    process: 'JsonCPUApp',
    pid: 456,
    bundleID: 'com.example.json-cpu',
    actionTaken: 'terminated',
    cpuLimit: '90%',
    cpuUsed: '97%',
    cpuDuration: '240 seconds',
    cpuTime: '220 seconds',
    reason: 'CPU usage exceeded requestID=REQ-CPU-JSON-123 uuid 22222222-3333-4444-5555-666666666666',
  }),
].join('\n');
const cpuResourceFullJsonFixture = JSON.stringify({
  bug_type: '202',
  timestamp: '2026-06-28 11:30:00 +0000',
  process: 'FullJsonCPUApp',
  pid: 789,
  bundle_id: 'com.example.full-json-cpu',
  action_taken: 'none',
  cpu_limit: '85%',
  cpu_used: '91%',
  cpu_duration: '120 seconds',
  reason: 'CPU limit exceeded',
});
const crashWithCpuWordingText = [
  'Incident Identifier: 99999999-8888-7777-6666-555555555555',
  'CrashReporter Key: abcdef12-3456-7890-abcd-ef1234567890',
  'Date/Time: 2026-06-28 12:00:00 +0000',
  'OS Version: iPhone OS 27.0 (24A999)',
  'Exception Type: EXC_CRASH (SIGABRT)',
  'Application Specific Information: CPU usage was observed before this crash.',
].join('\n');
const stackshotClassificationFixture = [
  JSON.stringify({ bug_type: '288', incident_id: 'FICTIONAL-STACKSHOT-INCIDENT' }),
  JSON.stringify({
    bug_type: '288',
    exception: '0x00000020',
    reason: 'fictional resource stackshot',
    memoryStatus: { pageSize: 16384 },
    processByPid: { 100: { procname: 'DemoProcess' } },
  }),
].join('\n');
const stackshotWithPanicStringFixture = [
  JSON.stringify({ bug_type: '288', incident_id: 'FICTIONAL-STACKSHOT-PANIC-INCIDENT' }),
  JSON.stringify({
    bug_type: '288',
    panicString: 'panic-like text inside a fictional stackshot resource report',
    reason: 'fictional resource stackshot with panic-like field',
    memoryStatus: { pageSize: 16384 },
    processByPid: { 100: { procname: 'StackshotPanicLikeApp' } },
  }),
].join('\n');
const jetsamWithProcessByPidFixture = [
  JSON.stringify({ bug_type: '298', incident_id: 'FICTIONAL-JETSAM-PROCESSBYPID' }),
  JSON.stringify({
    bug_type: '298',
    memoryStatus: { pageSize: 16384 },
    rpages: 2048,
    processByPid: { 100: { procname: 'JetsamProcessByPidApp' } },
  }),
].join('\n');
const watchdogWithStackshotPayloadFixture = [
  JSON.stringify({ bug_type: '509', incident_id: 'FICTIONAL-WATCHDOG-STACKSHOT-PAYLOAD' }),
  JSON.stringify({
    bug_type: '509',
    termination: { namespace: 'SPRINGBOARD', code: '0x8badf00d' },
    stackshot: { processByPid: { 100: { procname: 'WatchdogStackshotApp' } } },
    memoryStatus: { pageSize: 16384 },
    processByPid: { 100: { procname: 'WatchdogStackshotApp' } },
  }),
].join('\n');
const stackshotParserFixture = [
  JSON.stringify({
    bug_type: '288',
    timestamp: '2026-06-28 14:00:00 +0000',
    os_version: 'iPhone OS 27.0 (24A999)',
    device_model: 'iPhone19,4',
    incident_id: 'FICTIONAL-STACKSHOT-INCIDENT-001',
  }),
  JSON.stringify({
    bug_type: '288',
    exception: '0x00000020',
    reason:
      'fictional resource stackshot requestID=REQ-STACK-FICTIONAL-123 uuid 55555555-6666-7777-8888-999999999999 address 0xfffffff012345678 serial FICTIONAL-SERIAL-STACK mac AA:BB:CC:DD:EE:FF ECID 0x1234567890ABCDEF volume VOLUME-FICTIONAL-STACK CrashReporterKey CRASHKEY-STACK-123',
    targetPid: 100,
    triggeredProcess: 'TriggeredStackApp',
    notes: 'Collected near /private/var/mobile/stackshot.log with symbol _sensitiveFrameSymbol',
    memoryStatus: {
      pageSize: 16384,
      compressorSize: 1234,
      memoryPages: 50000,
    },
    processByPid: {
      100: {
        procname: 'TriggeredStackApp',
        pid: 100,
        bundleID: 'com.example.triggered-stack',
        role: 'Foreground',
        state: 'running',
        cpuPercent: '15%',
        rpages: 100,
        reason: 'triggered process near 0xfffffff011111111',
        uuid: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
        path: '/private/var/mobile/Containers/Bundle/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/TriggeredStackApp.app/TriggeredStackApp',
        threads: [
          {
            frames: [
              { symbol: '_sensitiveFrameSymbol', address: '0xfffffff012345678', slice_uuid: 'BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF' },
              { symbol: '_anotherSensitiveSymbol', address: '0xABCDEF12' },
            ],
          },
          {
            frames: [{ symbol: '_thirdSensitiveSymbol', address: '0xfffffff087654321' }],
          },
        ],
      },
      200: {
        procname: 'HighCPUStackApp',
        pid: 200,
        bundleID: 'com.example.high-cpu',
        cpuPercent: '95%',
        footprintMB: 20,
        threadCount: 3,
        frameCount: 7,
      },
      300: {
        procname: 'HighMemoryStackApp',
        pid: 300,
        bundleID: 'com.example.high-memory',
        physicalPages: 2000,
        reason: 'high memory participant',
      },
      400: {
        procname: 'SourceOrderStackApp',
        pid: 400,
        bundleID: 'com.example.source-order',
      },
    },
    nestedPayload: {
      sentinel: 'NESTED-STACKSHOT-SENTINEL',
      path: '/var/mobile/Library/Logs/stackshot.raw',
    },
  }),
].join('\n');
const minimalStackshotFixture = [
  JSON.stringify({ bug_type: '288', incident_id: 'FICTIONAL-STACKSHOT-MINIMAL' }),
  JSON.stringify({ bug_type: '288', reason: 'minimal stackshot resource report' }),
].join('\n');
const malformedStackshotFixture = [
  JSON.stringify({ bug_type: '288', incident_id: 'FICTIONAL-STACKSHOT-MALFORMED' }),
  JSON.stringify({ bug_type: '288', processByPid: 'malformed', memoryStatus: { pageSize: 16384 } }),
].join('\n');
const largeStackshotFixture = [
  JSON.stringify({ bug_type: '288', incident_id: 'FICTIONAL-STACKSHOT-LARGE' }),
  JSON.stringify({
    bug_type: '288',
    reason: 'large fictional stackshot resource',
    memoryStatus: { pageSize: 16384 },
    processByPid: Object.fromEntries(
      Array.from({ length: 150 }, (_, index) => {
        const pid = 1000 + index;
        return [
          String(pid),
          {
            procname: `LargeStackProcess${index}`,
            pid,
            bundleID: `com.example.large-stack-${index}`,
            cpuPercent: `${index}%`,
            physicalPages: 150 - index,
          },
        ];
      })
    ),
  }),
].join('\n');
const stackshotLeakPattern =
  /FICTIONAL-STACKSHOT-INCIDENT-001|REQ-STACK-FICTIONAL-123|55555555-6666-7777-8888-999999999999|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF|\/private\/var\/mobile|\/var\/mobile|0xfffffff012345678|0xfffffff011111111|0xABCDEF12|0xfffffff087654321|FICTIONAL-SERIAL-STACK|AA:BB:CC:DD:EE:FF|0x1234567890ABCDEF|VOLUME-FICTIONAL-STACK|CRASHKEY-STACK-123|NESTED-STACKSHOT-SENTINEL|_sensitiveFrameSymbol|_anotherSensitiveSymbol|_thirdSensitiveSymbol/;
const appUsageClassificationFixture = [
  JSON.stringify({ bug_type: '225', incident_id: 'FICTIONAL-USAGE-INCIDENT' }),
  JSON.stringify([{ eventType: 'example', topic: 'fictional-topic', bundleId: 'com.example.app' }]),
].join('\n');
const wifiClassificationFixture = [
  JSON.stringify({ bug_type: '233', incident_id: 'FICTIONAL-WIFI-INCIDENT' }),
  '<GEOLogMsgEvent><WiFiConnectionQuality>fictional quality event</WiFiConnectionQuality></GEOLogMsgEvent>',
].join('\n');
const diagnosticRequestClassificationFixture = [
  JSON.stringify({ bug_type: '312', incident_id: 'FICTIONAL-DIAGNOSTIC-INCIDENT' }),
  JSON.stringify({
    requestType: 'SubmitLogToContainer',
    decisionServerDecision: 'Accepted',
    requestID: 'FICTIONAL-REQUEST-ID',
    logPath: '/private/var/mobile/fictional.log',
    recordDictionary: { fileName: 'fictional.gz' },
  }),
].join('\n');
const diskWritesClassificationFixture = [
  JSON.stringify({ bug_type: '142', incident_id: 'FICTIONAL-DISK-INCIDENT' }),
  JSON.stringify({ bug_type: '142', diskWrites: { logicalWrites: 12345 }, process: 'DemoProcess' }),
].join('\n');
const diskWritesParserFixture = [
  JSON.stringify({
    bug_type: '142',
    timestamp: '2026-06-28 13:00:00 +0000',
    os_version: 'iPhone OS 27.0 (24A999)',
    device_model: 'iPhone19,3',
    incident_id: 'FICTIONAL-DISK-INCIDENT-001',
  }),
  JSON.stringify({
    bug_type: '142',
    process: 'DemoDiskApp [321]',
    pid: 321,
    bundleID: 'com.example.disk',
    command: '/private/var/mobile/Containers/Bundle/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/DemoDiskApp.app/DemoDiskApp --write',
    executable: '/private/var/containers/Bundle/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/DemoDiskApp.app/DemoDiskApp',
    path: '/private/var/mobile/Containers/Data/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/Documents/demo.db',
    actionTaken: 'none',
    reason:
      'Disk write limit exceeded requestID=REQ-DISK-FICTIONAL-123 uuid 33333333-4444-5555-6666-777777777777 address 0xfffffff012345678 serial FICTIONAL-SERIAL-DISK mac AA:BB:CC:DD:EE:FF ECID 0x1234567890ABCDEF volume VOLUME-FICTIONAL-001 CrashReporterKey CRASHKEY-DISK-123',
    diskWrites: {
      logicalWrites: '1024 MB',
      physicalWrites: '768 MB',
      bytesWritten: '805306368',
      writeCount: '4096',
      diskWriteDuration: '300 seconds',
      writeRate: '2.5 MB/s',
      paths: [
        '/private/var/mobile/Containers/Data/Application/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/Documents/demo.db',
        '/var/mobile/Library/Caches/com.example.disk/cache.sqlite',
      ],
      nestedPayload: {
        sentinel: 'NESTED-DISK-SENTINEL',
        path: '/private/var/root/hidden.db',
      },
    },
    limits: {
      logicalWriteLimit: '500 MB',
      physicalWriteLimit: '400 MB',
      window: '24 hours',
      threshold: '500 MB',
      status: 'exceeded',
      volumeUUID: '44444444-5555-6666-7777-888888888888',
    },
  }),
].join('\n');
const diskWritesFullJsonFixture = JSON.stringify({
  bug_type: '142',
  timestamp: '2026-06-28 13:30:00 +0000',
  process: 'FullJsonDiskApp',
  pid: 654,
  bundle_id: 'com.example.full-json-disk',
  action_taken: 'terminated',
  logicalWrites: '700 MB',
  physicalWrites: '650 MB',
  bytesWritten: '681574400',
  writeCount: '2048',
  diskWriteDuration: '180 seconds',
  writeLimit: '500 MB',
  reason: 'logical write limit exceeded',
});
const diskWritesLeakPattern =
  /FICTIONAL-DISK-INCIDENT-001|REQ-DISK-FICTIONAL-123|33333333-4444-5555-6666-777777777777|44444444-5555-6666-7777-888888888888|\/private\/var\/mobile|\/private\/var\/containers|\/var\/mobile|\/private\/var\/root|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|0xfffffff012345678|FICTIONAL-SERIAL-DISK|AA:BB:CC:DD:EE:FF|0x1234567890ABCDEF|VOLUME-FICTIONAL-001|CRASHKEY-DISK-123|NESTED-DISK-SENTINEL/;
const genericWritesJsonFixture = JSON.stringify({
  bug_type: '109',
  process: 'DemoCrashLikeApp',
  writes: 'generic note only',
  exception: { type: 'EXC_BAD_ACCESS' },
  threads: [],
});

const unsupportedDiagnosticMessageCases = [
  [
    appUsageClassificationFixture,
    'Recognized App Usage Metrics diagnostic, but this parser is not supported yet.',
    'App Usage Metrics',
  ],
  [
    wifiClassificationFixture,
    'Recognized Wi-Fi Connectivity diagnostic, but this parser is not supported yet.',
    'Wi-Fi Connectivity',
  ],
  [
    diagnosticRequestClassificationFixture,
    'Recognized Diagnostic Request report, but this parser is not supported yet.',
    'Diagnostic Request',
  ],
];

for (const [fixture, expectedMessage, label] of unsupportedDiagnosticMessageCases) {
  const message = getUnsupportedDiagnosticMessage(classifyDiagnostic(fixture));
  assert.equal(message, expectedMessage, `${label} has the approved friendly unsupported message`);
  assert.doesNotMatch(
    message,
    /FICTIONAL-|REQUEST-ID|private\/var|com\.example\.app|fictional-topic|WiFiConnectionQuality|12345|DemoProcess/,
    `${label} unsupported message does not expose fixture identifiers or payload values`
  );
}
assert.equal(
  getUnsupportedDiagnosticMessage(classifyDiagnostic(accessoryCrashParserFixture)),
  null,
  'supported AccessoryCrash diagnostics do not receive a recognized-unsupported message'
);
assert.equal(
  getUnsupportedDiagnosticMessage(classifyDiagnostic('{"not":"a diagnostic"}')),
  null,
  'unknown diagnostics do not receive a recognized-unsupported message'
);

assertClassification(
  accessoryCrashClassificationFixture,
  {
    type: 'accessory-crash',
    family: 'accessory',
    subtype: 'crash',
    supported: true,
    parserType: 'accessory-crash',
    legacyType: 'accessory-crash',
    bugType: '305',
  },
  'classifies supported AccessoryCrash diagnostics'
);
assertClassification(
  cpuResourceClassificationFixture,
  {
    type: 'resource-cpu',
    family: 'resource',
    subtype: 'cpu',
    supported: true,
    parserType: 'resource-cpu',
    legacyType: 'resource-cpu',
    bugType: '202',
  },
  'classifies supported CPU resource diagnostics'
);
assertClassification(
  stackshotClassificationFixture,
  {
    type: 'resource-stackshot',
    family: 'resource',
    subtype: 'stackshot',
    supported: true,
    parserType: 'resource-stackshot',
    legacyType: 'resource-stackshot',
    bugType: '288',
  },
  'classifies supported stackshot/resource diagnostics'
);
assert.notEqual(
  classifyDiagnostic(stackshotClassificationFixture).type,
  'app-crash',
  'stackshot/resource diagnostics with bug_type and exception are not classified as app crashes'
);
assertClassification(
  appUsageClassificationFixture,
  {
    type: 'app-usage-metrics',
    family: 'metrics',
    subtype: 'app-usage',
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    bugType: '225',
  },
  'classifies unsupported app usage metrics'
);
assertClassification(
  wifiClassificationFixture,
  {
    type: 'wifi-connectivity',
    family: 'connectivity',
    subtype: 'wifi',
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    bugType: '233',
  },
  'classifies unsupported Wi-Fi connectivity diagnostics'
);
assertClassification(
  diagnosticRequestClassificationFixture,
  {
    type: 'diagnostic-request',
    family: 'diagnostic-request',
    subtype: 'pipeline',
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    bugType: '312',
  },
  'classifies unsupported diagnostic request reports'
);
assertClassification(
  diskWritesClassificationFixture,
  {
    type: 'resource-diskwrites',
    family: 'resource',
    subtype: 'diskwrites',
    supported: true,
    parserType: 'resource-diskwrites',
    legacyType: 'resource-diskwrites',
    bugType: '142',
  },
  'classifies supported disk writes resource diagnostics'
);
assert.equal(detectFileType(accessoryCrashClassificationFixture), 'accessory-crash', 'detectFileType returns routable AccessoryCrash type');
assert.equal(classifyDiagnostic(accessoryCrashParserFixture).type, 'accessory-crash', 'AccessoryCrash with panicString remains AccessoryCrash');
assert.notEqual(classifyDiagnostic(accessoryCrashParserFixture).type, 'panic-full', 'AccessoryCrash with panicString does not classify as panic-full');
assert.equal(detectFileType(cpuResourceClassificationFixture), 'resource-cpu', 'detectFileType returns routable CPU Resource type');
assert.equal(
  getUnsupportedDiagnosticMessage(classifyDiagnostic(cpuResourceClassificationFixture)),
  null,
  'supported CPU Resource diagnostics do not receive a recognized-unsupported message'
);
assert.equal(
  getUnsupportedDiagnosticMessage(classifyDiagnostic(diskWritesClassificationFixture)),
  null,
  'supported Disk Writes Resource diagnostics do not receive a recognized-unsupported message'
);
assert.equal(
  getUnsupportedDiagnosticMessage(classifyDiagnostic(stackshotClassificationFixture)),
  null,
  'supported Stackshot Resource diagnostics do not receive a recognized-unsupported message'
);
assert.equal(
  classifyDiagnostic(cpuResourceParserFixture).type,
  'resource-cpu',
  'CPU Resource reports with crash-like Date/Time and OS Version markers classify as CPU Resource'
);
assert.notEqual(
  classifyDiagnostic(cpuResourceParserFixture).type,
  'crash-legacy',
  'CPU Resource reports with strong CPU markers do not classify as legacy crash'
);
assert.equal(
  classifyDiagnostic(crashWithCpuWordingText).type,
  'crash-legacy',
  'legacy crash reports with harmless CPU wording still classify as legacy crash'
);
assert.equal(
  detectFileType(crashWithCpuWordingText),
  'crash',
  'legacy crash reports with harmless CPU wording still detect as crash'
);
assert.equal(detectFileType(diskWritesClassificationFixture), 'resource-diskwrites', 'detectFileType returns routable Disk Writes Resource type');
assert.equal(detectFileType(stackshotClassificationFixture), 'resource-stackshot', 'detectFileType returns routable Stackshot Resource type');
assert.equal(
  classifyDiagnostic(genericWritesJsonFixture).type,
  'app-crash',
  'generic writes keys without strong Disk Writes evidence do not classify as Disk Writes Resource'
);
assert.equal(
  classifyDiagnostic(stackshotWithPanicStringFixture).type,
  'resource-stackshot',
  'Stackshot Resource with panicString classifies as Stackshot Resource'
);
assert.notEqual(
  classifyDiagnostic(stackshotWithPanicStringFixture).type,
  'panic-full',
  'Stackshot Resource with panicString does not classify as panic-full'
);
assert.equal(
  detectFileType(stackshotWithPanicStringFixture),
  'resource-stackshot',
  'Stackshot Resource with panicString detects as Stackshot Resource'
);
assert.equal(
  classifyDiagnostic(jetsamWithProcessByPidFixture).type,
  'jetsam',
  'Jetsam with processByPid and memoryStatus still classifies as Jetsam'
);
assert.equal(
  detectFileType(jetsamWithProcessByPidFixture),
  'jetsam',
  'Jetsam with processByPid and memoryStatus still detects as Jetsam'
);
assert.equal(
  classifyDiagnostic(watchdogWithStackshotPayloadFixture).type,
  'watchdog',
  'Watchdog with stackshot payload still classifies as Watchdog'
);
assert.equal(
  detectFileType(watchdogWithStackshotPayloadFixture),
  'ips-watchdog-stackshot',
  'Watchdog with stackshot payload still detects as watchdog stackshot'
);
assert.notEqual(
  detectFileType(stackshotClassificationFixture),
  'ips',
  'stackshot/resource diagnostics with bug_type and exception do not detect as app crash IPS'
);
assertUnsupportedFamilyDetection(
  appUsageClassificationFixture,
  'app-usage-metrics',
  'unsupported app usage metrics diagnostics'
);
assertUnsupportedFamilyDetection(
  wifiClassificationFixture,
  'wifi-connectivity',
  'unsupported Wi-Fi connectivity diagnostics'
);
assertUnsupportedFamilyDetection(
  diagnosticRequestClassificationFixture,
  'diagnostic-request',
  'unsupported diagnostic request reports'
);

const cpuResourceSections = parseCpuResource(cpuResourceParserFixture);
assert.deepEqual(
  cpuResourceSections.map((section) => section.id),
  [
    'resource-cpu-summary',
    'resource-cpu-process-info',
    'resource-cpu-usage',
    'resource-cpu-limits',
    'resource-cpu-parser-notes',
  ],
  'CPU Resource direct parser emits the expected section order'
);
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Bug Type'), '202');
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Timestamp'),
  '2026-06-28 10:00:00 +0000',
  'CPU Resource summary prefers metadata timestamp'
);
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'OS Version'),
  'iPhone OS 27.0 (24A999)',
  'CPU Resource summary populates OS version'
);
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Device'), 'iPhone19,1');
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Incident ID'),
  '[identifier redacted]',
  'CPU Resource summary redacts incident IDs by default'
);
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Report Type'), 'CPU Resource');
assert.match(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Primary Reason'),
  /CPU runaway/,
  'CPU Resource summary extracts primary reason text'
);
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-summary'), 'Action Taken'), 'none');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'Process'), 'DemoCPUApp');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'PID'), '123');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'Bundle ID'), 'com.example.cpu');
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'Path'),
  '[path redacted]',
  'CPU Resource path field redacts in sanitized mode'
);
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'Command'),
  '[path redacted]',
  'CPU Resource command paths redact in sanitized mode'
);
assert.equal(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-process-info'), 'Executable'),
  '[path redacted]',
  'CPU Resource executable paths redact in sanitized mode'
);
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'CPU Used'), '94%');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'CPU Limit'), '80%');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'CPU Duration'), '182 seconds');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'CPU Time'), '88.2 seconds');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'Wakeups'), '1234');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-usage'), 'Thread Count'), '12');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-limits'), 'CPU Limit'), '80%');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-limits'), 'Window'), '60 seconds');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-limits'), 'Threshold'), '80%');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-limits'), 'Action Taken'), 'none');
assert.equal(fieldValue(sectionById(cpuResourceSections, 'resource-cpu-limits'), 'Limit Status'), 'exceeded');
assert.match(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-parser-notes'), 'Sources'),
  /metadata and text/,
  'CPU Resource parser notes describe extraction sources'
);
assert.match(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-parser-notes'), 'Privacy'),
  /redacted or omitted/,
  'CPU Resource parser notes describe privacy handling'
);
assert.match(
  fieldValue(sectionById(cpuResourceSections, 'resource-cpu-parser-notes'), 'Raw Body'),
  /not rendered/,
  'CPU Resource parser notes describe raw body omission'
);
assert.doesNotMatch(
  JSON.stringify(cpuResourceSections),
  cpuResourceLeakPattern,
  'CPU Resource sanitized output redacts identifiers, paths, raw addresses, serials, MACs, and ECID values'
);
assert.doesNotThrow(
  () => parseCpuResource('Malformed CPU resource text without key value lines'),
  'CPU Resource parser tolerates malformed text'
);
assert.deepEqual(
  parseCpuResource('Malformed CPU resource text without key value lines').map((section) => section.id),
  ['resource-cpu-summary', 'resource-cpu-parser-notes'],
  'CPU Resource malformed input still emits summary and parser notes'
);
const minimalCpuResourceSections = parseCpuResource('CPU limit: 70%');
assert.deepEqual(
  minimalCpuResourceSections.map((section) => section.id),
  ['resource-cpu-summary', 'resource-cpu-usage', 'resource-cpu-limits', 'resource-cpu-parser-notes'],
  'CPU Resource minimal input omits missing optional process fields'
);
assert.equal(
  fieldValue(sectionById(minimalCpuResourceSections, 'resource-cpu-usage'), 'CPU Limit'),
  '70%',
  'CPU Resource minimal input extracts available metrics'
);
const rawCpuResourceSections = parseCpuResource(cpuResourceParserFixture, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawCpuResourceSections, 'resource-cpu-process-info'), 'Process'),
  'DemoCPUApp',
  'CPU Resource raw mode preserves safe scalar process values'
);
assert.equal(
  fieldValue(sectionById(rawCpuResourceSections, 'resource-cpu-usage'), 'CPU Used'),
  '94%',
  'CPU Resource raw mode preserves safe scalar metric values'
);
assert.doesNotMatch(
  JSON.stringify(rawCpuResourceSections),
  cpuResourceLeakPattern,
  'CPU Resource raw mode remains bounded and avoids paths, identifiers, raw addresses, serials, MACs, and ECID values'
);
assert.deepEqual(
  withoutExplanationSection(parseInput(cpuResourceParserFixture)),
  parseCpuResource(cpuResourceParserFixture),
  'CPU Resource parseInput route matches direct parser output in sanitized mode'
);
assert.deepEqual(
  withoutExplanationSection(parseInput(cpuResourceParserFixture, { sanitize: false })),
  parseCpuResource(cpuResourceParserFixture, { sanitize: false }),
  'CPU Resource parseInput route matches direct parser output in raw mode'
);
assert.equal(
  classifyDiagnostic(cpuResourceParserFixture).supported,
  true,
  'CPU Resource classification is supported in Slice 3C'
);
assert.equal(classifyDiagnostic(cpuResourceParserFixture).parserType, 'resource-cpu', 'CPU Resource classification exposes parserType for routing');
assert.equal(classifyDiagnostic(cpuResourceParserFixture).legacyType, 'resource-cpu', 'CPU Resource classification exposes legacyType for detectFileType compatibility');
assert.equal(detectFileType(cpuResourceParserFixture), 'resource-cpu', 'CPU Resource detectFileType compatibility returns routable type in Slice 3C');
assert.deepEqual(
  parseInput(cpuResourceParserFixture).map((section) => section.id),
  [
    'resource-cpu-summary',
    EXPLANATION_SECTION_ID,
    'resource-cpu-process-info',
    'resource-cpu-usage',
    'resource-cpu-limits',
    'resource-cpu-parser-notes',
  ],
  'CPU Resource parseInput route returns expected sections'
);
assertExplanationAfterSummary(parseInput(cpuResourceParserFixture), 'resource-cpu', 'CPU Resource parseInput inserts explanation');
assert.doesNotMatch(
  JSON.stringify(parseInput(cpuResourceParserFixture)),
  cpuResourceLeakPattern,
  'CPU Resource parseInput sanitized output preserves the same privacy boundary'
);
assert.doesNotMatch(
  JSON.stringify(parseInput(cpuResourceParserFixture, { sanitize: false })),
  cpuResourceLeakPattern,
  'CPU Resource parseInput raw mode remains bounded'
);
const cpuRoutedSections = parseInput(cpuResourceParserFixture);
const cpuExplanationSearch = filterSectionsByQuery(cpuRoutedSections, 'too much CPU for too long');
assert.equal(cpuExplanationSearch.active, true, 'explanation-only search is active');
assert.deepEqual(
  cpuExplanationSearch.sections.map((section) => section.id),
  [EXPLANATION_SECTION_ID],
  'explanation-only search returns the explanation section'
);
assert.equal(cpuExplanationSearch.totalMatches, 1, 'explanation-only search counts explanation text matches');
const cpuNormalSearch = filterSectionsByQuery(cpuRoutedSections, 'DemoCPUApp');
assert.ok(sectionById(cpuNormalSearch.sections, 'resource-cpu-process-info'), 'normal parser-section search still returns process info');
assert.equal(sectionById(cpuNormalSearch.sections, EXPLANATION_SECTION_ID), undefined, 'normal parser-section search filters out unrelated explanation text');
assert.doesNotMatch(
  serializeSectionsForCopy(cpuNormalSearch.sections),
  /What This Usually Means|too much CPU for too long/,
  'copy of filtered parser sections does not include filtered-out explanation text'
);
const cpuExplanationCopy = serializeSectionForCopy(explanationSectionFrom(cpuRoutedSections));
assert.match(cpuExplanationCopy, /What This Usually Means/, 'copy includes explanation title when explanation section is visible');
assert.match(cpuExplanationCopy, /too much CPU for too long/, 'copy includes explanation text when explanation section is visible');
assert.doesNotMatch(cpuExplanationCopy, /[{}\[\]]/, 'explanation copy remains plain text rather than serialized objects');
const cpuProcessCopy = serializeSectionForCopy(sectionById(cpuRoutedSections, 'resource-cpu-process-info'));
assert.match(cpuProcessCopy, /Process: DemoCPUApp/, 'copy for normal parser sections remains unchanged');
assert.doesNotMatch(cpuProcessCopy, /What This Usually Means|too much CPU for too long/, 'normal parser-section copy does not include explanation text');
assert.equal(classifyDiagnostic(cpuResourceJsonFixture).supported, true, 'JSON CPU Resource classification is supported');
assert.equal(detectFileType(cpuResourceJsonFixture), 'resource-cpu', 'JSON CPU Resource detectFileType returns routable type');
const parsedJsonCpuSections = parseInput(cpuResourceJsonFixture);
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-summary'), 'Bug Type'), '202');
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-process-info'), 'Process'), 'JsonCPUApp');
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-process-info'), 'PID'), '456');
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-process-info'), 'Bundle ID'), 'com.example.json-cpu');
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-usage'), 'CPU Used'), '97%');
assert.equal(fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-usage'), 'CPU Limit'), '90%');
assert.equal(
  fieldValue(sectionById(parsedJsonCpuSections, 'resource-cpu-summary'), 'Incident ID'),
  '[identifier redacted]',
  'JSON CPU Resource summary redacts incident IDs by default'
);
assert.doesNotMatch(
  JSON.stringify(parsedJsonCpuSections),
  /FICTIONAL-CPU-JSON-INCIDENT|REQ-CPU-JSON-123|22222222-3333-4444-5555-666666666666/,
  'JSON CPU Resource sanitized output redacts identifiers'
);
assert.equal(classifyDiagnostic(cpuResourceFullJsonFixture).supported, true, 'full JSON CPU Resource classification is supported');
assert.equal(detectFileType(cpuResourceFullJsonFixture), 'resource-cpu', 'full JSON CPU Resource detectFileType returns routable type');
const parsedFullJsonCpuSections = parseInput(cpuResourceFullJsonFixture);
assert.equal(fieldValue(sectionById(parsedFullJsonCpuSections, 'resource-cpu-process-info'), 'Process'), 'FullJsonCPUApp');
assert.equal(fieldValue(sectionById(parsedFullJsonCpuSections, 'resource-cpu-process-info'), 'PID'), '789');
assert.equal(fieldValue(sectionById(parsedFullJsonCpuSections, 'resource-cpu-usage'), 'CPU Used'), '91%');
assert.equal(fieldValue(sectionById(parsedFullJsonCpuSections, 'resource-cpu-usage'), 'CPU Limit'), '85%');

const diskWritesSections = parseDiskWritesResource(diskWritesParserFixture);
assert.deepEqual(
  diskWritesSections.map((section) => section.id),
  [
    'resource-diskwrites-summary',
    'resource-diskwrites-process-info',
    'resource-diskwrites-usage',
    'resource-diskwrites-limits',
    'resource-diskwrites-parser-notes',
  ],
  'Disk Writes Resource direct parser emits the expected section order'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Bug Type'), '142');
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Timestamp'),
  '2026-06-28 13:00:00 +0000',
  'Disk Writes Resource summary prefers metadata timestamp'
);
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'OS Version'),
  'iPhone OS 27.0 (24A999)',
  'Disk Writes Resource summary populates OS version'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Device'), 'iPhone19,3');
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Incident ID'),
  '[identifier redacted]',
  'Disk Writes Resource summary redacts incident IDs by default'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Report Type'), 'Disk Writes Resource');
assert.match(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Primary Reason'),
  /Disk write limit exceeded/,
  'Disk Writes Resource summary extracts primary reason text'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-summary'), 'Action Taken'), 'none');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'Process'), 'DemoDiskApp');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'PID'), '321');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'Bundle ID'), 'com.example.disk');
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'Path'),
  '[path redacted]',
  'Disk Writes Resource path field redacts in sanitized mode'
);
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'Command'),
  '[path redacted]',
  'Disk Writes Resource command paths redact in sanitized mode'
);
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-process-info'), 'Executable'),
  '[path redacted]',
  'Disk Writes Resource executable paths redact in sanitized mode'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Logical Writes'), '1024 MB');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Physical Writes'), '768 MB');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Bytes Written'), '805306368');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Write Count'), '4096');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Duration'), '300 seconds');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Write Rate'), '2.5 MB/s');
assert.equal(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-usage'), 'Path Entry Count'),
  '6',
  'Disk Writes Resource summarizes path-heavy entries by count'
);
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Logical Write Limit'), '500 MB');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Physical Write Limit'), '400 MB');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Window'), '24 hours');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Threshold'), '500 MB');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Action Taken'), 'none');
assert.equal(fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-limits'), 'Limit Status'), 'exceeded');
assert.match(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-parser-notes'), 'Sources'),
  /metadata and body/,
  'Disk Writes Resource parser notes describe extraction sources'
);
assert.match(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-parser-notes'), 'Privacy'),
  /redacted or omitted/,
  'Disk Writes Resource parser notes describe privacy handling'
);
assert.match(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-parser-notes'), 'Raw Body'),
  /not rendered/,
  'Disk Writes Resource parser notes describe raw body omission'
);
assert.match(
  fieldValue(sectionById(diskWritesSections, 'resource-diskwrites-parser-notes'), 'Path Data'),
  /summarized by count only/,
  'Disk Writes Resource parser notes describe path-heavy data summarization'
);
assert.doesNotMatch(
  JSON.stringify(diskWritesSections),
  diskWritesLeakPattern,
  'Disk Writes Resource sanitized output redacts identifiers, paths, volume IDs, raw addresses, serials, MACs, ECIDs, and nested sentinels'
);
assert.doesNotThrow(
  () => parseDiskWritesResource('Malformed Disk Writes resource text without key value lines'),
  'Disk Writes Resource parser tolerates malformed text'
);
assert.deepEqual(
  parseDiskWritesResource('Malformed Disk Writes resource text without key value lines').map((section) => section.id),
  ['resource-diskwrites-summary', 'resource-diskwrites-parser-notes'],
  'Disk Writes Resource malformed input still emits summary and parser notes'
);
const minimalDiskWritesSections = parseDiskWritesResource('Logical Writes: 10 MB');
assert.deepEqual(
  minimalDiskWritesSections.map((section) => section.id),
  ['resource-diskwrites-summary', 'resource-diskwrites-usage', 'resource-diskwrites-parser-notes'],
  'Disk Writes Resource minimal input omits missing optional process and limit fields'
);
assert.equal(
  fieldValue(sectionById(minimalDiskWritesSections, 'resource-diskwrites-usage'), 'Logical Writes'),
  '10 MB',
  'Disk Writes Resource minimal input extracts available metrics'
);
assert.doesNotThrow(
  () => parseDiskWritesResource(JSON.stringify({ bug_type: '142', diskWrites: 'malformed', limits: ['unexpected'] })),
  'Disk Writes Resource parser tolerates malformed diskWrites and limits values'
);
const rawDiskWritesSections = parseDiskWritesResource(diskWritesParserFixture, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawDiskWritesSections, 'resource-diskwrites-process-info'), 'Process'),
  'DemoDiskApp',
  'Disk Writes Resource raw mode preserves safe scalar process values'
);
assert.equal(
  fieldValue(sectionById(rawDiskWritesSections, 'resource-diskwrites-usage'), 'Logical Writes'),
  '1024 MB',
  'Disk Writes Resource raw mode preserves safe scalar metric values'
);
assert.doesNotMatch(
  JSON.stringify(rawDiskWritesSections),
  diskWritesLeakPattern,
  'Disk Writes Resource raw mode remains bounded and avoids paths, identifiers, volume IDs, nested payloads, serials, MACs, and ECID values'
);
assert.deepEqual(
  withoutExplanationSection(parseInput(diskWritesParserFixture)),
  parseDiskWritesResource(diskWritesParserFixture),
  'Disk Writes Resource parseInput route matches direct parser output in sanitized mode'
);
assert.deepEqual(
  withoutExplanationSection(parseInput(diskWritesParserFixture, { sanitize: false })),
  parseDiskWritesResource(diskWritesParserFixture, { sanitize: false }),
  'Disk Writes Resource parseInput route matches direct parser output in raw mode'
);
assert.equal(
  classifyDiagnostic(diskWritesParserFixture).supported,
  true,
  'Disk Writes Resource classification is supported in Slice 3D'
);
assert.equal(classifyDiagnostic(diskWritesParserFixture).parserType, 'resource-diskwrites', 'Disk Writes Resource classification exposes parserType for routing');
assert.equal(classifyDiagnostic(diskWritesParserFixture).legacyType, 'resource-diskwrites', 'Disk Writes Resource classification exposes legacyType for detectFileType compatibility');
assert.equal(detectFileType(diskWritesParserFixture), 'resource-diskwrites', 'Disk Writes Resource detectFileType compatibility returns routable type in Slice 3D');
assert.deepEqual(
  parseInput(diskWritesParserFixture).map((section) => section.id),
  [
    'resource-diskwrites-summary',
    EXPLANATION_SECTION_ID,
    'resource-diskwrites-process-info',
    'resource-diskwrites-usage',
    'resource-diskwrites-limits',
    'resource-diskwrites-parser-notes',
  ],
  'Disk Writes Resource parseInput route returns expected sections'
);
assertExplanationAfterSummary(parseInput(diskWritesParserFixture), 'resource-diskwrites', 'Disk Writes Resource parseInput inserts explanation');
assert.doesNotMatch(
  JSON.stringify(parseInput(diskWritesParserFixture)),
  diskWritesLeakPattern,
  'Disk Writes Resource parseInput sanitized output preserves the same privacy boundary'
);
assert.doesNotMatch(
  JSON.stringify(parseInput(diskWritesParserFixture, { sanitize: false })),
  diskWritesLeakPattern,
  'Disk Writes Resource parseInput raw mode remains bounded'
);
assert.equal(classifyDiagnostic(diskWritesFullJsonFixture).supported, true, 'full JSON Disk Writes Resource classification is supported');
assert.equal(detectFileType(diskWritesFullJsonFixture), 'resource-diskwrites', 'full JSON Disk Writes Resource detectFileType returns routable type');
const parsedFullJsonDiskWritesSections = parseInput(diskWritesFullJsonFixture);
assert.equal(fieldValue(sectionById(parsedFullJsonDiskWritesSections, 'resource-diskwrites-process-info'), 'Process'), 'FullJsonDiskApp');
assert.equal(fieldValue(sectionById(parsedFullJsonDiskWritesSections, 'resource-diskwrites-process-info'), 'PID'), '654');
assert.equal(fieldValue(sectionById(parsedFullJsonDiskWritesSections, 'resource-diskwrites-usage'), 'Logical Writes'), '700 MB');
assert.equal(fieldValue(sectionById(parsedFullJsonDiskWritesSections, 'resource-diskwrites-usage'), 'Physical Writes'), '650 MB');
assert.equal(fieldValue(sectionById(parsedFullJsonDiskWritesSections, 'resource-diskwrites-limits'), 'Logical Write Limit'), '500 MB');

const stackshotSections = parseResourceStackshot(stackshotParserFixture);
assert.deepEqual(
  stackshotSections.map((section) => section.id),
  [
    'resource-stackshot-summary',
    'resource-stackshot-trigger-reason',
    'resource-stackshot-process-overview',
    'resource-stackshot-top-processes',
    'resource-stackshot-parser-notes',
  ],
  'Stackshot Resource direct parser emits the expected section order'
);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Bug Type'), '288');
assert.equal(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Timestamp'),
  '2026-06-28 14:00:00 +0000',
  'Stackshot Resource summary prefers metadata timestamp'
);
assert.equal(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'OS Version'),
  'iPhone OS 27.0 (24A999)',
  'Stackshot Resource summary populates OS version'
);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Device'), 'iPhone19,4');
assert.equal(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Incident ID'),
  '[identifier redacted]',
  'Stackshot Resource summary redacts incident IDs by default'
);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Report Type'), 'Stackshot Resource');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Process Count'), '4');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Rendered Process Rows'), '4');
assert.match(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-summary'), 'Primary Reason'),
  /fictional resource stackshot/,
  'Stackshot Resource summary extracts primary reason text'
);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Exception'), '[address redacted]');
assert.match(fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Reason'), /fictional resource stackshot/);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Triggered Process'), 'TriggeredStackApp');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Triggered PID'), '100');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Selection'), 'Matched trigger process');
assert.match(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Notes'),
  /\[path redacted\]/,
  'Stackshot Resource trigger notes redact paths'
);
assert.doesNotMatch(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-trigger-reason'), 'Notes'),
  /_sensitiveFrameSymbol/,
  'Stackshot Resource trigger notes redact frame-like symbols'
);
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Total Processes'), '4');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Processes With CPU'), '2');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Processes With Memory'), '3');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Processes With Threads'), '2');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Processes With Reasons'), '2');
assert.equal(fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Page Size'), '16384');
assert.equal(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-process-overview'), 'Memory Status'),
  '3 memory status fields summarized',
  'Stackshot Resource process overview summarizes memoryStatus safely'
);
const stackshotProcessTable = sectionById(stackshotSections, 'resource-stackshot-top-processes');
assert.deepEqual(
  stackshotProcessTable.tableColumns.map((column) => column.label),
  ['Process', 'PID', 'Bundle ID', 'CPU', 'Footprint / Pages', 'Role / State', 'Reason', 'Threads', 'Frames'],
  'Stackshot Resource top process table exposes the expected columns'
);
assert.equal(stackshotProcessTable.table.length, 4, 'Stackshot Resource top process table renders normalized process rows');
assert.equal(stackshotProcessTable.tableSummary, '4 of 4 processes shown');
assert.equal(stackshotProcessTable.table[0].process, 'TriggeredStackApp', 'Stackshot Resource sorts explicit trigger process first');
assert.equal(stackshotProcessTable.table[1].process, 'HighCPUStackApp', 'Stackshot Resource sorts CPU values after trigger process');
assert.equal(stackshotProcessTable.table[2].process, 'HighMemoryStackApp', 'Stackshot Resource sorts memory/page fallback after CPU values');
assert.equal(stackshotProcessTable.table[3].process, 'SourceOrderStackApp', 'Stackshot Resource preserves source order when no CPU or memory values exist');
assert.equal(stackshotProcessTable.table[0].footprintPages, '1.6 MB');
assert.equal(stackshotProcessTable.table[0].threads, '2');
assert.equal(stackshotProcessTable.table[0].frames, '3');
assert.equal(stackshotProcessTable.table[1].frames, '7');
assert.match(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-parser-notes'), 'Row Cap'),
  /100 rows/,
  'Stackshot Resource parser notes describe row cap'
);
assert.match(
  fieldValue(sectionById(stackshotSections, 'resource-stackshot-parser-notes'), 'Stack Frames'),
  /counted only/,
  'Stackshot Resource parser notes describe frame summarization'
);
assert.doesNotMatch(
  JSON.stringify(stackshotSections),
  stackshotLeakPattern,
  'Stackshot Resource sanitized output redacts identifiers, paths, frame symbols, frame addresses, serials, MACs, ECIDs, and nested sentinels'
);
const rawStackshotSections = parseResourceStackshot(stackshotParserFixture, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawStackshotSections, 'resource-stackshot-top-processes'), 'Process'),
  undefined,
  'Stackshot Resource raw mode does not change table serialization shape'
);
assert.equal(
  sectionById(rawStackshotSections, 'resource-stackshot-top-processes').table[0].process,
  'TriggeredStackApp',
  'Stackshot Resource raw mode preserves safe scalar process values'
);
assert.doesNotMatch(
  JSON.stringify(rawStackshotSections),
  stackshotLeakPattern,
  'Stackshot Resource raw mode remains bounded and avoids paths, nested payloads, frame symbols, frame addresses, UUIDs, serials, MACs, and ECID values'
);
const minimalStackshotSections = parseResourceStackshot(minimalStackshotFixture);
assert.deepEqual(
  minimalStackshotSections.map((section) => section.id),
  ['resource-stackshot-summary', 'resource-stackshot-trigger-reason', 'resource-stackshot-parser-notes'],
  'Stackshot Resource minimal input emits summary, trigger/reason, and parser notes'
);
assert.doesNotThrow(
  () => parseResourceStackshot(malformedStackshotFixture),
  'Stackshot Resource parser tolerates malformed processByPid'
);
assert.deepEqual(
  parseResourceStackshot(malformedStackshotFixture).map((section) => section.id),
  ['resource-stackshot-summary', 'resource-stackshot-process-overview', 'resource-stackshot-parser-notes'],
  'Stackshot Resource malformed processByPid omits top process table'
);
const largeStackshotSections = parseResourceStackshot(largeStackshotFixture);
const largeStackshotTable = sectionById(largeStackshotSections, 'resource-stackshot-top-processes');
assert.equal(largeStackshotTable.table.length, 100, 'Stackshot Resource top process table caps at 100 rows');
assert.equal(largeStackshotTable.tableSummary, '100 of 150 processes shown', 'Stackshot Resource tableSummary reports capped rows');
assert.equal(largeStackshotTable.table[0].process, 'LargeStackProcess149', 'Stackshot Resource large table sorts by CPU descending');
assert.equal(classifyDiagnostic(stackshotParserFixture).supported, true, 'Stackshot Resource classification is supported in Slice 3E2');
assert.equal(classifyDiagnostic(stackshotParserFixture).parserType, 'resource-stackshot', 'Stackshot Resource classification exposes parserType for routing');
assert.equal(classifyDiagnostic(stackshotParserFixture).legacyType, 'resource-stackshot', 'Stackshot Resource classification exposes legacyType for detectFileType compatibility');
assert.equal(detectFileType(stackshotParserFixture), 'resource-stackshot', 'Stackshot Resource detectFileType returns routable type in Slice 3E2');
assert.deepEqual(
  parseInput(stackshotParserFixture).map((section) => section.id),
  [
    'resource-stackshot-summary',
    EXPLANATION_SECTION_ID,
    'resource-stackshot-trigger-reason',
    'resource-stackshot-process-overview',
    'resource-stackshot-top-processes',
    'resource-stackshot-parser-notes',
  ],
  'Stackshot Resource parseInput route returns expected sections'
);
assertExplanationAfterSummary(parseInput(stackshotParserFixture), 'resource-stackshot', 'Stackshot Resource parseInput inserts explanation');
assert.deepEqual(
  withoutExplanationSection(parseInput(stackshotParserFixture)),
  parseResourceStackshot(stackshotParserFixture),
  'Stackshot Resource parseInput route matches direct parser output'
);
assert.deepEqual(
  withoutExplanationSection(parseInput(stackshotParserFixture, { sanitize: false })),
  parseResourceStackshot(stackshotParserFixture, { sanitize: false }),
  'Stackshot Resource raw parseInput route matches direct parser output'
);
assert.doesNotMatch(
  JSON.stringify(parseInput(stackshotParserFixture)),
  stackshotLeakPattern,
  'Stackshot Resource parseInput sanitized output preserves the same privacy boundary'
);
assert.doesNotMatch(
  JSON.stringify(parseInput(stackshotParserFixture, { sanitize: false })),
  stackshotLeakPattern,
  'Stackshot Resource parseInput raw mode remains bounded'
);

const resourcePrivacyCases = [
  {
    label: 'CPU Resource',
    fixture: cpuResourceParserFixture,
    nestedFixture: cpuNestedPrivacyFixture,
    directParser: parseCpuResource,
    leakPattern: cpuResourceLeakPattern,
    nestedLeakPattern: cpuNestedLeakPattern,
    safeSearch: 'DemoCPUApp',
    sensitiveSearches: [
      'REQ-CPU-FICTIONAL-123',
      '11111111-2222-3333-4444-555555555555',
      '/private/var/mobile',
      '/usr/bin/DemoCPUApp',
      '0xfffffff012345678',
      'FICTIONAL-SERIAL-CPU',
      'AA:BB:CC:DD:EE:FF',
      '0x1234567890ABCDEF',
      'VOLUME-FICTIONAL-CPU',
      'CRASHKEY-CPU-123',
    ],
  },
  {
    label: 'Disk Writes Resource',
    fixture: diskWritesParserFixture,
    directParser: parseDiskWritesResource,
    leakPattern: diskWritesLeakPattern,
    safeSearch: 'DemoDiskApp',
    sensitiveSearches: [
      'REQ-DISK-FICTIONAL-123',
      '33333333-4444-5555-6666-777777777777',
      '44444444-5555-6666-7777-888888888888',
      '/private/var/mobile',
      '/private/var/root',
      '0xfffffff012345678',
      'FICTIONAL-SERIAL-DISK',
      'AA:BB:CC:DD:EE:FF',
      '0x1234567890ABCDEF',
      'VOLUME-FICTIONAL-001',
      'CRASHKEY-DISK-123',
      'NESTED-DISK-SENTINEL',
    ],
  },
  {
    label: 'Stackshot Resource',
    fixture: stackshotParserFixture,
    directParser: parseResourceStackshot,
    leakPattern: stackshotLeakPattern,
    safeSearch: 'TriggeredStackApp',
    sensitiveSearches: [
      'REQ-STACK-FICTIONAL-123',
      '55555555-6666-7777-8888-999999999999',
      'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
      '/private/var/mobile',
      '0xfffffff012345678',
      '0xfffffff011111111',
      'FICTIONAL-SERIAL-STACK',
      'AA:BB:CC:DD:EE:FF',
      '0x1234567890ABCDEF',
      'VOLUME-FICTIONAL-STACK',
      'CRASHKEY-STACK-123',
      'NESTED-STACKSHOT-SENTINEL',
      '_sensitiveFrameSymbol',
    ],
  },
];

for (const resourceCase of resourcePrivacyCases) {
  const directSanitizedSections = resourceCase.directParser(resourceCase.fixture);
  const routedSanitizedSections = parseInput(resourceCase.fixture);
  const directRawSections = resourceCase.directParser(resourceCase.fixture, { sanitize: false });
  const routedRawSections = parseInput(resourceCase.fixture, { sanitize: false });

  assert.doesNotMatch(
    JSON.stringify(directSanitizedSections),
    resourceCase.leakPattern,
    `${resourceCase.label} direct sanitized output does not expose sensitive resource values`
  );
  assert.doesNotMatch(
    JSON.stringify(routedSanitizedSections),
    resourceCase.leakPattern,
    `${resourceCase.label} routed sanitized output does not expose sensitive resource values`
  );
  assert.doesNotMatch(
    JSON.stringify(directRawSections),
    resourceCase.leakPattern,
    `${resourceCase.label} direct raw mode stays bounded and does not expose disallowed values`
  );
  assert.doesNotMatch(
    JSON.stringify(routedRawSections),
    resourceCase.leakPattern,
    `${resourceCase.label} routed raw mode stays bounded and does not expose disallowed values`
  );
  assertExplanationDoesNotLeak(
    routedSanitizedSections,
    resourceCase.leakPattern,
    `${resourceCase.label} sanitized explanation output does not expose sensitive resource values`
  );
  assertExplanationDoesNotLeak(
    routedRawSections,
    resourceCase.leakPattern,
    `${resourceCase.label} raw-mode explanation output remains generic`
  );
  assert.doesNotMatch(
    serializeSectionsForCopy(routedSanitizedSections),
    resourceCase.leakPattern,
    `${resourceCase.label} copied visible content does not expose sensitive resource values`
  );
  assertNoSearchMatches(
    routedSanitizedSections,
    resourceCase.sensitiveSearches,
    `${resourceCase.label} sanitized search does not expose sensitive source values`
  );
  assert.ok(
    filterSectionsByQuery(routedSanitizedSections, resourceCase.safeSearch).totalMatches > 0,
    `${resourceCase.label} sanitized search still finds safe parsed values`
  );

  if (resourceCase.nestedFixture) {
    assert.doesNotThrow(
      () => resourceCase.directParser(resourceCase.nestedFixture),
      `${resourceCase.label} parser tolerates nested malformed privacy payloads`
    );
    assert.doesNotMatch(
      JSON.stringify(resourceCase.directParser(resourceCase.nestedFixture)),
      resourceCase.nestedLeakPattern,
      `${resourceCase.label} nested malformed payloads do not stringify into sanitized output`
    );
    assert.doesNotMatch(
      JSON.stringify(parseInput(resourceCase.nestedFixture)),
      resourceCase.nestedLeakPattern,
      `${resourceCase.label} routed nested malformed payloads do not expose source values`
    );
  }
}

const largeRoutedStackshotSections = parseInput(largeStackshotFixture);
const largeRoutedStackshotTable = sectionById(largeRoutedStackshotSections, 'resource-stackshot-top-processes');
assert.equal(largeRoutedStackshotTable.table.length, 100, 'Stackshot routed top process table keeps the 100 row cap');
assert.equal(
  largeRoutedStackshotTable.tableSummary,
  '100 of 150 processes shown',
  'Stackshot routed top process table reports visible and total process counts'
);
assert.equal(
  filterSectionsByQuery(largeRoutedStackshotSections, 'LargeStackProcess0').totalMatches,
  0,
  'Stackshot search cannot find process rows outside the rendered top-process cap'
);
assert.ok(
  filterSectionsByQuery(largeRoutedStackshotSections, 'LargeStackProcess149').totalMatches > 0,
  'Stackshot search can find rendered capped top-process rows'
);
const largeStackshotCopyText = serializeSectionsForCopy(largeRoutedStackshotSections);
assert.doesNotMatch(
  largeStackshotCopyText,
  /LargeStackProcess0/,
  'Stackshot copied content omits process rows outside the rendered cap'
);
assert.match(
  largeStackshotCopyText,
  /LargeStackProcess149/,
  'Stackshot copied content includes rendered top-process rows'
);
assert.doesNotMatch(
  serializeSectionsForCopy(parseInput(stackshotParserFixture)),
  /_sensitiveFrameSymbol|0xfffffff012345678|0xfffffff011111111|0xABCDEF12|0xfffffff087654321/,
  'Stackshot copied content does not include frame symbols or frame addresses'
);

const accessoryCrashSections = parseAccessoryCrash(accessoryCrashParserBody, accessoryCrashParserMetadata);
assert.deepEqual(
  accessoryCrashSections.map((section) => section.id),
  [
    'accessory-crash-summary',
    'accessory-information',
    'accessory-application-information',
    'accessory-crashlog-overview',
    'accessory-panic-fault-notes',
    'accessory-crash-parser-notes',
  ],
  'AccessoryCrash direct parser emits the expected section order'
);
assert.equal(fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Bug Type'), '305');
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Timestamp'),
  '2026-06-28 10:00:00 +0000',
  'AccessoryCrash summary prefers metadata timestamp'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'OS Version'),
  'iPhone OS 27.0 (24A999)',
  'AccessoryCrash summary populates OS version'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Device'),
  'iPhone19,1',
  'AccessoryCrash summary populates device'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Incident ID'),
  '[identifier redacted]',
  'AccessoryCrash summary redacts incident IDs by default'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Crash Log Count'),
  '2',
  'AccessoryCrash summary counts crashlogs'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-summary'), 'Primary Reason'),
  'Fictional accessory watchdog timeout',
  'AccessoryCrash summary extracts a primary reason'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-information'), 'Accessory Type'),
  'AudioAccessory',
  'AccessoryCrash accessory type populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-information'), 'Accessory OS Train'),
  'AccessoryOS 3A',
  'AccessoryCrash accessory OS train populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-information'), 'Accessory OS Version'),
  '3.1.0',
  'AccessoryCrash accessory OS version populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-information'), 'Accessory PID'),
  '4242',
  'AccessoryCrash accessory PID populates'
);
assert.doesNotMatch(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-information'), 'Accessory Machine Config'),
  /FICTIONAL-SERIAL-12345/,
  'AccessoryCrash accessory machine config redacts serial-like values'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-application-information'), 'Process'),
  'DemoHostApp',
  'AccessoryCrash application process populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-application-information'), 'Bundle ID'),
  'com.example.demo-host',
  'AccessoryCrash application bundle ID populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-application-information'), 'Version'),
  '1.2.3',
  'AccessoryCrash application version populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-application-information'), 'Build'),
  '123',
  'AccessoryCrash application build populates'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-application-information'), 'Request ID'),
  '[identifier redacted]',
  'AccessoryCrash application request IDs redact by default'
);
const accessoryCrashlogRows = sectionById(accessoryCrashSections, 'accessory-crashlog-overview').table;
assert.equal(accessoryCrashlogRows.length, 2, 'AccessoryCrash crashlog overview renders representative rows');
assert.deepEqual(
  accessoryCrashlogRows[0],
  {
    index: '1',
    process: 'AccessoryDaemon',
    type: 'firmware-reset',
    reason: 'Fictional accessory watchdog timeout',
    timestamp: '2026-06-28 10:00:02 +0000',
    frames: '2',
  },
  'AccessoryCrash crashlog overview summarizes safe row fields'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-panic-fault-notes'), 'Fault Reason'),
  'Fictional accessory watchdog timeout',
  'AccessoryCrash fault notes extract fault reason'
);
assert.match(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-panic-fault-notes'), 'Panic String'),
  /panic: fictional accessory fault/,
  'AccessoryCrash fault notes extract concise panic string'
);
assert.equal(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-parser-notes'), 'Crashlogs'),
  '2 summarized',
  'AccessoryCrash parser notes summarize crashlog handling'
);
assert.match(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-parser-notes'), 'Privacy'),
  /redacted or omitted/,
  'AccessoryCrash parser notes describe privacy handling'
);
assert.match(
  fieldValue(sectionById(accessoryCrashSections, 'accessory-crash-parser-notes'), 'Raw Payloads'),
  /not rendered/,
  'AccessoryCrash parser notes describe raw payload omission'
);
assert.doesNotMatch(
  JSON.stringify(accessoryCrashSections),
  /11111111-2222-3333-4444-555555555555|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|REQ-FICTIONAL-12345|\/private\/var\/mobile|CRASHLOG-FICTIONAL-001|abcdef12-3456-7890-abcd-ef1234567890|FICTIONAL-SERIAL-12345/,
  'AccessoryCrash sanitized output omits or redacts identifier-heavy values'
);
const rawAccessoryCrashSections = parseAccessoryCrash(accessoryCrashParserBody, accessoryCrashParserMetadata, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawAccessoryCrashSections, 'accessory-crash-summary'), 'Incident ID'),
  '11111111-2222-3333-4444-555555555555',
  'AccessoryCrash raw mode can preserve approved scalar incident ID values'
);
assert.equal(
  fieldValue(sectionById(rawAccessoryCrashSections, 'accessory-application-information'), 'Request ID'),
  'REQ-FICTIONAL-12345',
  'AccessoryCrash raw mode can preserve approved scalar request ID values'
);
assert.doesNotMatch(
  JSON.stringify(rawAccessoryCrashSections),
  /\/private\/var\/mobile|CRASHLOG-FICTIONAL-001|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|abcdef12-3456-7890-abcd-ef1234567890|FICTIONAL-SERIAL-12345/,
  'AccessoryCrash raw mode still avoids paths, nested crashlog identifiers, crashReporterKey, and serial-like values'
);
const accessoryCrashAddressBody = {
  ...accessoryCrashParserBody,
  panicString: 'panic: fictional accessory fault at 0xfffffff012345678 and 0x12345678',
  faultReason: 'Fault near pointer 0xfffffff087654321 and register 0xABCDEF12',
  faultText: 'Concise note references 0x87654321',
};
const accessoryCrashAddressSections = parseAccessoryCrash(accessoryCrashAddressBody, accessoryCrashParserMetadata);
const accessoryCrashAddressText = JSON.stringify(accessoryCrashAddressSections);
assert.doesNotMatch(
  accessoryCrashAddressText,
  /0xfffffff012345678|0x12345678|0xfffffff087654321|0xABCDEF12|0x87654321/i,
  'AccessoryCrash sanitized panic/fault notes redact address-like hex values'
);
assert.match(
  accessoryCrashAddressText,
  /\[address redacted\]/,
  'AccessoryCrash sanitized panic/fault notes retain context with address placeholders'
);
const rawAccessoryCrashAddressText = JSON.stringify(
  parseAccessoryCrash(accessoryCrashAddressBody, accessoryCrashParserMetadata, { sanitize: false })
);
assert.match(rawAccessoryCrashAddressText, /0xfffffff012345678/, 'AccessoryCrash raw mode still preserves panic addresses');
assert.match(rawAccessoryCrashAddressText, /0x12345678/, 'AccessoryCrash raw mode still preserves short address-like values');
const accessoryCrashAddressFixture = [
  JSON.stringify(accessoryCrashParserMetadata),
  JSON.stringify(accessoryCrashAddressBody),
].join('\n');
assert.doesNotMatch(
  JSON.stringify(parseInput(accessoryCrashAddressFixture)),
  /0xfffffff012345678|0x12345678|0xfffffff087654321|0xABCDEF12|0x87654321/i,
  'AccessoryCrash parseInput sanitized output redacts panic/fault address-like values'
);
const hardenedAccessoryCrashSections = parseAccessoryCrash(accessoryCrashPrivacyBody, accessoryCrashParserMetadata);
const hardenedAccessoryCrashText = JSON.stringify(hardenedAccessoryCrashSections);
assert.doesNotMatch(
  hardenedAccessoryCrashText,
  accessoryCrashPrivacyLeakPattern,
  'AccessoryCrash sanitized mode redacts mixed-case keys, identifiers, paths, MACs, ECIDs, chip IDs, nested values, and frame addresses'
);
assert.equal(
  fieldValue(sectionById(hardenedAccessoryCrashSections, 'accessory-application-information'), 'Request ID'),
  '[identifier redacted]',
  'AccessoryCrash mixed-case RequestID redacts by default'
);
assert.equal(
  sectionById(hardenedAccessoryCrashSections, 'accessory-crashlog-overview').table[0].frames,
  '2',
  'AccessoryCrash crashlog frames stay count-only'
);
assert.equal(
  sectionById(hardenedAccessoryCrashSections, 'accessory-crashlog-overview').table[1].process,
  '',
  'AccessoryCrash primitive crashlog entries do not render raw primitive values'
);
const hardenedRawAccessoryCrashSections = parseAccessoryCrash(accessoryCrashPrivacyBody, accessoryCrashParserMetadata, {
  sanitize: false,
});
assert.equal(
  fieldValue(sectionById(hardenedRawAccessoryCrashSections, 'accessory-application-information'), 'Request ID'),
  'REQ-MIXED-67890',
  'AccessoryCrash raw mode can preserve approved scalar mixed-case request IDs'
);
assert.doesNotMatch(
  JSON.stringify(hardenedRawAccessoryCrashSections),
  accessoryCrashRawLeakPattern,
  'AccessoryCrash raw mode still redacts paths, crashlog identifiers, crashReporterKey, serials, MACs, ECIDs, device/accessory IDs, nested identifiers, and frame addresses'
);
const parsedHardenedAccessoryCrashSections = parseInput(accessoryCrashPrivacyFixture);
assert.doesNotMatch(
  JSON.stringify(parsedHardenedAccessoryCrashSections),
  accessoryCrashPrivacyLeakPattern,
  'AccessoryCrash parseInput sanitized output preserves the same hardened privacy boundary'
);
assertExplanationDoesNotLeak(
  parsedHardenedAccessoryCrashSections,
  accessoryCrashPrivacyLeakPattern,
  'AccessoryCrash sanitized explanation output does not expose sensitive values'
);
assertExplanationDoesNotLeak(
  parseInput(accessoryCrashPrivacyFixture, { sanitize: false }),
  accessoryCrashRawLeakPattern,
  'AccessoryCrash raw-mode explanation output remains generic'
);
assert.equal(
  filterSectionsByQuery(parsedHardenedAccessoryCrashSections, 'AA:BB:CC:DD:EE:FF').totalMatches,
  0,
  'AccessoryCrash search sees only parsed sanitized values, not source MAC addresses'
);
assert.doesNotMatch(
  parsedHardenedAccessoryCrashSections.map((section) => serializeSectionForCopy(section)).join('\n'),
  accessoryCrashPrivacyLeakPattern,
  'AccessoryCrash copy serialization sees only parsed sanitized values'
);
const accessoryCrashWithoutNotes = {
  ...accessoryCrashParserBody,
  panicString: '',
  faultReason: '',
  faultText: '',
  reason: '',
};
assert.equal(
  sectionById(parseAccessoryCrash(accessoryCrashWithoutNotes, accessoryCrashParserMetadata), 'accessory-panic-fault-notes'),
  undefined,
  'AccessoryCrash omits panic/fault notes when no concise notes exist'
);
assert.doesNotThrow(
  () => parseAccessoryCrash({ bug_type: '305', crashlogs: { unexpected: true } }, accessoryCrashParserMetadata),
  'AccessoryCrash parser tolerates malformed crashlogs'
);
const malformedAccessoryCrashSections = parseAccessoryCrash(
  { bug_type: '305', crashlogs: { unexpected: true } },
  accessoryCrashParserMetadata
);
assert.deepEqual(
  malformedAccessoryCrashSections.map((section) => section.id),
  ['accessory-crash-summary', 'accessory-crash-parser-notes'],
  'AccessoryCrash malformed crashlogs still emit summary and parser notes'
);
assert.match(
  fieldValue(sectionById(malformedAccessoryCrashSections, 'accessory-crash-parser-notes'), 'Crashlogs'),
  /unavailable or malformed/,
  'AccessoryCrash parser notes mention malformed crashlogs'
);
assert.equal(
  classifyDiagnostic(accessoryCrashParserFixture).supported,
  true,
  'AccessoryCrash classification is supported in Slice 2C'
);
assert.equal(
  classifyDiagnostic(accessoryCrashParserFixture).parserType,
  'accessory-crash',
  'AccessoryCrash classification exposes parserType for routing'
);
assert.equal(
  classifyDiagnostic(accessoryCrashParserFixture).legacyType,
  'accessory-crash',
  'AccessoryCrash classification exposes legacyType for detectFileType compatibility'
);
assert.equal(detectFileType(accessoryCrashParserFixture), 'accessory-crash', 'AccessoryCrash detectFileType compatibility returns routable type in Slice 2C');
const parsedAccessoryCrashSections = parseInput(accessoryCrashParserFixture);
assert.deepEqual(
  parsedAccessoryCrashSections.map((section) => section.id),
  [
    'accessory-crash-summary',
    EXPLANATION_SECTION_ID,
    'accessory-information',
    'accessory-application-information',
    'accessory-crashlog-overview',
    'accessory-panic-fault-notes',
    'accessory-crash-parser-notes',
  ],
  'AccessoryCrash parseInput route returns expected sections'
);
assertExplanationAfterSummary(parsedAccessoryCrashSections, 'accessory-crash', 'AccessoryCrash parseInput inserts explanation');
assert.doesNotMatch(
  JSON.stringify(parsedAccessoryCrashSections),
  /11111111-2222-3333-4444-555555555555|AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE|REQ-FICTIONAL-12345|\/private\/var\/mobile|CRASHLOG-FICTIONAL-001|abcdef12-3456-7890-abcd-ef1234567890|FICTIONAL-SERIAL-12345/,
  'AccessoryCrash parseInput sanitized output omits or redacts identifier-heavy values'
);
const rawParsedAccessoryCrashSections = parseInput(accessoryCrashParserFixture, { sanitize: false });
assert.equal(
  fieldValue(sectionById(rawParsedAccessoryCrashSections, 'accessory-crash-summary'), 'Incident ID'),
  '11111111-2222-3333-4444-555555555555',
  'AccessoryCrash parseInput raw mode preserves approved scalar incident ID values'
);
assert.equal(
  fieldValue(sectionById(rawParsedAccessoryCrashSections, 'accessory-application-information'), 'Request ID'),
  'REQ-FICTIONAL-12345',
  'AccessoryCrash parseInput raw mode preserves approved scalar request ID values'
);
assertClassification(
  '',
  {
    type: 'unknown',
    family: 'unknown',
    subtype: 'unknown',
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    bugType: '',
  },
  'classifies empty input as unknown'
);
assertClassification(
  '{"not":"a diagnostic"}',
  {
    type: 'unknown',
    family: 'unknown',
    subtype: 'unknown',
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    bugType: '',
  },
  'classifies malformed or unsupported JSON as unknown'
);

const sensitiveClassificationText = JSON.stringify([
  classifyDiagnostic(accessoryCrashClassificationFixture),
  classifyDiagnostic(diagnosticRequestClassificationFixture),
  classifyDiagnostic(appUsageClassificationFixture),
]);
assert.doesNotMatch(
  sensitiveClassificationText,
  /FICTIONAL-|REQUEST-ID|private\/var|com\.example\.app|fictional-topic/,
  'classification output does not expose raw incident IDs, request IDs, paths, or app usage details'
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
  withoutExplanationSection(ipsSections).slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'IPS Phase 1 core sections remain first'
);
assertExplanationAfterSummary(ipsSections, 'exc-bad-access', 'App Crash parseInput inserts explanation');
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
assert.deepEqual(
  getCopyMetadata({ id: 'plain-table', title: 'Plain', table: plainTableRows }),
  {
    visibleRows: 3,
    totalRows: 3,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes all visible section content.',
  },
  'copy metadata describes plain tables as fully visible'
);
assert.deepEqual(
  getCopyMetadata({ id: 'process-table', table: sixtyProcessRows }),
  {
    visibleRows: 50,
    totalRows: 60,
    allRowsVisible: false,
    limitedRows: true,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes visible rows only.',
  },
  'copy metadata matches default process-table row limits'
);
assert.deepEqual(
  getCopyMetadata(
    { id: 'process-table', table: sixtyProcessRows },
    { denseTableState: { rowLimits: { 'process-table': 55 } } }
  ),
  {
    visibleRows: 55,
    totalRows: 60,
    allRowsVisible: false,
    limitedRows: true,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes visible rows only.',
  },
  'copy metadata matches Show more process-table row state'
);
assert.deepEqual(
  getCopyMetadata(
    { id: 'process-table', table: sixtyProcessRows },
    { denseTableState: { rowLimits: { 'process-table': 60 } } }
  ),
  {
    visibleRows: 60,
    totalRows: 60,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes all visible section content.',
  },
  'copy metadata matches Show all process-table row state'
);
assert.deepEqual(
  getCopyMetadata({ id: 'loaded-kexts', table: sixtyProcessRows }),
  {
    visibleRows: 0,
    totalRows: 60,
    allRowsVisible: false,
    limitedRows: false,
    collapsedRows: true,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy omits collapsed rows.',
  },
  'copy metadata matches collapsed loaded-kext tables'
);
assert.deepEqual(
  getCopyMetadata(
    { id: 'loaded-kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: { 'loaded-kexts': true } } }
  ),
  {
    visibleRows: 60,
    totalRows: 60,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes all visible section content.',
  },
  'copy metadata matches expanded loaded-kext tables'
);
assert.deepEqual(
  getCopyMetadata(sectionById(fullIpsSections, 'all-threads'), { allSections: fullIpsSections }),
  {
    visibleRows: 2,
    totalRows: 3,
    allRowsVisible: false,
    limitedRows: false,
    collapsedRows: true,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes expanded thread groups only.',
  },
  'copy metadata matches collapsed All Threads groups'
);
assert.deepEqual(
  getCopyMetadata(sectionById(fullIpsSections, 'all-threads'), {
    allSections: fullIpsSections,
    denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': true } },
  }),
  {
    visibleRows: 3,
    totalRows: 3,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes all visible section content.',
  },
  'copy metadata matches expanded All Threads groups'
);
assert.deepEqual(
  getCopyMetadata(null),
  {
    visibleRows: 0,
    totalRows: 0,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    knownSourceRecordTotal: 0,
    note: 'Copy includes all visible section content.',
  },
  'copy metadata handles malformed input without throwing'
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
assert.deepEqual(
  getSearchMetadata(inactiveSearch, fullIpsSections),
  {
    searchActive: false,
    query: '',
    matchCount: 0,
    searchedSectionCount: 0,
    searchedTableRowCount: 0,
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    hasCappedTables: false,
    knownSourceRecordTotal: 0,
    scopeNote: '',
  },
  'search metadata reports stable inactive state'
);
assert.deepEqual(
  getSearchMetadata(uikitSearch, fullIpsSections),
  {
    searchActive: true,
    query: 'uikitcore',
    matchCount: uikitSearch.totalMatches,
    searchedSectionCount: fullIpsSections.length,
    searchedTableRowCount: fullIpsSections.reduce((total, section) => total + (section.table?.length ?? 0), 0),
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    hasCappedTables: false,
    knownSourceRecordTotal: 0,
    scopeNote: 'Search covers parsed output.',
  },
  'search metadata describes normal parsed-output search scope'
);
assert.deepEqual(
  getSearchMetadata(noSearchMatches, fullIpsSections),
  {
    searchActive: true,
    query: 'definitely-not-present',
    matchCount: 0,
    searchedSectionCount: fullIpsSections.length,
    searchedTableRowCount: fullIpsSections.reduce((total, section) => total + (section.table?.length ?? 0), 0),
    renderedRowsOnly: false,
    cappedCoreAnalytics: false,
    hasCappedTables: false,
    knownSourceRecordTotal: 0,
    scopeNote: 'Search covers parsed output.',
  },
  'search metadata describes no-match searches without treating them as inactive'
);
const searchMetadataBefore = JSON.stringify(fullIpsSections);
getSearchMetadata(uikitSearch, fullIpsSections);
assert.equal(JSON.stringify(fullIpsSections), searchMetadataBefore, 'search metadata does not mutate input sections');

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
assert.match(mainScriptText, /getSearchMetadata/, 'main app computes search scope metadata');
assert.match(mainScriptText, /getSearchMetadata\(searchResult, appState\.sections, \{ coreAnalyticsView \}\)/, 'search metadata uses current search results, original sections, and CoreAnalytics view');
assert.match(mainScriptText, /renderSearchControls\(searchMetadata, hasParsedSections\)/, 'search controls receive metadata instead of raw search-result wording');
assert.match(mainScriptText, /statusMessageForSearch\(searchMetadata\)/, 'search status text is derived from metadata');
assert.match(mainScriptText, /Search and copy operate on rendered capped rows only\./, 'CoreAnalytics capped search wording is available in status text');
assert.match(mainScriptText, /Some source records are not rendered\./, 'large rendered-row search wording is available in status text');
assert.match(renderAppSource, /renderCoreAnalyticsOverview/, 'results rendering can prepend the CoreAnalytics overview without mutating sections');
assert.match(renderAppSource, /searchActive:\s*options\.searchActive === true/, 'CoreAnalytics overview receives search-active state from render options');
assert.match(renderSectionText, /getCopyMetadata/, 'render path computes copy metadata for feedback');
assert.match(renderSectionText, /copyFeedbackText\(copyMetadata\)/, 'copy success feedback is derived from copy metadata');
assert.match(renderSectionText, /Copied visible section content\./, 'copy feedback reports full visible section copy');
assert.match(renderSectionText, /Copied visible rows only\./, 'copy feedback reports visible-row-only copy');
assert.match(renderSectionText, /Copy failed\. Select and copy manually\./, 'copy failure feedback remains unchanged');
assert.match(renderSectionText, /Search and copy operate on rendered capped rows only\./, 'copy feedback includes capped CoreAnalytics wording');
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
  withoutExplanationSection(fullIpsSections).map((section) => section.id),
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
  withoutExplanationSection(crashSections).slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'legacy crash Phase 1 core sections remain first'
);
assertExplanationAfterSummary(crashSections, 'exc-bad-access', 'Legacy Crash parseInput inserts explanation');
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'Version'), '2.1.4 (318)');
assert.equal(fieldValue(sectionById(crashSections, 'exception'), 'Termination Reason'), 'Namespace SIGNAL, Code 11 Segmentation fault: 11');
assert.equal(sectionById(crashSections, 'crashed-thread').table[1].symbol, 'viewDidLoad + 44');

const fullCrashSections = parseInput(fullCrashText);
assert.deepEqual(
  withoutExplanationSection(fullCrashSections).map((section) => section.id),
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
  ['summary', EXPLANATION_SECTION_ID, 'termination', 'main-thread-stackshot'],
  'watchdog stackshot Phase 1 output contains summary, termination, and main thread stackshot'
);
assertExplanationAfterSummary(watchdogSections, 'watchdog', 'Watchdog parseInput inserts explanation');
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
  ['summary', EXPLANATION_SECTION_ID, 'victim', 'process-table', 'system-memory', 'limits'],
  'JetsamEvent includes summary, victim, process table, system memory, and limits'
);
assertExplanationAfterSummary(jetsamSections, 'jetsam', 'Jetsam parseInput inserts explanation');
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
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info', EXPLANATION_SECTION_ID],
  'panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.equal(fieldValue(sectionById(panicSections, EXPLANATION_SECTION_ID), 'Category'), 'System panic report', 'panic-full parseInput appends explanation when no summary section exists');
assert.match(sectionById(panicSections, 'panic-string').raw, /userspace watchdog timeout/);
assert.equal(sectionById(panicSections, 'kernel-backtrace').table[0].returnAddress, '0xfffffff007123456');
assert.equal(sectionById(panicSections, 'loaded-kexts').table[0].name, 'com.apple.driver.ExampleKext');

const jsonPanicSections = parseInput(jsonPanicText);
assert.deepEqual(
  jsonPanicSections.map((section) => section.id),
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info', EXPLANATION_SECTION_ID],
  'JSON-wrapped panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.equal(fieldValue(sectionById(jsonPanicSections, EXPLANATION_SECTION_ID), 'Category'), 'System panic report', 'JSON-wrapped panic-full parseInput appends explanation when no summary section exists');
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
const largeCoreAnalyticsSearch = filterSectionsByQuery(largeCoreAnalyticsSections, 'metric-001');
assert.deepEqual(
  getSearchMetadata(largeCoreAnalyticsSearch, largeCoreAnalyticsSections, {
    coreAnalyticsView: getCoreAnalyticsView(largeCoreAnalyticsSections),
  }),
  {
    searchActive: true,
    query: 'metric-001',
    matchCount: largeCoreAnalyticsSearch.totalMatches,
    searchedSectionCount: largeCoreAnalyticsSections.length,
    searchedTableRowCount: largeCoreAnalyticsSections.reduce((total, section) => total + (section.table?.length ?? 0), 0),
    renderedRowsOnly: true,
    cappedCoreAnalytics: true,
    hasCappedTables: true,
    knownSourceRecordTotal: 400,
    scopeNote: 'Search covers rendered capped CoreAnalytics rows only.',
  },
  'search metadata describes capped CoreAnalytics rendered-row search scope'
);
assert.deepEqual(
  getCopyMetadata(sectionById(largeCoreAnalyticsSections, 'coreanalytics-event-types')),
  {
    visibleRows: 100,
    totalRows: 100,
    allRowsVisible: true,
    limitedRows: false,
    collapsedRows: false,
    renderedRowsOnly: true,
    cappedCoreAnalytics: true,
    knownSourceRecordTotal: 200,
    note: 'Copy includes rendered capped CoreAnalytics rows only.',
  },
  'copy metadata describes capped CoreAnalytics tables as rendered rows only'
);

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
