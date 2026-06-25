# Phase 3 Summary

## Overview

Phase 3 is complete for the `v0.3.0-alpha` release target.

Post-Phase 3 release note: `v0.3.1-alpha` adds initial CoreAnalytics `.ips.ca.synced` support after the `v0.3.0-alpha` UI release.

Post-Phase 4 release note: PWA identity, service worker app shell, offline examples, update UX, safe file intake, and mobile Safari hardening were added later for the `v0.4.0-alpha` release target. See `PHASE_4_SUMMARY.md` for the current PWA/offline status.

This phase focused on turning the Phase 1 and Phase 2 parser layer into a more usable local diagnostic viewer. The app remains a static, browser-native ES module application with no build step and no server-side component.

Phase 3 did not add backend services, authentication, analytics, cloud storage, framework dependencies, or report persistence.

## Goals Achieved

- Added clear app state boundaries for current source text, source label, detected type, parsed sections, status, privacy mode, search state, and dense table state.
- Extended the parser contract to accept explicit privacy options.
- Kept sanitized mode as the default.
- Added raw local view as an opt-in mode for the currently loaded report only.
- Added production example loading from sanitized fictional files under `examples/`.
- Improved input UX with an explicit paste parse button and optional drag-and-drop.
- Added section navigation, search/filter, copy actions, and dense table controls.
- Preserved Phase 1 and Phase 2 parser behavior.
- Kept the app static, local-first, and privacy-first.

## Features Added

### Input UX

- File picker remains supported.
- Paste textarea now uses an explicit `Parse pasted text` action.
- Optional drag-and-drop support was added.
- Clear Report wipes current report state and rendered output.
- Production examples are loaded from `examples/`, not from `tests/fixtures/`.

### Example Files

One sanitized fictional production example is available for each supported family:

- app crash `.ips`
- legacy `.crash`
- watchdog `.ips`
- JetsamEvent `.ips`
- panic-full `.ips`
- analytics `.txt`

Examples use the same parse path as file and paste input.

### Section Navigation

- Section navigation is generated from current visible sections.
- Navigation uses jump links, not hidden tabs.
- All sections remain in normal document flow.
- Search filtering updates the visible section navigation.

### Search And Filtering

- Search runs against parsed `SectionModel` data, not the rendered DOM.
- Search covers section titles, field labels, field values, table cells, and raw text.
- Matching sections remain visible.
- Matching table rows are filtered down to visible matches.
- Empty result state shows `No matches in parsed output.`
- Search results take precedence over collapsed dense table state.
- CoreAnalytics search runs against rendered capped rows, not every source record.

### Copy Section Actions

- Each rendered section has a Copy action.
- Copy output is plain text.
- Copy includes visible section title, fields, table rows, table summaries, raw text, and chart data where present.
- Copy respects current privacy mode.
- Copy respects search filtering and dense table visibility.
- CoreAnalytics copy uses rendered capped rows and does not include full raw JSON bodies.

### Dense Table Controls

- All Threads sections group rows by thread.
- Crashed thread expands by default.
- Other threads collapse by default.
- Jetsam process tables show the first 50 rows initially and expose Show more / Show all controls.
- Large panic loaded-kext tables collapse by default.
- Binary image tables use compact horizontal overflow handling.

### Privacy Toggle

- Sanitized mode is default.
- Raw local view is opt-in.
- Raw local view is labeled as local-only.
- Switching privacy mode reparses from the current in-memory source text.
- Loading a new report resets privacy mode to sanitized.

## Architecture Changes

Phase 3 added UI state and interaction modules around the existing parser layer:

- `src/appState.js`: app state helpers and privacy-aware status messages.
- `src/main.js`: event coordination, parse flow, privacy toggle, search, copy, dense table state, and rendering.
- `src/search/filterSections.js`: pure search/filter helpers for parsed sections.
- `src/clipboard/serializeSection.js`: plain-text section serialization.
- `src/clipboard/visibleSection.js`: derives copy content from current rendered dense-table visibility.
- `src/ui/renderSectionNav.js`: jump-link section navigation.
- `src/ui/denseTables.js`: pure dense table helpers.
- `examples/manifest.js`: production example metadata.
- `examples/`: sanitized fictional production examples.

Parser contract:

```js
parseInput(text, { sanitize = true } = {}) -> SectionModel[]
```

Default behavior remains:

```js
parseInput(text)
parseInput(text, { sanitize: true })
```

Raw local parsing must be explicit:

```js
parseInput(text, { sanitize: false })
```

## Privacy Model

Sanitized mode is default.

Raw local view is opt-in and applies only to the currently loaded report. It reparses the current in-memory source text with sanitization disabled.

No persistence was added during Phase 3:

- no `localStorage`
- no `sessionStorage`
- no `IndexedDB`
- no cookies
- no service worker cache existed at the Phase 3 release point
- no hidden report storage

No external services were added:

- no backend
- no authentication
- no analytics
- no cloud storage
- no external parsing service
- no framework dependencies

Clear Report wipes the current report state, rendered sections, source label, detected type, source text, search state, dense table state, file input, paste textarea, and resets privacy mode to sanitized.

## Search/Filter Implementation

Search is implemented as a pure transformation over parsed sections.

Behavior:

- Normalizes the query to lowercase text.
- Returns original sections when the query is blank.
- Produces filtered section copies when search is active.
- Does not mutate parser output.
- Adds `forceExpanded` to matching sections so search results remain visible.
- Filters table rows down to matching rows.
- Adds row-count summaries such as `12 of 868 rows shown`.

Search intentionally avoids DOM scanning.

## Dense Table Controls

Dense table state is UI-only and is not stored in parser output.

Current controls:

- thread group expansion state
- Jetsam process-table row limits
- loaded-kext table expanded/collapsed state

Dense state resets on:

- Clear Report
- loading a new report
- privacy-mode reparse

Search results override collapse and row-limit behavior where needed so matches stay visible.

## Accessibility Improvements

Implemented:

- Real buttons for parse, clear, privacy toggle, copy actions, examples, and dense table controls.
- Real anchors for section navigation.
- Semantic section headings.
- Visible labels for search and input controls.
- `aria-expanded` on collapse controls.
- Descriptive copy button labels.
- Copy feedback with `aria-live="polite"`.
- Scoped status/search live regions.
- Visible keyboard focus styling for the custom file picker.
- Textarea font size of at least 16px for iPhone Safari.

The broad results-level live region was removed in favor of narrower status/search feedback.

## Testing And Validation Performed

Primary command:

```powershell
npm.cmd test
```

The Node/assert-only test suite covers:

- parser detection and extraction regressions
- privacy default behavior
- explicit raw parse behavior
- app state privacy defaults
- section navigation helper output
- search/filter behavior
- copy serialization
- visible-copy behavior with dense table state
- thread grouping helpers
- Jetsam row-limit helpers
- large-kext detection
- production example metadata and parsing
- CoreAnalytics detection, parser summaries, row caps, and privacy behavior in `v0.3.1-alpha`

Focused syntax checks used during Phase 3:

```powershell
node --check src\main.js
node --check src\appState.js
node --check src\clipboard\visibleSection.js
node --check src\clipboard\serializeSection.js
node --check src\ui\renderSection.js
node --check src\search\filterSections.js
```

Privacy/persistence marker scans were also used to check for forbidden persistence and raw-data logging markers.

## Real-World Files Validated

Real files were validated read-only and were not committed.

Validated successfully:

- real standard app crash `.ips`
- real panic-full `.ips`
- real CoreAnalytics `.ips.ca.synced` files after the `v0.3.1-alpha` parser update

Resolved parser gap:

- structured CoreAnalytics `.ips.ca.synced` files using line-delimited JSON now detect as `coreanalytics` and render capped summary, configuration, record overview, event type, sample record, and parser notes sections in `v0.3.1-alpha`.

Sanitized fictional `.ips.ca.synced` fixture patterns were added for CoreAnalytics because real files contain structured analytics records and privacy-sensitive keys such as device IDs, UUIDs, session IDs, config UUIDs, and incident IDs.

## Known Limitations

- Historical note: the Phase 4/PWA limitations in this section described the project state at the end of Phase 3 and the `v0.3.x` releases.
- Current PWA/offline status is documented in `PHASE_4_SUMMARY.md`.
- CSP/header hardening remains deferred for the `v0.4.0-alpha` release target.
- No Cloudflare/header CSP deployment is configured yet.
- No automated browser or mobile Safari test harness.
- Clipboard behavior depends on browser permissions and secure-context rules.
- Very large visible search results can still require substantial DOM rerendering.
- Search is simple substring matching; no regex, tokenization, or highlighting.
- Section navigation marks clicked links only; no scroll-spy observer is implemented.
- Dense table state is UI-only and resets on new report, Clear Report, and privacy reparse.
- Copy reflects currently visible dense-table content and does not include collapsed hidden rows.
- Examples may require serving the repository through a local static server because browser `file://` fetch behavior varies.
- The current UI is dark themed; dark/light mode is not implemented.
- CoreAnalytics does not render full raw JSON bodies.
- CoreAnalytics grouped event rows and sample record rows are capped at 100 rendered rows.
- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- No symbolication.
- No `.dSYM` support.
- No sysdiagnose archive extraction.

## Phase 4 Preview

Phase 4 was planned to focus on release hardening and deployment:

- manual QA pass across supported examples and real-world validation patterns
- optional browser smoke tests if approved
- Web App Manifest
- Service Worker for offline support after first load
- Content Security Policy hardening
- static hosting setup
- release checklist and versioning cleanup
- changelog maintenance

As of the `v0.4.0-alpha` release target, manifest/install identity, service worker app shell, offline examples, update UX, safe file intake, and mobile Safari hardening have been implemented. CSP/header hardening is intentionally deferred.

Phase 4 should preserve the existing constraints:

- static browser app
- browser-native ES modules
- sanitized output by default
- no backend
- no authentication
- no analytics
- no cloud storage for user reports
- no external parsing service
- no framework dependencies unless explicitly approved
