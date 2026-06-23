# iOS Analytics File Parser Roadmap

Status: updated for `v0.3.1-alpha`

The project is a static, local-first browser app for inspecting iOS analytics and diagnostic files. Reports are parsed in the browser, sanitized by default, and never uploaded by the app.

## Current Release State

| Milestone | Status | Release | Summary |
| --- | --- | --- | --- |
| Phase 1: Core Parser | Complete | `v0.1.0-alpha` | Core static app, `.ips` and `.crash` parsing, sanitizer foundation, Node/assert tests |
| Phase 2: Full Section Rendering | Complete | `v0.2.0-alpha` | All Threads, Binary Images, JetsamEvent, panic-full, analytics fallback, memory chart |
| Phase 3: UI Polish | Complete | `v0.3.0-alpha` | Examples, input UX, section navigation, search/filter, copy actions, dense tables, privacy toggle |
| CoreAnalytics Patch | Complete | `v0.3.1-alpha` | Initial `.ips.ca.synced` CoreAnalytics detection, parser, privacy handling, capped rows, fixtures, tests |
| Phase 4: PWA and Release | Not started | Future | Offline/PWA hardening, deployment, CSP, release polish |

## Project Constraints

These constraints remain active for future phases unless explicitly changed:

- Static browser app.
- Browser-native ES modules.
- No backend.
- No authentication.
- No analytics.
- No cloud storage for user reports.
- No external parsing services.
- No framework dependencies unless explicitly approved.
- Sanitized output remains the default.
- Raw local view remains opt-in and local-only.

## Completed Milestones

### Phase 1: Core Parser

Completed in `v0.1.0-alpha`.

Delivered:

- Static single-page app scaffold with no build step.
- Browser-native ES module structure.
- File type detection foundation.
- Standard app crash `.ips` parsing.
- Legacy `.crash` parsing.
- Summary, Exception, and Crashed Thread sections.
- Privacy sanitizer foundation.
- Sanitized fictional fixtures.
- Node/assert-only parser tests.

### Phase 2: Full Section Rendering

Completed in `v0.2.0-alpha`.

Delivered:

- Per-section table rendering with section-specific columns.
- All Threads sections for standard `.ips` and legacy `.crash` reports.
- Binary Images sections for standard `.ips` and legacy `.crash` reports.
- Watchdog stackshot `.ips` rendering.
- JetsamEvent parser with summary, victim/likely culprit, process table, system memory, limits, and memory chart.
- Panic-full parser with panic string, panic flags, kernel backtrace, loaded kexts, and system info.
- Generic analytics text fallback parser.
- Real-world validation fixes for Jetsam and panic-full formats.

### Phase 3: UI Polish

Completed in `v0.3.0-alpha`.

Delivered:

- App state boundaries for current source, parsed sections, source labels, detected type, privacy mode, search, and dense table state.
- Production examples loaded from `examples/`.
- File picker, explicit paste parsing, optional drag-and-drop, and Clear Report.
- Jump-link section navigation.
- Search/filter over parsed `SectionModel` data.
- Copy section actions using visible rendered content.
- Dense table controls for thread groups, Jetsam row limits, panic kext collapse, and compact binary image tables.
- Privacy toggle with sanitized mode as default and raw local view as opt-in.
- Accessibility and mobile Safari improvements.
- Pre-release hardening for privacy lifecycle, status accuracy, and copy visibility behavior.

### v0.3.1-alpha: CoreAnalytics Patch

Completed after Phase 3.

Delivered:

- Content-based detection for newline-delimited CoreAnalytics `.ips.ca.synced` reports.
- Dedicated CoreAnalytics parser.
- Rendered CoreAnalytics sections:
  - `coreanalytics-summary`
  - `coreanalytics-configuration`
  - `coreanalytics-record-overview`
  - `coreanalytics-event-types`
  - `coreanalytics-sample-records`
  - `coreanalytics-parser-notes`
- Key-aware privacy handling for `incident_id`, `deviceId`, `uuid`, `configUuid`, and `sessionId`.
- 100-row caps for grouped event rows and sample record rows.
- Sanitized fictional fixtures and regression tests.

Known CoreAnalytics limits:

- Full raw JSON bodies are not rendered.
- Search and copy operate on rendered capped rows, not every source record.

## Active Roadmap: Phase 4

Phase 4 has not started.

Primary goal: prepare the static app for release-quality deployment while preserving the local-first privacy model.

Recommended Phase 4 scope:

- Web App Manifest for installability.
- Service Worker for offline use after first load.
- Content Security Policy hardening.
- Static hosting setup, such as GitHub Pages or Cloudflare Pages.
- Manual QA pass across supported examples and real-world validation patterns.
- Mobile Safari QA pass.
- Release checklist and versioning cleanup.
- Documentation review before release.

Phase 4 should not add:

- Backend services.
- Authentication.
- Analytics.
- Cloud storage for user reports.
- External parsing services.
- Symbolication.
- `.dSYM` support.
- Sysdiagnose archive extraction.
- New framework dependencies without explicit approval.

Testing direction for Phase 4:

- Preserve existing Node/assert regression tests.
- Add focused tests only where Phase 4 changes create testable logic.
- Consider browser smoke tests only if approved.
- Do not migrate the test runner unless the cost is justified and approved.

## Historical Planning Notes

The original four-week checklist and task IDs have been replaced by the completed milestone summaries above. Those old checklist items were useful while planning, but they no longer reflected the released project state.

The original timeline should be treated as historical planning context, not the current source of truth. The current source of truth is:

- `README.md` for user-facing support and limitations.
- `CHANGELOG.md` for release history.
- `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, and `PHASE_3_SUMMARY.md` for phase details.
- This roadmap for active and future project direction.

## Post-Phase-4 Exploratory Ideas

These ideas are intentionally out of scope for Phase 4 unless explicitly approved later.

| Area | Idea |
| --- | --- |
| Symbolication | Client-side `.dSYM` symbolication for resolving raw addresses without a backend |
| Diagnostics | Confidence-based diagnosis rules for known crash signatures |
| Panic analysis | Optional panic repair hint rules for repeated panic-full signatures |
| MetricKit | `MXCrashDiagnostic` format support |
| Sysdiagnose | Local sysdiagnose archive extraction and file picker |
| Comparison | Diff view for comparing two reports side by side |
| Sharing | Local-only share/export format that does not upload reports |

## Next Planning Step

Before Phase 4 implementation begins, produce a focused Phase 4 plan covering:

- exact PWA/offline requirements
- CSP policy
- hosting target
- manual QA matrix
- browser smoke-test decision
- release/versioning cleanup
