# iOS Analytics File Parser Roadmap

Status: updated for `v0.4.0-alpha` release preparation

The project is a static, local-first browser app for inspecting iOS analytics and diagnostic files. Reports are parsed in the browser, sanitized by default, and never uploaded by the app.

## Current Release State

| Milestone | Status | Release | Summary |
| --- | --- | --- | --- |
| Phase 1: Core Parser | Complete | `v0.1.0-alpha` | Core static app, `.ips` and `.crash` parsing, sanitizer foundation, Node/assert tests |
| Phase 2: Full Section Rendering | Complete | `v0.2.0-alpha` | All Threads, Binary Images, JetsamEvent, panic-full, analytics fallback, memory chart |
| Phase 3: UI Polish | Complete | `v0.3.0-alpha` | Examples, input UX, section navigation, search/filter, copy actions, dense tables, privacy toggle |
| CoreAnalytics Patch | Complete | `v0.3.1-alpha` | Initial `.ips.ca.synced` CoreAnalytics detection, parser, privacy handling, capped rows, fixtures, tests |
| Phase 4: PWA and Release | Mostly complete | `v0.4.0-alpha` target | Manifest/install identity, service worker app shell, offline examples, update UX, mobile Safari hardening, release docs |

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

## Active Roadmap: Phase 4

Phase 4 is the active release-hardening phase for the `v0.4.0-alpha` target.

Primary goal: prepare the static app for GitHub Pages deployment while preserving the local-first privacy model.

### Completed Phase 4 Slices

#### Slice 1: PWA Identity And Installability

Implemented:

- `manifest.webmanifest` with GitHub Pages-safe relative paths.
- PWA icons, maskable icon, favicon, and Apple touch icon.
- Apple web app meta tags.
- Theme color.
- Install guidance UI.
- Privacy trust messaging explaining that installation saves the app shell, not reports.

#### Slice 2: Offline App Shell And Service Worker

Implemented:

- Root `service-worker.js`.
- GitHub Pages-safe service worker registration from `src/main.js`.
- Versioned app cache.
- Explicit precache allowlist for app shell, CSS, ES modules, manifest, icons, and sanitized fictional examples.
- Cache cleanup for old `ios-analytics-parser-*` caches during activation.
- Cache-first behavior only for allowlisted same-origin GET assets.
- Navigation fallback to cached `index.html`.
- No runtime caching of unknown requests.
- No dynamic `cache.put`.
- No Background Sync, Periodic Sync, Push, Share Target, or file handlers.

#### Slice 3: Offline, Install, Update, And Mobile UX Polish

Implemented:

- Offline-ready status:
  - `Offline app shell ready. Examples can open offline. Reports are still not saved.`
- Offline setup failure status:
  - `Offline setup unavailable. Online parsing still works.`
- Update-ready status:
  - `Update ready. Reload when done with the current report.`
- Explicit `Reload app` button for service worker updates.
- Install guidance copy for iPhone, iPad, and desktop.
- Developer cache-version reminder for precached asset changes.
- Broad file picker with safe pre-read validation.
- 20 MB mobile Safari safety limit.
- Rejection of clearly unsupported binary/media/PDF/ZIP files before reading.
- Panic/raw diagnostic text wrapping fixes for iPhone Safari.
- Safe-area and bottom-toolbar layout padding.
- Static tests for service worker privacy boundaries, cache-version reminders, file validation, and update UX copy.

### Slice 4: Release Hardening And Documentation

Current focus:

- Align README, ROADMAP, CHANGELOG, and phase summaries with implemented Phase 4 behavior.
- Create `PHASE_4_SUMMARY.md`.
- Document GitHub Pages deployment expectations.
- Document manual QA requirements for desktop, iPhone, iPad, installed PWA, offline examples, and update-ready flow.
- Document CSP/header hardening decision and deferral.
- Confirm package version handling without changing `package.json` unless explicitly approved.

### Phase 4 Should Not Add

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

### Testing Direction For Phase 4

- Preserve existing Node/assert regression tests.
- Keep static checks for service worker cache boundaries and forbidden persistence APIs.
- Run syntax checks for touched JavaScript files when code changes are made.
- Keep browser/mobile checks manual unless browser automation is explicitly approved.
- Do not migrate the test runner unless the cost is justified and approved.

## Post-v0.4.0-alpha Work

These items are intentionally outside the `v0.4.0-alpha` release target unless explicitly approved later.

| Area | Future work |
| --- | --- |
| CSP/header hardening | Stronger response-header CSP on a host that supports custom headers, such as Cloudflare Pages |
| Browser QA | Optional automated browser smoke tests |
| Release operations | Package metadata/version cleanup if release process moves beyond Git tags/docs |
| Visual QA | Screenshot/demo capture for README and GitHub Releases |

## Historical Planning Notes

The original four-week checklist and task IDs have been replaced by completed milestone summaries and active Phase 4 slices above. Those old checklist items were useful while planning, but they no longer reflect the released project state.

The current source of truth is:

- `README.md` for user-facing support and limitations.
- `CHANGELOG.md` for release history.
- `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, `PHASE_3_SUMMARY.md`, and `PHASE_4_SUMMARY.md` for phase details.
- This roadmap for active and future project direction.

## Exploratory Ideas

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

## Next Release Step

Before tagging `v0.4.0-alpha`:

- Confirm docs are aligned.
- Confirm package version handling decision.
- Run `npm.cmd test`.
- Run focused syntax checks:
  - `node --check src\main.js`
  - `node --check service-worker.js`
  - `node --check src\fileValidation.js`
- Perform local static-server QA.
- Perform GitHub Pages QA.
- Perform iPhone and iPad Safari QA.
- Perform installed PWA/offline/update-ready QA.
- Confirm no uploaded or pasted reports are persisted or cached.
