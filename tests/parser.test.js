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
  createComparisonEntry,
  createInitialAppState,
  normalizeComparisonLocalLabel,
  removeComparisonEntry,
  createParsedStatusMessage,
  startNewReportState,
  updateComparisonEntryLocalLabel,
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
import { SEARCH_MATCH_KINDS, filterSectionsByQuery } from '../src/search/filterSections.js';
import { createExactMatchTargets, getExactMatchTargetId, isValidMatchRange } from '../src/search/exactMatch.js';
import { getSearchMetadata } from '../src/search/searchMetadata.js';
import { getCopyMetadata } from '../src/clipboard/copyMetadata.js';
import { downloadTextFile } from '../src/clipboard/downloadText.js';
import {
  serializeSectionForCopy,
  serializeSectionsForExport,
  serializeSectionsForJsonExport,
} from '../src/clipboard/serializeSection.js';
import { getVisibleSectionForCopy } from '../src/clipboard/visibleSection.js';
import {
  findCrashedThreadName,
  getLimitedRows,
  groupRowsByThread,
  isLargeKextTable,
} from '../src/ui/denseTables.js';
import { TABLE_VIEW_MODES, getTableView } from '../src/ui/tableView.js';
import { getCoreAnalyticsFacetOptions, getCoreAnalyticsView, parseTableSummary } from '../src/ui/coreAnalyticsView.js';
import { createSectionNavItems } from '../src/ui/renderSectionNav.js';
import { sanitizeText } from '../src/privacy/sanitize.js';
import {
  EXPLANATION_SECTION_ID,
  createExplanationSection,
  getDiagnosticExplanation,
} from '../src/explanations/diagnosticExplanations.js';
import { createComparisonSections, validateComparison } from '../src/comparison/comparisonModel.js';
import {
  createLargeCoreAnalyticsFixture,
  createLargeStackshotFixture,
  LARGE_CORE_ANALYTICS_EVENT_COUNT,
  LARGE_CORE_ANALYTICS_GROUP_COUNT,
  LARGE_STACKSHOT_PROCESS_COUNT,
} from './fixtures/largeReportWorkloads.js';

const ipsText = await readFile(new URL('./fixtures/example.ips', import.meta.url), 'utf8');
const fullIpsText = await readFile(new URL('./fixtures/example-full.ips', import.meta.url), 'utf8');
const metadataIpsText = await readFile(new URL('./fixtures/example-metadata.ips', import.meta.url), 'utf8');
const visibleSectionSource = await readFile(new URL('../src/clipboard/visibleSection.js', import.meta.url), 'utf8');
const indexHtmlSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const searchSource = await readFile(new URL('../src/search/filterSections.js', import.meta.url), 'utf8');
const exactMatchSource = await readFile(new URL('../src/search/exactMatch.js', import.meta.url), 'utf8');
const searchMetadataSource = await readFile(new URL('../src/search/searchMetadata.js', import.meta.url), 'utf8');
const copyMetadataSource = await readFile(new URL('../src/clipboard/copyMetadata.js', import.meta.url), 'utf8');
const downloadTextSource = await readFile(new URL('../src/clipboard/downloadText.js', import.meta.url), 'utf8');
const serializeSectionSource = await readFile(new URL('../src/clipboard/serializeSection.js', import.meta.url), 'utf8');
const renderAppSource = await readFile(new URL('../src/ui/renderApp.js', import.meta.url), 'utf8');
const renderCoreAnalyticsOverviewSource = await readFile(new URL('../src/ui/renderCoreAnalyticsOverview.js', import.meta.url), 'utf8');
const coreAnalyticsViewSource = await readFile(new URL('../src/ui/coreAnalyticsView.js', import.meta.url), 'utf8');
const renderSectionSource = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const parserIndexSource = await readFile(new URL('../src/parsers/index.js', import.meta.url), 'utf8');
const diagnosticExplanationsSource = await readFile(new URL('../src/explanations/diagnosticExplanations.js', import.meta.url), 'utf8');
const comparisonModelSource = await readFile(new URL('../src/comparison/comparisonModel.js', import.meta.url), 'utf8');
const largeWorkloadSource = await readFile(new URL('./fixtures/largeReportWorkloads.js', import.meta.url), 'utf8');
const browserHarnessSource = await readFile(new URL('./browserPerformanceHarness.html', import.meta.url), 'utf8');
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
const renderSectionNavSource = await readFile(new URL('../src/ui/renderSectionNav.js', import.meta.url), 'utf8');
const workspaceNavigationSource = await readFile(new URL('../src/ui/workspaceNavigation.js', import.meta.url), 'utf8');
const appStateSource = await readFile(new URL('../src/appState.js', import.meta.url), 'utf8');
const renderSectionText = await readFile(new URL('../src/ui/renderSection.js', import.meta.url), 'utf8');
const styleText = await readFile(new URL('../styles/main.css', import.meta.url), 'utf8');
const tokenStyleText = await readFile(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const reportContentStyleText = await readFile(new URL('../styles/report-content.css', import.meta.url), 'utf8');
const manifest = JSON.parse(manifestText);
const precacheBody = serviceWorkerText.match(/const PRECACHE_URLS = \[(?<body>[^]*?)\];/)?.groups?.body ?? '';
const precacheUrls = [...precacheBody.matchAll(/'([^']+)'/g)].map((match) => match[1]);

assert.match(indexHtmlText, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, 'viewport supports mobile Safari safe-area rendering without disabling zoom');
assert.match(indexHtmlText, /<link rel="manifest" href=".\/manifest.webmanifest">/, 'page links the manifest with a GitHub Pages-safe relative path');
assert.match(indexHtmlText, /<link rel="apple-touch-icon" href=".\/icons\/apple-touch-icon.png">/, 'page links the Apple touch icon with a GitHub Pages-safe relative path');
assert.match(indexHtmlText, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/, 'page includes a keyboard skip link to main content');
assert.match(indexHtmlText, /<main id="main-content" class="app-shell">/, 'main content exposes a stable skip-link target');
assert.match(indexHtmlText, /<meta name="color-scheme" content="light dark">/, 'page advertises production light and dark color schemes');
assert.match(indexHtmlText, /<link rel="stylesheet" href="\.\/styles\/main\.css">\s*<link rel="stylesheet" href="\.\/styles\/report-content\.css">/, 'report content styles load after the frozen shell foundation');
assert.match(indexHtmlText, /name="theme-color" content="#f5f5f7" media="\(prefers-color-scheme: light\)"/, 'light browser chrome follows the approved canvas token');
assert.match(indexHtmlText, /name="theme-color" content="#000000" media="\(prefers-color-scheme: dark\)"/, 'dark browser chrome follows the approved canvas token');
assert.match(indexHtmlText, /<header id="import-intro" class="intro">[^]*<p class="app-identity">iOS Analytics File Parser<\/p>[^]*<h1>Inspect iOS diagnostic reports with clarity\.<\/h1>/, 'calm import state keeps application identity and one logical h1 in a semantic header');
assert.match(indexHtmlText, /Reports stay on this device\. Nothing is uploaded, tracked, or saved\./, 'import state states the local-only privacy assurance in plain text');
assert.match(indexHtmlText, /Supports selected \.ips, \.crash, \.ips\.ca\.synced, panic-full,\s+JetsamEvent, and analytics text reports up to 20 MB\./, 'import state presents concise supported-format and size guidance');
assert.match(indexHtmlText, /<details id="import-options" class="import-options">[^]*<summary>Paste text or use an example<\/summary>/, 'paste and example routes are grouped as restrained secondary import options');
assert.doesNotMatch(indexHtmlText, /trusted by|\d+[,+]?\d* users|AI-powered|testimonial|customer logo/i, 'import state contains no invented metrics, claims, testimonials, or marketing proof');
assert.match(indexHtmlText, /<div class="workspace-shell">\s*<nav id="section-nav"[^]*<section class="results workspace-content" aria-label="Report workspace">/, 'workspace shell keeps navigation before report content in DOM order');
assert.match(indexHtmlText, /id="workspace-heading" tabindex="-1">Inspector workspace<\/h2>/, 'workspace exposes a focusable orientation heading after successful parsing');
assert.match(indexHtmlText, /id="sections-trigger"[^>]*aria-haspopup="dialog"[^>]*aria-controls="section-dialog"[^>]*hidden/, 'tablet and mobile navigation use a labeled native-dialog trigger');
assert.match(indexHtmlText, /<dialog id="section-dialog"[^>]*aria-labelledby="section-dialog-title"[^>]*aria-describedby="section-dialog-description">/, 'section sheet uses native dialog semantics with a title and description');
assert.match(indexHtmlText, /id="section-dialog-close"[^>]*>Close<\/button>/, 'section dialog includes an explicit close control');
assert.match(indexHtmlText, /id="mobile-section-nav"[^>]*aria-label="Report sections"/, 'section dialog includes a named navigation landmark');
assert.match(indexHtmlText, /<section class="workspace-controls" aria-label="Workspace controls and status">/, 'workspace controls and status expose a named region');
assert.match(styleText, /^@import url\("\.\/tokens\.css"\);/, 'production stylesheet loads the dedicated token foundation first');
assert.doesNotMatch(`${indexHtmlText}\n${styleText}\n${mainScriptText}`, /Prototype review controls|scenario-select|theme-select|ORCHID-LOCK-7391/, 'production shell excludes prototype-only review controls and synthetic helper data');
assert.match(indexHtmlText, /<input id="file-input" type="file" aria-label="Choose report file" aria-describedby="input-help status">/, 'file picker has an explicit accessible name and linked help/error status without extension filters');
assert.doesNotMatch(indexHtmlText, /id="file-input"[^>]*accept=/, 'file picker has no accept attribute that could grey out .ips files on Safari');
assert.match(indexHtmlText, /Install for quick access\. Installation saves the app shell, not\s+your reports\./, 'install guidance clarifies reports are not saved');
assert.match(indexHtmlText, /On iPhone or iPad, tap Share, then Add to Home Screen\./, 'install guidance includes iPhone and iPad Add to Home Screen steps');
assert.match(indexHtmlText, /<div id="offline-status" class="offline-status" role="status" aria-live="polite" hidden><\/div>/, 'offline status supports accessible text and actions');
assert.match(indexHtmlText, /id="privacy-toggle"[^>]*aria-describedby="privacy-mode-label"/, 'privacy toggle is associated with the current privacy mode label');
assert.match(indexHtmlText, /id="result-search"[^>]*aria-describedby="search-count"/, 'search input is associated with calm search status text');
assert.match(indexHtmlText, /<div id="search-navigation" class="search-navigation" role="group" aria-labelledby="search-navigation-label" hidden>/, 'search navigation starts hidden in a labeled group');
assert.match(indexHtmlText, /id="search-navigation-label"[^>]*>Search result navigation</, 'search navigation group has a clear accessible label');
assert.match(indexHtmlText, /id="search-previous"[^>]*aria-label="Previous matching section"[^>]*disabled[^>]*>Previous</, 'Previous uses a native disabled button with an accessible name');
assert.match(indexHtmlText, /id="search-position"[^>]*>Search navigation inactive\.</, 'search navigation exposes an inactive position status');
assert.match(indexHtmlText, /id="search-next"[^>]*aria-label="Next matching section"[^>]*disabled[^>]*>Next</, 'Next uses a native disabled button with an accessible name');
assert.match(indexHtmlText, /id="exact-match-navigation"[^>]*role="group"[^>]*aria-labelledby="exact-match-navigation-label"[^>]*hidden/, 'exact-match navigation starts hidden in a labeled group');
assert.match(indexHtmlText, /id="exact-match-navigation-label"[^>]*>Exact-match navigation</, 'exact-match navigation has a distinct accessible label');
assert.match(indexHtmlText, /id="exact-match-previous"[^>]*aria-label="Previous exact match"[^>]*disabled[^>]*>Previous exact match</, 'Previous exact match is a native disabled button with a distinct accessible name');
assert.match(indexHtmlText, /id="exact-match-next"[^>]*aria-label="Next exact match"[^>]*disabled[^>]*>Next exact match</, 'Next exact match is a native disabled button with a distinct accessible name');
assert.match(indexHtmlText, /id="exact-match-status"[^>]*role="status"[^>]*aria-live="polite"/, 'exact-match movement has a scoped live status');
assert.match(indexHtmlText, /<section id="comparison-panel" class="comparison-panel" aria-labelledby="comparison-title" hidden>/, 'comparison workflow uses a compact labeled region');
assert.match(indexHtmlText, /id="add-to-comparison"[^>]*aria-describedby="comparison-status"[^>]*disabled/, 'Add to comparison starts disabled and references status feedback');
assert.match(indexHtmlText, /id="compare-reports"[^>]*aria-describedby="comparison-status"[^>]*disabled/, 'Compare starts disabled and references status feedback');
assert.match(indexHtmlText, /id="clear-comparison"[^>]*aria-describedby="comparison-status"[^>]*disabled/, 'Clear comparison starts disabled and references status feedback');
assert.match(indexHtmlText, /id="comparison-status"[^>]*role="status"[^>]*aria-live="polite"/, 'comparison workflow exposes calm status announcements');
assert.match(indexHtmlText, /id="download-visible-export"[^>]*aria-describedby="export-status"[^>]*disabled/, 'visible export starts disabled with an accessible status description');
assert.match(indexHtmlText, /id="export-status"/, 'visible export provides a concise scope description');
for (const token of [
  '--color-page',
  '--color-control-surface',
  '--color-content',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-inverse',
  '--color-accent',
  '--color-border-subtle',
  '--color-focus-ring',
  '--color-disabled-foreground',
  '--color-code-surface',
  '--font-ui',
  '--font-technical',
  '--size-touch-target-min',
  '--size-navigation-width',
  '--radius-medium',
  '--elevation-control',
  '--material-background',
  '--motion-state',
]) {
  assert.match(tokenStyleText, new RegExp(`${token}:`), `token foundation defines ${token}`);
}
assert.match(tokenStyleText, /@media \(prefers-color-scheme: dark\)/, 'token foundation maps a complete dark theme from the system preference');
assert.match(tokenStyleText, /--font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;/, 'token foundation uses the approved system font stack without an external font');
assert.match(tokenStyleText, /--font-technical: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;/, 'technical values use a true monospace stack');
assert.match(tokenStyleText, /--size-touch-target-min: 2\.75rem;/, 'touch target foundation remains at least 44 CSS pixels at the default root size');
assert.doesNotMatch(tokenStyleText, /https?:|@font-face|fonts\.googleapis/, 'token foundation adds no external font or network resource');
assert.match(styleText, /\.workspace-shell:has\(> \.section-nav:not\(\[hidden\]\)\)\s*\{[^]*grid-template-columns: var\(--size-navigation-width\) minmax\(0, 1fr\)/, 'desktop shell establishes the approved navigation and content regions');
assert.match(styleText, /@media \(prefers-reduced-transparency: reduce\)/, 'shell includes a reduced-transparency fallback');
assert.match(styleText, /@media \(prefers-contrast: more\)/, 'shell includes an increased-contrast fallback');
assert.match(styleText, /@media \(forced-colors: active\)/, 'shell includes forced-colors behavior');
assert.match(styleText, /@supports \(\s*\(backdrop-filter: blur\(1px\)\) or\s*\(-webkit-backdrop-filter: blur\(1px\)\)\s*\)/, 'restrained material enhancement is feature-detected');
const materialEnhancement = styleText.slice(styleText.indexOf('@supports ('), styleText.indexOf('@media (min-width: 24.375rem)'));
assert.match(materialEnhancement, /\.section-nav,\s*\.search-panel/, 'material enhancement is limited to navigation and search control chrome');
assert.doesNotMatch(materialEnhancement, /\.section-card|\.frame-table|\.chart|\.comparison-panel|\.input-panel|\.status/, 'material enhancement excludes report, table, chart, comparison, form, and status content');
assert.doesNotMatch(styleText, /linear-gradient|radial-gradient|conic-gradient/, 'production shell does not introduce decorative gradients');
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
    backgroundColor: '#f5f5f7',
    themeColor: '#f5f5f7',
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
assert.match(serviceWorkerText, /index\.html, styles\/tokens\.css, styles\/main\.css, styles\/report-content\.css, src modules, examples,/, 'service worker cache reminder lists all production stylesheets');
assert.match(serviceWorkerText, /v2\.0\.0-slice20d-report-content-2026-07-16/, 'service worker cache version reflects the Slice 20D report content update');
assert.ok(precacheUrls.includes('./styles/tokens.css'), 'service worker precaches the production token foundation');
assert.ok(precacheUrls.includes('./styles/report-content.css'), 'service worker precaches the production report content stylesheet');
assert.ok(precacheUrls.includes('./src/ui/workspaceNavigation.js'), 'service worker precaches the focused workspace navigation helper');
assert.match(serviceWorkerText, /\.\/src\/search\/exactMatch\.js/, 'service worker precaches the exact-match helper');
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
assert.match(serviceWorkerText, /\.\/src\/comparison\/comparisonModel\.js/, 'service worker precaches the comparison model');
assert.match(serviceWorkerText, /\.\/src\/clipboard\/downloadText\.js/, 'service worker precaches the visible export download helper');
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
assert.match(mainScriptText, /createWorkspaceNavigation\(\{[^]*desktopNav: sectionNavElement[^]*mobileNav: mobileSectionNav[^]*dialog: sectionDialog/, 'main app wires one navigation controller to desktop and mobile surfaces');
assert.match(mainScriptText, /pendingWorkspaceFocus = sections\.length > 0;/, 'successful parsing schedules workspace-entry focus only when visible sections exist');
assert.match(mainScriptText, /if \(pendingWorkspaceFocus && hasParsedSections\)[^]*workspaceHeading\.focus\(\{ preventScroll: true \}\)/, 'scheduled workspace-entry focus targets the workspace heading after rendering');
assert.match(mainScriptText, /workspaceShell\.hidden = !hasParsedSections && appState\.statusTone !== 'error'/, 'initial state hides empty workspace chrome while parse errors remain recoverable');
assert.match(mainScriptText, /importIntro\.scrollIntoView\(\{ block: 'start' \}\);\s*fileInput\.focus\(\{ preventScroll: true \}\);/, 'Clear Report returns focus to the primary import action');
assert.match(workspaceNavigationSource, /dialog\.showModal\(\)/, 'mobile Sections control opens a native modal dialog');
assert.match(workspaceNavigationSource, /closeButton\.addEventListener\('click', \(\) => dialog\.close\(\)\)/, 'mobile section dialog explicit close uses the native close path');
assert.match(workspaceNavigationSource, /if \(event\.key !== 'Escape'\) return;[^]*event\.preventDefault\(\);[^]*dialog\.close\(\)/, 'mobile section dialog supports an explicit Escape close path');
assert.match(workspaceNavigationSource, /dialog\.addEventListener\('close'[^]*if \(!trigger\.hidden\) trigger\.focus\(\)/, 'dialog close and Escape return focus to the invoking control');
assert.match(workspaceNavigationSource, /if \(desktopMedia\.matches && dialog\.open\)[^]*focusDesktopAfterClose = true;[^]*dialog\.close\(\)/, 'open mobile navigation closes safely when the viewport crosses to desktop');
assert.match(workspaceNavigationSource, /suppressFocusReturn = true;[^]*dialog\.close\(\);[^]*const nextFocus = trigger\.hidden \? fallbackFocus : trigger;[^]*nextFocus\?\.focus\(\)/, 'content replacement closes mobile navigation without leaving focus on a control that becomes hidden');
assert.match(workspaceNavigationSource, /observer\?\.disconnect\(\);[^]*new IntersectionObserver/, 'section replacement disconnects stale observers before active-section tracking restarts');
assert.match(workspaceNavigationSource, /rootMargin: '-12% 0px -68% 0px'/, 'active-section tracking uses a bounded observation zone rather than a raw scroll handler');
assert.doesNotMatch(workspaceNavigationSource, /addEventListener\(['"]scroll|setInterval|innerHTML|localStorage|sessionStorage|fetch\(/, 'navigation adds no continuous scroll handler, unsafe HTML, persistence, or network behavior');
assert.match(renderSectionNavSource, /aria-current', 'location'/, 'section navigation exposes the current location with appropriate semantics');
assert.match(mainScriptText, /getUnsupportedDiagnosticMessage\(classification\)/, 'main app uses safe recognized-unsupported diagnostic messages');
assert.match(mainScriptText, /import \{ createComparisonSections, validateComparison \} from '\.\/comparison\/comparisonModel\.js';/, 'main app reuses the pure comparison model');
assert.match(mainScriptText, /import \{ downloadTextFile \} from '\.\/clipboard\/downloadText\.js';/, 'main app delegates downloads to the focused text-download helper');
assert.match(mainScriptText, /serializeSectionsForExport/, 'main app reuses the visible export serializer');
assert.match(mainScriptText, /serializeSectionsForJsonExport/, 'main app reuses the structured JSON export serializer');
assert.match(mainScriptText, /getVisibleSectionForCopy/, 'main app reuses existing table visibility for export');
assert.doesNotMatch(mainScriptText, /getTableView/, 'main app does not introduce a second table-visibility pipeline for export');
assert.match(mainScriptText, /!comparisonMode && \(!appState\.sanitize/, 'Raw Local View never produces export content');
assert.match(mainScriptText, /comparisonEntries\.length > 0 && !validateComparison\(comparisonEntries\)\.valid/, 'incomplete comparison selection never produces export content');
assert.match(mainScriptText, /downloadVisibleExportButton\.disabled = !hasEligibleSections \|\| !exportText/, 'text export disables when no eligible output exists');
assert.match(mainScriptText, /downloadVisibleJsonButton\.disabled = !hasEligibleSections \|\| !exportJson/, 'JSON export disables when no eligible output exists');
assert.match(mainScriptText, /comparisonMode \? 'ios-diagnostic-comparison\.txt' : 'ios-diagnostic-export\.txt'/, 'visible export uses generic filenames only');
assert.match(mainScriptText, /comparisonMode \? 'ios-diagnostic-comparison\.json' : 'ios-diagnostic-export\.json'/, 'structured JSON export uses generic filenames only');
assert.match(mainScriptText, /mimeType: 'application\/json;charset=utf-8'/, 'structured JSON export uses the JSON Blob MIME type');
assert.match(indexHtmlSource, /id="download-visible-json"[^>]*disabled[^>]*>Download sanitized JSON/, 'index exposes an accessible disabled JSON export action');
assert.doesNotMatch(downloadTextSource, /(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|navigator\.clipboard)/, 'visible export download helper has no network, persistence, or clipboard behavior');
assert.doesNotMatch(serializeSectionSource, /(?:document|window|scroll)/, 'visible export serialization is independent of DOM viewport and scroll state');
assert.match(mainScriptText, /let comparisonEntries = \[\];[^]*let comparisonSections = \[\];[^]*let comparisonMode = false;/, 'comparison state remains separate from single-report app state');
assert.match(mainScriptText, /parseInput\(appState\.sourceText, \{ sanitize: true \}\)/, 'Add to comparison always reparses sanitized sections');
assert.match(mainScriptText, /validateComparison\(comparisonEntries\)[^]*compareReportsButton\.disabled = !validation\.valid;/, 'Compare enablement delegates to comparison validation');
assert.match(mainScriptText, /comparisonEntries\.length >= 3/, 'comparison workflow enforces the three-report limit');
assert.match(mainScriptText, /comparisonSections = createComparisonSections\(comparisonEntries\)/, 'Compare delegates section generation to the pure comparison model');
assert.match(mainScriptText, /function removeComparisonReport\(index\)/, 'comparison workflow supports removing reports');
assert.match(mainScriptText, /createComparisonEntry\(\{/, 'comparison entries use the shared identity initializer');
assert.match(mainScriptText, /updateComparisonEntryLocalLabel\(comparisonEntries, index,/, 'local-label input updates the selected comparison entry through the frozen state helper');
assert.match(mainScriptText, /Local label for Report \$\{index \+ 1\}/, 'local-label inputs use positional accessible names');
assert.match(mainScriptText, /Optional local label - stays on this device and is not included in exports\./, 'local-label help text states the privacy boundary');
assert.match(mainScriptText, /placeholder = 'e\.g\. Before Update'/, 'local-label inputs use a generic example placeholder');
assert.match(mainScriptText, /localLabelInput\.setAttribute\('aria-describedby', helpId\)/, 'local-label inputs reference their privacy help text');
assert.match(mainScriptText, /Remove Report \$\{index \+ 1\} from comparison/, 'remove controls identify their comparison slot');
assert.match(mainScriptText, /Comparison supports up to three reports\./, 'comparison setup exposes the maximum-report feedback');
assert.match(mainScriptText, /Add one or two more reports of the same type to compare\./, 'one-report setup explains the remaining eligibility');
assert.match(mainScriptText, /Selected reports must use the same parser type\./, 'mixed-parser setup explains the compatibility rule');
assert.match(mainScriptText, /focusComparisonEntry\(/, 'comparison removal restores focus through the existing DOM focus path');
assert.match(mainScriptText, /comparisonEntries = \[\];\s+comparisonMessage = 'No reports added\.';/, 'full report clear discards comparison identity state');
assert.match(mainScriptText, /function clearComparison\(\)[^]*comparisonEntries = \[\][^]*comparisonMessage = 'Comparison cleared\.';/, 'clear comparison discards local-label state and reports completion');
assert.match(mainScriptText, /function clearComparison\(\)/, 'comparison workflow supports clearing comparison state');
assert.match(mainScriptText, /const activeSections = comparisonMode \? comparisonSections : appState\.sections;/, 'renderer, search, and copy share the active SectionModel array');
assert.match(mainScriptText, /privacyPanel\.hidden = comparisonMode \|\| !hasParsedSections;/, 'Raw Local View controls remain unavailable in comparison mode');
assert.match(mainScriptText, /inputPanel\.hidden = comparisonMode;/, 'comparison mode hides the source input panel and its raw report text');
assert.match(
  mainScriptText,
  /Unsupported or unknown report format\. Try a \.ips, \.crash, panic-full, JetsamEvent, or analytics text file\./,
  'main app keeps the generic unknown-format fallback message'
);
assert.match(serviceWorkerText, /\.\/src\/clipboard\/copyMetadata\.js/, 'service worker precaches the copy metadata helper');
assert.match(serviceWorkerText, /\.\/src\/models\/reportSize\.js/, 'service worker precaches report-size helper dependencies');
assert.match(serviceWorkerText, /\.\/src\/ui\/tableView\.js/, 'service worker precaches shared table-view helper dependencies');
assert.doesNotMatch(`${serviceWorkerText}\n${mainScriptText}`, /(?:localStorage|sessionStorage|indexedDB|document\.cookie)/, 'app shell avoids persistent report storage APIs');
assert.doesNotMatch(appStateSource, /(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket)/, 'comparison identity helpers avoid persistence and network APIs');
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
assert.match(renderSectionText, /document\.createElement\('mark'\)/, 'exact matches render through safe mark elements');
assert.match(renderSectionText, /mark\.textContent = text\.slice\(/, 'match text is assigned as text content rather than interpreted markup');
assert.doesNotMatch(renderSectionText, /innerHTML|outerHTML|innerText/, 'match rendering avoids unsafe HTML-string and DOM-text search techniques');
assert.match(renderSectionText, /canvas\.setAttribute\('role', 'img'\)/, 'canvas chart output has an accessible semantic role');
assert.doesNotMatch(exactMatchSource, /(?:document|window|innerText|textContent|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket)/, 'exact-match target metadata remains pure and DOM-free');
assert.match(browserHarnessSource, /createExactMatchTargets/, 'browser harness derives exact-match targets from the frozen metadata contract');
assert.match(browserHarnessSource, /matchRegions,\s*activeExactMatchId/, 'browser harness renders exact-match metadata through the production renderer path');
assert.match(browserHarnessSource, /exactMatchRenderingWorkflow/, 'browser harness includes a focused exact-match rendering workflow');
assert.match(browserHarnessSource, /visibleSearchContractWorkflow/, 'browser harness covers hidden-only and visible-cell rendering transitions');
assert.match(browserHarnessSource, /applicationWorkflow/, 'browser harness covers live search, report, comparison, Raw Local View, and Clear Report transitions');
assert.match(browserHarnessSource, /mobileNavigation\.modal = sectionDialog\.matches\(':modal'\)/, 'browser harness verifies native modal section navigation at sub-desktop widths');
assert.match(browserHarnessSource, /mobileNavigation\.focusReturned = document\.activeElement === sectionsTrigger/, 'browser harness verifies explicit dialog close returns focus');
assert.match(browserHarnessSource, /mobileNavigation\.replacementClosed = !sectionDialog\.open/, 'browser harness verifies report replacement closes stale mobile navigation');
assert.match(browserHarnessSource, /clearReturnedToImport/, 'browser harness verifies Clear Report returns focus to the import action');
assert.match(browserHarnessSource, /Promise\.race\(\[/, 'browser harness bounds frame settlement when headless animation frames are unavailable');
assert.match(browserHarnessSource, /targetIdsUnique: new Set\(targetIds\)\.size === targetIds\.length/, 'browser harness checks deterministic unique target identities');
assert.match(browserHarnessSource, /hostileImageCount: document\.querySelectorAll\('#sections img'\)\.length/, 'browser harness checks hostile report text does not create image elements');
assert.match(browserHarnessSource, /hostileTextPreserved:/, 'browser harness checks hostile report text remains literal after highlighting');
assert.match(browserHarnessSource, /const comparisonFiltered = filterSectionsByQuery\(comparisonSections, query\)/, 'browser harness exercises exact-match rendering on sanitized comparison sections');
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
assert.match(styleText, /\.search-navigation__button\s*{[^}]*min-height:\s*44px;/s, 'search navigation buttons have practical touch targets');
assert.match(styleText, /\.search-navigation\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/s, 'search navigation wraps safely in the search panel');
assert.match(styleText, /button\s*{[^}]*touch-action:\s*manipulation;/s, 'buttons opt into touch-friendly manipulation behavior');
assert.match(styleText, /\.skip-link\s*{[^}]*transform:\s*translateY\(-160%\);/s, 'skip link is visually hidden until focused');
assert.match(styleText, /\.skip-link\s*{[^}]*min-height:\s*var\(--size-touch-target-min\);/s, 'skip link keeps the shared 44px touch and focus target');
assert.match(styleText, /\.skip-link:focus-visible\s*{[^}]*transform:\s*translateY\(0\);/s, 'skip link becomes visible when focused');
assert.match(styleText, /:focus-visible\s*{[^}]*outline:\s*var\(--border-focus\) solid var\(--color-focus-ring\);/s, 'all keyboard focus uses the shared visible focus foundation');
assert.match(styleText, /@media \(prefers-reduced-motion:\s*reduce\)/, 'reduced-motion users receive motion guardrails');
assert.match(styleText, /\.file-picker span,\s*\.clear-report,\s*\.parse-paste\s*{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s, 'primary input actions share practical touch sizing and alignment');
assert.match(styleText, /\.file-picker:focus-within span\s*{[^}]*outline:\s*var\(--border-focus\) solid var\(--color-focus-ring\);/s, 'visually hidden native file input exposes focus on its visible picker surface');
assert.match(styleText, /\.section-copy__button\s*{[^}]*min-height:\s*44px;/s, 'copy buttons have practical mobile touch targets');
assert.match(styleText, /\.clear-search\s*{[^}]*min-height:\s*44px;/s, 'clear search button has a practical mobile touch target');
assert.match(styleText, /\.exact-match\s*{[^}]*text-decoration:\s*underline;/s, 'non-active matches remain identifiable beyond color');
assert.match(styleText, /\.exact-match--active\s*{[^}]*outline:/s, 'active matches have a stronger non-color focus treatment');
assert.match(styleText, /\.privacy-toggle\s*{[^}]*min-height:\s*44px;/s, 'privacy toggle has a practical mobile touch target');
assert.match(styleText, /\.comparison-button,\s*\.comparison-list__remove\s*{[^}]*min-height:\s*44px;/s, 'comparison controls have practical touch targets');
assert.match(styleText, /\.comparison-list__fields\s*{/, 'comparison entries provide a contained field group for labels and help text');
assert.match(styleText, /\.comparison-list__input\s*{/, 'comparison local labels use a dedicated responsive input style');
assert.match(styleText, /\.comparison-list__input\s*{[^}]*min-height:\s*44px;/s, 'comparison local labels meet the touch-target height');
assert.match(styleText, /@media \(max-width:\s*480px\)[^]*\.comparison-actions\s*{[^}]*flex-direction:\s*column;/s, 'comparison actions stack at narrow mobile widths');
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
  [
    'ips',
    'crash',
    'ips-watchdog-stackshot',
    'jetsam',
    'panic',
    'analytics',
    'coreanalytics',
    'accessory-crash',
    'resource-cpu',
    'resource-diskwrites',
    'resource-stackshot',
  ],
  'production examples cover each supported file type exactly once'
);
assert.equal(new Set(EXAMPLE_REPORTS.map((example) => example.id)).size, 11, 'production example IDs are unique');
assert.equal(new Set(EXAMPLE_REPORTS.map((example) => example.path)).size, 11, 'production example paths are unique');
assert.equal(new Set(EXAMPLE_REPORTS.map((example) => example.label)).size, 11, 'production example labels are unique');
assert.ok(EXAMPLE_REPORTS.every((example) => example.label.trim()), 'production example labels are nonblank');
assert.equal(
  EXAMPLE_REPORTS.slice(6).map((example) => example.path).join('|'),
  [
    './examples/coreanalytics.ips.ca.synced',
    './examples/accessory-crash.ips',
    './examples/cpu-resource.ips',
    './examples/disk-writes-resource.ips',
    './examples/stackshot-resource.ips',
  ].join('|'),
  'new production examples preserve deterministic supported-family ordering and approved paths'
);
assert.deepEqual(
  EXAMPLE_REPORTS.filter((example) => example.type.startsWith('resource-') || example.type === 'coreanalytics' || example.type === 'accessory-crash')
    .map((example) => example.type),
  ['coreanalytics', 'accessory-crash', 'resource-cpu', 'resource-diskwrites', 'resource-stackshot'],
  'manifest contains the five newly integrated supported resource and analytics families'
);
assert.ok(
  EXAMPLE_REPORTS.every((example) => !/tests[\\/]fixtures/.test(example.path)),
  'production manifest does not reference test fixtures'
);
const parsedProductionExamples = [];
for (const example of EXAMPLE_REPORTS) {
  assert.match(example.path, /^\.\/examples\//, 'production example files live in examples/');
  assert.doesNotMatch(example.path, /tests\/fixtures/, 'production UI does not load test fixtures');
  assert.match(example.sourceLabel, /^Example: /, 'production examples use explicit source labels');
  assert.doesNotMatch(example.label, /\d{4}-\d{2}-\d{2}|UUID|[0-9A-F]{8}-[0-9A-F-]{27}/i, 'production example labels do not expose report-derived metadata');

  const exampleText = await readFile(new URL(`../${example.path.slice(2)}`, import.meta.url), 'utf8');
  assert.equal(detectFileType(exampleText), example.type, `${example.label} production example detects correctly`);
  const sections = parseInput(exampleText);
  assert.ok(sections.length > 0, `${example.label} production example parses into sections`);
  parsedProductionExamples.push({ example, sourceText: exampleText, sections });
  assert.match(serviceWorkerText, new RegExp(example.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${example.label} is explicitly precached`);
}

const NEW_PRODUCTION_EXAMPLE_CONTRACTS = [
  {
    label: 'CoreAnalytics',
    path: './examples/coreanalytics.ips.ca.synced',
    type: 'coreanalytics',
    sectionIds: [
      'coreanalytics-summary',
      'coreanalytics-configuration',
      'coreanalytics-record-overview',
      'coreanalytics-event-types',
      'coreanalytics-sample-records',
      'coreanalytics-parser-notes',
    ],
    expectedFields: [
      ['coreanalytics-summary', 'Bug Type', '211'],
      ['coreanalytics-summary', 'Incident ID', '[identifier redacted]'],
    ],
    expectedRow: ['coreanalytics-event-types', 'message', 'demo.launch'],
  },
  {
    label: 'AccessoryCrash',
    path: './examples/accessory-crash.ips',
    type: 'accessory-crash',
    sectionIds: [
      'accessory-crash-summary',
      EXPLANATION_SECTION_ID,
      'accessory-information',
      'accessory-crashlog-overview',
      'accessory-panic-fault-notes',
      'accessory-crash-parser-notes',
    ],
    expectedFields: [
      ['accessory-crash-summary', 'Bug Type', '305'],
      ['accessory-crash-summary', 'Device', 'DemoPhone'],
    ],
    expectedRow: ['accessory-crashlog-overview', 'process', 'DemoAccessoryHost'],
  },
  {
    label: 'CPU Resource',
    path: './examples/cpu-resource.ips',
    type: 'resource-cpu',
    sectionIds: [
      'resource-cpu-summary',
      EXPLANATION_SECTION_ID,
      'resource-cpu-process-info',
      'resource-cpu-usage',
      'resource-cpu-limits',
      'resource-cpu-parser-notes',
    ],
    expectedFields: [
      ['resource-cpu-summary', 'Bug Type', '202'],
      ['resource-cpu-usage', 'CPU Used', '94%'],
    ],
  },
  {
    label: 'Disk Writes Resource',
    path: './examples/disk-writes-resource.ips',
    type: 'resource-diskwrites',
    sectionIds: [
      'resource-diskwrites-summary',
      EXPLANATION_SECTION_ID,
      'resource-diskwrites-process-info',
      'resource-diskwrites-usage',
      'resource-diskwrites-limits',
      'resource-diskwrites-parser-notes',
    ],
    expectedFields: [
      ['resource-diskwrites-summary', 'Bug Type', '142'],
      ['resource-diskwrites-usage', 'Logical Writes', '128 MB'],
    ],
  },
  {
    label: 'Stackshot Resource',
    path: './examples/stackshot-resource.ips',
    type: 'resource-stackshot',
    sectionIds: [
      'resource-stackshot-summary',
      EXPLANATION_SECTION_ID,
      'resource-stackshot-trigger-reason',
      'resource-stackshot-process-overview',
      'resource-stackshot-top-processes',
      'resource-stackshot-parser-notes',
    ],
    expectedFields: [
      ['resource-stackshot-summary', 'Bug Type', '288'],
      ['resource-stackshot-summary', 'Process Count', '2'],
    ],
    expectedRow: ['resource-stackshot-top-processes', 'process', 'DemoForegroundApp'],
  },
];
const forbiddenProductionExamplePattern =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{2}(?::[0-9a-f]{2}){5}|(?:C:\\Users\\|\/Users\/|\/private\/var\/|\/var\/mobile\/|file:\/\/\/)|\b0x[0-9a-f]{8,}\b|\b[^\s@]+@[^\s@]+\.[^\s@]+/i;

for (const example of NEW_PRODUCTION_EXAMPLE_CONTRACTS) {
  assert.match(example.path, /^\.\/examples\//, `${example.label} example stays under examples/`);
  assert.doesNotMatch(example.path, /tests[\\/]fixtures/, `${example.label} example does not reference test fixtures`);

  const exampleText = await readFile(new URL(`../${example.path.slice(2)}`, import.meta.url), 'utf8');
  assert.ok(Buffer.byteLength(exampleText, 'utf8') <= 12 * 1024, `${example.label} example stays within bundled example size budget`);
  assert.doesNotMatch(exampleText, forbiddenProductionExamplePattern, `${example.label} source contains no identifier/path/address sentinels`);

  const sections = parseInput(exampleText);
  assert.equal(detectFileType(exampleText), example.type, `${example.label} example detects as its intended parser type`);
  assert.deepEqual(sections.map((section) => section.id), example.sectionIds, `${example.label} example returns expected sanitized sections`);
  for (const [sectionId, label, value] of example.expectedFields) {
    assert.equal(fieldValue(sectionById(sections, sectionId), label), value, `${example.label} exposes expected sanitized ${label}`);
  }
  if (example.expectedRow) {
    const [sectionId, key, value] = example.expectedRow;
    assert.equal(sectionById(sections, sectionId).table[0][key], value, `${example.label} exposes expected sanitized table data`);
  }
  assert.doesNotMatch(JSON.stringify(sections), forbiddenProductionExamplePattern, `${example.label} sanitized sections contain no forbidden sentinels`);
  const outputSnapshot = JSON.stringify(sections);
  assert.deepEqual(parseInput(exampleText), sections, `${example.label} parsing is deterministic`);
  assert.equal(JSON.stringify(sections), outputSnapshot, `${example.label} parsed output remains unchanged after repeated parsing`);
}

function workflowVisibleSections(sections, query = '') {
  const searchResult = filterSectionsByQuery(sections, query);
  return {
    searchResult,
    visibleSections: searchResult.sections.map((section) =>
      getVisibleSectionForCopy(section, { allSections: sections })
    ),
  };
}

const navigationContractSections = [
  {
    id: 'navigation-first',
    title: 'First visible section',
    fields: [{ label: 'Category', value: 'shared-visible-value' }],
    raw: 'explanation-only match',
    tableColumns: [{ key: 'value', label: 'Value' }],
    table: [{ value: 'shared-visible-value' }, { value: 'other-visible-value' }],
  },
  {
    id: 'navigation-second',
    title: 'Second visible section',
    fields: [{ label: 'Other field', value: 'second-only-value' }],
    tableColumns: [{ key: 'value', label: 'Value' }],
    table: [{ value: 'shared-visible-value' }],
  },
];
const navigationInputSnapshot = JSON.stringify(navigationContractSections);
const sharedNavigationSearch = filterSectionsByQuery(navigationContractSections, 'shared-visible-value');
assert.deepEqual(
  sharedNavigationSearch.navigationTargets,
  [
    { id: 'navigation-first', title: 'First visible section', position: 0 },
    { id: 'navigation-second', title: 'Second visible section', position: 1 },
  ],
  'search exposes one ordered target per matching section'
);
assert.equal(
  sharedNavigationSearch.navigationTargets.length,
  new Set(sharedNavigationSearch.navigationTargets.map((target) => target.id)).size,
  'multiple matches in one section do not create duplicate navigation targets'
);
assert.deepEqual(
  filterSectionsByQuery(navigationContractSections, 'explanation-only match').navigationTargets,
  [{ id: 'navigation-first', title: 'First visible section', position: 0 }],
  'explanation matches use the existing section-level search decision'
);
const noNavigationMatches = filterSectionsByQuery(navigationContractSections, 'not-visible');
assert.deepEqual(noNavigationMatches.navigationTargets, [], 'no-result search exposes no navigation targets');
const inactiveNavigationSearch = filterSectionsByQuery(navigationContractSections, '   ');
assert.deepEqual(inactiveNavigationSearch.navigationTargets, [], 'inactive search exposes no navigation targets');
assert.equal(inactiveNavigationSearch.sections, navigationContractSections, 'inactive search keeps the existing section reference');
assert.equal(
  JSON.stringify(navigationContractSections),
  navigationInputSnapshot,
  'navigation target derivation does not mutate input sections'
);
assert.notEqual(
  sharedNavigationSearch.navigationTargets[0],
  sharedNavigationSearch.sections[0],
  'navigation targets do not expose filtered section object references'
);

const matchMetadataSections = [
  {
    id: 'match-first',
    title: 'Alpha title alpha',
    fields: [
      { label: 'Label alpha', value: 'Value alpha alpha' },
      { label: 'No match', value: 'Other' },
    ],
    tableColumns: [
      { key: 'status', label: 'Alpha status' },
      { key: 'message', label: 'Alpha message' },
    ],
    table: [
      { status: 'Row alpha', message: 'Cell alpha alpha', hidden: 'Private alpha' },
      { status: 'Other', message: 'No match' },
    ],
    chart: {
      type: 'memory-bars',
      title: 'Chart alpha',
      items: [
        { label: 'Chart label alpha', value: 42 },
        { label: 'No chart', value: 7 },
      ],
    },
    raw: 'Raw alpha\nSecond line',
    sourceOnly: 'Source alpha',
  },
  {
    id: 'match-second',
    title: 'Later',
    fields: [{ label: 'Other', value: 'later' }],
  },
];
const matchMetadataInputSnapshot = JSON.stringify(matchMetadataSections);
const matchMetadataSearch = filterSectionsByQuery(matchMetadataSections, ' alpha ');
const hiddenOnlyTableSearch = filterSectionsByQuery(matchMetadataSections, 'private alpha');
const visibleCellSearch = filterSectionsByQuery(matchMetadataSections, 'cell alpha alpha');
const headerOnlyTableSearch = filterSectionsByQuery(matchMetadataSections, 'alpha status');
assert.deepEqual(
  SEARCH_MATCH_KINDS,
  ['section-title', 'field-label', 'field-value', 'table-header', 'table-cell', 'chart-label', 'chart-value', 'text'],
  'search metadata exposes only the explicit supported match kinds'
);
assert.equal(matchMetadataSearch.totalMatches, 8, 'match metadata counts all matching visible fields, rows, labels, charts, and text');
assert.deepEqual(
  matchMetadataSearch.sections.map((section) => section.id),
  ['match-first'],
  'match metadata preserves existing section filtering'
);
assert.deepEqual(
  matchMetadataSearch.matchRegions,
  [
    { sectionIndex: 0, sectionId: 'match-first', kind: 'section-title', occurrences: [{ start: 0, end: 5 }, { start: 12, end: 17 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'field-label', fieldIndex: 0, occurrences: [{ start: 6, end: 11 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'field-value', fieldIndex: 0, occurrences: [{ start: 6, end: 11 }, { start: 12, end: 17 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'table-header', columnIndex: 0, columnKey: 'status', occurrences: [{ start: 0, end: 5 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'table-header', columnIndex: 1, columnKey: 'message', occurrences: [{ start: 0, end: 5 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'table-cell', rowIndex: 0, columnIndex: 0, columnKey: 'status', occurrences: [{ start: 4, end: 9 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'table-cell', rowIndex: 0, columnIndex: 1, columnKey: 'message', occurrences: [{ start: 5, end: 10 }, { start: 11, end: 16 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'chart-label', chartIndex: 0, chartPart: 'title', occurrences: [{ start: 6, end: 11 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'chart-label', chartIndex: 0, itemIndex: 0, chartPart: 'item-label', occurrences: [{ start: 12, end: 17 }] },
    { sectionIndex: 0, sectionId: 'match-first', kind: 'text', textBlockIndex: 0, occurrences: [{ start: 4, end: 9 }] },
  ],
  'match metadata exposes deterministic visible rendered regions in render order'
);
assert.doesNotMatch(JSON.stringify(matchMetadataSearch.matchRegions), /Private alpha|Source alpha/, 'match metadata excludes hidden and source-only values');
assert.equal(matchMetadataSearch.sections[0].table.length, 1, 'match metadata preserves the existing matching-row filter');
assert.equal(matchMetadataSearch.sections[0].table[0].hidden, 'Private alpha', 'match metadata does not rewrite filtered row content');
assert.equal(JSON.stringify(matchMetadataSections), matchMetadataInputSnapshot, 'match metadata does not mutate input sections');
assert.deepEqual(hiddenOnlyTableSearch.sections, [], 'non-column row values do not retain a section');
assert.equal(hiddenOnlyTableSearch.sections.flatMap((section) => section.table ?? []).length, 0, 'non-column row values do not return filtered rows');
assert.equal(hiddenOnlyTableSearch.totalMatches, 0, 'non-column row values do not increment the search match count');
assert.deepEqual(hiddenOnlyTableSearch.navigationTargets, [], 'non-column row values do not create section-navigation results');
assert.deepEqual(hiddenOnlyTableSearch.matchRegions, [], 'non-column row values do not create visible match metadata');
assert.deepEqual(createExactMatchTargets(hiddenOnlyTableSearch.matchRegions), [], 'non-column row values do not create exact-match targets');
assert.deepEqual(visibleCellSearch.sections.map((section) => section.id), ['match-first'], 'visible table-cell values retain their section');
assert.equal(visibleCellSearch.sections[0].table.length, 1, 'visible table-cell values retain their matching row');
assert.equal(visibleCellSearch.sections[0].table[0].hidden, 'Private alpha', 'visible table-cell filtering preserves unrelated row properties');
assert.equal(visibleCellSearch.totalMatches, 1, 'visible table-cell values preserve existing match-count semantics');
assert.deepEqual(
  visibleCellSearch.matchRegions,
  [{ sectionIndex: 0, sectionId: 'match-first', kind: 'table-cell', rowIndex: 0, columnIndex: 1, columnKey: 'message', occurrences: [{ start: 0, end: 16 }] }],
  'visible table-cell metadata keeps its row and column identity without hidden properties'
);
assert.equal(createExactMatchTargets(visibleCellSearch.matchRegions).length, 1, 'visible table-cell values keep exact-match targets');
const hiddenOnlyWorkflowSections = hiddenOnlyTableSearch.sections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: matchMetadataSections })
);
const hiddenOnlyWorkflowOutput = [
  hiddenOnlyWorkflowSections.map(serializeSectionForCopy).join('\n'),
  serializeSectionsForExport(hiddenOnlyWorkflowSections),
  serializeSectionsForJsonExport(hiddenOnlyWorkflowSections),
].join('\n');
assert.equal(hiddenOnlyWorkflowSections.length, 0, 'non-column row values leave copy and export ineligible');
assert.equal(JSON.parse(serializeSectionsForJsonExport(hiddenOnlyWorkflowSections)).sections.length, 0, 'non-column row values produce no JSON export sections');
assert.doesNotMatch(hiddenOnlyWorkflowOutput, /Private alpha/, 'non-column row values never enter copy or export output');

const visibleCellWorkflowSections = visibleCellSearch.sections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: matchMetadataSections })
);
const visibleCellWorkflowOutput = [
  visibleCellWorkflowSections.map(serializeSectionForCopy).join('\n'),
  serializeSectionsForExport(visibleCellWorkflowSections),
  serializeSectionsForJsonExport(visibleCellWorkflowSections),
].join('\n');
assert.match(visibleCellWorkflowOutput, /Cell alpha alpha/, 'visible table-cell values remain eligible for copy and export');
assert.doesNotMatch(visibleCellWorkflowOutput, /Private alpha/, 'visible table-cell copy and export exclude unrelated row properties');
assert.doesNotMatch(visibleCellWorkflowOutput, /matchRegions|navigationTargets|occurrences/, 'search metadata never enters copy or export output');

const queryTransitionResults = [
  ['empty', ''],
  ['visible-cell', 'cell alpha alpha'],
  ['hidden-only', 'private alpha'],
  ['no-result', 'not present'],
  ['repeated-occurrence', 'alpha'],
  ['cleared', ''],
].map(([state, query]) => {
  const result = filterSectionsByQuery(matchMetadataSections, query);
  return {
    state,
    active: result.active,
    sectionCount: result.sections.length,
    rowCount: result.sections.flatMap((section) => section.table ?? []).length,
    matchCount: result.totalMatches,
    navigationCount: result.navigationTargets.length,
    regionCount: result.matchRegions.length,
    targetCount: createExactMatchTargets(result.matchRegions).length,
  };
});
assert.deepEqual(
  queryTransitionResults,
  [
    { state: 'empty', active: false, sectionCount: 2, rowCount: 2, matchCount: 0, navigationCount: 0, regionCount: 0, targetCount: 0 },
    { state: 'visible-cell', active: true, sectionCount: 1, rowCount: 1, matchCount: 1, navigationCount: 1, regionCount: 1, targetCount: 1 },
    { state: 'hidden-only', active: true, sectionCount: 0, rowCount: 0, matchCount: 0, navigationCount: 0, regionCount: 0, targetCount: 0 },
    { state: 'no-result', active: true, sectionCount: 0, rowCount: 0, matchCount: 0, navigationCount: 0, regionCount: 0, targetCount: 0 },
    { state: 'repeated-occurrence', active: true, sectionCount: 1, rowCount: 1, matchCount: 8, navigationCount: 1, regionCount: 10, targetCount: 13 },
    { state: 'cleared', active: false, sectionCount: 2, rowCount: 2, matchCount: 0, navigationCount: 0, regionCount: 0, targetCount: 0 },
  ],
  'query transitions replace counts, metadata, navigation targets, and exact-match targets without stale state'
);
assert.deepEqual(headerOnlyTableSearch.sections, [], 'header-only queries preserve existing section filtering');
assert.equal(headerOnlyTableSearch.totalMatches, 0, 'header-only queries preserve existing match-count semantics');
assert.deepEqual(headerOnlyTableSearch.matchRegions, [], 'discarded header-only sections expose no match metadata');
assert.deepEqual(createExactMatchTargets(headerOnlyTableSearch.matchRegions), [], 'discarded header-only sections expose no exact-match targets');
assert.deepEqual(
  matchMetadataSearch.matchRegions,
  filterSectionsByQuery(matchMetadataSections, 'alpha').matchRegions,
  'match metadata is stable across equivalent normalized queries'
);
assert.deepEqual(filterSectionsByQuery(matchMetadataSections, 'not present').matchRegions, [], 'no-match searches expose no match metadata');
assert.deepEqual(filterSectionsByQuery(matchMetadataSections, '   ').matchRegions, [], 'empty searches expose no match metadata');

const chartOnlySections = [{
  id: 'chart-only',
  title: 'Unmatched title',
  fields: [{ label: 'Unmatched label', value: 'Unmatched value' }],
  chart: {
    type: 'memory-bars',
    title: 'Chart title',
    items: [{ label: 'Chart label only', value: 17 }],
  },
  raw: 'Unmatched raw',
}];
const chartValueOnlySearch = filterSectionsByQuery(chartOnlySections, '17');
const chartLabelOnlySearch = filterSectionsByQuery(chartOnlySections, 'chart label only');
assert.deepEqual(chartValueOnlySearch.sections.map((section) => section.id), ['chart-only'], 'chart-value-only searches retain the matching section');
assert.ok(chartValueOnlySearch.matchRegions.some((region) => region.kind === 'chart-value'), 'chart-value-only searches expose chart-value metadata');
assert.deepEqual(chartLabelOnlySearch.sections.map((section) => section.id), ['chart-only'], 'chart-label-only searches retain the matching section');
assert.ok(chartLabelOnlySearch.matchRegions.some((region) => region.kind === 'chart-label'), 'chart-label-only searches expose chart-label metadata');

const occurrenceSections = [{
  id: 'occurrences',
  title: 'Occurrences',
  fields: [
    { label: 'Punctuation', value: 'Alpha, alpha alpha.' },
    { label: 'Emoji', value: '😀Alpha' },
    { label: 'Overlap', value: 'aaaa' },
  ],
  raw: 'Alpha\nalpha',
}];
const alphaOccurrences = filterSectionsByQuery(occurrenceSections, 'alpha').matchRegions;
assert.deepEqual(
  alphaOccurrences.find((region) => region.kind === 'field-value' && region.fieldIndex === 0)?.occurrences,
  [{ start: 0, end: 5 }, { start: 7, end: 12 }, { start: 13, end: 18 }],
  'match metadata records non-overlapping punctuation-separated occurrences'
);
assert.deepEqual(
  alphaOccurrences.find((region) => region.kind === 'field-value' && region.fieldIndex === 1)?.occurrences,
  [{ start: 2, end: 7 }],
  'match metadata records deterministic UTF-16 offsets after supplementary characters'
);
assert.deepEqual(
  filterSectionsByQuery(occurrenceSections, 'aa').matchRegions.find((region) => region.fieldIndex === 2)?.occurrences,
  [{ start: 0, end: 2 }, { start: 2, end: 4 }],
  'match metadata uses non-overlapping left-to-right occurrences'
);

const exactTargetRegions = [
  { sectionIndex: 0, sectionId: 'first', kind: 'field-value', fieldIndex: 2, occurrences: [{ start: 1, end: 3 }, { start: 5, end: 7 }] },
  { sectionIndex: 2, sectionId: 'second', kind: 'table-cell', rowIndex: 4, columnIndex: 1, columnKey: 'message', occurrences: [{ start: 0, end: 4 }] },
];
const exactTargetSnapshot = JSON.stringify(exactTargetRegions);
assert.equal(isValidMatchRange({ start: 1, end: 3 }, 3), true, 'exact-match ranges accept valid UTF-16 bounds');
assert.equal(isValidMatchRange({ start: -1, end: 3 }, 3), false, 'exact-match ranges reject negative offsets');
assert.equal(isValidMatchRange({ start: 1, end: 4 }, 3), false, 'exact-match ranges reject out-of-bounds offsets');
assert.equal(
  getExactMatchTargetId({ sectionIndex: 2, regionIndex: 4 }, 1),
  'exact-match-2-4-1',
  'exact-match target identities use only deterministic metadata indices'
);
assert.deepEqual(
  createExactMatchTargets(exactTargetRegions),
  [
    { id: 'exact-match-0-0-0', sectionIndex: 0, sectionId: 'first', kind: 'field-value', regionIndex: 0, occurrenceIndex: 0, start: 1, end: 3 },
    { id: 'exact-match-0-0-1', sectionIndex: 0, sectionId: 'first', kind: 'field-value', regionIndex: 0, occurrenceIndex: 1, start: 5, end: 7 },
    { id: 'exact-match-2-1-0', sectionIndex: 2, sectionId: 'second', kind: 'table-cell', regionIndex: 1, occurrenceIndex: 0, start: 0, end: 4 },
  ],
  'exact-match targets flatten regions in deterministic section, region, and occurrence order'
);
assert.deepEqual(createExactMatchTargets([{ sectionIndex: 0, sectionId: 'invalid', kind: 'text', occurrences: [{ start: 2, end: 1 }] }]), [], 'malformed match ranges do not create navigable targets');
assert.equal(JSON.stringify(exactTargetRegions), exactTargetSnapshot, 'exact-match target derivation does not mutate frozen metadata');
assert.deepEqual(
  filterSectionsByQuery(occurrenceSections, 'longer than any value').matchRegions,
  [],
  'queries longer than visible values produce no match metadata'
);

const productionExampleByType = new Map(parsedProductionExamples.map((run) => [run.example.type, run]));
for (const run of parsedProductionExamples) {
  const broadQuery = run.sections[0]?.title.split(/\s+/)[0] ?? run.example.type;
  const narrowQuery = run.sections[0]?.title ?? run.example.type;
  const noResultQuery = `__missing-${run.example.type}__`;
  const broadSearch = workflowVisibleSections(run.sections, broadQuery);
  const narrowSearch = workflowVisibleSections(run.sections, narrowQuery);
  const noResultSearch = workflowVisibleSections(run.sections, noResultQuery);
  const clearedSearch = workflowVisibleSections(run.sections);

  assert.ok(broadSearch.searchResult.totalMatches > 0, `${run.example.label} supports broad search`);
  assert.ok(broadSearch.searchResult.matchRegions.length > 0, `${run.example.label} exposes broad-search match metadata`);
  assert.ok(narrowSearch.searchResult.totalMatches > 0, `${run.example.label} supports narrow search`);
  assert.equal(noResultSearch.searchResult.totalMatches, 0, `${run.example.label} supports no-result search`);
  assert.deepEqual(clearedSearch.searchResult.sections, run.sections, `${run.example.label} Clear Search restores all sections`);
  assert.deepEqual(
    createSectionNavItems(narrowSearch.searchResult.sections).map((item) => item.id),
    narrowSearch.searchResult.sections.map((section) => section.id),
    `${run.example.label} navigation follows the visible filtered section order`
  );
  assert.deepEqual(
    narrowSearch.searchResult.navigationTargets.map((target) => target.id),
    narrowSearch.searchResult.sections.map((section) => section.id),
    `${run.example.label} search navigation targets follow filtered section order`
  );
  assert.deepEqual(
    narrowSearch.searchResult.navigationTargets.map((target) => target.position),
    narrowSearch.searchResult.navigationTargets.map((_, index) => index),
    `${run.example.label} search navigation positions are deterministic`
  );
  assert.equal(
    new Set(narrowSearch.searchResult.navigationTargets.map((target) => target.id)).size,
    narrowSearch.searchResult.navigationTargets.length,
    `${run.example.label} search navigation has no duplicate section targets`
  );
  for (const target of narrowSearch.searchResult.navigationTargets) {
    assert.deepEqual(
      Object.keys(target).sort(),
      ['id', 'position', 'title'],
      `${run.example.label} navigation target contains only approved metadata`
    );
  }
  assert.doesNotMatch(
    JSON.stringify(narrowSearch.searchResult.navigationTargets),
    forbiddenProductionExamplePattern,
    `${run.example.label} navigation metadata contains no private-looking values`
  );
  assert.doesNotMatch(
    JSON.stringify(narrowSearch.searchResult.matchRegions),
    forbiddenProductionExamplePattern,
    `${run.example.label} match metadata contains no private-looking values`
  );

  const copy = narrowSearch.visibleSections.map(serializeSectionForCopy).join('\n\n---\n\n');
  const textExport = serializeSectionsForExport(narrowSearch.visibleSections);
  const jsonExport = JSON.parse(serializeSectionsForJsonExport(narrowSearch.visibleSections));
  assert.ok(copy, `${run.example.label} has visible copy content`);
  assert.ok(textExport, `${run.example.label} has visible text export content`);
  assert.equal(jsonExport.version, 1, `${run.example.label} JSON export keeps schema version 1`);
  assert.equal(jsonExport.mode, 'single', `${run.example.label} JSON export remains single-report mode`);
  assert.equal(jsonExport.sections.length, narrowSearch.visibleSections.length, `${run.example.label} JSON export follows filtered sections`);
  assert.doesNotMatch(
    `${copy}\n${textExport}\n${JSON.stringify(jsonExport)}`,
    forbiddenProductionExamplePattern,
    `${run.example.label} workflow outputs remain sanitized`
  );

  const outputSnapshot = JSON.stringify(run.sections);
  workflowVisibleSections(run.sections, broadQuery);
  assert.equal(JSON.stringify(run.sections), outputSnapshot, `${run.example.label} search and export do not mutate parsed output`);
}

const exampleSwitchOrder = [
  'ips',
  'coreanalytics',
  'resource-stackshot',
  'resource-cpu',
  'resource-diskwrites',
  'accessory-crash',
];
let switchingState = createInitialAppState();
for (const parserType of exampleSwitchOrder) {
  const run = productionExampleByType.get(parserType);
  const nextState = withParsedReport(startNewReportState(switchingState), {
    sourceText: run.sourceText,
    sourceLabel: run.example.sourceLabel,
    detectedType: run.example.type,
    sections: run.sections,
  });

  assert.equal(nextState.sanitize, true, `${run.example.label} switching restores sanitized mode`);
  assert.equal(nextState.sourceLabel, run.example.sourceLabel, `${run.example.label} switching updates source label`);
  assert.deepEqual(nextState.sections, run.sections, `${run.example.label} switching replaces prior report sections`);
  assert.deepEqual(filterSectionsByQuery(nextState.sections).sections, run.sections, `${run.example.label} switching starts with cleared search`);
  switchingState = createInitialAppState();
  assert.deepEqual(switchingState.sections, [], `${run.example.label} Clear Report removes prior sections`);
  assert.equal(switchingState.sourceText, '', `${run.example.label} Clear Report removes prior source text`);
}

const coreAnalyticsProductionRun = productionExampleByType.get('coreanalytics');
const coreAnalyticsProductionFacetOptions = getCoreAnalyticsFacetOptions(getCoreAnalyticsView(coreAnalyticsProductionRun.sections));
assert.ok(
  coreAnalyticsProductionFacetOptions.some((group) => group.options.length > 0),
  'production CoreAnalytics exposes facets from its sanitized rendered rows'
);
for (const run of parsedProductionExamples) {
  const options = getCoreAnalyticsFacetOptions(getCoreAnalyticsView(run.sections));
  if (run.example.type === 'coreanalytics') continue;
  assert.deepEqual(options, [], `${run.example.label} does not expose CoreAnalytics facets`);
}
const productionFacet = coreAnalyticsProductionFacetOptions.find((group) => group.options.length > 0)?.options[0];
assert.deepEqual(
  filterSectionsByQuery(coreAnalyticsProductionRun.sections, productionFacet.query).sections,
  filterSectionsByQuery(coreAnalyticsProductionRun.sections, productionFacet.value).sections,
  'production CoreAnalytics facet activation preserves ordinary substring search'
);
const productionFacetSearch = filterSectionsByQuery(coreAnalyticsProductionRun.sections, productionFacet.query);
assert.deepEqual(
  productionFacetSearch.navigationTargets.map((target) => target.id),
  productionFacetSearch.sections.map((section) => section.id),
  'CoreAnalytics facet searches expose targets in filtered section order'
);

function comparisonEntryForExample(run) {
  const classification = classifyDiagnostic(run.sourceText);
  return {
    classification: { parserType: classification.parserType, supported: classification.supported },
    sections: run.sections,
  };
}

const comparisonExampleRun = productionExampleByType.get('coreanalytics');
const comparisonExampleEntries = [comparisonExampleRun, comparisonExampleRun, comparisonExampleRun].map(comparisonEntryForExample);
assert.equal(validateComparison(comparisonExampleEntries).valid, true, 'same-parser production examples remain comparison-compatible');
const comparisonExampleSections = createComparisonSections(comparisonExampleEntries);
const comparisonExampleVisibleSections = comparisonExampleSections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: comparisonExampleSections })
);
const comparisonExampleJson = JSON.parse(serializeSectionsForJsonExport(comparisonExampleVisibleSections, { mode: 'comparison' }));
assert.equal(comparisonExampleJson.mode, 'comparison', 'production example comparison export remains comparison mode');
assert.match(serializeSectionsForExport(comparisonExampleVisibleSections), /Report 1|Report 2|Report 3/, 'production example comparison keeps report ordering in text export');
assert.equal(validateComparison([
  comparisonEntryForExample(productionExampleByType.get('ips')),
  comparisonEntryForExample(productionExampleByType.get('coreanalytics')),
]).valid, false, 'mixed production example families remain rejected for comparison');
assert.match(
  mainScriptText,
  /function clearComparison\(\) \{[^]*comparisonEntries = \[\][^]*exitComparisonMode\(\)/,
  'clearing comparison removes selected reports and rendered comparison sections'
);

const rawCoreAnalyticsState = withPrivacyMode(
  withParsedReport(startNewReportState(createInitialAppState()), {
    sourceText: coreAnalyticsProductionRun.sourceText,
    sourceLabel: coreAnalyticsProductionRun.example.sourceLabel,
    detectedType: coreAnalyticsProductionRun.example.type,
    sections: parseInput(coreAnalyticsProductionRun.sourceText, { sanitize: false }),
  }),
  false
);
assert.equal(rawCoreAnalyticsState.sanitize, false, 'Raw Local View remains opt-in for production examples');
assert.match(
  mainScriptText,
  /const coreAnalyticsFacetOptions = !comparisonMode && appState\.sanitize[^]*\? getCoreAnalyticsFacetOptions\(coreAnalyticsView\)/,
  'Raw Local View and comparison mode keep CoreAnalytics facets non-interactive'
);
assert.match(
  mainScriptText,
  /function renderExampleControls\(\) \{[^]*EXAMPLE_REPORTS\.map[^]*button\.type = 'button'[^]*loadExample\(example\)/,
  'bundled examples use the existing native button workflow'
);
assert.match(
  mainScriptText,
  /async function loadExample\(example\)[^]*clearSearchState\(\)[^]*resetDenseTableState\(\)[^]*showParsedReport\(text, example\.sourceLabel\)/,
  'example loading resets search and dense-table state before parsing the next report'
);

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
assert.deepEqual(
  cpuExplanationSearch.navigationTargets,
  [{ id: EXPLANATION_SECTION_ID, title: cpuExplanationSearch.sections[0].title, position: 0 }],
  'explanation-only search exposes one section-level navigation target'
);
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
const largeStackshotSearch = filterSectionsByQuery(largeRoutedStackshotSections, 'LargeStackProcess149');
assert.ok(largeStackshotSearch.totalMatches > 0, 'Stackshot search can find rendered capped top-process rows');
assert.deepEqual(
  largeStackshotSearch.navigationTargets.map((target) => target.id),
  ['resource-stackshot-top-processes'],
  'Stackshot search exposes one target for the matching visible capped table'
);
assert.deepEqual(
  filterSectionsByQuery(largeRoutedStackshotSections, 'LargeStackProcess0').navigationTargets,
  [],
  'Stackshot rows outside the rendered cap do not create navigation targets'
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
const hiddenNavigationHelper = 'HIDDEN-NAVIGATION-HELPER-SENTINEL';
const safeNavigationItems = createSectionNavItems([{
  id: 'safe-navigation-section',
  title: 'Visible navigation title',
  helper: hiddenNavigationHelper,
}]);
assert.equal(JSON.stringify(safeNavigationItems).includes(hiddenNavigationHelper), false, 'section navigation excludes hidden helper properties');
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
const visibleExportSections = [
  {
    title: 'Report 1 Summary',
    fields: [{ label: 'Status', value: 'Visible' }],
  },
  {
    title: 'Top Processes',
    tableSummary: '1 of 2 processes shown',
    tableColumns: [{ key: 'process', label: 'Process' }],
    table: [{ process: 'Visible Process' }],
    hiddenRows: [{ process: 'HIDDEN_EXPORT_SENTINEL' }],
    sourceText: 'RAW_EXPORT_SENTINEL',
    raw: 'RAW_LOCAL_EXPORT_SENTINEL',
  },
];
const visibleExportSnapshot = JSON.stringify(visibleExportSections);
const visibleExportText = serializeSectionsForExport(visibleExportSections);
assert.equal(
  visibleExportText,
  [
    'Report 1 Summary',
    '',
    'Status: Visible',
    '',
    '---',
    '',
    'Top Processes',
    '',
    '1 of 2 processes shown',
    '',
    'Process',
    'Visible Process',
  ].join('\n'),
  'visible export preserves section order, visible table rows, and stable separators'
);
assert.equal(serializeSectionsForExport(visibleExportSections), visibleExportText, 'visible export is deterministic for identical input');
assert.equal(JSON.stringify(visibleExportSections), visibleExportSnapshot, 'visible export does not mutate input sections');
assert.doesNotMatch(
  visibleExportText,
  /HIDDEN_EXPORT_SENTINEL|RAW_EXPORT_SENTINEL|RAW_LOCAL_EXPORT_SENTINEL/,
  'visible export excludes hidden source values and raw local content'
);
assert.equal(serializeSectionsForExport([]), '', 'visible export handles empty section arrays');
assert.equal(serializeSectionsForExport(null), '', 'visible export handles malformed section collections');
assert.equal(
  serializeSectionsForExport([null, {}, { title: 'Safe Empty Section', fields: null, table: [null] }]),
  'Safe Empty Section',
  'visible export skips malformed sections and content safely'
);
let downloadBlob = null;
let downloadLink = null;
let downloadClicked = false;
let downloadRemoved = false;
let revokedObjectUrl = null;
const downloadDocument = {
  createElement(tagName) {
    assert.equal(tagName, 'a', 'visible export creates a temporary download link');
    return {
      click() {
        downloadClicked = true;
      },
      remove() {
        downloadRemoved = true;
      },
    };
  },
  body: {
    append(link) {
      downloadLink = link;
    },
  },
};
const downloadUrlApi = {
  createObjectURL(blob) {
    downloadBlob = blob;
    return 'blob:visible-export';
  },
  revokeObjectURL(objectUrl) {
    revokedObjectUrl = objectUrl;
  },
};
assert.equal(
  downloadTextFile('Visible export content', 'ios-diagnostic-export.txt', {
    documentRef: downloadDocument,
    urlRef: downloadUrlApi,
  }),
  true,
  'visible export starts a local plain-text download'
);
assert.equal(downloadBlob.type, 'text/plain;charset=utf-8', 'visible export uses a UTF-8-compatible plain-text Blob');
assert.equal(await downloadBlob.text(), 'Visible export content', 'visible export Blob contains only supplied serialized text');
assert.deepEqual(
  { href: downloadLink.href, download: downloadLink.download, hidden: downloadLink.hidden },
  { href: 'blob:visible-export', download: 'ios-diagnostic-export.txt', hidden: true },
  'visible export uses a generic filename and temporary object URL'
);
assert.equal(downloadClicked, true, 'visible export triggers the user-initiated link');
assert.equal(downloadRemoved, true, 'visible export removes its temporary link');
assert.equal(revokedObjectUrl, 'blob:visible-export', 'visible export revokes its object URL after use');
assert.equal(downloadTextFile('', 'ios-diagnostic-export.txt', { documentRef: downloadDocument, urlRef: downloadUrlApi }), false, 'visible export rejects empty text');

const searchScopedExportSource = [{
  id: 'process-table',
  title: 'Processes',
  tableColumns: [{ key: 'process', label: 'Process' }],
  table: [{ process: 'Visible Search Row' }, { process: 'FILTERED_EXPORT_SENTINEL' }],
}];
const searchScopedExport = filterSectionsByQuery(searchScopedExportSource, 'Visible Search Row').sections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: searchScopedExportSource })
);
const searchScopedExportText = serializeSectionsForExport(searchScopedExport);
const searchScopedExportJson = serializeSectionsForJsonExport(searchScopedExport);
assert.match(searchScopedExportText, /Visible Search Row/, 'visible export includes active-search rows');
assert.doesNotMatch(searchScopedExportText, /FILTERED_EXPORT_SENTINEL/, 'visible export excludes filtered-out rows');
assert.match(searchScopedExportJson, /Visible Search Row/, 'structured JSON export includes active-search rows');
assert.doesNotMatch(searchScopedExportJson, /FILTERED_EXPORT_SENTINEL/, 'structured JSON export excludes filtered-out rows');

const cappedExportSource = [{
  id: 'process-table',
  title: 'Capped Processes',
  tableColumns: [{ key: 'process', label: 'Process' }],
  table: Array.from({ length: 60 }, (_, index) => ({ process: `Export Process ${index + 1}` })),
}];
const cappedExportSections = cappedExportSource.map((section) => getVisibleSectionForCopy(section, { allSections: cappedExportSource }));
const cappedExportText = serializeSectionsForExport(cappedExportSections);
assert.match(cappedExportText, /50 of 60 rows shown/, 'visible export preserves the existing capped-table summary');
assert.match(cappedExportText, /Export Process 50/, 'visible export includes rendered capped rows');
assert.doesNotMatch(cappedExportText, /Export Process 51|Export Process 60/, 'visible export excludes rows beyond the active table cap');
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
assert.match(mainScriptText, /getCoreAnalyticsView\(activeSections\)/, 'CoreAnalytics overview uses active unfiltered report or comparison sections');
assert.match(mainScriptText, /getCoreAnalyticsFacetOptions\(coreAnalyticsView\)/, 'main app derives facet controls from the Slice 14C contract');
assert.match(mainScriptText, /searchInput\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/, 'facet activation reuses the existing search input event path');
assert.match(mainScriptText, /selectedCoreAnalyticsFacetQuery: searchQuery/, 'facet appearance is derived from the existing search query');
assert.match(mainScriptText, /const coreAnalyticsFacetOptions = !comparisonMode && appState\.sanitize/, 'facet controls are limited to sanitized single-report mode');
assert.match(mainScriptText, /const restoreCoreAnalyticsFacetFocus = document\.activeElement\?\.matches\('\.coreanalytics-overview__chip'\) === true/, 'facet focus is captured before the shared results rerender');
assert.match(mainScriptText, /document\.querySelector\('\.coreanalytics-overview__chip\[aria-pressed=\"true\"\]'\)\?\.focus\(\)/, 'facet focus is restored after the shared results rerender');
const facetHandlerSource = mainScriptText.match(/function selectCoreAnalyticsFacet\(option\) \{[^]*?\n\}/)?.[0] ?? '';
assert.match(facetHandlerSource, /searchInput\.value = option\.query/, 'facet activation writes the exact contract query to the search input');
assert.match(facetHandlerSource, /searchInput\.dispatchEvent\(new Event\('input'/, 'facet activation delegates filtering to the search input event');
assert.doesNotMatch(facetHandlerSource, /filterSectionsByQuery|serializeSections|table|row|sourceText/, 'facet activation does not implement a parallel filtering or export path');
assert.match(mainScriptText, /function clearSearchState\(\) \{[^]*searchQuery = ''[^]*searchInput\.value = ''/, 'clear search resets both the query and input value');
assert.match(mainScriptText, /function clearSearch\(\) \{[^]*clearSearchState\(\)[^]*renderApp\(\)[^]*searchInput\.focus\(\)/, 'Clear Search re-renders and preserves keyboard focus');
assert.match(mainScriptText, /function clearReport\(\) \{[^]*exitComparisonMode\(\)[^]*clearSearchState\(\)/, 'Clear Report clears comparison mode and facet-driven search state');
assert.match(mainScriptText, /getSearchMetadata/, 'main app computes search scope metadata');
assert.match(mainScriptText, /getSearchMetadata\(searchResult, activeSections, \{ coreAnalyticsView \}\)/, 'search metadata uses current search results, active sections, and CoreAnalytics view');
assert.match(mainScriptText, /filterSectionsByQuery\(activeSections, searchQuery, \{ includeMatchRegions: appState\.sanitize \|\| comparisonMode \}\)/, 'raw local view disables new search-match metadata while preserving filtering');
assert.match(mainScriptText, /renderSearchControls\(searchMetadata, hasParsedSections\)/, 'search controls receive metadata instead of raw search-result wording');
assert.match(mainScriptText, /searchResult\.navigationTargets/, 'search navigation consumes the Slice 16A navigation target contract');
assert.match(mainScriptText, /function navigateSearchResult\(direction\)/, 'search navigation uses one section-level movement handler');
assert.match(mainScriptText, /document\.getElementById\(target\.id\)/, 'search navigation resolves existing stable section anchors by ID');
assert.match(mainScriptText, /targetElement\.scrollIntoView\(/, 'search navigation scrolls the selected section into view');
assert.match(mainScriptText, /section unavailable/, 'search navigation handles missing anchors through the existing status path');
assert.match(mainScriptText, /document\.getElementById\(navigationButton\?\.id \?\? ''\)\?\.focus\(\)/, 'search navigation restores focus after rerender when an anchor is unavailable');
assert.match(mainScriptText, /activeNavigationIndex|searchNavigationTargets/, 'search navigation stores only target metadata and an active numeric index');
assert.match(mainScriptText, /searchNavigationTargets\.length - 1/, 'search navigation disables movement at the final target without wrapping');
assert.match(mainScriptText, /setAttribute\('aria-disabled', String\(previousDisabled\)\)/, 'search navigation exposes boundary-disabled state accessibly while retaining focus');
assert.match(mainScriptText, /getAttribute\('aria-disabled'\) === 'true'/, 'search navigation ignores activation of a boundary-disabled control');
assert.match(mainScriptText, /Showing match \$\{activeNavigationIndex \+ 1\} of \$\{searchNavigationTargets\.length\}/, 'search navigation announces section-level position through existing status wording');
assert.match(mainScriptText, /searchNavigationElement\.hidden = !showSearchNavigation/, 'search navigation hides when search is inactive, empty, or not sanitized');
assert.match(mainScriptText, /appState\.sanitize \|\| comparisonMode/, 'Raw Local View is excluded while sanitized comparison navigation remains eligible');
assert.match(mainScriptText, /searchNavigationTargets = \[\];[^]*activeNavigationIndex = -1/, 'search navigation state clears with search reset');
assert.match(mainScriptText, /searchNavigationPreviousButton\.addEventListener\('click', \(\) => navigateSearchResult\(-1\)\)/, 'Previous uses the shared navigation movement handler');
assert.match(mainScriptText, /searchNavigationNextButton\.addEventListener\('click', \(\) => navigateSearchResult\(1\)\)/, 'Next uses the shared navigation movement handler');
assert.match(mainScriptText, /direction > 0 \? 'exact-match-previous' : 'exact-match-next'/, 'exact-match boundary movement restores focus to the remaining enabled control');
assert.match(mainScriptText, /exactMatchPreviousButton\.addEventListener\('click', \(\) => navigateExactMatch\(-1\)\)/, 'Previous exact match uses the shared exact-match movement handler');
assert.match(mainScriptText, /exactMatchNextButton\.addEventListener\('click', \(\) => navigateExactMatch\(1\)\)/, 'Next exact match uses the shared exact-match movement handler');
assert.match(mainScriptText, /createExactMatchTargets\(matchRegions\)/, 'exact-match UI derives targets from the frozen match-region metadata');
assert.doesNotMatch(mainScriptText, /(?:innerText|textContent)\.(?:match|includes|indexOf|toLowerCase)/, 'exact-match navigation does not derive search matches from rendered DOM text');
const navigationHandlerSource = mainScriptText.match(/function navigateSearchResult\(direction\) \{[^]*?\n\}/)?.[0] ?? '';
assert.doesNotMatch(
  navigationHandlerSource,
  /filterSectionsByQuery|serializeSections|serializeSection|sourceText|raw|table|row/,
  'navigation movement does not create a second search or export pipeline'
);
assert.equal(
  (mainScriptText.match(/searchNavigationPreviousButton\.addEventListener\(/g) ?? []).length,
  1,
  'Previous has one event listener'
);
assert.equal(
  (mainScriptText.match(/searchNavigationNextButton\.addEventListener\(/g) ?? []).length,
  1,
  'Next has one event listener'
);
assert.match(mainScriptText, /statusMessageForSearch\(searchMetadata\)/, 'search status text is derived from metadata');
assert.match(mainScriptText, /searchCount\.textContent = searchStatusText\(searchMetadata\)/, 'visible and live search status use the same result-count wording');
assert.match(mainScriptText, /if \(searchMetadata\.matchCount === 0\) return 'No matches in parsed output\.'/, 'zero-result searches cannot announce a positive result count');
const exactNavigationHandlerSource = mainScriptText.match(/function navigateExactMatch\(direction\) \{[^]*?\n\}/)?.[0] ?? '';
assert.match(exactNavigationHandlerSource, /nextIndex < 0 \|\| nextIndex > exactMatchTargets\.length - 1/, 'exact-match navigation remains non-wrapping at both boundaries');
assert.match(mainScriptText, /Search and copy operate on rendered capped rows only\./, 'CoreAnalytics capped search wording is available in status text');
assert.match(mainScriptText, /Some source records are not rendered\./, 'large rendered-row search wording is available in status text');
assert.match(renderAppSource, /renderCoreAnalyticsOverview/, 'results rendering can prepend the CoreAnalytics overview without mutating sections');
assert.match(renderAppSource, /searchActive:\s*options\.searchActive === true/, 'CoreAnalytics overview receives search-active state from render options');
assert.match(renderAppSource, /facetOptions:\s*options\.coreAnalyticsFacetOptions/, 'CoreAnalytics overview receives contract facet options from the app state path');
assert.match(renderAppSource, /selectedFacetQuery:\s*options\.selectedCoreAnalyticsFacetQuery/, 'CoreAnalytics overview derives selected appearance from the current search query');
assert.match(renderAppSource, /options\.presentation === 'report'/, 'report presentation is an explicit render option rather than inferred from report data');
assert.match(renderAppSource, /element\.classList\.toggle\('report-document'/, 'single-report rendering activates the continuous document surface');
assert.match(renderAppSource, /document\.createElement\('header'\)[^]*report-document__header[^]*report-document-title/s, 'single-report rendering includes a restrained semantic report header');
assert.match(renderAppSource, /title\.textContent = identity\.title/, 'report identity is assigned through safe text content');
assert.match(mainScriptText, /presentation:\s*hasParsedSections && !comparisonMode && appState\.sanitize \? 'report' : 'compatibility'/, 'only populated sanitized single reports receive the Slice 20D presentation');
assert.match(mainScriptText, /title:\s*'Parsed report'[^]*type:\s*appState\.detectedType/s, 'report header uses generic identity and the existing parser type without exposing source labels');
assert.match(renderSectionText, /getCopyMetadata/, 'render path computes copy metadata for feedback');
assert.match(renderSectionText, /copyFeedbackText\(copyMetadata\)/, 'copy success feedback is derived from copy metadata');
assert.match(renderSectionText, /Copied visible section content\./, 'copy feedback reports full visible section copy');
assert.match(renderSectionText, /Copied visible rows only\./, 'copy feedback reports visible-row-only copy');
assert.match(renderSectionText, /Copy failed\. Select and copy manually\./, 'copy failure feedback remains unchanged');
assert.match(renderSectionText, /Search and copy operate on rendered capped rows only\./, 'copy feedback includes capped CoreAnalytics wording');
assert.match(renderSectionText, /title\.id = `\$\{section\.id\}-title`/, 'each report section exposes a stable heading id derived from its stable section id');
assert.match(renderSectionText, /title\.dataset\.sectionHeading = 'true'/, 'section headings expose a stable focus hook without depending on heading level');
assert.match(renderSectionText, /row\.className = 'field-row'[^]*row\.append\(dt, dd\)/s, 'definition-list values are grouped into semantic property rows');
assert.match(renderSectionText, /dd\.classList\.add\('technical-value'\)/, 'technical field values receive the approved monospace presentation hook');
assert.match(renderSectionText, /wrapper\.setAttribute\('role', 'region'\)[^]*wrapper\.tabIndex = 0[^]*aria-labelledby[^]*aria-describedby/s, 'wide tables use a named keyboard-scrollable region with persistent instructions');
assert.match(renderSectionText, /columnIndex === 0 \? document\.createElement\('th'\) : document\.createElement\('td'\)/, 'table first columns render as semantic row headers');
assert.match(renderSectionText, /cell\.scope = 'row'/, 'table row headers expose row scope');
assert.match(renderSectionText, /document\.createElement\('dl'\)[^]*data\.className = 'chart-data'/s, 'charts include a visible definition-list equivalent for the same values');
assert.match(renderSectionText, /getComputedStyle\(canvas\)/, 'canvas colors resolve from the active production theme');
assert.match(renderSectionText, /context\.measureText\(valueText\)[^]*canvas\.width - valueWidth - valueInset/s, 'chart value labels reserve measured canvas space instead of clipping at the edge');
assert.doesNotMatch(renderSectionText, /item\.color \?\?/, 'chart presentation does not trust parser-provided decorative colors');
assert.match(renderCoreAnalyticsOverviewSource, /Tables show rendered capped rows only\. Full raw JSON bodies are not rendered\./, 'CoreAnalytics overview explains rendered capped rows');
assert.match(renderCoreAnalyticsOverviewSource, /Search and copy operate on rendered rows only\./, 'CoreAnalytics overview explains search and copy row boundaries');
assert.match(renderCoreAnalyticsOverviewSource, /Overview hidden while search is active\./, 'CoreAnalytics overview has explicit search-active copy');
assert.match(renderCoreAnalyticsOverviewSource, /document\.createElement\(interactive \? 'button' : 'span'\)/, 'CoreAnalytics facet options render as native buttons when the contract is active');
assert.match(renderCoreAnalyticsOverviewSource, /aria-pressed/, 'CoreAnalytics facet buttons expose selected appearance semantics');
assert.match(renderCoreAnalyticsOverviewSource, /item\.query === selectedFacetQuery/, 'selected facet appearance follows the exact active query');
assert.match(renderCoreAnalyticsOverviewSource, /document\.createElement\('dl'\)[^]*coreanalytics-overview__table-counts/s, 'CoreAnalytics row counts use a compact semantic definition summary rather than cards');
assert.doesNotMatch(renderCoreAnalyticsOverviewSource, /document\.createElement\('section'\)[^]*coreanalytics-overview__table-count/s, 'CoreAnalytics row counts no longer render dashboard-style statistic tiles');
assert.doesNotMatch(
  renderCoreAnalyticsOverviewSource,
  /parseInput|filterSectionsByQuery|localStorage|sessionStorage|indexedDB|navigator\.clipboard|sourceText/,
  'CoreAnalytics overview renderer stays DOM-only without parser, search, storage, clipboard, or source-text access'
);
assert.doesNotMatch(
  coreAnalyticsViewSource,
  /document|window|navigator|filterSectionsByQuery|serializeSection|parseInput|sourceText/,
  'CoreAnalytics facet view model stays pure without DOM, search, serialization, parser, or source-text access'
);
assert.doesNotMatch(searchSource, /renderCoreAnalyticsOverview|coreAnalyticsView/, 'search module does not import or count the CoreAnalytics overview UI');
assert.match(styleText, /\.coreanalytics-overview__chip\s*\{[^}]*min-height:\s*44px;/s, 'CoreAnalytics facet controls keep practical touch targets');
assert.match(styleText, /\.coreanalytics-overview__chip:focus-visible/, 'CoreAnalytics facet controls expose visible focus styling');
assert.match(reportContentStyleText, /^\/\* Hallmark .* Inspector Workspace .* report content/s, 'report content stylesheet records the approved Hallmark design authority');
assert.match(reportContentStyleText, /\.sections\.report-document\s*\{[^}]*background:\s*var\(--color-content\)/s, 'single reports use one opaque content canvas');
assert.match(reportContentStyleText, /\.report-document > \.section-card\s*\{[^}]*border:\s*0[^}]*border-radius:\s*0/s, 'single-report sections are continuous document sections rather than cards');
assert.match(reportContentStyleText, /\.field-row\s*\{[^}]*grid-template-columns:/s, 'report definition rows establish a readable label-value grid');
assert.match(reportContentStyleText, /\.table-scroll__hint/, 'wide tables include a visible horizontal-scroll cue');
assert.match(reportContentStyleText, /@media \(max-width:\s*47\.999rem\)[^]*\.report-document \.field-row,[^]*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s, 'definition rows stack intentionally at narrow widths');
assert.match(reportContentStyleText, /@media \(forced-colors:\s*active\)[^]*\.chart canvas\s*\{[^}]*display:\s*none/s, 'forced colors preserves chart values through the text equivalent instead of unreadable canvas pixels');
assert.doesNotMatch(reportContentStyleText, /backdrop-filter|linear-gradient|radial-gradient|conic-gradient/, 'report content remains opaque without glass or decorative gradients');
assert.match(workspaceNavigationSource, /querySelector\('\[data-section-heading\]'\)/, 'workspace navigation focuses section headings without freezing the heading level');
assert.match(browserHarnessSource, /reportDocumentSemantics/, 'browser harness reports continuous-document, definition-list, table, and chart semantics');
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
assert.equal(sectionById(panicSections, 'kernel-backtrace').table[0].returnAddress, '[address redacted]');
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
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].lr, '[address redacted]');
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].fp, '[address redacted]');
assert.doesNotMatch(
  JSON.stringify(jsonPanicSections),
  /0xfffffff051260638|0xfffffff05046e9cc|0xffffffef16ceb5f0|0xfffffff007123456/,
  'panic sanitized output excludes raw panic and backtrace addresses'
);
const rawJsonPanicSections = parseInput(jsonPanicText, { sanitize: false });
assert.equal(
  sectionById(rawJsonPanicSections, 'kernel-backtrace').table[0].lr,
  '0xfffffff05046e9cc',
  'Raw Local View preserves the existing bounded panic address behavior'
);
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
const rawSearchWithoutMatchMetadata = filterSectionsByQuery(rawCoreAnalyticsSections, '22222222-3333-4444-5555-666666666666', { includeMatchRegions: false });
assert.ok(rawSearchWithoutMatchMetadata.totalMatches > 0, 'Raw Local View keeps its existing parsed-value search behavior');
assert.deepEqual(rawSearchWithoutMatchMetadata.matchRegions, [], 'Raw Local View does not produce new exact-match metadata');
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

const coreAnalyticsFacetOptions = getCoreAnalyticsFacetOptions(coreAnalyticsView);
assert.deepEqual(
  coreAnalyticsFacetOptions.map(({ key, label }) => ({ key, label })),
  [
    { key: 'message', label: 'Top Messages' },
    { key: 'name', label: 'Top Names' },
    { key: 'aggregationPeriod', label: 'Aggregation Periods' },
    { key: 'sampling', label: 'Sampling Values' },
  ],
  'CoreAnalytics facet options preserve the existing group order and labels'
);
assert.deepEqual(
  coreAnalyticsFacetOptions[0].options.slice(0, 3),
  [
    { value: 'com.example.launch', query: 'com.example.launch', count: 3 },
    { value: 'com.example.session', query: 'com.example.session', count: 3 },
    { value: 'com.example.network', query: 'com.example.network', count: 2 },
  ],
  'CoreAnalytics facet options preserve deterministic visible value ordering and counts'
);
assert.equal(
  coreAnalyticsFacetOptions[0].options[0].value,
  coreAnalyticsFacetOptions[0].options[0].query,
  'CoreAnalytics facet options map the visible value directly to the existing search query'
);
assert.equal(
  filterSectionsByQuery(coreAnalyticsSections, coreAnalyticsFacetOptions[0].options[0].query).totalMatches,
  coreAnalyticsSearch.totalMatches,
  'CoreAnalytics facet query values use the existing substring search behavior'
);
const selectedCoreAnalyticsFacet = coreAnalyticsFacetOptions[0].options[0];
const facetDrivenSearch = filterSectionsByQuery(coreAnalyticsSections, selectedCoreAnalyticsFacet.query);
const manualSearchForFacet = filterSectionsByQuery(coreAnalyticsSections, 'com.example.launch');
assert.deepEqual(facetDrivenSearch, manualSearchForFacet, 'facet-driven search matches the existing manual substring search result');
const facetVisibleSections = facetDrivenSearch.sections.map((section) => getVisibleSectionForCopy(section));
const manualVisibleSections = manualSearchForFacet.sections.map((section) => getVisibleSectionForCopy(section));
assert.equal(
  serializeSectionsForExport(facetVisibleSections),
  serializeSectionsForExport(manualVisibleSections),
  'facet-driven text export uses the same filtered visible sections as manual search'
);
assert.equal(
  serializeSectionsForJsonExport(facetVisibleSections),
  serializeSectionsForJsonExport(manualVisibleSections),
  'facet-driven JSON export uses the same filtered visible sections as manual search'
);
assert.deepEqual(
  filterSectionsByQuery(coreAnalyticsSections, coreAnalyticsFacetOptions[0].options[1].query).sections,
  filterSectionsByQuery(coreAnalyticsSections, coreAnalyticsFacetOptions[0].options[1].value).sections,
  'selecting another facet replaces the active query without changing substring semantics'
);

const facetAccessibleNames = coreAnalyticsFacetOptions
  .flatMap((group) => group.options.map((option) => `${group.label}: ${option.value}, ${option.count} occurrences`))
  .join('\n');
assert.doesNotMatch(facetAccessibleNames, /22222222-3333-4444-5555-666666666666|DEVICE-COREANALYTICS-0002|BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF|SESSION-COREANALYTICS-0002/, 'facet accessible names contain only sanitized visible values');

const duplicateFacetValue = {};
duplicateFacetValue.self = duplicateFacetValue;
const inheritedFacetOption = Object.create({ value: 'INHERITED-FACET-SENTINEL', count: 1 });
const customFacetView = {
  isCoreAnalytics: true,
  facets: {
    values: {
      message: [
        { value: 'Same visible value', count: 2 },
        { value: 'Same visible value', count: 9 },
        { value: '  ', count: 1 },
        { value: { nested: 'NESTED-FACET-SENTINEL' }, count: 1 },
        { value: duplicateFacetValue, count: 1 },
        inheritedFacetOption,
        { value: '__proto__', count: 1 },
        { value: 'constructor', count: 1 },
        { value: 'prototype', count: 1 },
      ],
      name: [{ value: 'Same visible value', count: 4 }],
      aggregationPeriod: [],
      sampling: [],
    },
  },
};
const customFacetRowsBefore = customFacetView.facets.values.message.slice();
const customFacetOptions = getCoreAnalyticsFacetOptions(customFacetView);
assert.deepEqual(
  customFacetOptions.find(({ key }) => key === 'message').options,
  [{ value: 'Same visible value', query: 'Same visible value', count: 2 }],
  'CoreAnalytics facet options deduplicate visible values and exclude unsafe values'
);
assert.deepEqual(
  customFacetOptions.find(({ key }) => key === 'name').options,
  [{ value: 'Same visible value', query: 'Same visible value', count: 4 }],
  'CoreAnalytics facet options keep identical text separate across categories'
);
assert.deepEqual(
  customFacetView.facets.values.message,
  customFacetRowsBefore,
  'CoreAnalytics facet option generation does not mutate input rows'
);
assert.equal(duplicateFacetValue.self, duplicateFacetValue, 'cyclic facet values remain untouched and excluded safely');

const missingFacetView = {
  isCoreAnalytics: true,
  facets: { values: { message: [{ value: 'Only visible value', count: 1 }] } },
};
const nonCoreAnalyticsView = getCoreAnalyticsView(ipsSections);
assert.deepEqual(
  getCoreAnalyticsFacetOptions(missingFacetView).map(({ key, options }) => ({ key, options })),
  [
    { key: 'message', options: [{ value: 'Only visible value', query: 'Only visible value', count: 1 }] },
    { key: 'name', options: [] },
    { key: 'aggregationPeriod', options: [] },
    { key: 'sampling', options: [] },
  ],
  'CoreAnalytics facet options handle missing optional categories with stable empty groups'
);
assert.deepEqual(getCoreAnalyticsFacetOptions(nonCoreAnalyticsView), [], 'non-CoreAnalytics views do not expose facet options');
assert.deepEqual(getCoreAnalyticsFacetOptions({ isCoreAnalytics: true, facets: { values: null } }), [], 'malformed CoreAnalytics facet views fail safely');

const largeCoreAnalyticsView = getCoreAnalyticsView(largeCoreAnalyticsSections);
const largeCoreAnalyticsFacetOptions = getCoreAnalyticsFacetOptions(largeCoreAnalyticsView);
assert.equal(
  largeCoreAnalyticsFacetOptions.find(({ key }) => key === 'message').options.some(({ value }) => value === 'SyntheticMetricGroup-249'),
  false,
  'CoreAnalytics facet options cannot expose values outside the existing 100-row cap'
);
const cappedCoreAnalyticsSentinel = 'SyntheticMetricGroup-249';
const cappedCoreAnalyticsSearch = filterSectionsByQuery(largeCoreAnalyticsSections, cappedCoreAnalyticsSentinel);
const cappedCoreAnalyticsVisibleSections = cappedCoreAnalyticsSearch.sections.map((section) => getVisibleSectionForCopy(section));
assert.equal(cappedCoreAnalyticsSearch.totalMatches, 0, 'capped-out CoreAnalytics values are not searchable');
assert.deepEqual(cappedCoreAnalyticsSearch.navigationTargets, [], 'capped-out CoreAnalytics values do not create navigation targets');
assert.deepEqual(cappedCoreAnalyticsSearch.matchRegions, [], 'capped-out CoreAnalytics values do not create match metadata');
assert.doesNotMatch(serializeSectionsForExport(cappedCoreAnalyticsVisibleSections), new RegExp(cappedCoreAnalyticsSentinel), 'capped-out CoreAnalytics values are excluded from text export');
assert.doesNotMatch(serializeSectionsForJsonExport(cappedCoreAnalyticsVisibleSections), new RegExp(cappedCoreAnalyticsSentinel), 'capped-out CoreAnalytics values are excluded from JSON export');
assert.doesNotMatch(serializeSectionsForCopy(cappedCoreAnalyticsVisibleSections), new RegExp(cappedCoreAnalyticsSentinel), 'capped-out CoreAnalytics values are excluded from copy output');

const nonCoreAnalyticsFacetCases = [
  ['App Crash', fullIpsText],
  ['Legacy Crash', fullCrashText],
  ['Watchdog', watchdogText],
  ['Jetsam', jetsamText],
  ['Panic', panicText],
  ['Generic Analytics', analyticsText],
  ['AccessoryCrash', accessoryCrashParserFixture],
  ['CPU Resource', cpuResourceParserFixture],
  ['Disk Writes Resource', diskWritesParserFixture],
  ['Stackshot Resource', stackshotParserFixture],
];
for (const [label, fixture] of nonCoreAnalyticsFacetCases) {
  const sections = parseInput(fixture);
  assert.deepEqual(
    getCoreAnalyticsFacetOptions(getCoreAnalyticsView(sections)),
    [],
    `${label} does not expose CoreAnalytics facet controls`
  );
}

const usableCoreAnalyticsFacetOptions = coreAnalyticsFacetOptions.flatMap((group) => group.options);
const coreAnalyticsBeforeRepeatedWorkflow = JSON.stringify(coreAnalyticsSections);
for (let cycle = 0; cycle < 20; cycle += 1) {
  const option = usableCoreAnalyticsFacetOptions[cycle % usableCoreAnalyticsFacetOptions.length];
  const filtered = filterSectionsByQuery(coreAnalyticsSections, option.query);
  const visible = filtered.sections.map((section) => getVisibleSectionForCopy(section));
  serializeSectionForCopy(visible[0]);
  serializeSectionsForExport(visible);
  serializeSectionsForJsonExport(visible);
  filterSectionsByQuery(coreAnalyticsSections, '');
}
assert.equal(JSON.stringify(coreAnalyticsSections), coreAnalyticsBeforeRepeatedWorkflow, 'repeated facet/search/export cycles do not mutate CoreAnalytics sections');

assert.equal(largeCoreAnalyticsView.tables.eventTypes.capped, true, 'CoreAnalytics view marks capped grouped event tables');
assert.equal(largeCoreAnalyticsView.tables.sampleRecords.capped, true, 'CoreAnalytics view marks capped sample record tables');
assert.deepEqual(
  largeCoreAnalyticsView.tables.eventTypes.counts,
  { known: true, shown: 100, total: 200 },
  'CoreAnalytics view parses capped grouped event counts'
);

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

function comparisonEntry(fields, {
  parserType = 'panic',
  supported = true,
  sections = null,
  sourceText = '',
} = {}) {
  return {
    classification: { parserType, supported },
    sections: sections ?? [
      {
        id: 'panic-summary',
        title: 'Panic Summary',
        fields,
      },
    ],
    sourceText,
  };
}

const comparisonReportOne = comparisonEntry([
  { label: 'Timestamp', value: '2026-07-01 10:00:00' },
  { label: 'OS Version', value: 'iOS 18.0' },
  { label: 'Device', value: 'iPhone15,2' },
  { label: 'Bug Type', value: '210' },
  { label: 'Primary Reason', value: 'CPU usage exceeded' },
]);
const comparisonReportTwo = comparisonEntry([
  { label: 'Timestamp', value: '2026-07-02 09:00:00' },
  { label: 'OS Version', value: 'iOS 18.0' },
  { label: 'Device', value: 'iPhone16,1' },
  { label: 'Bug Type', value: '210' },
  { label: 'Primary Reason', value: 'CPU usage exceeded' },
]);

const localLabelInput = '  Before\t\n Update\u0000\u0007!  ';
assert.equal(
  normalizeComparisonLocalLabel(localLabelInput),
  'Before Update!',
  'comparison local labels trim, normalize whitespace, remove controls, and remove line breaks'
);
assert.equal(
  normalizeComparisonLocalLabel('Before   Update: v1.7!'),
  'Before Update: v1.7!',
  'comparison local labels preserve ordinary punctuation'
);
assert.equal(
  normalizeComparisonLocalLabel('  前回 🚀 レポート  '),
  '前回 🚀 レポート',
  'comparison local labels preserve Unicode letters, numbers, and punctuation'
);
assert.equal(normalizeComparisonLocalLabel('   \t\n  '), '', 'blank local labels normalize to empty');
assert.equal(normalizeComparisonLocalLabel(null), '', 'non-string local labels normalize to empty');
assert.equal(normalizeComparisonLocalLabel(17), '', 'numeric local labels normalize to empty');
assert.equal(
  [...normalizeComparisonLocalLabel('🚀'.repeat(41))].length,
  40,
  'comparison local labels truncate by Unicode code point rather than UTF-16 code unit'
);
const stableLocalLabelInput = '  Stable label  ';
const stableLocalLabelSnapshot = stableLocalLabelInput;
assert.equal(normalizeComparisonLocalLabel(stableLocalLabelInput), 'Stable label', 'local label normalization is deterministic');
assert.equal(stableLocalLabelInput, stableLocalLabelSnapshot, 'local label normalization does not mutate its input');

const identitySections = [{ id: 'identity-summary', title: 'Identity Summary', fields: [] }];
const identityEntryOne = createComparisonEntry({
  classification: { parserType: 'panic', supported: true },
  sections: identitySections,
});
const identityEntryTwo = createComparisonEntry({
  classification: { parserType: 'panic', supported: true },
  sections: [{ id: 'identity-summary-two', title: 'Identity Summary Two', fields: [] }],
});
assert.equal(identityEntryOne.localLabel, '', 'new comparison entries start with an empty local label');
const sourceBoundEntry = createComparisonEntry({
  classification: { parserType: 'panic', supported: true },
  sections: identitySections,
  sourceText: 'PRIVATE-SOURCE-SENTINEL',
  sourceLabel: 'private-report.ips',
});
assert.deepEqual(
  Object.keys(sourceBoundEntry),
  ['classification', 'sections', 'localLabel'],
  'comparison entries exclude source text and source labels from identity metadata'
);
const identityEntries = [identityEntryOne, identityEntryTwo];
const identityEntriesSnapshot = JSON.stringify(identityEntries);
const labeledIdentityEntries = updateComparisonEntryLocalLabel(identityEntries, 0, ' Before   Update ');
assert.notStrictEqual(labeledIdentityEntries, identityEntries, 'label updates return a new comparison-entry array');
assert.notStrictEqual(labeledIdentityEntries[0], identityEntries[0], 'label updates return a new selected entry object');
assert.equal(labeledIdentityEntries[0].localLabel, 'Before Update', 'label updates store the normalized value');
assert.equal(labeledIdentityEntries[0].sections, identityEntryOne.sections, 'label updates preserve sanitized sections');
assert.equal(labeledIdentityEntries[0].classification.parserType, 'panic', 'label updates preserve parser classification');
assert.equal(labeledIdentityEntries[1], identityEntryTwo, 'label updates preserve other entry objects');
assert.equal(JSON.stringify(identityEntries), identityEntriesSnapshot, 'label updates do not mutate the prior entry array');
assert.equal(updateComparisonEntryLocalLabel(identityEntries, 99, 'ignored'), identityEntries, 'invalid label indexes leave state unchanged');

const relabeledIdentityEntries = updateComparisonEntryLocalLabel(labeledIdentityEntries, 1, 'After Update');
const removedIdentityEntries = removeComparisonEntry(relabeledIdentityEntries, 0);
assert.deepEqual(
  removedIdentityEntries.map((entry) => entry.localLabel),
  ['After Update'],
  'removing an entry discards only the removed label'
);
assert.equal(removedIdentityEntries[0], relabeledIdentityEntries[1], 'remaining entries retain their identity metadata');
assert.deepEqual(
  removedIdentityEntries.map((entry, index) => `Report ${index + 1} — ${entry.localLabel}`),
  ['Report 1 — After Update'],
  'remaining entries are re-numbered from current insertion order'
);
assert.equal(removeComparisonEntry(relabeledIdentityEntries, 99), relabeledIdentityEntries, 'invalid removal indexes leave state unchanged');

const comparisonAliasSentinel = 'Private Local Alias';
const aliasedComparisonEntries = [
  updateComparisonEntryLocalLabel(identityEntries, 0, comparisonAliasSentinel)[0],
  identityEntryTwo,
];
assert.equal(validateComparison(aliasedComparisonEntries).valid, true, 'local labels do not affect same-parser comparison validation');
const aliasedComparisonSections = createComparisonSections(aliasedComparisonEntries);
const aliasedComparisonJsonText = serializeSectionsForJsonExport(aliasedComparisonSections, { mode: 'comparison' });
const aliasedComparisonJson = JSON.parse(aliasedComparisonJsonText);
const aliasedComparisonCopy = aliasedComparisonSections.map((section) => serializeSectionForCopy(section)).join('\n');
const aliasedComparisonExport = serializeSectionsForExport(aliasedComparisonSections);
assert.doesNotMatch(JSON.stringify(aliasedComparisonSections), new RegExp(comparisonAliasSentinel), 'local labels do not enter generated comparison sections');
assert.doesNotMatch(aliasedComparisonCopy, new RegExp(comparisonAliasSentinel), 'local labels do not enter comparison copy output');
assert.doesNotMatch(aliasedComparisonExport, new RegExp(comparisonAliasSentinel), 'local labels do not enter comparison text export');
assert.doesNotMatch(aliasedComparisonJsonText, new RegExp(comparisonAliasSentinel), 'local labels do not enter comparison JSON export');
assert.equal(aliasedComparisonJson.mode, 'comparison', 'local labels do not change comparison JSON mode');
assert.equal(filterSectionsByQuery(aliasedComparisonSections, comparisonAliasSentinel).totalMatches, 0, 'local labels do not enter comparison search');
assert.deepEqual(filterSectionsByQuery(aliasedComparisonSections, comparisonAliasSentinel).matchRegions, [], 'local labels do not enter match metadata');
assert.deepEqual(
  filterSectionsByQuery(aliasedComparisonSections, comparisonAliasSentinel).navigationTargets,
  [],
  'local labels do not enter Search Result Navigation targets'
);
assert.doesNotMatch(comparisonModelSource, /localLabel/, 'comparison model remains independent of UI-only local labels');

assert.doesNotMatch(
  comparisonModelSource,
  /\b(?:document|window|navigator|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|caches|serviceWorker)\b|filterSections|serializeSection|renderSection/,
  'comparison model remains independent of browser, network, storage, search, copy, and rendering APIs'
);

assert.match(
  mainScriptText,
  /comparisonList\.replaceChildren\(\.\.\.items\)/,
  'comparison rerenders replace the complete entry list without accumulating controls'
);
assert.match(
  mainScriptText,
  /displayLabel\.textContent = formatComparisonEntryLabel\(comparisonEntries\[index\], index\)/,
  'local-label updates use safe text insertion for the visible identity'
);
assert.doesNotMatch(
  mainScriptText,
  /(?:displayLabel|localLabelInput)[^]*(?:innerHTML|outerHTML)/,
  'local-label UI never interprets user text as HTML'
);
assert.match(
  mainScriptText,
  /localLabelInput\.addEventListener\('input', \(event\) => \{[^]*updateComparisonEntryLocalLabel\(comparisonEntries, index, event\.currentTarget\.value\)/,
  'rapid label edits update only the selected comparison entry through the frozen state path'
);
assert.match(
  mainScriptText,
  /localLabelInput\.addEventListener\('blur', \(\) => \{[^]*localLabelInput\.value = comparisonEntries\[index\]\?\.localLabel \?\? '';/,
  'normalized local-label state is restored to the input after editing'
);
assert.match(
  mainScriptText,
  /comparisonStatus\.textContent = comparisonMessage/,
  'comparison eligibility feedback uses the existing status element'
);
assert.match(
  mainScriptText,
  /if \(reportCount === 0\) return 'No reports added\.'/,
  'empty comparison selection has neutral status feedback'
);
assert.match(
  mainScriptText,
  /if \(reportCount === 1 \|\| validation\.code === 'too-few-reports'\) return 'Add one or two more reports of the same type to compare\.'/,
  'incomplete selection gives actionable same-type guidance'
);
assert.match(
  mainScriptText,
  /if \(validation\.code === 'mixed-parser-types'\) return 'Selected reports must use the same parser type\.'/,
  'mixed-parser feedback stays generic and privacy-safe'
);
assert.match(
  mainScriptText,
  /if \(validation\.code === 'too-many-reports' \|\| reportCount > 3\) return 'Comparison supports up to three reports\.'/,
  'maximum-report feedback stays explicit without changing the limit'
);
assert.match(
  mainScriptText,
  /focusComparisonEntry\(focusIndex\)/,
  'removal restores focus through the existing comparison control path'
);
assert.match(
  mainScriptText,
  /const focusIndex = comparisonEntries\.length \? Math\.min\(index, comparisonEntries\.length - 1\) : -1/,
  'removal focus chooses the next surviving entry or the previous entry at the end'
);
assert.match(
  mainScriptText,
  /comparisonEntries = \[\];\s+exitComparisonMode\(\);\s+clearSearchState\(\);/,
  'clear comparison removes identity state and resets comparison search state'
);
assert.match(
  mainScriptText,
  /comparisonEntries = \[\];\s+comparisonMessage = 'No reports added\.';\s+exitComparisonMode\(\);/,
  'clear report removes comparison identity and mode state'
);
assert.doesNotMatch(
  `${mainScriptText}\n${appStateSource}`,
  /(?:localLabel|comparison-local-label)[^]*(?:localStorage|sessionStorage|indexedDB|document\.cookie|history\.pushState|history\.replaceState|URLSearchParams)/,
  'local-label state has no browser persistence path'
);

const hostileComparisonLabel = normalizeComparisonLocalLabel('<img src=x onerror=alert(1)>');
assert.equal(
  hostileComparisonLabel,
  '<img src=x onerror=alert(1)>',
  'hostile-looking local labels remain ordinary normalized text'
);

const workflowEntriesSnapshot = JSON.stringify([comparisonReportOne, comparisonReportTwo]);
for (let cycle = 0; cycle < 20; cycle += 1) {
  let workflowEntries = [
    createComparisonEntry({ classification: comparisonReportOne.classification, sections: comparisonReportOne.sections }),
    createComparisonEntry({ classification: comparisonReportTwo.classification, sections: comparisonReportTwo.sections }),
    createComparisonEntry({ classification: comparisonReportOne.classification, sections: comparisonReportOne.sections }),
  ];

  workflowEntries = updateComparisonEntryLocalLabel(workflowEntries, 0, `Before ${cycle}`);
  workflowEntries = updateComparisonEntryLocalLabel(workflowEntries, 1, 'Private Local Alias');
  workflowEntries = updateComparisonEntryLocalLabel(workflowEntries, 2, 'After Update');
  assert.equal(validateComparison(workflowEntries).valid, true, `repeated cycle ${cycle + 1} remains comparison-compatible`);

  const workflowSections = createComparisonSections(workflowEntries);
  const workflowSearch = filterSectionsByQuery(workflowSections, 'Private Local Alias');
  assert.equal(workflowSearch.totalMatches, 0, `repeated cycle ${cycle + 1} keeps aliases out of search`);
  assert.deepEqual(workflowSearch.navigationTargets, [], `repeated cycle ${cycle + 1} keeps aliases out of navigation targets`);

  const workflowText = serializeSectionsForExport(workflowSections);
  const workflowJson = serializeSectionsForJsonExport(workflowSections, { mode: 'comparison' });
  assert.doesNotMatch(workflowText, /Private Local Alias/, `repeated cycle ${cycle + 1} keeps aliases out of text export`);
  assert.doesNotMatch(workflowJson, /Private Local Alias/, `repeated cycle ${cycle + 1} keeps aliases out of JSON export`);

  const afterMiddleRemoval = removeComparisonEntry(workflowEntries, 1);
  assert.deepEqual(
    afterMiddleRemoval.map((entry) => entry.localLabel),
    [`Before ${cycle}`, 'After Update'],
    `repeated cycle ${cycle + 1} preserves surviving aliases after middle removal`
  );
  assert.equal(validateComparison(afterMiddleRemoval).valid, true, `repeated cycle ${cycle + 1} keeps two reports eligible`);
}
assert.equal(JSON.stringify([comparisonReportOne, comparisonReportTwo]), workflowEntriesSnapshot, 'repeated identity workflows do not mutate source entries');

assert.deepEqual(
  validateComparison([comparisonReportOne, comparisonReportTwo]),
  {
    valid: true,
    code: 'ok',
    message: 'Reports are compatible for comparison.',
    reportCount: 2,
    parserType: 'panic',
    reportIndex: null,
  },
  'comparison validation accepts two supported reports with the same parser type'
);
assert.equal(validateComparison([]).code, 'too-few-reports', 'comparison validation rejects fewer than two reports');
assert.equal(
  validateComparison([comparisonReportOne]).code,
  'too-few-reports',
  'comparison validation rejects one report'
);
assert.equal(
  validateComparison([comparisonReportOne, comparisonReportTwo, comparisonReportOne, comparisonReportTwo]).code,
  'too-many-reports',
  'comparison validation rejects more than three reports'
);
assert.equal(
  validateComparison([comparisonReportOne, comparisonEntry([], { parserType: 'jetsam' })]).code,
  'mixed-parser-types',
  'comparison validation rejects mixed parser types'
);
assert.equal(
  validateComparison([comparisonReportOne, null]).code,
  'malformed-entry',
  'comparison validation rejects malformed entries'
);
assert.equal(
  validateComparison([comparisonReportOne, { classification: { supported: true }, sections: [] }]).code,
  'missing-parser-type',
  'comparison validation rejects missing parser types'
);
assert.equal(
  validateComparison([comparisonReportOne, comparisonEntry([], { supported: false })]).code,
  'unsupported-report',
  'comparison validation rejects unsupported parser metadata'
);
assert.equal(
  validateComparison([comparisonReportOne, comparisonEntry([], { parserType: 'future-parser' })]).code,
  'unsupported-report',
  'comparison validation rejects unknown parser types even when metadata claims support'
);
assert.equal(
  validateComparison([comparisonReportOne, { classification: { parserType: 'panic', supported: true }, sections: {} }]).code,
  'invalid-sections',
  'comparison validation rejects non-array sections'
);
assert.equal(
  validateComparison([
    comparisonReportOne,
    comparisonEntry([], { sections: [{ id: 'panic-summary', title: 'Panic Summary', fields: {} }] }),
  ]).code,
  'invalid-sections',
  'comparison validation rejects malformed section fields'
);

const twoReportComparison = createComparisonSections([comparisonReportOne, comparisonReportTwo]);
assert.deepEqual(
  twoReportComparison.map((section) => section.id),
  [
    'comparison-overview',
    'comparison-report-summaries',
    'comparison-common-fields',
    'comparison-differences',
    'comparison-recurring-indicators',
    'comparison-notes',
  ],
  'comparison sections have stable output ordering'
);
assert.ok(
  twoReportComparison.every((section) =>
    ['id', 'title', 'priority', 'fields', 'raw', 'table', 'tableColumns', 'tableSummary', 'chart']
      .every((key) => Object.hasOwn(section, key))
  ),
  'comparison output uses the ordinary SectionModel shape'
);
assert.deepEqual(
  twoReportComparison[1].table.map((row) => row.report),
  ['Report 1', 'Report 2'],
  'comparison report summaries preserve insertion order'
);
assert.deepEqual(
  twoReportComparison[2].table.map((row) => row.field),
  ['OS Version', 'Bug Type', 'Primary Reason'],
  'comparison common fields preserve source field order'
);
assert.deepEqual(
  twoReportComparison[3].table.map((row) => row.field),
  ['Timestamp', 'Device'],
  'comparison differences contain changed fields in source order'
);
assert.deepEqual(
  twoReportComparison[4].table,
  [
    {
      indicator: 'Primary Reason',
      value: 'CPU usage exceeded',
      reports: 'Report 1, Report 2',
    },
  ],
  'comparison recurring indicators require matching allowlisted values'
);
const comparisonSearch = filterSectionsByQuery(twoReportComparison, 'iPhone16,1');
assert.ok(comparisonSearch.matchRegions.length > 0, 'comparison search exposes match metadata from sanitized comparison sections');
assert.deepEqual(
  comparisonSearch.sections.map((section) => section.id),
  ['comparison-report-summaries', 'comparison-differences'],
  'existing search filters generated comparison sections without a comparison-specific engine'
);
assert.deepEqual(
  comparisonSearch.navigationTargets.map((target) => target.id),
  comparisonSearch.sections.map((section) => section.id),
  'comparison search targets follow existing comparison section order'
);
const comparisonCopy = serializeSectionForCopy(sectionById(twoReportComparison, 'comparison-differences'));
assert.match(comparisonCopy, /Report 1\tReport 2/, 'existing copy serializes comparison report columns as plain text');
assert.match(comparisonCopy, /iPhone15,2\tiPhone16,1/, 'existing copy includes visible sanitized comparison values');

const comparisonReportThree = comparisonEntry([
  { label: 'Timestamp', value: '2026-06-30 08:00:00' },
  { label: 'OS Version', value: 'iOS 18.0' },
  { label: 'Device', value: 'iPhone14,5' },
  { label: 'Bug Type', value: '210' },
  { label: 'Primary Reason', value: ' CPU   usage exceeded ' },
]);
const threeReportComparison = createComparisonSections([
  comparisonReportOne,
  comparisonReportTwo,
  comparisonReportThree,
]);
assert.deepEqual(
  threeReportComparison[1].table.map((row) => row.report),
  ['Report 1', 'Report 2', 'Report 3'],
  'three-report comparison never sorts reports by timestamp or metadata'
);
assert.deepEqual(
  threeReportComparison[3].tableColumns.map((column) => column.label),
  ['Section', 'Field', 'Report 1', 'Report 2', 'Report 3', 'Status'],
  'three-report differences expose columns in insertion order'
);
assert.equal(
  threeReportComparison[4].table[0].reports,
  'Report 1, Report 2, Report 3',
  'recurring indicator normalization collapses whitespace without fuzzy matching'
);

const missingFieldComparison = createComparisonSections([
  comparisonReportOne,
  comparisonEntry([
    { label: 'Timestamp', value: '2026-07-02 09:00:00' },
    { label: 'OS Version', value: 'iOS 18.0' },
    { label: 'Bug Type', value: '210' },
    { label: 'Primary Reason', value: 'Different reason' },
  ]),
]);
const missingDeviceRow = missingFieldComparison[3].table.find((row) => row.field === 'Device');
assert.equal(missingDeviceRow.report2, 'Not present', 'comparison represents missing fields explicitly');
assert.equal(missingDeviceRow.status, 'Missing', 'comparison distinguishes missing values from changed values');

const duplicateComparison = createComparisonSections([comparisonReportOne, comparisonReportOne]);
assert.equal(duplicateComparison[3].table.length, 0, 'duplicate reports produce no differences');
assert.deepEqual(
  duplicateComparison,
  createComparisonSections([comparisonReportOne, comparisonReportOne]),
  'duplicate report comparison output is deterministic'
);

const numericComparison = createComparisonSections([
  comparisonEntry([{ label: 'Bug Type', value: 210 }]),
  comparisonEntry([{ label: 'Bug Type', value: 210 }]),
]);
assert.equal(
  numericComparison[2].table.find((row) => row.field === 'Bug Type')?.value,
  '210',
  'comparison preserves approved numeric scalar fields'
);

const comparisonLeakSentinel = 'PRIVATE-SOURCE-SENTINEL-12345';
const nestedLeakSentinel = 'NESTED-SENTINEL-67890';
const privateComparisonEntry = comparisonEntry(
  [
    { label: 'OS Version', value: 'iOS 18.0' },
    { label: 'Primary Reason', value: { nested: nestedLeakSentinel } },
    { label: 'Private Value', value: comparisonLeakSentinel },
  ],
  {
    sourceText: comparisonLeakSentinel,
    sections: [
      {
        id: 'panic-summary',
        title: 'Panic Summary',
        fields: [
          { label: 'OS Version', value: 'iOS 18.0' },
          { label: 'Primary Reason', value: { nested: nestedLeakSentinel } },
          { label: 'Private Value', value: comparisonLeakSentinel },
        ],
        raw: comparisonLeakSentinel,
      },
    ],
  }
);
const privateComparisonOutput = JSON.stringify(
  createComparisonSections([privateComparisonEntry, privateComparisonEntry])
);
assert.doesNotMatch(privateComparisonOutput, new RegExp(comparisonLeakSentinel), 'comparison ignores source text, raw notes, and non-allowlisted fields');
assert.doesNotMatch(privateComparisonOutput, new RegExp(nestedLeakSentinel), 'comparison never stringifies nested field values');
const comparisonTableLeakSentinel = 'HIDDEN-TABLE-SENTINEL-24680';
const tablePrivateComparisonEntry = comparisonEntry(
  [{ label: 'OS Version', value: 'iOS 18.0' }],
  {
    sections: [{
      id: 'panic-summary',
      title: 'Panic Summary',
      fields: [{ label: 'OS Version', value: 'iOS 18.0' }],
      table: [{ hidden: comparisonTableLeakSentinel }],
      raw: comparisonTableLeakSentinel,
    }],
  }
);
const tablePrivateComparison = createComparisonSections([tablePrivateComparisonEntry, tablePrivateComparisonEntry]);
assert.doesNotMatch(JSON.stringify(tablePrivateComparison), new RegExp(comparisonTableLeakSentinel), 'comparison excludes source tables and raw section text');
assert.equal(filterSectionsByQuery(tablePrivateComparison, comparisonTableLeakSentinel).totalMatches, 0, 'comparison search cannot reach excluded table data');
assert.doesNotMatch(serializeSectionsForCopy(tablePrivateComparison), new RegExp(comparisonTableLeakSentinel), 'comparison copy cannot reach excluded table data');

const supportedComparisonCases = [
  ['ips', fullIpsText],
  ['crash', fullCrashText],
  ['ips-watchdog-stackshot', watchdogText],
  ['jetsam', jetsamText],
  ['panic', panicText],
  ['analytics', analyticsText],
  ['coreanalytics', coreAnalyticsMediumText],
  ['accessory-crash', accessoryCrashParserFixture],
  ['resource-cpu', cpuResourceParserFixture],
  ['resource-diskwrites', diskWritesParserFixture],
  ['resource-stackshot', stackshotParserFixture],
];

for (const [parserType, fixture] of supportedComparisonCases) {
  const classification = classifyDiagnostic(fixture);
  const sections = parseInput(fixture);
  const entries = [
    { classification: { parserType: classification.parserType, supported: classification.supported }, sections },
    { classification: { parserType: classification.parserType, supported: classification.supported }, sections },
  ];
  const beforeComparison = JSON.stringify(entries);
  const comparison = createComparisonSections(entries);

  assert.equal(classification.parserType, parserType, `${parserType} keeps its parser type for comparison`);
  assert.equal(validateComparison(entries).valid, true, `${parserType} accepts compatible sanitized reports`);
  assert.deepEqual(comparison, createComparisonSections(entries), `${parserType} comparison output is deterministic`);
  assert.equal(JSON.stringify(entries), beforeComparison, `${parserType} comparison does not retain or mutate parser output`);
  assert.equal(comparison[0].fields.find((field) => field.label === 'Comparison Mode')?.value, 'Sanitized only', `${parserType} comparison remains sanitized only`);
}

for (const [parserType, fixture] of supportedComparisonCases) {
  const sections = parseInput(fixture);
  const beforeExport = JSON.stringify(sections);
  const visibleSections = sections.map((section) => getVisibleSectionForCopy(section, { allSections: sections }));
  const exportText = serializeSectionsForExport(visibleSections);

  assert.ok(exportText, `${parserType} produces sanitized visible export content`);
  assert.equal(exportText, serializeSectionsForExport(visibleSections), `${parserType} visible export is deterministic`);
  assert.equal(
    exportText,
    visibleSections.map((section) => serializeSectionsForExport([section])).join('\n\n---\n\n'),
    `${parserType} visible export preserves ordered sections`
  );
  assert.equal(JSON.stringify(sections), beforeExport, `${parserType} visible export does not mutate parser output`);
  assert.equal(exportText.startsWith(sections[0].title), true, `${parserType} visible export preserves its first section`);
  assert.doesNotMatch(
    serializeSectionsForExport(visibleSections.map((section) => ({
      ...section,
      sourceOnly: `${parserType}-EXPORT-SOURCE-SENTINEL`,
      raw: `${parserType}-EXPORT-RAW-SENTINEL`,
    }))),
    new RegExp(`${parserType}-EXPORT-(?:SOURCE|RAW)-SENTINEL`),
    `${parserType} export ignores source-only and raw section values`
  );
}

const searchCopyParityText = searchScopedExport.map((section) => serializeSectionForCopy(section)).join('\n\n---\n\n');
assert.equal(searchScopedExportText, searchCopyParityText, 'search, copy, and export share the same visible section content');
const clearedSearchExportText = serializeSectionsForExport(
  searchScopedExportSource.map((section) => getVisibleSectionForCopy(section, { allSections: searchScopedExportSource }))
);
assert.match(clearedSearchExportText, /FILTERED_EXPORT_SENTINEL/, 'clearing search restores eligible visible export content');

const largeStackshotExportText = serializeSectionsForExport(
  largeRoutedStackshotSections.map((section) => getVisibleSectionForCopy(section, { allSections: largeRoutedStackshotSections }))
);
assert.match(largeStackshotExportText, /LargeStackProcess149/, 'Stackshot export includes capped visible process rows');
assert.doesNotMatch(largeStackshotExportText, /LargeStackProcess0/, 'Stackshot export excludes process rows beyond the parser cap');

const largeCoreAnalyticsExportText = serializeSectionsForExport(
  largeCoreAnalyticsSections.map((section) => getVisibleSectionForCopy(section, { allSections: largeCoreAnalyticsSections }))
);
assert.match(largeCoreAnalyticsExportText, /100 of/, 'CoreAnalytics export retains rendered-row cap summaries');
assert.doesNotMatch(largeCoreAnalyticsExportText, /com\.example\.event\.199/, 'CoreAnalytics export excludes rows beyond the parser cap');

const twoReportComparisonExport = serializeSectionsForExport(twoReportComparison);
const twoReportComparisonJson = serializeSectionsForJsonExport(twoReportComparison, { mode: 'comparison' });
const threeReportComparisonExport = serializeSectionsForExport(threeReportComparison);
assert.equal(twoReportComparisonExport, serializeSectionsForExport(twoReportComparison), 'two-report comparison export is deterministic');
assert.equal(threeReportComparisonExport, serializeSectionsForExport(threeReportComparison), 'three-report comparison export is deterministic');
assert.match(twoReportComparisonExport, /Comparison Mode: Sanitized only/, 'comparison export remains sanitized only');
assert.ok(
  threeReportComparisonExport.indexOf('Report 1') < threeReportComparisonExport.indexOf('Report 2') &&
    threeReportComparisonExport.indexOf('Report 2') < threeReportComparisonExport.indexOf('Report 3'),
  'comparison export preserves report insertion order'
);
assert.doesNotMatch(
  serializeSectionsForExport(tablePrivateComparison),
  new RegExp(comparisonTableLeakSentinel),
  'comparison export excludes hidden source tables and raw content'
);

const jsonExportSections = [
  {
    id: 'json-first',
    title: 'First Section',
    fields: [
      { label: 'Safe Field', value: 'safe-value' },
      { label: 'Nested Field', value: { secret: 'JSON-NESTED-SENTINEL' } },
    ],
    tableSummary: '2 visible rows',
    tableColumns: [
      { key: 'name', label: 'Name' },
      { key: 'count', label: 'Count' },
    ],
    table: [
      { name: 'Row 1', count: 1, hidden: 'JSON-HIDDEN-SENTINEL' },
      { name: 'Row 2', count: 2 },
    ],
    chart: {
      title: 'Safe Chart',
      items: [
        { label: 'A', value: 1 },
        { label: 'Nested', value: { secret: 'JSON-CHART-SENTINEL' } },
      ],
    },
    raw: 'JSON-RAW-SENTINEL',
    sourceOnly: 'JSON-SOURCE-SENTINEL',
  },
  {
    id: 'json-second',
    title: 'Second Section',
    fields: [{ label: 'Later Field', value: true }],
  },
];
const jsonExportBefore = JSON.stringify(jsonExportSections);
const jsonExportText = serializeSectionsForJsonExport(jsonExportSections, { mode: 'comparison' });
const jsonExport = JSON.parse(jsonExportText);
assert.deepEqual(
  Object.keys(jsonExport),
  ['format', 'version', 'mode', 'sections'],
  'JSON export uses a stable top-level schema'
);
assert.equal(jsonExport.format, 'ios-analytics-visible-export', 'JSON export identifies its format');
assert.equal(jsonExport.version, 1, 'JSON export uses schema version 1');
assert.equal(jsonExport.mode, 'comparison', 'JSON export preserves the explicit comparison mode');
assert.deepEqual(
  jsonExport.sections.map((section) => section.title),
  ['First Section', 'Second Section'],
  'JSON export preserves section order'
);
assert.deepEqual(
  jsonExport.sections[0].fields,
  [{ label: 'Safe Field', value: 'safe-value' }],
  'JSON export keeps scalar fields and omits nested field values'
);
assert.deepEqual(
  jsonExport.sections[0].table,
  [{ name: 'Row 1', count: 1 }, { name: 'Row 2', count: 2 }],
  'JSON export preserves visible table rows and allowlisted columns'
);
assert.deepEqual(
  jsonExport.sections[0].chart,
  { title: 'Safe Chart', items: [{ label: 'A', value: 1 }] },
  'JSON export keeps scalar chart values and omits nested chart values'
);
assert.equal(jsonExportText, serializeSectionsForJsonExport(jsonExportSections, { mode: 'comparison' }), 'JSON export is deterministic');
assert.equal(JSON.stringify(jsonExportSections), jsonExportBefore, 'JSON export does not mutate input sections');
for (const sentinel of [
  'JSON-NESTED-SENTINEL',
  'JSON-CHART-SENTINEL',
  'JSON-HIDDEN-SENTINEL',
  'JSON-RAW-SENTINEL',
  'JSON-SOURCE-SENTINEL',
]) {
  assert.doesNotMatch(jsonExportText, new RegExp(sentinel), `JSON export excludes ${sentinel}`);
}
assert.equal(JSON.parse(serializeSectionsForJsonExport([])).sections.length, 0, 'JSON export handles empty arrays safely');
assert.equal(serializeSectionsForJsonExport(null), '', 'JSON export handles malformed section collections safely');
assert.equal(JSON.parse(serializeSectionsForJsonExport([{ title: 'Safe Empty Section', fields: null, table: [null] }])).sections.length, 1, 'JSON export handles malformed section content safely');

for (const [parserType, fixture] of supportedComparisonCases) {
  const sections = parseInput(fixture);
  const visibleSections = sections.map((section) => getVisibleSectionForCopy(section, { allSections: sections }));
  const beforeSections = JSON.stringify(sections);
  const serialized = serializeSectionsForJsonExport(visibleSections);
  const payload = JSON.parse(serialized);

  assert.equal(payload.version, 1, `${parserType} JSON export keeps schema version 1`);
  assert.equal(payload.mode, 'single', `${parserType} JSON export defaults to single-report mode`);
  assert.deepEqual(
    payload.sections.map((section) => section.title),
    visibleSections.map((section) => section.title),
    `${parserType} JSON export preserves section order`
  );
  assert.equal(serialized, serializeSectionsForJsonExport(visibleSections), `${parserType} JSON export is deterministic`);
  assert.equal(JSON.stringify(sections), beforeSections, `${parserType} JSON export does not mutate parser output`);
}

const threeReportComparisonJson = JSON.parse(serializeSectionsForJsonExport(threeReportComparison, { mode: 'comparison' }));
const twoReportComparisonPayload = JSON.parse(twoReportComparisonJson);
assert.equal(twoReportComparisonPayload.mode, 'comparison', 'two-report JSON comparison uses comparison mode');
assert.equal(twoReportComparisonPayload.sections.length > 0, true, 'two-report JSON comparison includes generated sections');
assert.equal(threeReportComparisonJson.mode, 'comparison', 'three-report JSON comparison uses comparison mode');
assert.deepEqual(
  threeReportComparisonJson.sections.map((section) => section.title),
  threeReportComparison.map((section) => section.title),
  'three-report JSON comparison preserves generated section order'
);
assert.equal(
  JSON.stringify(threeReportComparisonJson),
  JSON.stringify(JSON.parse(serializeSectionsForJsonExport(threeReportComparison, { mode: 'comparison' }))),
  'three-report JSON comparison is deterministic'
);

const largeGeneratedCoreAnalyticsText = createLargeCoreAnalyticsFixture();
const largeGeneratedStackshotText = createLargeStackshotFixture();
const workloadPrivacyPattern = /(?:\/private\/var|\/var\/mobile|0x[0-9a-f]{8,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?:[0-9a-f]{2}:){5}[0-9a-f]{2})/i;

assert.equal(
  largeGeneratedCoreAnalyticsText,
  createLargeCoreAnalyticsFixture(),
  'large CoreAnalytics workload generation is deterministic'
);
assert.equal(
  largeGeneratedStackshotText,
  createLargeStackshotFixture(),
  'large Stackshot workload generation is deterministic'
);
assert.equal(
  largeGeneratedCoreAnalyticsText.split(/\r?\n/).length,
  LARGE_CORE_ANALYTICS_EVENT_COUNT + 2,
  'large CoreAnalytics workload has the declared event count'
);
assert.equal(
  JSON.parse(largeGeneratedStackshotText.split(/\r?\n/)[1]).processByPid &&
    Object.keys(JSON.parse(largeGeneratedStackshotText.split(/\r?\n/)[1]).processByPid).length,
  LARGE_STACKSHOT_PROCESS_COUNT,
  'large Stackshot workload has the declared process count'
);
assert.ok(
  Buffer.byteLength(largeGeneratedCoreAnalyticsText) >= 1_000_000 &&
    Buffer.byteLength(largeGeneratedCoreAnalyticsText) <= 5_000_000,
  'large CoreAnalytics workload stays inside the 1-5 MB target range'
);
assert.ok(
  Buffer.byteLength(largeGeneratedStackshotText) >= 1_000_000 &&
    Buffer.byteLength(largeGeneratedStackshotText) <= 5_000_000,
  'large Stackshot workload stays inside the 1-5 MB target range'
);
assert.doesNotMatch(largeGeneratedCoreAnalyticsText, workloadPrivacyPattern, 'large CoreAnalytics workload contains no identifier-like privacy sentinels');
assert.doesNotMatch(largeGeneratedStackshotText, workloadPrivacyPattern, 'large Stackshot workload contains no identifier-like privacy sentinels');
assert.doesNotMatch(
  largeWorkloadSource,
  /Math\.random|Date\.now|crypto|fetch\(|localStorage|sessionStorage|indexedDB|createObjectURL|cache\.put/,
  'large workload generator has no nondeterministic, browser, storage, or network behavior'
);

const generatedCoreSections = parseInput(largeGeneratedCoreAnalyticsText);
const generatedCoreEventTypes = sectionById(generatedCoreSections, 'coreanalytics-event-types');
const generatedCoreSampleRecords = sectionById(generatedCoreSections, 'coreanalytics-sample-records');
assert.equal(
  fieldValue(sectionById(generatedCoreSections, 'coreanalytics-record-overview'), 'Total event records'),
  String(LARGE_CORE_ANALYTICS_EVENT_COUNT),
  'large CoreAnalytics parsing preserves the generated source record count'
);
assert.equal(generatedCoreEventTypes.table.length, 100, 'large CoreAnalytics event groups keep the existing 100-row cap');
assert.equal(generatedCoreSampleRecords.table.length, 100, 'large CoreAnalytics sample records keep the existing 100-row cap');
assert.equal(
  generatedCoreEventTypes.tableSummary,
  `100 of ${LARGE_CORE_ANALYTICS_GROUP_COUNT} event groups shown`,
  'large CoreAnalytics event-group summary reports visible and total rows'
);
assert.equal(
  generatedCoreSampleRecords.tableSummary,
  `100 of ${LARGE_CORE_ANALYTICS_EVENT_COUNT} event records shown`,
  'large CoreAnalytics sample summary reports visible and total rows'
);
assert.deepEqual(
  parseInput(largeGeneratedCoreAnalyticsText),
  generatedCoreSections,
  'large CoreAnalytics parser output is deterministic'
);

const generatedStackshotSections = parseInput(largeGeneratedStackshotText);
const generatedStackshotTable = sectionById(generatedStackshotSections, 'resource-stackshot-top-processes');
assert.equal(generatedStackshotTable.table.length, 100, 'large Stackshot output keeps the existing 100-row cap');
assert.equal(
  generatedStackshotTable.tableSummary,
  `100 of ${LARGE_STACKSHOT_PROCESS_COUNT} processes shown`,
  'large Stackshot summary reports visible and total process rows'
);
assert.deepEqual(
  parseInput(largeGeneratedStackshotText),
  generatedStackshotSections,
  'large Stackshot parser output is deterministic'
);

const generatedCoreSearchHit = filterSectionsByQuery(generatedCoreSections, 'SyntheticMetricGroup-000');
assert.ok(generatedCoreSearchHit.totalMatches > 0, 'large CoreAnalytics search finds rendered rows');
assert.equal(
  filterSectionsByQuery(generatedCoreSections, 'SyntheticMetricGroup-249').totalMatches,
  0,
  'large CoreAnalytics search does not scan capped-out source groups'
);
assert.equal(
  filterSectionsByQuery(generatedStackshotSections, 'SyntheticStackProcess-04900').totalMatches,
  0,
  'large Stackshot search does not scan processes outside the rendered cap'
);

const generatedCoreVisibleSections = generatedCoreSections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: generatedCoreSections })
);
const generatedStackshotVisibleSections = generatedStackshotSections.map((section) =>
  getVisibleSectionForCopy(section, { allSections: generatedStackshotSections })
);
const generatedCoreTextExport = serializeSectionsForExport(generatedCoreVisibleSections);
const generatedCoreJsonExport = serializeSectionsForJsonExport(generatedCoreVisibleSections);
const generatedStackshotTextExport = serializeSectionsForExport(generatedStackshotVisibleSections);
const generatedStackshotJsonExport = serializeSectionsForJsonExport(generatedStackshotVisibleSections);
assert.match(generatedCoreTextExport, /100 of 5000 event records shown/, 'large CoreAnalytics text export preserves visible-row summaries');
assert.match(generatedCoreJsonExport, /100 of 5000 event records shown/, 'large CoreAnalytics JSON export preserves visible-row summaries');
assert.match(generatedStackshotTextExport, /100 of 5000 processes shown/, 'large Stackshot text export preserves visible-row summaries');
assert.match(generatedStackshotJsonExport, /100 of 5000 processes shown/, 'large Stackshot JSON export preserves visible-row summaries');
assert.doesNotMatch(generatedCoreTextExport, /SyntheticMetricGroup-249/, 'large CoreAnalytics text export excludes capped-out groups');
assert.doesNotMatch(generatedCoreJsonExport, /SyntheticMetricGroup-249/, 'large CoreAnalytics JSON export excludes capped-out groups');
assert.doesNotMatch(generatedStackshotTextExport, /SyntheticStackProcess-04900/, 'large Stackshot text export excludes capped-out processes');
assert.doesNotMatch(generatedStackshotJsonExport, /SyntheticStackProcess-04900/, 'large Stackshot JSON export excludes capped-out processes');

const generatedCoreSnapshot = JSON.stringify(generatedCoreSections);
const generatedCoreEntry = {
  classification: { parserType: 'coreanalytics', supported: true },
  sections: generatedCoreSections,
};
const generatedTwoReportComparison = createComparisonSections([generatedCoreEntry, generatedCoreEntry]);
const generatedThreeReportComparison = createComparisonSections([
  generatedCoreEntry,
  generatedCoreEntry,
  generatedCoreEntry,
]);
assert.deepEqual(
  generatedTwoReportComparison,
  createComparisonSections([generatedCoreEntry, generatedCoreEntry]),
  'large two-report comparison output is deterministic'
);
assert.deepEqual(
  generatedThreeReportComparison,
  createComparisonSections([generatedCoreEntry, generatedCoreEntry, generatedCoreEntry]),
  'large three-report comparison output is deterministic'
);
assert.equal(
  serializeSectionsForJsonExport(generatedThreeReportComparison, { mode: 'comparison' }),
  serializeSectionsForJsonExport(generatedThreeReportComparison, { mode: 'comparison' }),
  'large comparison JSON export is deterministic'
);
assert.equal(JSON.stringify(generatedCoreSections), generatedCoreSnapshot, 'large comparison and export do not mutate parser output');

for (let cycle = 0; cycle < 3; cycle += 1) {
  const cycleSections = parseInput(largeGeneratedCoreAnalyticsText);
  const cycleVisibleSections = filterSectionsByQuery(cycleSections, 'SyntheticMetricGroup-000').sections;
  serializeSectionsForExport(cycleVisibleSections);
  serializeSectionsForJsonExport(cycleVisibleSections);
  createComparisonSections([generatedCoreEntry, generatedCoreEntry, generatedCoreEntry]);
}
assert.equal(JSON.stringify(generatedCoreSections), generatedCoreSnapshot, 'repeated large-report workflows preserve parser output');

const inheritedField = Object.create({ label: 'Inherited Field', value: 'INHERITED-FIELD-SENTINEL' });
const inheritedColumn = Object.create({ key: 'inherited', label: 'Inherited' });
const prototypeKeyRow = {};
Object.defineProperties(prototypeKeyRow, {
  safe: { value: 'safe-row', enumerable: true },
  constructor: { value: 'CONSTRUCTOR-SENTINEL', enumerable: true },
  prototype: { value: 'PROTOTYPE-SENTINEL', enumerable: true },
});
const cyclicValue = {};
cyclicValue.self = cyclicValue;
const hardenedJsonSource = [{
  id: '__proto__',
  title: 'Hardened Section',
  fields: [
    inheritedField,
    { label: 'Cyclic Field', value: cyclicValue },
    { label: 'Function Field', value() {} },
    { label: 'Symbol Field', value: Symbol('JSON-SYMBOL-SENTINEL') },
  ],
  tableColumns: [
    { key: 'safe', label: 'Safe' },
    inheritedColumn,
    { key: '__proto__', label: 'Prototype Key' },
    { key: 'constructor', label: 'Constructor Key' },
    { key: 'prototype', label: 'Prototype Property' },
  ],
  table: [prototypeKeyRow],
  raw: 'JSON-HARDENED-RAW-SENTINEL',
  sourceText: 'JSON-HARDENED-SOURCE-SENTINEL',
}];
const hardenedJsonText = serializeSectionsForJsonExport(hardenedJsonSource);
const hardenedJson = JSON.parse(hardenedJsonText);
const hardenedSection = hardenedJson.sections[0];
assert.deepEqual(hardenedSection.tableColumns, [{ key: 'safe', label: 'Safe' }], 'JSON export rejects inherited and prototype-style table columns');
assert.deepEqual(hardenedSection.table, [{ safe: 'safe-row' }], 'JSON export rejects inherited and prototype-style row values');
assert.deepEqual(hardenedSection.fields, [], 'JSON export rejects inherited, cyclic, function, and symbol field values');
assert.equal(Object.prototype.hasOwnProperty.call(hardenedSection, '__proto__'), false, 'JSON export does not emit prototype-style section keys');
for (const sentinel of [
  'INHERITED-FIELD-SENTINEL',
  'CONSTRUCTOR-SENTINEL',
  'PROTOTYPE-SENTINEL',
  'JSON-HARDENED-RAW-SENTINEL',
  'JSON-HARDENED-SOURCE-SENTINEL',
  'JSON-SYMBOL-SENTINEL',
]) {
  assert.doesNotMatch(hardenedJsonText, new RegExp(sentinel), `JSON export excludes ${sentinel}`);
}

const repeatedDownloadBlobs = [];
const repeatedDownloadUrls = [];
const repeatedRevokedUrls = [];
const repeatedDownloadLinks = [];
const repeatedDownloadDocument = {
  createElement() {
    const link = { click() {}, remove() {} };
    repeatedDownloadLinks.push(link);
    return link;
  },
  body: { append() {} },
};
const repeatedDownloadUrlApi = {
  createObjectURL(blob) {
    repeatedDownloadBlobs.push(blob);
    const objectUrl = `blob:visible-export-${repeatedDownloadBlobs.length}`;
    repeatedDownloadUrls.push(objectUrl);
    return objectUrl;
  },
  revokeObjectURL(objectUrl) {
    repeatedRevokedUrls.push(objectUrl);
  },
};
assert.equal(
  downloadTextFile(twoReportComparisonExport, 'ios-diagnostic-comparison.txt', {
    documentRef: repeatedDownloadDocument,
    urlRef: repeatedDownloadUrlApi,
  }),
  true,
  'comparison export starts a local plain-text download'
);
assert.equal(
  downloadTextFile(twoReportComparisonJson, 'ios-diagnostic-comparison.json', {
    documentRef: repeatedDownloadDocument,
    urlRef: repeatedDownloadUrlApi,
    mimeType: 'application/json;charset=utf-8',
  }),
  true,
  'comparison structured JSON export starts a local download'
);
assert.equal(
  downloadTextFile(searchScopedExportText, 'ios-diagnostic-export.txt', {
    documentRef: repeatedDownloadDocument,
    urlRef: repeatedDownloadUrlApi,
  }),
  true,
  'repeated single-report export starts a new local download'
);
assert.equal(
  downloadTextFile(searchScopedExportJson, 'ios-diagnostic-export.json', {
    documentRef: repeatedDownloadDocument,
    urlRef: repeatedDownloadUrlApi,
    mimeType: 'application/json;charset=utf-8',
  }),
  true,
  'single-report structured JSON export starts a local download'
);
assert.deepEqual(repeatedRevokedUrls, repeatedDownloadUrls, 'every export object URL is revoked without retention');
assert.deepEqual(
  repeatedDownloadLinks.map((link) => link.download),
  ['ios-diagnostic-comparison.txt', 'ios-diagnostic-comparison.json', 'ios-diagnostic-export.txt', 'ios-diagnostic-export.json'],
  'comparison, text, and JSON exports keep generic filenames'
);
assert.equal(await repeatedDownloadBlobs[0].text(), twoReportComparisonExport, 'comparison Blob content exactly matches visible export serialization');
assert.equal(await repeatedDownloadBlobs[1].text(), twoReportComparisonJson, 'comparison JSON Blob content matches the structured serializer');
assert.equal(await repeatedDownloadBlobs[2].text(), searchScopedExportText, 'single-report Blob content exactly matches visible export serialization');
assert.equal(await repeatedDownloadBlobs[3].text(), searchScopedExportJson, 'single-report JSON Blob content matches the structured serializer');
assert.equal(repeatedDownloadBlobs[1].type, 'application/json;charset=utf-8', 'comparison JSON export uses the JSON MIME type');
assert.equal(repeatedDownloadBlobs[3].type, 'application/json;charset=utf-8', 'single-report JSON export uses the JSON MIME type');
assert.throws(
  () => createComparisonSections([comparisonReportOne]),
  /Comparison requires 2 or 3 reports\./,
  'comparison section creation refuses invalid input'
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
