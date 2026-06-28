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
- generic analytics text logs

It is intentionally local-first. Reports are parsed in the browser, sanitized by default, and displayed as structured sections, tables, charts, and raw notes where useful.

## Release Status

| Item | Status |
| --- | --- |
| Latest released version | `v0.5.1-alpha` |
| Active unreleased milestone | `v0.6.0-alpha`: Apple Diagnostics Expansion |
| Current v0.6 focus | Phase 2: AccessoryCrash support and QA cleanup |
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
| v0.6.0-alpha Phase 1 | Implemented but unreleased: classification architecture and safe unsupported messages |
| v0.6.0-alpha Phase 2 | Implemented but unreleased: narrow AccessoryCrash `bug_type: 305` support |
| App type | Static browser app |
| Build step | None |
| Backend | None |
| Framework dependencies | None |

Note: `package.json` may still show `0.1.0`. Project release state is currently tracked by Git tags, this README, the changelog, and phase summaries.

## Why This Exists

Apple diagnostic files are useful, but they are dense and hard to scan quickly. This project provides a local tool for turning those reports into readable diagnostic sections while preserving privacy by default.

The goal is not to symbolicate, upload, diagnose, or store reports. The goal is to make the report content easier to inspect safely on the user's own machine.

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
| Generic analytics text | `analytics` | Fallback summary and grouped text sections |

### Recognized But Not Parsed Yet

Active `v0.6.0-alpha` classification work can recognize some additional Apple diagnostic families and show safe unsupported messages. Recognized does not mean parsed: these files do not produce diagnostic sections yet, and direct parser calls still fail safely.

| Diagnostic family | Classification type | Current support |
| --- | --- | --- |
| CPU Resource | `resource-cpu` | Recognized for safe unsupported messaging only |
| Disk Writes Resource | `resource-diskwrites` | Recognized for safe unsupported messaging only |
| Stackshot Resource | `resource-stackshot` | Recognized for safe unsupported messaging only |
| App Usage Metrics | `app-usage-metrics` | Recognized for safe unsupported messaging only |
| Wi-Fi Connectivity | `wifi-connectivity` | Recognized for safe unsupported messaging only |
| Diagnostic Request | `diagnostic-request` | Recognized for safe unsupported messaging only |

AccessoryCrash support is intentionally narrow. It covers AccessoryCrash `.ips` reports with `bug_type: 305`; it does not claim broad Accessory/Firmware diagnostic support.

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
| Copy visible section content | Supported |
| Thread grouping/collapse | Supported |
| Jetsam row limits | Supported |
| Panic kext collapse | Supported |
| Binary image horizontal overflow | Supported |
| Memory chart | Supported, simple Canvas chart |
| Generic analytics fallback parser | Supported |
| CoreAnalytics `.ips.ca.synced` line-delimited JSON | Supported, capped rendered rows |
| AccessoryCrash `bug_type: 305` parser | Supported, narrow v0.6 work |
| Large-report size helpers | Supported |
| Shared table-view model | Supported |
| CoreAnalytics overview panel | Supported |
| Search/copy scope wording for capped rows | Supported |
| Diagnostic classification layer | Implemented in active `v0.6.0-alpha` work |
| Friendly messages for recognized unsupported diagnostics | Implemented in active `v0.6.0-alpha` work |
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
- AccessoryCrash `bug_type: 305` summary, accessory information, application information, crashlog overview, panic/fault notes, and parser notes.
- AccessoryCrash crashlogs are summarized; raw nested crashlog bodies are not rendered.
- AccessoryCrash sanitized mode redacts or omits identifier-heavy fields by default.
- Diagnostic classification identifies supported formats and selected unsupported Apple diagnostic families before parser routing.
- Recognized unsupported diagnostics show safe unsupported messages instead of being treated as generic unknown files.
- Section-specific table columns.
- Simple Jetsam memory bar chart.
- Large-report size helpers centralize section and report size summaries for future scale work.
- Shared table-view helpers centralize dense table visibility decisions for rendering and copy.

### Navigation And Inspection

- Jump-link section navigation.
- Search across section titles, field labels, field values, table cells, and raw text.
- Matching table rows only are shown while search is active.
- Search results override collapsed dense-table state so matches remain visible.
- Copy buttons on each section.
- Copy output uses plain text and reflects currently visible content.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- Search and copy status wording distinguishes parsed output, rendered capped rows, and visible rows.

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
- `src/parsers/index.js` routes `parseInput()` through `classification.parserType`.
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
|   |   |-- serializeSection.js
|   |   `-- visibleSection.js
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
|   |   |-- parseCrash.js
|   |   |-- parseIps.js
|   |   |-- parseIpsContainer.js
|   |   |-- parseIpsWatchdogStackshot.js
|   |   |-- parseJetsam.js
|   |   |-- parsePanic.js
|   |   `-- parsePanicStub.js
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

Internally, `parseInput()` uses `classifyDiagnostic(text)` and routes supported files with `classification.parserType`. `detectFileType(text)` remains available as a compatibility wrapper that returns legacy strings such as `ips`, `crash`, `jetsam`, `panic`, `coreanalytics`, `analytics`, or `unknown`.

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

After first successful service worker setup, these fictional examples are available offline. Test fixtures live separately in `tests/fixtures/` and should not be loaded by the production UI.

## Documentation Links

- [Phase 1 Summary](PHASE_1_SUMMARY.md)
- [Phase 2 Summary](PHASE_2_SUMMARY.md)
- [Phase 3 Summary](PHASE_3_SUMMARY.md)
- [Phase 4 Summary](PHASE_4_SUMMARY.md)
- [Phase 5 Summary](PHASE_5_SUMMARY.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Known Limitations

- CSP/header hardening is deferred beyond `v0.5.0-alpha`.
- GitHub Pages does not provide custom security headers; stronger header CSP may require a future hosting option such as Cloudflare Pages.
- No Cloudflare/header CSP deployment is configured yet.
- No report persistence, recent files, or history.
- No automated browser or mobile Safari test harness.
- Offline support covers the app shell and fictional examples after first successful load; it does not make user reports persistent.
- Clipboard behavior depends on browser permissions and secure-context rules.
- Very large visible search results can still require substantial DOM rerendering.
- Large tables are capped, grouped, or collapsed, but true virtualization is not implemented.
- Search is simple substring matching; there is no regex, tokenization, or highlighting.
- CoreAnalytics does not render full raw JSON bodies.
- CoreAnalytics grouped event rows and sample record rows are capped at 100 rendered rows.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- AccessoryCrash support is limited to `.ips` reports with `bug_type: 305`.
- Broad Accessory/Firmware diagnostics are not supported.
- AccessoryCrash raw nested crashlog bodies are not rendered; crashlogs are summarized.
- Some additional Apple diagnostic families are recognized for safe unsupported messages only; they are not parsed into sections yet.
- CPU Resource, Disk Writes Resource, Stackshot Resource, App Usage Metrics, Wi-Fi Connectivity, and Diagnostic Request reports are not supported parsers yet.
- Section navigation marks clicked links only; there is no scroll-spy observer.
- Dense table state is UI-only and resets on new report, Clear Report, and privacy reparse.
- Copy reflects currently visible dense-table content and does not include collapsed hidden rows.
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
| v0.6.0-alpha Phase 1 | Complete, unreleased | Diagnostic Classification Architecture |
| v0.6.0-alpha Phase 2 | Active, unreleased | AccessoryCrash `bug_type: 305` support and QA cleanup |

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

CSP/header hardening is intentionally deferred beyond the `v0.5.0-alpha` release unless approved as a focused follow-up.

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

Upcoming `v0.6.0-alpha` or later work remains parser-family implementation and later hardening, subject to approval:

- broader Accessory/Firmware diagnostics, if explicitly planned
- Resource Diagnostics parser work for CPU, Disk Writes, and Stackshot families
- Wi-Fi Connectivity and Diagnostic Request parser work
- virtualization or incremental rendering for very large visible tables
- deeper CoreAnalytics drill-down without raw JSON dumping
- CSP/header hardening on a host that supports response headers
- export improvements beyond visible-section copy

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
