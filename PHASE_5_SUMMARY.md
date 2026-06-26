# Phase 5 Summary

## Overview

Phase 5 is the `v0.5.0-alpha` Large Report Usability and Performance milestone.

The milestone improves how large parsed reports are modeled, rendered, searched, copied, and viewed on narrow/mobile Safari layouts. It keeps the existing parser behavior, local-first privacy model, and PWA cache boundaries intact.

No backend, authentication, analytics, cloud storage, report persistence, framework dependency, runtime caching, or new parser format was added.

## Phase 5 Status

| Slice | Status | Summary |
| --- | --- | --- |
| Slice 0 | Complete | Release-state documentation cleanup after `v0.4.1-alpha` |
| Slice 1 | Complete | Large report baseline and guardrail helpers |
| Slice 2A | Complete | Pure shared table-view helper |
| Slice 2B | Complete | Copy path uses shared table-view helper |
| Slice 2C | Complete | Render path uses shared table-view helper |
| Slice 3A | Complete | Pure CoreAnalytics viewer model helper |
| Slice 3B | Complete | Minimal CoreAnalytics overview UI |
| Slice 4A | Complete | Pure search/copy metadata helpers |
| Slice 4B | Complete | Search/copy metadata wired into UI wording |
| Slice 5 | Complete | Mobile Safari and narrow-width polish |
| Slice 6 | Complete | Release hardening and documentation alignment |

## Milestone Theme

Primary theme: Large Report Usability and Performance, with CoreAnalytics as the proving ground.

Primary goal: make dense diagnostic reports easier to inspect without changing parser output, uploading reports, storing reports, or expanding the PWA cache strategy.

## Architecture Changes

### `src/models/reportSize.js`

Added pure helpers for identifying and summarizing report/section size:

- `getSectionSizeMetrics(section)`
- `summarizeSectionSize(section)`
- `isLargeSection(section)`
- `getReportSizeMetrics(sections)`
- `summarizeReportSize(sections)`
- `isLargeReport(sections)`

These helpers centralize size thresholds for future large-report work.

### `src/ui/tableView.js`

Added a shared table visibility model used by copy and rendering paths.

Supported modes:

- `plain`
- `compact`
- `limited`
- `collapsed`
- `grouped`

The helper models existing dense-table behavior for:

- All Threads grouping
- Jetsam process-table row limits
- panic loaded-kext collapse
- Binary Images compact rendering
- search `forceExpanded` behavior

### `src/ui/coreAnalyticsView.js`

Added a pure CoreAnalytics viewer model helper.

It derives display-safe overview data from existing parsed CoreAnalytics sections:

- summary/config/overview fields
- event type table metadata
- sample records table metadata
- shown/total count parsing
- capped table detection
- rendered-row-only facets
- parser-note warnings

It does not inspect raw source text or raw JSON bodies.

### `src/ui/renderCoreAnalyticsOverview.js`

Added a minimal overview panel above existing CoreAnalytics sections.

The overview is not inserted into parser output and does not affect section navigation, search result counts, or section copy behavior.

It shows:

- key CoreAnalytics summary fields
- Event Groups and Sample Records shown/total counts
- capped table warnings
- rendered-row-only facet summaries
- parser-note warnings

### `src/search/searchMetadata.js`

Added display-safe search scope metadata.

It helps the UI distinguish:

- inactive search
- parsed output search
- rendered parsed output search
- capped CoreAnalytics rendered-row search

It does not scan the DOM, source text, raw JSON bodies, or persistent storage.

### `src/clipboard/copyMetadata.js`

Added display-safe copy scope metadata.

It describes:

- visible rows
- total rows
- limited rows
- collapsed rows
- capped CoreAnalytics tables
- visible-section copy scope

It uses the shared table-view model and does not change copied content.

## User-Facing Improvements

- CoreAnalytics reports now include a compact overview panel.
- CoreAnalytics overview explains rendered capped rows and omitted raw JSON bodies.
- Search status now states when search covers rendered capped rows only.
- Copy feedback now states when only visible rows are copied.
- Dense table render and copy behavior now share the same visibility model.
- Mobile Safari layout has stronger page containment.
- Search/copy status text wraps on narrow screens.
- CoreAnalytics chips and notes wrap on narrow screens.
- Dense table controls, section nav chips, copy buttons, clear search, and privacy toggle have practical mobile touch targets.

## Privacy Boundaries

Sanitized mode remains the default.

Raw local view remains opt-in and applies only to the current in-memory report.

Phase 5 did not add:

- report persistence
- recent files
- report history
- uploads
- backend processing
- analytics
- cloud storage
- external parsing services
- `localStorage`
- `sessionStorage`
- `IndexedDB`
- cookies

Search/copy metadata and CoreAnalytics overview helpers operate on parsed sections only. They do not inspect source text, raw JSON bodies, clipboard output, or persistent storage.

## PWA And Cache Boundaries

Phase 5 did not change the service worker caching strategy.

The service worker still:

- precaches only explicit app-shell assets and sanitized fictional examples
- uses cache-first only for allowlisted same-origin GET assets
- uses cached `index.html` only for same-origin navigation fallback
- deletes old `ios-analytics-parser-*` caches during activation
- avoids dynamic `cache.put`
- avoids runtime caching of unknown requests

The cache version was bumped when precached CSS/JS changed during Phase 5.

Current Phase 5 cache version:

```text
v0.5.0-alpha-slice5-mobile-safari-polish-2026-06-27
```

## Validation Commands Run

Final validation before documentation alignment:

```powershell
npm.cmd test
node --check src\main.js
node --check service-worker.js
node --check tests\parser.test.js
node --check src\models\reportSize.js
node --check src\ui\tableView.js
node --check src\ui\coreAnalyticsView.js
node --check src\ui\renderCoreAnalyticsOverview.js
node --check src\search\searchMetadata.js
node --check src\clipboard\copyMetadata.js
```

Result: all commands passed.

## Manual QA Checklist

Record release evidence for:

- local static server load
- GitHub Pages deployed path
- service worker registration scope
- installed PWA launch
- offline app shell after first online load
- offline fictional examples
- update-ready flow and `Reload app`
- iPhone Safari file picker
- iPhone Safari unsupported file rejection
- iPhone Safari 20 MB safety limit
- iPhone Safari no page-level horizontal overflow
- iPad Safari split-screen and installed PWA behavior
- large CoreAnalytics overview, capped rows, search, and copy
- panic-full long raw text wrapping
- Jetsam process table row controls
- standard app crash All Threads and Binary Images
- Clear Report state wipe
- sanitized default and raw local opt-in behavior

## Known Limitations

- No new parser formats were added in Phase 5.
- AccessoryCrash is not supported.
- True virtualization is not implemented.
- CoreAnalytics grouped event rows and sample record rows remain capped at 100 rendered rows.
- CoreAnalytics full raw JSON bodies are not rendered by default.
- Search remains simple substring matching.
- No automated mobile Safari harness exists.
- CSP/header hardening remains deferred.
- No report persistence, recent files, or history.
- No symbolication.
- No `.dSYM` support.
- No sysdiagnose archive extraction.
- `package.json` may still show the legacy `0.1.0` value; release identity is tracked by Git tags, README, CHANGELOG, and GitHub Releases.

## v0.6.0-alpha Starting Point

Potential next milestone work, subject to approval:

- AccessoryCrash or another focused parser format
- virtualization or incremental rendering for very large visible tables
- deeper CoreAnalytics drill-down without rendering full raw JSON bodies by default
- export/copy improvements beyond visible-section plain text
- optional automated browser/mobile smoke tests
- CSP/header hardening on a host that supports custom response headers

Continue to preserve:

- browser-only static app architecture
- sanitized output by default
- raw local view as explicit opt-in
- no uploads
- no report persistence
- no backend/auth/analytics/cloud
- no runtime caching of user data
