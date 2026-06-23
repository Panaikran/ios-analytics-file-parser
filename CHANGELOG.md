# Changelog

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
- Phase 4 PWA/deployment work has not started.

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
- Phase 4 PWA/deployment work has not started.

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
