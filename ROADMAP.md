# iOS Analytics File Parser Roadmap

Status: updated for `v0.5.0-alpha` release hardening

The project is a static, local-first browser app for inspecting iOS analytics and diagnostic files. Reports are parsed in the browser, sanitized by default, and never uploaded by the app.

## Current Release State

| Milestone | Status | Release | Summary |
| --- | --- | --- | --- |
| Phase 1: Core Parser | Complete | `v0.1.0-alpha` | Core static app, `.ips` and `.crash` parsing, sanitizer foundation, Node/assert tests |
| Phase 2: Full Section Rendering | Complete | `v0.2.0-alpha` | All Threads, Binary Images, JetsamEvent, panic-full, analytics fallback, memory chart |
| Phase 3: UI Polish | Complete | `v0.3.0-alpha` | Examples, input UX, section navigation, search/filter, copy actions, dense tables, privacy toggle |
| CoreAnalytics Patch | Complete | `v0.3.1-alpha` | Initial `.ips.ca.synced` CoreAnalytics detection, parser, privacy handling, capped rows, fixtures, tests |
| Phase 4: PWA and Release | Complete | `v0.4.0-alpha` | Manifest/install identity, service worker app shell, offline examples, update UX, mobile Safari hardening, release docs |
| PWA Update Hotfix | Complete | `v0.4.1-alpha` | Service worker update activation fix using `event.waitUntil(self.skipWaiting())` |
| Large Report Usability and Performance | Release-ready | `v0.5.0-alpha` | Large report guardrails, shared table controls, CoreAnalytics overview, search/copy scope wording, mobile Safari polish |

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
- Uploaded or pasted reports remain memory-only.

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

### Phase 4: PWA And Release

Completed in `v0.4.0-alpha`.

Delivered:

- PWA identity and installability through `manifest.webmanifest`, icons, Apple web app meta tags, theme color, and install guidance.
- Offline app shell through a conservative service worker.
- Offline sanitized fictional examples after first successful load.
- Strict service worker cache allowlist and old-cache cleanup.
- No runtime caching of unknown requests.
- No dynamic `cache.put`.
- Offline-ready, offline-setup-failed, and update-ready UX.
- Safe file intake before `file.text()`.
- 20 MB mobile Safari safety limit.
- Rejection of clearly unsupported binary/media/PDF/ZIP files before reading.
- Panic/raw diagnostic text wrapping and mobile Safari layout containment.
- GitHub Pages deployment notes and manual QA checklist.
- CSP/header hardening decision and deferral.

### v0.4.1-alpha: PWA Update Hotfix

Completed after Phase 4.

Delivered:

- Fixed a stuck `Update ready` state where a waiting service worker could remain waiting after reload.
- Updated the service worker `SKIP_WAITING` message flow to keep `self.skipWaiting()` alive with `event.waitUntil(self.skipWaiting())`.
- Bumped the service worker cache version for the hotfix.
- Strengthened the static regression test for the skip-waiting flow.

No parser behavior, caching strategy, privacy model, backend, analytics, cloud storage, or package metadata changed.

### v0.5.0-alpha: Large Report Usability And Performance

Release-ready after Slice 6.

Primary theme: Large Report Usability and Performance, with CoreAnalytics as the proving ground.

Primary goal: make large diagnostic reports easier to inspect without changing the local-first privacy model, parser behavior, or PWA cache boundaries.

Delivered:

- Slice 0 release-state cleanup for `v0.4.1-alpha` and `v0.5.0-alpha` planning.
- Slice 1 large report baseline helpers in `src/models/reportSize.js`.
- Slice 2A shared table-view helper in `src/ui/tableView.js`.
- Slice 2B copy path alignment with shared table-view decisions.
- Slice 2C render path alignment with shared table-view decisions.
- Slice 3A CoreAnalytics viewer model helper in `src/ui/coreAnalyticsView.js`.
- Slice 3B minimal CoreAnalytics overview UI in `src/ui/renderCoreAnalyticsOverview.js`.
- Slice 4A search/copy metadata helpers in `src/search/searchMetadata.js` and `src/clipboard/copyMetadata.js`.
- Slice 4B search/copy UI wording for rendered capped rows and visible rows.
- Slice 5 mobile Safari polish for narrow-width containment, CoreAnalytics chips, search/copy feedback wrapping, and touch targets.
- Slice 6 release hardening and documentation alignment.

Not changed:

- Parser support and parser output remained stable.
- The PWA service worker cache strategy remained unchanged.
- No runtime caching, backend, authentication, analytics, cloud storage, or report persistence was added.
- No package metadata change was made.

## Active Roadmap: v0.6.0-alpha Or Later

The next milestone has not been approved yet. Candidate work should stay incremental and preserve the local-first privacy model.

Candidate areas:

- AccessoryCrash or other new parser formats.
- Virtualization or incremental rendering for very large visible tables.
- Deeper CoreAnalytics drill-down using parsed/capped data without rendering full raw JSON bodies by default.
- Export improvements beyond visible-section copy.
- CSP/header hardening on a host that supports custom response headers.
- Optional automated browser/mobile smoke tests.

### Still Out Of Scope Unless Explicitly Approved

- Backend services.
- Authentication.
- Analytics.
- Cloud storage for user reports.
- External parsing services.
- Symbolication.
- `.dSYM` support.
- Sysdiagnose archive extraction.
- New framework dependencies without explicit approval.
- Runtime caching of unknown requests.
- Report persistence, recent files, or history.
- Full raw CoreAnalytics JSON rendering by default.
- AI-style diagnosis or confident root-cause claims.
- Framework or build-system migration.

### Testing Direction

- Preserve existing Node/assert regression tests.
- Add focused pure-helper tests for table sizing, row limits, search/copy visibility, and CoreAnalytics grouping.
- Keep static checks for service worker cache boundaries and forbidden persistence APIs when service-worker-adjacent files change.
- Run syntax checks for touched JavaScript modules.
- Keep browser/mobile checks manual unless browser automation is explicitly approved.
- Do not migrate the test runner unless the cost is justified and approved.

## Post-v0.5.0-alpha Or Parallel Hardening

These items remain outside the `v0.5.0-alpha` release unless explicitly approved later.

| Area | Future work |
| --- | --- |
| CSP/header hardening | Stronger response-header CSP on a host that supports custom headers, such as Cloudflare Pages |
| Browser QA | Optional automated browser smoke tests |
| Release operations | Package metadata/version cleanup if release process moves beyond Git tags/docs |
| Visual QA | Screenshot/demo capture for README and GitHub Releases |

## Historical Planning Notes

The original four-week checklist and task IDs have been replaced by completed milestone summaries and active milestone slices above. Those old checklist items were useful while planning, but they no longer reflect the released project state.

The current source of truth is:

- `README.md` for user-facing support and limitations.
- `CHANGELOG.md` for release history.
- `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, `PHASE_3_SUMMARY.md`, and `PHASE_4_SUMMARY.md` for phase details.
- This roadmap for active and future project direction.

## Exploratory Ideas

These ideas are intentionally out of scope for `v0.5.0-alpha` unless explicitly approved later.

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

Before starting the next milestone:

- Confirm README, ROADMAP, CHANGELOG, and phase summaries reflect `v0.5.0-alpha`.
- Confirm the next milestone theme and slice plan.
- Run `npm.cmd test`.
- Run focused syntax checks:
  - `node --check src\main.js`
  - `node --check service-worker.js`
  - touched JavaScript modules
- Preserve existing parser behavior and PWA privacy boundaries.
