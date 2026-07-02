# Changelog

## v0.8.0-alpha

Release hardening and QA polish for the existing static, local-first app.

### Added

- Foundational project documentation in `PLANS.md` and `ARCHITECTURE.md`.
- Static regression guards for manifest metadata, GitHub Pages-safe relative paths, explicit service-worker precache allowlist boundaries, navigation fallback behavior, old-cache cleanup, and no runtime cache additions.
- Phase 8 summary documentation.

### Improved

- UI spacing, wrapping, dense-table containment, section navigation, copy/search feedback wrapping, and mobile readability.
- Keyboard usability, focus visibility, accessible names for ambiguous controls, live-region behavior, touch target sizing, and reduced-motion guardrails.
- Browser and mobile QA coverage across supported parser families, recognized unsupported diagnostics, explanation sections, search, copy, raw local mode, Clear Report, responsive widths, and PWA behavior.
- Service-worker platform behavior by redirecting unsupported nested navigations back to the app root before relative app-shell assets can resolve against the wrong path.
- PWA/install confidence through manifest, service-worker, offline-shell, offline-example, and cache-boundary verification.
- README, ROADMAP, CHANGELOG, and phase-summary alignment for the completed hardening milestone.

### Notes

- No parser behavior, parser routing, explanation logic, parser families, package metadata, backend, analytics, cloud storage, report persistence, AI diagnosis, symbolication, sysdiagnose extraction, or full stack rendering was added.
- CSP/header hardening remains hosting-dependent. GitHub Pages does not serve custom response headers directly.
- Safari and Mobile Safari remain manual QA targets when available; they were not available in the Windows QA environment.

## v0.7.0-alpha

Human-readable diagnostic explanations for already-supported report types.

### Added

- Deterministic explanation helper in `src/explanations/diagnosticExplanations.js`.
- One `What This Usually Means` explanation section for supported parsed reports when a safe rule applies.
- Explanation coverage for selected app crash exceptions, Watchdog, Jetsam, Panic, AccessoryCrash, CPU Resource, Disk Writes Resource, and Stackshot Resource reports.
- Search, copy, privacy, raw-mode, malformed-input, and unsupported-diagnostic regression coverage for explanation sections.
- Browser/UI smoke QA for rendered explanation sections, section navigation, search, copy, raw local mode, Clear Report, mobile widths, and service-worker/offline behavior.
- Phase 7 summary documentation.

### Changed

- `parseInput()` now inserts at most one explanation section into supported `SectionModel[]` output after the first Summary-like section when practical.
- Explanation sections participate in existing section rendering, section navigation, search, and copy behavior.
- Service worker precache coverage now includes the explanation helper module.

### Notes

- Explanations are deterministic, local-only, and based on already-parsed safe fields.
- No AI diagnosis, exact root-cause claims, symbolication, full stack rendering, new parser families, backend, analytics, cloud storage, report persistence, or package metadata change was added.
- App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, and broad Accessory/Firmware diagnostics remain unsupported.

## v0.6.0-alpha

Apple Diagnostics Expansion classification architecture, narrow AccessoryCrash support, and narrow Resource Diagnostics support.

### Added

- Diagnostic classifier in `src/parsers/classifyDiagnostic.js` for supported formats and recognized unsupported Apple diagnostic families.
- Taxonomy metadata for `type`, `family`, `subtype`, `supported`, `parserType`, `legacyType`, `structure`, and `bugType`.
- Recognition for unsupported App Usage Metrics, Wi-Fi Connectivity, and Diagnostic Request diagnostics.
- Friendly safe unsupported diagnostic messages for recognized-but-unsupported families.
- Taxonomy and privacy regression tests for supported and recognized unsupported diagnostics.
- AccessoryCrash parser support for `.ips` reports with `bug_type: 305`.
- AccessoryCrash sections: Summary, Accessory Information, Application Information, Crash Log Overview, Panic / Fault Notes, and Parser Notes.
- AccessoryCrash privacy hardening for incident IDs, UUIDs, request IDs, paths, serials, MAC addresses, ECIDs/chip identifiers, crashlog IDs, nested values, and raw-mode output.
- CPU Resource parser support for reports classified as `bug_type: 202`.
- CPU Resource sections: Summary, Process / Command Info, CPU Usage, Limits / Thresholds, and Parser Notes.
- Disk Writes Resource parser support for reports classified as `bug_type: 142`.
- Disk Writes Resource sections: Summary, Process / Command Info, Disk Write Usage, Limits / Thresholds, and Parser Notes.
- Stackshot Resource parser support for reports classified as `bug_type: 288`, with summary-only output.
- Stackshot Resource sections: Summary, Trigger / Reason, Process Overview, Top Processes, and Parser Notes.
- Stackshot Top Processes output is capped at 100 rendered rows with visible/total summary wording.
- Cross-resource privacy, search, copy, raw-mode, malformed-input, and row-cap regression coverage for CPU Resource, Disk Writes Resource, and Stackshot Resource.

### Changed

- `detectFileType()` is now a compatibility wrapper over `classifyDiagnostic(input).legacyType`.
- `parseInput()` now routes internally through `classifyDiagnostic(input).parserType` while preserving its public `SectionModel[]` return contract for supported files.
- AccessoryCrash is now classified and routed through `parseInput()` as `accessory-crash`.
- CPU Resource is now classified and routed through `parseInput()` as `resource-cpu`.
- Disk Writes Resource is now classified and routed through `parseInput()` as `resource-diskwrites`.
- Stackshot Resource is now classified and routed through `parseInput()` as `resource-stackshot`.

### Notes

- AccessoryCrash support is intentionally narrow and limited to `bug_type: 305`; broad Accessory/Firmware diagnostics are not supported.
- Resource Diagnostics support is intentionally narrow and limited to CPU Resource `bug_type: 202`, Disk Writes Resource `bug_type: 142`, and Stackshot Resource `bug_type: 288`.
- Stackshot Resource support is summary parsing only; full stack rendering, frame symbol rendering, frame address rendering, and symbolication are not supported.
- No App Usage Metrics, Wi-Fi Connectivity, or Diagnostic Request parser support was added.
- No real diagnostic fixtures were committed.
- Recognized unsupported diagnostics do not emit sections and still fail safely if parsed directly.
- No UI rendering model, service worker strategy, package metadata, backend, authentication, analytics, cloud storage, report persistence, or framework dependency changed.

## v0.5.1-alpha

File-size validation hotfix.

### Fixed

- Restored the mobile Safari file safety limit to 20 MB.
- Fixed the oversized-file error message so it shows `This file exceeds the 20 MB safety limit and was not opened.`
- Bumped the service worker cache version so the corrected precached file validation module is fetched after deploy.

### Notes

- No parser behavior changed.
- No search, copy, render, runtime caching, backend, analytics, cloud storage, report persistence, or package metadata changed.

## v0.5.0-alpha

Large Report Usability and Performance release.

### Added

- Reusable large-report size helpers in `src/models/reportSize.js`.
- Shared table-view helper in `src/ui/tableView.js`.
- CoreAnalytics viewer model helper in `src/ui/coreAnalyticsView.js`.
- Minimal CoreAnalytics overview UI above existing CoreAnalytics parser sections.
- Search metadata helper for describing parsed output versus rendered capped rows.
- Copy metadata helper for describing visible rows, collapsed rows, and capped CoreAnalytics tables.
- Static regression coverage for large-report helpers, table-view decisions, CoreAnalytics overview behavior, search/copy scope metadata, and mobile Safari layout guardrails.

### Improved

- Copy and render paths now share the same table visibility decisions.
- All Threads, Jetsam process tables, panic loaded-kext tables, Binary Images, and plain tables now use centralized table-view logic.
- Search/copy UI wording now clarifies when results operate on rendered capped rows rather than every source record.
- CoreAnalytics overview summarizes rendered counts, capped-table status, rendered-row-only facets, and parser notes without rendering full raw JSON bodies.
- Mobile Safari/narrow-width layout polish for page-level containment, CoreAnalytics chips, search/copy feedback wrapping, dense table controls, section nav chips, and practical touch targets.
- Service worker cache version was bumped for precached CSS/JS updates during the milestone.

### Notes

- No parser support changed in this release.
- No AccessoryCrash support was added.
- No virtualization was added.
- No backend, authentication, analytics, cloud storage, runtime caching, report persistence, or framework dependency was added.
- `package.json` remains unchanged and may still show the legacy `0.1.0` value; release state is tracked by tags and documentation.

## v0.4.1-alpha

PWA update activation hotfix.

### Fixed

- Fixed a stuck `Update ready` state where a waiting service worker could remain waiting after the user pressed `Reload app`.
- Service worker `SKIP_WAITING` message handling now uses `event.waitUntil(self.skipWaiting())` so the activation request is kept alive reliably.

### Notes

- No parser behavior changed.
- No caching strategy changed.
- No runtime caching, backend, analytics, cloud storage, or report persistence was added.

## v0.4.0-alpha

Phase 4 PWA, offline app shell, mobile Safari hardening, and release-readiness update.

### Added

- Web App Manifest with GitHub Pages-safe relative paths.
- PWA icons, maskable icon, favicon, and Apple touch icon.
- Apple web app meta tags and theme color.
- Install guidance explaining that installation saves the app shell, not reports.
- Root service worker for an offline app shell after first successful load.
- Offline support for sanitized fictional examples.
- Offline-ready, offline-setup-failed, and update-ready status messages.
- Explicit `Reload app` button for applying a waiting service worker update.
- Developer cache-version reminder for precached asset changes.
- Release hardening documentation and Phase 4 summary.

### Improved

- File picker behavior for iPhone and iPad Safari by keeping selection broad enough for `.ips` and related diagnostic files.
- Safe file intake by validating selected files before calling `file.text()`.
- Mobile Safari safety limit for files larger than 20 MB.
- Rejection of clearly unsupported binary, media, PDF, and ZIP files before reading.
- Panic/raw diagnostic text wrapping on iPhone Safari.
- Mobile layout containment for raw text, tables, section cards, section navigation, and safe-area bottom padding.
- Service worker cache-version discipline after CSS/JS and file-message changes.

### Notes

- CSP/header hardening is deferred for `v0.4.0-alpha`.
- GitHub Pages is the deployment target.
- The service worker caches only allowlisted app-shell assets and sanitized fictional examples.
- Uploaded files, pasted report text, parsed sections, raw-mode output, search state, dense-table state, and clipboard output are not cached or persisted by the app.
- `package.json` remains unchanged and may still show the legacy `0.1.0` value; release state is tracked by tags and documentation.

## v0.3.1-alpha

CoreAnalytics patch release.

### Added

- Content-based CoreAnalytics `.ips.ca.synced` detection.
- Dedicated CoreAnalytics parser for newline-delimited JSON records.
- CoreAnalytics sections for summary, configuration, record overview, event types, sample records, and parser notes.
- Key-aware CoreAnalytics privacy handling for `incident_id`, `deviceId`, `uuid`, `configUuid`, and `sessionId`.
- 100-row caps for CoreAnalytics grouped event rows and sample record rows.
- Sanitized fictional CoreAnalytics fixtures and regression tests.

### Notes

- CoreAnalytics search and copy operate on rendered capped rows, not every source record.
- CoreAnalytics does not render full raw JSON bodies.
- Phase 4 PWA/deployment work was added later for the `v0.4.0-alpha` release target.

## v0.3.0-alpha

Phase 3 UI polish and release hardening.

### Added

- Production examples from `examples/`, one per supported report family.
- Explicit paste parsing flow.
- Optional drag-and-drop input.
- Clear Report action for wiping current report state.
- Section jump navigation.
- Search/filter across parsed output.
- Copy section actions with plain-text output.
- Dense table controls:
  - grouped All Threads sections
  - crashed thread expanded by default
  - Jetsam process-table row limits
  - panic loaded-kext collapse
  - compact binary-image table handling
- Privacy toggle:
  - sanitized mode remains default
  - raw local view is opt-in
  - raw mode applies only to the current in-memory report
- Accessibility improvements:
  - narrower live regions
  - keyboard focus styling for the file picker
  - `aria-expanded` collapse controls
  - labeled copy actions

### Fixed

- New reports now reset back to sanitized mode after raw local view was used.
- Status text now reflects the actual privacy mode.
- Copy now respects current rendered visibility, including search filtering, dense table expansion, row limits, and kext collapse state.

### Notes

- Structured CoreAnalytics `.ips.ca.synced` line-delimited JSON reports were added later in `v0.3.1-alpha`.
- Phase 4 PWA/deployment work was added later for the `v0.4.0-alpha` release target.

## v0.2.0-alpha

Phase 2 full section rendering and parser expansion.

### Added

- JetsamEvent parser.
- Panic-full parser.
- Generic analytics fallback parser.
- Binary Images sections.
- All Threads rendering.
- Flexible per-section table columns.
- Simple Jetsam memory chart.

### Improved

- Standard `.ips` metadata normalization.
- Real-world Jetsam normalization for memory values, culprit selection, limits, role/state, priority, and reasons.
- Real-world panic-full parsing for JSON-wrapped `.ips` containers, panic flags, system info, `lr` / `fp` backtrace rows, and loaded kext rows.

## v0.1.0-alpha

Phase 1 core parser milestone.

### Added

- Static browser app scaffold.
- Browser-native ES module structure.
- Standard app crash `.ips` support.
- Legacy `.crash` support.
- Watchdog stackshot `.ips` support.
- Panic-full detection placeholder.
- Shared `SectionModel` rendering flow.
- Privacy sanitizer foundation.
- Sanitized fictional test fixtures.
- Node/assert-only parser test suite.
