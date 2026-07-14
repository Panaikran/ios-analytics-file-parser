# iOS Analytics File Parser

A privacy-first, browser-based tool for reading iPhone and iPad diagnostic logs locally.

The app converts Apple diagnostic files into structured, human-readable sections without uploading reports to a server.

## Overview

iOS Analytics File Parser is a static browser app for inspecting common iOS and iPadOS diagnostic report formats:

- application crash reports
- watchdog stackshots
- JetsamEvent memory reports
- panic-full logs
- CoreAnalytics `.ips.ca.synced` reports
- AccessoryCrash and selected resource diagnostics
- generic analytics text logs

The bundled catalog contains one fictional production example for each of the
11 supported parser families.

It is intentionally local-first. Reports are parsed in the browser, sanitized by default, and displayed as structured sections, tables, charts, cautious explanation notes, and raw notes where useful.

## Release Status

| Item | Status |
| --- | --- |
| Latest released version | `v1.8.0` (2026-07-14) |
| Active phase | `v1.8.0 — Precision Search & Deep Inspection` released and fully closed |
| Current focus | `v1.9.0` planning; scope to be determined after v1.8.0 post-release reconciliation |
| Phase 1 | Complete |
| Phase 2 | Complete |
| Phase 3 | Complete |
| CoreAnalytics patch | Complete in `v0.3.1-alpha` |
| Phase 4 | Complete in `v0.4.0-alpha` |
| Phase 4 Slice 1 | Implemented: manifest, icons, install identity |
| Phase 4 Slice 2 | Implemented: service worker, offline app shell, offline examples |
| Phase 4 Slice 3 | Implemented: offline/install/update UX polish and mobile Safari hardening |
| Phase 4 Slice 4 | Complete: release documentation and deployment readiness |
| PWA update hotfix | Complete in `v0.4.1-alpha` |
| v0.5.0-alpha | Released: Large Report Usability and Performance |
| v0.5.1-alpha | Released: file-size validation hotfix |
| v0.6.0-alpha | Released: Apple Diagnostics Expansion |
| v0.7.0-alpha | Released: Human-Readable Diagnostic Explanations |
| v0.8.0-alpha | Released: Release Hardening and QA Polish |
| v0.9.0-beta | Released: Feature Freeze / Release Candidate Preparation |
| v1.0.0 | Released: First Stable Release |
| v1.1.0 | Released: Multi-Report Comparison |
| v1.2.0 | Released: Sanitized Visible Export |
| v1.3.0 | Released: Structured Sanitized Export |
| v1.4.0 | Released: CoreAnalytics Investigation Workflow |
| v1.5.0 | Released: Complete Supported Diagnostic Examples |
| v1.6.0 | Released: Search Result Navigation |
| v1.7.0 | Released 2026-07-14: Comparison Workflow Clarity |
| v1.8.0 | Released 2026-07-14: Precision Search & Deep Inspection |
| App type | Static browser app |
| Build step | None |
| Backend | None |
| Framework dependencies | None |

Note: `package.json` may still show `0.1.0`. Project release state is currently tracked by Git tags, this README, the changelog, and phase summaries.

`v1.8.0 — Precision Search & Deep Inspection` is the latest stable release, tagged and published on 2026-07-14 as a non-draft, non-prerelease GitHub Release. It adds precise exact-match inspection within visible sanitized content while preserving comparison, Raw Local View, export, privacy, local-only, and offline boundaries. `v1.9.0` is the next planning milestone; its scope is to be determined after v1.8.0 post-release reconciliation.

## Why This Exists

Apple diagnostic files are useful, but they are dense and hard to scan quickly. This project provides a local tool for turning those reports into readable diagnostic sections while preserving privacy by default.

The goal is not to symbolicate, upload, diagnose, or store reports. The goal is to make the report content easier to inspect safely on the user's own machine.

Human-readable explanations are deterministic and local-only. They are based on already-parsed safe fields, use cautious wording, and do not provide AI diagnosis or exact root-cause claims.

## Privacy Model

All parsing happens locally in the browser.

- No uploads.
- No backend.
- No analytics.
- No accounts.
- No cloud processing.
- No external parsing service.
- No persistence of user logs.
- No report history or recent files.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or hidden report storage.

Sanitized mode is the default. It redacts sensitive identifiers before content is rendered.

Raw local view is opt-in. When enabled, the current report is reparsed from in-memory source text with sanitization disabled and labeled as:

```text
Raw local view - not uploaded
```

Raw mode applies only to the currently loaded report. Loading a new file, paste, drop, or example resets back to sanitized mode.

The service worker caches only the app shell, static assets, icons, manifest, ES modules, CSS, and sanitized fictional examples. It does not cache uploaded files, pasted report text, parsed output, raw-mode output, search state, dense-table state, clipboard output, test fixtures, unknown same-origin URLs, or external URLs.

## Supported Formats

| Format | Detection | Current support |
| --- | --- | --- |
| Standard app crash `.ips` | `ips` | Summary, Exception, Crashed Thread, All Threads, Binary Images |
| Legacy `.crash` | `crash` | Summary, Exception, Crashed Thread, All Threads, Binary Images |
| Watchdog stackshot `.ips` | `ips-watchdog-stackshot` | Summary, Termination, Main Thread Stackshot |
| JetsamEvent `.ips` | `jetsam` | Summary, Victim / Likely Culprit, Process Table, System Memory, Limits, memory chart |
| Panic-full text or JSON-wrapped `.ips` | `panic` | Panic String, Panic Flags, Kernel Backtrace, Loaded Kexts, System Info |
| Structured CoreAnalytics `.ips.ca.synced` line-delimited JSON | `coreanalytics` | Summary, Configuration, Record Overview, Event Types, Sample Records, Parser Notes |
| AccessoryCrash `.ips` with `bug_type: 305` | `accessory-crash` | Summary, Accessory Information, Application Information, Crash Log Overview, Panic / Fault Notes, Parser Notes |
| CPU Resource `.ips` with `bug_type: 202` | `resource-cpu` | Summary, Process / Command Info, CPU Usage, Limits / Thresholds, Parser Notes |
| Disk Writes Resource `.ips` with `bug_type: 142` | `resource-diskwrites` | Summary, Process / Command Info, Disk Write Usage, Limits / Thresholds, Parser Notes |
| Stackshot Resource `.ips` with `bug_type: 288` | `resource-stackshot` | Summary, Trigger / Reason, Process Overview, Top Processes, Parser Notes; summary parsing only |
| Generic analytics text | `analytics` | Fallback summary and grouped text sections |

### Recognized But Not Parsed Yet

The diagnostic classifier can recognize some additional Apple diagnostic families and show safe unsupported messages. Recognized does not mean parsed: these files do not produce diagnostic sections yet, and direct parser calls still fail safely.

| Diagnostic family | Classification type | Current support |
| --- | --- | --- |
| App Usage Metrics | `app-usage-metrics` | Recognized for safe unsupported messaging only |
| Wi-Fi Connectivity | `wifi-connectivity` | Recognized for safe unsupported messaging only |
| Diagnostic Request | `diagnostic-request` | Recognized for safe unsupported messaging only |

AccessoryCrash support is intentionally narrow. It covers AccessoryCrash `.ips` reports with `bug_type: 305`; it does not claim broad Accessory/Firmware diagnostic support.
Resource diagnostic support is also narrow. It covers CPU Resource `bug_type: 202`, Disk Writes Resource `bug_type: 142`, and Stackshot Resource `bug_type: 288` only. Stackshot Resource support is summary parsing only; full stack rendering and symbolication are not supported.

## Feature Support

| Feature | Current support |
| --- | --- |
| Static browser app | Supported |
| Browser-native ES modules | Supported |
| File picker | Supported |
| Broad mobile-safe file picker | Supported |
| Safe file validation before reading | Supported |
| 20 MB mobile Safari safety limit | Supported |
| Binary/media/PDF/ZIP rejection before reading | Supported |
| Paste textarea | Supported |
| Explicit paste parse button | Supported |
| Drag-and-drop | Supported, optional |
| Production examples | Supported |
| Offline fictional examples after first load | Supported |
| Sanitized-by-default parsing | Supported |
| Raw local view | Supported, opt-in |
| Clear Report | Supported |
| Section jump navigation | Supported |
| Search/filter parsed output | Supported |
| Search Result Navigation | Implemented in `v1.6.0`: section-level Previous/Next movement through visible matching sections |
| Precision Search & Deep Inspection | Implemented in `v1.8.0`: exact-match metadata, safe highlighting, and non-wrapping Previous/Next exact-match navigation within visible sanitized content |
| Copy visible section content | Supported |
| Sanitized Visible Export | Supported: visible single-report and comparison `.txt` downloads |
| Structured Sanitized JSON Export | Supported: visible single-report and comparison `.json` downloads |
| Multi-Report Comparison | Supported: 2-3 reports with the same parser type, sanitized only |
| Comparison Workflow Clarity | Released in `v1.7.0`: optional ephemeral local labels, parser-type visibility, clearer setup feedback, and predictable removal focus |
| Thread grouping/collapse | Supported |
| Jetsam row limits | Supported |
| Panic kext collapse | Supported |
| Binary image horizontal overflow | Supported |
| Memory chart | Supported, simple Canvas chart |
| Generic analytics fallback parser | Supported |
| CoreAnalytics `.ips.ca.synced` line-delimited JSON | Supported, capped rendered rows |
| AccessoryCrash `bug_type: 305` parser | Supported, narrow v0.6 work |
| CPU Resource `bug_type: 202` parser | Supported, narrow v0.6 work |
| Disk Writes Resource `bug_type: 142` parser | Supported, narrow v0.6 work |
| Stackshot Resource `bug_type: 288` parser | Supported, summary parsing only |
| Human-readable diagnostic explanations | Supported for selected already-supported report patterns |
| Release-hardening UI polish | Released in `v0.8.0-alpha` |
| Accessibility polish | Released in `v0.8.0-alpha` |
| Browser/mobile QA pass | Complete in `v0.8.0-alpha` |
| Platform/PWA hardening | Released in `v0.8.0-alpha` |
| AI diagnosis | Not supported |
| Exact root-cause claims | Not supported |
| Large-report size helpers | Supported |
| Shared table-view model | Supported |
| CoreAnalytics overview panel | Supported |
| CoreAnalytics Investigation Workflow | Implemented in `v1.4.0`: sanitized rendered/capped facet controls using the existing search path |
| Search/copy scope wording for capped rows | Supported |
| Diagnostic classification layer | Released in `v0.6.0-alpha` |
| Friendly messages for recognized unsupported diagnostics | Released in `v0.6.0-alpha` |
| Web App Manifest | Supported |
| Install guidance | Supported |
| Service worker app shell | Supported |
| Offline app shell after first successful load | Supported |
| Update-ready UI | Supported |
| CSP/header hardening | Deferred |
| Symbolication | Not supported |
| `.dSYM` support | Not supported |
| Sysdiagnose archive extraction | Not supported |

## Current Features

### Input

- Choose a local report file.
- Paste report text and parse explicitly.
- Drop a file onto the input panel.
- Load sanitized fictional examples from `examples/`.
- Clear the current report and reset UI state.
- Validate selected files before calling `file.text()`.
- Reject files over the 20 MB mobile Safari safety limit.
- Reject clearly unsupported binary/media/PDF/ZIP files before reading.

### Parsing And Rendering

- Summary, exception, termination, victim, system memory, limits, and system info sections.
- Crashed thread and all-thread stack rendering.
- Binary image tables.
- Jetsam process tables sorted by best available memory value.
- Panic backtrace and loaded kext tables.
- Generic analytics fallback grouping for unstructured analytics text.
- CoreAnalytics `.ips.ca.synced` summary, configuration, record overview, event type grouping, capped sample records, and parser notes.
- CoreAnalytics Investigation Workflow exposes Top Messages, Top Names, Aggregation Periods, and Sampling Values as accessible controls for the existing sanitized rendered/capped view.
- Activating a CoreAnalytics facet places its exact visible value into the existing substring search field. Only one facet query is active at a time; manual search editing and Clear Search reset selected appearance.
- CoreAnalytics facet controls do not expose raw or uncapped records and do not appear in Raw Local View or comparison mode. Existing CoreAnalytics table caps remain unchanged.
- AccessoryCrash `bug_type: 305` summary, accessory information, application information, crashlog overview, panic/fault notes, and parser notes.
- AccessoryCrash crashlogs are summarized; raw nested crashlog bodies are not rendered.
- AccessoryCrash sanitized mode redacts or omits identifier-heavy fields by default.
- CPU Resource `bug_type: 202` summary, process/command info, CPU usage, limits/thresholds, and parser notes.
- Disk Writes Resource `bug_type: 142` summary, process/command info, disk write usage, limits/thresholds, and parser notes.
- Stackshot Resource `bug_type: 288` summary, trigger/reason, process overview, capped top-process summaries, and parser notes.
- Stackshot Resource support is summary-only. Full stack frames, frame symbols, frame addresses, and raw nested stackshot payloads are not rendered.
- Diagnostic classification identifies supported formats and selected unsupported Apple diagnostic families before parser routing.
- Recognized unsupported diagnostics show safe unsupported messages instead of being treated as generic unknown files.
- Human-readable explanation sections are inserted for supported diagnostics when a safe deterministic rule applies.
- Explanations use already-parsed safe fields only, avoid AI diagnosis, and avoid exact root-cause claims.
- Section-specific table columns.
- Simple Jetsam memory bar chart.
- Large-report size helpers centralize section and report size summaries for future scale work.
- Shared table-view helpers centralize dense table visibility decisions for rendering and copy.

### Navigation And Inspection

- Jump-link section navigation.
- Search Result Navigation moves through visible matching sanitized sections with accessible Previous and Next controls.
- Navigation follows filtered section order, does not wrap, shows the current section-level position, and scrolls to the existing stable section anchor.
- Previous is unavailable at the first matching section and Next is unavailable at the final matching section. Focus remains on the activated control and announcements reuse the existing status live region.
- Search remains case-insensitive substring search over visible sanitized generated sections.
- Exact matching regions can be visually identified and navigated with native Previous and Next exact-match controls. The current exact-match position is shown, such as `2 of 7`; first, final, one-result, and no-result boundaries are deterministic and navigation does not wrap.
- Exact-match regions include section titles, field labels, field values, table headers, table cells, chart labels, chart values, and visible text blocks. Match metadata comes from the same sanitized model as filtering, never raw source or DOM scanning.
- Exact-match navigation remains synchronized with section-level navigation and works in supported two- and three-report comparisons.
- Local comparison labels, capped-out rows, hidden values, and Raw Local View content remain excluded from exact-match metadata and highlighting.
- Search across section titles, field labels, field values, table cells, chart labels, chart values, and visible text blocks.
- Matching table rows only are shown while search is active.
- Search results override collapsed dense-table state so matches remain visible.
- Copy buttons on each section.
- Copy output uses plain text and reflects currently visible content.
- Download sanitized visible output as a local plain-text file for a single report or a generated comparison.
- Download structured sanitized JSON for a single report or a generated comparison.
- Export follows the active search and the same dense-table visibility rules as copy; viewport position and scrolling do not affect eligibility.
- Text and JSON export share the same visible-section contract. Raw Local View disables both exports, and comparison export is sanitized-only.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- Search and copy status wording distinguishes parsed output, rendered capped rows, and visible rows.
- CoreAnalytics facet filtering uses the same search, copy, text-export, and JSON-export visibility rules as manual search. Keyboard focus is restored to the selected facet after filtering rerenders.
- CoreAnalytics facet-generated queries reset search-result navigation to the first matching section. Manual search editing, Clear Search, report changes, comparison changes, and Raw Local View changes reset or hide navigation through the existing search workflow.
- Explanation sections participate in the same section navigation, search, and copy behavior as other rendered sections.
- Multi-Report Comparison accepts 2 or 3 supported reports with the same `parserType`, preserves insertion order, and produces ordinary comparison sections for the existing navigation, search, and copy paths.
- Comparison setup shows generic positional identities (`Report 1`, `Report 2`, and `Report 3`) with the parser type visible. Each selected report may have an optional local label to distinguish it during setup.
- Local labels are user-supplied, normalized, in-memory-only text. They are discarded when entries are removed, comparison is cleared, the report is reset, the page reloads, or the session ends. They are never derived from filenames or report contents.
- Local labels appear only in the comparison setup UI. They are excluded from comparison output, copy, text export, JSON export, filenames, search, and Search Result Navigation. Setup feedback explains incomplete selection, mixed parser types, and the three-report limit.
- Comparison uses sanitized parsed sections only. Raw Local View remains available only for a single loaded report.

### Sanitized Visible Export

- Export is available only for currently eligible sanitized sections.
- Active search limits exported sections and rows; collapsed, capped, filtered-out, unrendered, and source-only content is excluded.
- Single reports download as `ios-diagnostic-export.txt`; comparisons download as `ios-diagnostic-comparison.txt`.
- Single reports download as `ios-diagnostic-export.json`; comparisons download as `ios-diagnostic-comparison.json`.
- JSON export uses schema version `1` and includes only explicitly allowlisted sanitized scalar values in eligible visible sections.
- Downloads are created locally with a temporary object URL. No report, export, or download history is retained.
- Raw export, original-file export, CSV, PDF, cloud sharing, uploads, and export persistence are not supported.

### CoreAnalytics Sections

Initial CoreAnalytics `.ips.ca.synced` support renders these sections:

- `coreanalytics-summary`
- `coreanalytics-configuration`
- `coreanalytics-record-overview`
- `coreanalytics-event-types`
- `coreanalytics-sample-records`
- `coreanalytics-parser-notes`

The v0.5.0-alpha viewer adds a non-mutating CoreAnalytics overview above the existing parser sections. It summarizes visible totals, capped table status, rendered-row-only facets, and parser notes without adding raw JSON rendering or changing parser output.

### Dense Table Controls

- All Threads groups rows by thread.
- Crashed thread expands by default.
- Other threads collapse by default.
- Jetsam process tables show the first 50 rows initially, with Show more and Show all controls.
- Large panic loaded-kext tables collapse by default.
- Binary image tables use compact rendering with horizontal overflow.

### PWA And Offline

- `manifest.webmanifest` provides app identity, standalone display mode, icons, and GitHub Pages-safe relative paths.
- Apple web app meta tags and touch icon support iPhone and iPad Add to Home Screen.
- Install guidance explains that installation saves the app shell, not reports.
- The service worker precaches only explicit app-shell assets and sanitized fictional examples.
- Offline status uses the copy: `Offline app shell ready. Examples can open offline. Reports are still not saved.`
- Update-ready status uses the copy: `Update ready. Reload when done with the current report.`
- Updates require the user to press `Reload app`; the app does not auto-reload while a report may be open.
- `v0.4.1-alpha` fixes update activation by keeping the `skipWaiting()` request alive during the service worker message event.
- `v0.8.0-alpha` platform hardening keeps the service worker on an explicit precache allowlist, adds static guards for manifest and cache boundaries, and redirects unsupported nested navigations back to the app root so relative assets do not break.
- Offline setup failures are non-blocking; online parsing still works.

### Accessibility And Mobile

- Real buttons and anchors for primary controls.
- Visible labels for search and input controls.
- `aria-expanded` on collapse controls.
- Focus styling for the custom file picker.
- Scoped live regions for status/search feedback.
- Offline/update status uses `role="status"` and `aria-live="polite"`.
- Textarea font size is at least 16px for iPhone Safari.
- Mobile layout supports horizontally scrollable section navigation and tables.
- Panic/raw diagnostic text wraps inside cards on mobile Safari.
- Page padding accounts for mobile Safari safe-area and bottom toolbar behavior.
- v0.5 mobile polish improves narrow-width containment, CoreAnalytics chip wrapping, search/copy feedback wrapping, and practical touch targets for dense-table controls.
- v0.8 UI and accessibility polish improves spacing consistency, readable wrapping, touch target sizing, focus visibility, accessible names, reduced-motion guardrails, and mobile/table containment without redesigning the app.
- v1.4 CoreAnalytics controls use native keyboard-operable buttons, category-and-value accessible names, selected-state semantics, focus restoration, and practical 44px touch targets across narrow layouts.
- v1.6 Search Result Navigation uses native Previous and Next buttons, accessible names, `aria-disabled` boundary state, visible focus, logical tab order, existing status announcements, stable-anchor movement, and touch-safe controls.
- v1.7 comparison setup uses programmatic input labels, associated privacy help text, native keyboard-editable controls, predictable focus restoration after removal, updated positional names, and responsive touch-safe layout. Labels remain ephemeral. No native screen-reader certification or Safari/Firefox validation is claimed.
- v1.8 exact-match inspection uses distinct native section and exact-match controls, keyboard operation, visible focus, active-match styling beyond color, concise live-status feedback, reduced-motion handling, and responsive touch-safe controls. No native screen-reader certification or Safari/Firefox validation is claimed.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Panaikran/ios-analytics-file-parser.git
cd ios-analytics-file-parser
```

The app has no build step. You can open `index.html` directly for basic file and paste parsing.

For production examples, service worker registration, PWA behavior, and offline app-shell checks, serve the folder with a local static server. Examples are loaded with `fetch()`, and browser `file://` behavior varies.

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

On systems where `python` is unavailable, use any static file server that serves the repository root. GitHub Pages is the intended hosted deployment target.

## Tests

Run the Node/assert-only test suite:

```powershell
npm.cmd test
```

Direct equivalent:

```powershell
node tests/parser.test.js
```

Useful syntax checks for release hardening:

```powershell
node --check src\main.js
node --check service-worker.js
node --check src\fileValidation.js
```

PowerShell note: `npm.cmd test` avoids execution-policy issues that can occur when `npm.ps1` is invoked.

## Architecture Overview

The project is a static, local-first browser app.

- `index.html` loads `src/main.js` with `type="module"`.
- `manifest.webmanifest` describes installable app identity using relative GitHub Pages-safe paths.
- `service-worker.js` precaches only the explicit app shell and sanitized fictional examples.
- `src/main.js` coordinates input, parsing, search, privacy mode, copy, dense table state, service worker registration, and rendering.
- `src/fileValidation.js` validates local file selections before reading.
- `src/models/reportSize.js` summarizes large report and large section size signals.
- `src/parsers/classifyDiagnostic.js` classifies supported formats and selected recognized-but-unsupported diagnostic families.
- `src/parsers/detect.js` remains a compatibility wrapper around classifier legacy type names.
- `src/parsers/index.js` routes `parseInput()` through `classification.parserType` and inserts one safe explanation section when applicable.
- `src/explanations/diagnosticExplanations.js` contains deterministic, local-only explanation rules for already-parsed supported diagnostics.
- `src/comparison/comparisonModel.js` validates compatible sanitized reports and emits deterministic comparison `SectionModel[]` output.
- `src/parsers/` parses supported report formats.
- `src/privacy/sanitize.js` applies default sanitization.
- `src/models/sectionModel.js` documents the shared section shape.
- `src/ui/` renders sections, tables, charts, dense table controls, navigation, shared table views, and the CoreAnalytics overview.
- `src/search/` filters parsed section data without scanning the DOM.
- `src/search/searchMetadata.js` describes search scope for capped/large rendered output.
- `src/clipboard/` serializes visible section content for copy actions.
- `src/clipboard/copyMetadata.js` describes copy scope for visible rows and capped tables.
- `examples/` contains sanitized fictional examples for production UI use.
- `icons/` contains PWA, favicon, maskable, and Apple touch icons.
- `tests/fixtures/` contains sanitized test-only fixtures.

### Architecture Flow

```text
User input
  |
  |-- file picker
  |-- pasted text
  |-- drag/drop
  |-- example file
  v
src/main.js
  |
  |-- validateReportFile(file)
  |-- classifyDiagnostic(text)
  |-- getUnsupportedDiagnosticMessage(classification)
  |-- detectFileType(text) compatibility wrapper for legacy type strings
  |-- parseInput(text, { sanitize }) routes with classification.parserType
  v
src/parsers/*
  |
  |-- createSanitizer({ sanitize })
  |-- normalize report fields
  |-- emit SectionModel[]
  v
src/explanations/diagnosticExplanations.js
  |
  |-- inspect parsed safe SectionModel[] fields only
  |-- emit at most one explanation SectionModel
  v
src/comparison/comparisonModel.js
  |
  |-- validate 2-3 supported reports with the same parserType
  |-- compare sanitized allowlisted fields in insertion order
  |-- emit comparison SectionModel[]
  v
src/search/filterSections.js
  |
  |-- optional search-filtered SectionModel[]
  v
src/ui/*
  |
  |-- section cards
  |-- fields
  |-- tables
  |-- charts
  |-- dense table controls
  v
Browser DOM

Copy actions:

visible SectionModel -> src/clipboard/* -> plain text clipboard

PWA path:

index.html -> manifest.webmanifest
           -> service-worker.js
           -> explicit precache allowlist
           -> app shell and sanitized examples only
```

## Architecture Directory Tree

```text
.
|-- index.html
|-- manifest.webmanifest
|-- service-worker.js
|-- README.md
|-- ROADMAP.md
|-- CHANGELOG.md
|-- PHASE_1_SUMMARY.md
|-- PHASE_2_SUMMARY.md
|-- PHASE_3_SUMMARY.md
|-- PHASE_4_SUMMARY.md
|-- PHASE_5_SUMMARY.md
|-- PHASE_6_SUMMARY.md
|-- PHASE_7_SUMMARY.md
|-- PHASE_8_SUMMARY.md
|-- PHASE_9_SUMMARY.md
|-- PHASE_11_SUMMARY.md
|-- PHASE_12_SUMMARY.md
|-- package.json
|-- icons/
|   |-- apple-touch-icon.png
|   |-- favicon.svg
|   |-- favicon-32.png
|   |-- icon-192.png
|   |-- icon-512.png
|   `-- maskable-512.png
|-- examples/
|   |-- manifest.js
|   |-- app-crash.ips
|   |-- legacy.crash
|   |-- watchdog.ips
|   |-- jetsam-event.ips
|   |-- panic-full.ips
|   `-- analytics.txt
|-- src/
|   |-- main.js
|   |-- appState.js
|   |-- fileValidation.js
|   |-- clipboard/
|   |   |-- copyMetadata.js
|   |   |-- downloadText.js
|   |   |-- serializeSection.js
|   |   `-- visibleSection.js
|   |-- explanations/
|   |   `-- diagnosticExplanations.js
|   |-- comparison/
|   |   `-- comparisonModel.js
|   |-- models/
|   |   |-- reportSize.js
|   |   `-- sectionModel.js
|   |-- parsers/
|   |   |-- classifyDiagnostic.js
|   |   |-- detect.js
|   |   |-- index.js
|   |   |-- parseAccessoryCrash.js
|   |   |-- parseAnalytics.js
|   |   |-- parseCoreAnalytics.js
|   |   |-- parseCpuResource.js
|   |   |-- parseCrash.js
|   |   |-- parseDiskWritesResource.js
|   |   |-- parseIps.js
|   |   |-- parseIpsContainer.js
|   |   |-- parseIpsWatchdogStackshot.js
|   |   |-- parseJetsam.js
|   |   |-- parsePanic.js
|   |   |-- parsePanicStub.js
|   |   `-- parseResourceStackshot.js
|   |-- privacy/
|   |   `-- sanitize.js
|   |-- search/
|   |   |-- filterSections.js
|   |   `-- searchMetadata.js
|   `-- ui/
|       |-- coreAnalyticsView.js
|       |-- denseTables.js
|       |-- renderApp.js
|       |-- renderCoreAnalyticsOverview.js
|       |-- renderSection.js
|       |-- renderSectionNav.js
|       `-- tableView.js
|-- styles/
|   `-- main.css
`-- tests/
    |-- parser.test.js
    `-- fixtures/
```

## Parser Contract

The parser entry point is:

```js
parseInput(text, { sanitize = true } = {}) -> SectionModel[]
```

Equivalent default behavior:

```js
parseInput(text)
parseInput(text, { sanitize: true })
```

Raw local parsing must be explicit:

```js
parseInput(text, { sanitize: false })
```

`SectionModel` objects are rendered by the UI. Sections may include:

- `id`
- `title`
- `priority`
- `fields`
- `table`
- `tableColumns`
- `tableSummary`
- `chart`
- `raw`

Parser output is treated as immutable by search and UI controls. Search and dense table state are UI concerns layered on top of parsed sections.

Internally, `parseInput()` uses `classifyDiagnostic(text)` and routes supported files with `classification.parserType`. `detectFileType(text)` remains available as a compatibility wrapper that returns legacy strings such as `ips`, `crash`, `jetsam`, `panic`, `coreanalytics`, `analytics`, `accessory-crash`, `resource-cpu`, `resource-diskwrites`, `resource-stackshot`, or `unknown`.

When a supported parsed report matches a safe deterministic explanation rule, `parseInput()` inserts one `diagnostic-explanation` section after the first Summary-like section. If no Summary-like section exists, the explanation section is appended. Explanations are generic guidance from parsed fields; they are not AI diagnosis and do not identify an exact root cause.

Recognized-but-unsupported diagnostics are classified for safe UI messaging only. They do not return `SectionModel[]`; direct unsupported parsing still throws:

```text
Unsupported or unrecognized file type.
```

## Example Files

Production UI examples live in `examples/`.

They are sanitized fictional files and are loaded through `examples/manifest.js`.

Current examples:

- `examples/app-crash.ips`
- `examples/legacy.crash`
- `examples/watchdog.ips`
- `examples/jetsam-event.ips`
- `examples/panic-full.ips`
- `examples/analytics.txt`
- `examples/coreanalytics.ips.ca.synced`
- `examples/accessory-crash.ips`
- `examples/cpu-resource.ips`
- `examples/disk-writes-resource.ips`
- `examples/stackshot-resource.ips`

These 11 files map one-to-one to the supported parser families: App Crash,
Legacy Crash, Watchdog, Jetsam, Panic, Generic Analytics, CoreAnalytics,
AccessoryCrash, CPU Resource, Disk Writes Resource, and Stackshot Resource.

Use the **Try an example** controls in the app to load them through the normal
manifest and `parseInput()` workflow. The examples are compact, deterministic,
fictional, sanitized, and separate from internal stress fixtures.

After first successful service worker setup, these fictional examples are available offline. Test fixtures live separately in `tests/fixtures/` and should not be loaded by the production UI.

## Documentation Links

- [Phase 1 Summary](PHASE_1_SUMMARY.md)
- [Phase 2 Summary](PHASE_2_SUMMARY.md)
- [Phase 3 Summary](PHASE_3_SUMMARY.md)
- [Phase 4 Summary](PHASE_4_SUMMARY.md)
- [Phase 5 Summary](PHASE_5_SUMMARY.md)
- [Phase 6 Summary](PHASE_6_SUMMARY.md)
- [Phase 7 Summary](PHASE_7_SUMMARY.md)
- [Phase 8 Summary](PHASE_8_SUMMARY.md)
- [Phase 9 Summary](PHASE_9_SUMMARY.md)
- [Phase 11 Summary](PHASE_11_SUMMARY.md)
- [Phase 15 Summary](PHASE_15_SUMMARY.md)
- [Phase 16 Summary](PHASE_16_SUMMARY.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Known Limitations

- CSP/header hardening is deferred until the project uses a host that supports custom response headers.
- GitHub Pages does not provide custom security headers; stronger header CSP may require a future hosting option such as Cloudflare Pages.
- No Cloudflare/header CSP deployment is configured yet.
- No report persistence, recent files, or history.
- `tests/browserPerformanceHarness.html` provides a reusable browser performance
  harness, and final v1.5.0 workflow QA passed in headless Chrome on Windows.
  There is no dedicated automated Firefox, Safari, or Mobile Safari harness.
- Native screen-reader software and every browser/operating-system combination
  were not directly certified.
- Offline support covers the app shell and fictional examples after first successful load; it does not make user reports persistent.
- Clipboard behavior depends on browser permissions and secure-context rules.
- Very large visible search results can still require substantial DOM rerendering.
- Large tables are capped, grouped, or collapsed, but true virtualization is not implemented.
- Search is simple case-insensitive substring matching; there is no regex, fuzzy, semantic, raw-source, capped-out, or hidden-data search.
- Exact-match navigation is limited to visible sanitized rendered regions, does not wrap, and is not available in Raw Local View. It does not provide search history, saved searches, or persistence.
- CoreAnalytics does not render full raw JSON bodies.
- CoreAnalytics grouped event rows and sample record rows are capped at 100 rendered rows.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- AccessoryCrash support is limited to `.ips` reports with `bug_type: 305`.
- Broad Accessory/Firmware diagnostics are not supported.
- AccessoryCrash raw nested crashlog bodies are not rendered; crashlogs are summarized.
- CPU Resource support is limited to reports classified as `bug_type: 202`.
- Disk Writes Resource support is limited to reports classified as `bug_type: 142`.
- Stackshot Resource support is limited to reports classified as `bug_type: 288`, and it is summary parsing only.
- Stackshot full stack rendering, frame symbol rendering, frame address rendering, and symbolication are not supported.
- App Usage Metrics, Wi-Fi Connectivity, and Diagnostic Request reports are recognized for safe unsupported messages only; they are not parsed into sections yet.
- Human-readable explanations are conservative and generic; they do not symbolicate, inspect full raw stacks, or identify the exact faulty function.
- Comparison accepts only 2 or 3 reports that share a supported `parserType`; mixed types, raw-mode reports, fuzzy matching, and source-text comparison are not supported. Local labels are intentionally ephemeral and are not exported.
- No AI diagnosis or exact root-cause analysis is provided.
- Section navigation marks clicked links only; there is no scroll-spy observer.
- Dense table state is UI-only and resets on new report, Clear Report, and privacy reparse.
- Copy reflects currently visible dense-table content and does not include collapsed hidden rows.
- Sanitized Visible Export is limited to visible `.txt` and `.json` output. Raw, original-file, CSV, PDF, and persistent export history are not supported.
- Examples and PWA behavior require serving the repository through a local server or GitHub Pages.
- Current UI is dark themed; dark/light mode via `prefers-color-scheme` is not implemented.
- Panic parsing is regex/section based and may need expansion for uncommon layouts.
- Jetsam culprit selection is heuristic when no explicit victim exists.
- No symbolication.
- No `.dSYM` support.
- No sysdiagnose archive extraction.

## Roadmap

| Phase | Status | Scope |
| --- | --- | --- |
| Phase 1 | Complete | Core `.ips` and `.crash` parser, privacy sanitizer, panic stub, tests |
| Phase 2 | Complete | Full section rendering, JetsamEvent, panic-full, analytics fallback, memory chart |
| Phase 3 | Complete | UI polish, examples, search, copy, dense tables, privacy toggle, mobile/accessibility improvements |
| v0.3.1-alpha | Complete | Initial CoreAnalytics `.ips.ca.synced` line-delimited JSON detection and parser support |
| v0.4.0-alpha | Complete | PWA identity, offline app shell, offline examples, update UX, mobile Safari hardening, release docs |
| v0.4.1-alpha | Complete | PWA update activation hotfix for waiting service workers |
| v0.5.0-alpha | Complete | Large Report Usability and Performance: size helpers, shared table-view model, CoreAnalytics overview, search/copy scope wording, mobile Safari polish |
| v0.5.1-alpha | Complete | File-size validation hotfix restoring the 20 MB safety limit |
| v0.6.0-alpha | Released | Diagnostic Classification Architecture, AccessoryCrash `bug_type: 305`, CPU Resource `bug_type: 202`, Disk Writes Resource `bug_type: 142`, and Stackshot Resource `bug_type: 288` summary parsing |
| v0.7.0-alpha | Released | Human-readable deterministic explanations for supported diagnostics |
| v0.8.0-alpha | Released | Release hardening, UI/accessibility polish, browser/mobile QA, platform hardening, and documentation alignment |
| v0.9.0-beta | Released | Feature Freeze / Release Candidate Preparation: documentation reconciliation, regression audit, browser/mobile/accessibility QA, and release-candidate polish |
| v1.0.0 | Released | Stable parser, explanation, privacy, accessibility, and PWA foundation |
| v1.1.0 | Released | Multi-Report Comparison: deterministic, sanitized-only comparison of 2-3 compatible reports |
| v1.2.0 | Released | Sanitized Visible Export for eligible single-report and comparison `.txt` output |
| v1.3.0 | Released | Structured Sanitized Export for eligible single-report and comparison `.json` output |
| v1.4.0 | Released | CoreAnalytics Investigation Workflow through sanitized rendered/capped facets |
| v1.5.0 | Released | Complete fictional bundled example catalog, offline integration, privacy hardening, and cross-family workflow QA |
| v1.6.0 | Released | Section-level Search Result Navigation with accessible non-wrapping Previous/Next controls |
| v1.7.0 | Released 2026-07-14 | Comparison Workflow Clarity with ephemeral local labels, clearer setup feedback, focus restoration, and privacy-safe export isolation |
| v1.8.0 | Released 2026-07-14 | Precision Search & Deep Inspection: visible sanitized exact-match metadata, safe highlighting, non-wrapping exact-match navigation, comparison support, privacy/export isolation, accessibility, responsive, offline, and performance hardening |
| v1.9.0 | Planning | Scope to be determined after v1.8.0 post-release reconciliation |

The project keeps the same constraints:

- static browser app
- browser-native ES modules
- no backend
- no authentication
- no analytics
- no cloud storage for user reports
- no external parsing services
- no framework dependencies unless explicitly approved
- sanitized output remains default

CSP/header hardening remains hosting-dependent and is deferred until the project uses a host that supports custom response headers.

The `v0.6.0-alpha` Phase 1 work delivered diagnostic classification architecture:

- Slice 1A added `classifyDiagnostic(input)` and taxonomy/privacy tests.
- Slice 1B made `detectFileType(input)` delegate to `classifyDiagnostic(input).legacyType`.
- Slice 1C made `parseInput()` route through `classifyDiagnostic(input).parserType`.
- Slice 1D added safe friendly messages for recognized-but-unsupported diagnostics.
- Slice 1E aligns documentation and cleanup.

The `v0.6.0-alpha` Phase 2 AccessoryCrash work is narrow:

- Slice 2A designed the AccessoryCrash parser and fictional fixture shape.
- Slice 2B added direct `parseAccessoryCrash()` parser tests.
- Slice 2C routed AccessoryCrash through `parseInput()`.
- Slice 2D hardened AccessoryCrash privacy handling.
- Slice 2E aligns documentation and QA cleanup.

The `v0.6.0-alpha` Phase 3 Resource Diagnostics work is narrow:

- Slice 3A designed CPU Resource, Disk Writes Resource, and Stackshot Resource parser boundaries.
- Slice 3B and Slice 3C added CPU Resource direct parsing and routing.
- Slice 3D added Disk Writes Resource parsing and routing.
- Slice 3E1 and Slice 3E2 added Stackshot Resource direct parsing and routing.
- Slice 3F added cross-resource privacy, search, copy, raw-mode, and row-cap regression coverage.
- Slice 3G performs browser QA, documentation alignment, and release-readiness checks.

The `v0.7.0-alpha` Human-Readable Diagnostic Explanations work is narrow:

- Slice 7A added the pure deterministic explanation helper.
- Slice 7B integrated explanation sections into `parseInput()`.
- Slice 7C added search, copy, privacy, raw-mode, and unsupported-diagnostic regression coverage.
- Slice 7D completed Browser/UI smoke QA for rendered explanation sections.
- Slice 7E aligns documentation and release-readiness state.

The explanation layer does not add AI diagnosis, exact root-cause claims, new parser families, symbolication, full stack rendering, backend services, storage, or analytics.

The `v0.8.0-alpha` Release Hardening and QA Polish work is narrow:

- Slice 8A polished existing UI spacing, wrapping, table containment, and mobile readability.
- Slice 8A.5 added foundational project documentation in `PLANS.md` and `ARCHITECTURE.md`.
- Slice 8B improved keyboard, focus, accessible-name, live-region, touch-target, and reduced-motion details.
- Slice 8C completed browser and mobile QA with no blockers.
- Slice 8D hardened PWA/platform behavior, service-worker navigation fallback, manifest/cache static guards, and offline verification.
- Slice 8E aligns documentation and release-readiness state.

The hardening milestone does not add parser families, parser redesign, UI redesign, backend services, storage, analytics, AI diagnosis, symbolication, sysdiagnose extraction, or full stack rendering.

The `v0.9.0-beta` Feature Freeze and Release Candidate Preparation work is narrow:

- Slice 9A reconciled post-`v0.8.0-alpha` release-state documentation.
- Slice 9B completed parser, privacy, explanation, search/copy, and local-first regression auditing with no regressions found.
- Slice 9C completed Chrome and Edge browser/mobile/accessibility/PWA release-candidate QA with no blockers; Firefox, Safari, and Mobile Safari require environments where those browsers are available.
- Slice 9D aligned release-candidate documentation and repository polish for review.

The feature-freeze boundary remains in effect: verified bug fixes, documentation accuracy, QA evidence, and stable-release preparation only.

`v1.8.0 — Precision Search & Deep Inspection` is released and fully closed on 2026-07-14. `v1.9.0` remains planning-only with scope to be determined after v1.8.0 post-release reconciliation. MetricKit, speculative performance optimization, additional parser families, and broader diagnostics remain separate future planning candidates.

## Screenshots / Demo

Screenshots are not included yet.

Useful future screenshots:

- input area with file picker, paste, examples, and Clear Report
- install guidance and offline-ready status
- update-ready status with Reload app button
- standard `.ips` crash summary and crashed thread
- All Threads grouped by thread
- Jetsam process table with row controls
- panic loaded-kext collapse controls
- search/filter result state
- privacy toggle in raw local view
- mobile Safari layout

## License

License to be determined.
