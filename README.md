# iOS Analytics File Parser

A privacy-first, browser-based tool for reading iPhone and iPad diagnostic logs locally.

The app converts Apple diagnostic files into structured, human-readable sections without uploading reports to a server.

## Overview

iOS Analytics File Parser is a static browser app for inspecting common iOS and iPadOS diagnostic report formats:

- application crash reports
- watchdog stackshots
- JetsamEvent memory reports
- panic-full logs
- generic analytics text logs

It is intentionally local-first. Reports are parsed in the browser, sanitized by default, and displayed as structured sections, tables, charts, and raw notes where useful.

## Release Status

| Item | Status |
| --- | --- |
| Release target | `v0.3.1-alpha` |
| Phase 1 | Complete |
| Phase 2 | Complete |
| Phase 3 | Complete |
| Phase 4 | Not started |
| App type | Static browser app |
| Build step | None |
| Backend | None |
| Framework dependencies | None |

Note: `package.json` may still show `0.1.0` until release versioning is updated.

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
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or hidden report storage.

Sanitized mode is the default. It redacts sensitive identifiers before content is rendered.

Raw local view is opt-in. When enabled, the current report is reparsed from in-memory source text with sanitization disabled and labeled as:

```text
Raw local view - not uploaded
```

Raw mode applies only to the currently loaded report. Loading a new file, paste, drop, or example resets back to sanitized mode.

## Supported Formats

| Format | Detection | Current support |
| --- | --- | --- |
| Standard app crash `.ips` | `ips` | Summary, Exception, Crashed Thread, All Threads, Binary Images |
| Legacy `.crash` | `crash` | Summary, Exception, Crashed Thread, All Threads, Binary Images |
| Watchdog stackshot `.ips` | `ips-watchdog-stackshot` | Summary, Termination, Main Thread Stackshot |
| JetsamEvent `.ips` | `jetsam` | Summary, Victim / Likely Culprit, Process Table, System Memory, Limits, memory chart |
| Panic-full text or JSON-wrapped `.ips` | `panic` | Panic String, Panic Flags, Kernel Backtrace, Loaded Kexts, System Info |
| Generic analytics text | `analytics` | Fallback summary and grouped text sections |
| Structured CoreAnalytics `.ips.ca.synced` line-delimited JSON | `coreanalytics` | Summary, Configuration, Record Overview, Event Types, Sample Records, Parser Notes |

## Feature Support

| Feature | v0.3.1-alpha |
| --- | --- |
| Static browser app | Supported |
| Browser-native ES modules | Supported |
| File picker | Supported |
| Paste textarea | Supported |
| Explicit paste parse button | Supported |
| Drag-and-drop | Supported, optional |
| Production examples | Supported |
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
| PWA/offline mode | Not started |
| Web App Manifest | Not started |
| CSP hardening | Not started |
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

### Parsing And Rendering

- Summary, exception, termination, victim, system memory, limits, and system info sections.
- Crashed thread and all-thread stack rendering.
- Binary image tables.
- Jetsam process tables sorted by best available memory value.
- Panic backtrace and loaded kext tables.
- Generic analytics fallback grouping for unstructured analytics text.
- CoreAnalytics `.ips.ca.synced` summary, configuration, record overview, event type grouping, capped sample records, and parser notes.
- Section-specific table columns.
- Simple Jetsam memory bar chart.

### Navigation And Inspection

- Jump-link section navigation.
- Search across section titles, field labels, field values, table cells, and raw text.
- Matching table rows only are shown while search is active.
- Search results override collapsed dense-table state so matches remain visible.
- Copy buttons on each section.
- Copy output uses plain text and reflects currently visible content.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.

### CoreAnalytics Sections

Initial CoreAnalytics `.ips.ca.synced` support renders these sections:

- `coreanalytics-summary`
- `coreanalytics-configuration`
- `coreanalytics-record-overview`
- `coreanalytics-event-types`
- `coreanalytics-sample-records`
- `coreanalytics-parser-notes`

### Dense Table Controls

- All Threads groups rows by thread.
- Crashed thread expands by default.
- Other threads collapse by default.
- Jetsam process tables show the first 50 rows initially, with Show more and Show all controls.
- Large panic loaded-kext tables collapse by default.
- Binary image tables use compact rendering with horizontal overflow.

### Accessibility And Mobile

- Real buttons and anchors for primary controls.
- Visible labels for search and input controls.
- `aria-expanded` on collapse controls.
- Focus styling for the custom file picker.
- Scoped live regions for status/search feedback.
- Textarea font size is at least 16px for iPhone Safari.
- Mobile layout supports horizontally scrollable section navigation and tables.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Panaikran/ios-analytics-file-parser.git
cd ios-analytics-file-parser
```

The app has no build step. You can open `index.html` directly for basic file and paste parsing.

For production examples, serve the folder with a local static server. Examples are loaded with `fetch()`, and browser `file://` behavior varies.

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

On systems where `python` is unavailable, use any static file server that serves the repository root.

## Tests

Run the Node/assert-only test suite:

```powershell
npm.cmd test
```

Direct equivalent:

```powershell
node tests/parser.test.js
```

PowerShell note: `npm.cmd test` avoids execution-policy issues that can occur when `npm.ps1` is invoked.

## Architecture Overview

The project is a static, local-first browser app.

- `index.html` loads `src/main.js` with `type="module"`.
- `src/main.js` coordinates input, parsing, search, privacy mode, copy, dense table state, and rendering.
- `src/parsers/` detects and parses supported report formats.
- `src/privacy/sanitize.js` applies default sanitization.
- `src/models/sectionModel.js` documents the shared section shape.
- `src/ui/` renders sections, tables, charts, dense table controls, and navigation.
- `src/search/` filters parsed section data without scanning the DOM.
- `src/clipboard/` serializes visible section content for copy actions.
- `examples/` contains sanitized fictional examples for production UI use.
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
  |-- detectFileType(text)
  |-- parseInput(text, { sanitize })
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
```

## Architecture Directory Tree

```text
.
|-- index.html
|-- README.md
|-- ROADMAP.md
|-- PHASE_1_SUMMARY.md
|-- PHASE_2_SUMMARY.md
|-- PHASE_3_SUMMARY.md
|-- package.json
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
|   |-- clipboard/
|   |   |-- serializeSection.js
|   |   `-- visibleSection.js
|   |-- models/
|   |   `-- sectionModel.js
|   |-- parsers/
|   |   |-- detect.js
|   |   |-- index.js
|   |   |-- parseAnalytics.js
|   |   |-- parseCrash.js
|   |   |-- parseIps.js
|   |   |-- parseIpsContainer.js
|   |   |-- parseIpsWatchdogStackshot.js
|   |   |-- parseJetsam.js
|   |   |-- parseCoreAnalytics.js
|   |   `-- parsePanic.js
|   |-- privacy/
|   |   `-- sanitize.js
|   |-- search/
|   |   `-- filterSections.js
|   `-- ui/
|       |-- denseTables.js
|       |-- renderApp.js
|       |-- renderSection.js
|       `-- renderSectionNav.js
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

Test fixtures live separately in `tests/fixtures/` and should not be loaded by the production UI.

## Documentation Links

- [Phase 1 Summary](PHASE_1_SUMMARY.md)
- [Phase 2 Summary](PHASE_2_SUMMARY.md)
- [Phase 3 Summary](PHASE_3_SUMMARY.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Known Limitations

- Phase 4 has not started.
- No PWA/offline support yet.
- No service worker.
- No Web App Manifest.
- No CSP hardening yet.
- No hosted deployment yet.
- No automated browser or mobile Safari test harness.
- Clipboard behavior depends on browser permissions and secure-context rules.
- Very large visible search results can still require substantial DOM rerendering.
- Search is simple substring matching; there is no regex, tokenization, or highlighting.
- CoreAnalytics does not render full raw JSON bodies.
- CoreAnalytics grouped event rows and sample record rows are capped at 100 rendered rows.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- Section navigation marks clicked links only; there is no scroll-spy observer.
- Dense table state is UI-only and resets on new report, Clear Report, and privacy reparse.
- Copy reflects currently visible dense-table content and does not include collapsed hidden rows.
- Examples may require serving the repository through a local static server.
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
| Phase 4 | Not started | PWA, offline mode, web manifest, CSP hardening, deployment, release preparation |

Phase 4 should keep the same constraints:

- static browser app
- browser-native ES modules
- no backend
- no authentication
- no analytics
- no cloud storage for user reports
- no external parsing services
- no framework dependencies unless explicitly approved
- sanitized output remains default

## Screenshots / Demo

Screenshots are not included yet.

Useful future screenshots:

- input area with file picker, paste, examples, and Clear Report
- standard `.ips` crash summary and crashed thread
- All Threads grouped by thread
- Jetsam process table with row controls
- panic loaded-kext collapse controls
- search/filter result state
- privacy toggle in raw local view
- mobile Safari layout

## License

License to be determined.
