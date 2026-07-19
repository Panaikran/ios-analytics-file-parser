# iOS Analytics File Parser Roadmap

Status: `v2.1.0 — Battery and Charging Insights` released; Phase 21 is complete and frozen. The repository is moving toward planning v2.2.0; no v2.2.0 implementation has started.

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
| Large Report Usability and Performance | Complete | `v0.5.0-alpha` | Large report guardrails, shared table controls, CoreAnalytics overview, search/copy scope wording, mobile Safari polish |
| File-size Validation Hotfix | Complete | `v0.5.1-alpha` | Restored the documented 20 MB file safety limit and corrected the too-large message |
| Apple Diagnostics Expansion | Released | `v0.6.0-alpha` | Diagnostic classification, AccessoryCrash `bug_type: 305`, CPU Resource `bug_type: 202`, Disk Writes Resource `bug_type: 142`, and Stackshot Resource `bug_type: 288` summary parsing |
| Human-Readable Diagnostic Explanations | Released | `v0.7.0-alpha` | Deterministic explanation sections for supported diagnostics, with search/copy/privacy coverage and browser QA |
| Release Hardening and QA Polish | Released | `v0.8.0-alpha` | UI/accessibility polish, documentation foundation, browser/mobile QA, platform hardening, and release-readiness alignment |
| Feature Freeze / Release Candidate Preparation | Released | `v0.9.0-beta` | Final regression review, browser/mobile/accessibility QA, privacy verification, documentation polish, and stable-release preparation |
| Stable Release Final Verification | Complete | `v1.0.0 RC1` | Final regression verification, documentation consistency, browser/accessibility/PWA verification, and release-blocker review completed with no blockers |
| Stable Release Publication | Released | `v1.0.0` | Stable parser, explanation, privacy, accessibility, and PWA foundation published |
| Multi-Report Comparison | Released | `v1.1.0` | Deterministic, sanitized-only comparison for 2-3 compatible supported reports |
| Sanitized Visible Export | Released | `v1.2.0` | Local plain-text export of eligible sanitized visible single-report and comparison output |
| Structured Sanitized Export | Released | `v1.3.0` | Deterministic schema-versioned JSON export for eligible sanitized visible single-report and comparison output |
| CoreAnalytics Investigation Workflow | Released | `v1.4.0` | Interactive sanitized rendered/capped facets through the existing substring-search path |
| Complete Supported Diagnostic Examples | Released | `v1.5.0` | One fictional bundled example for each supported parser family, offline integration, privacy hardening, and cross-family QA |
| Search Result Navigation | Released | `v1.6.0` | Additive section-level targets and accessible non-wrapping Previous/Next navigation through the existing search path |
| Comparison Workflow Clarity | Released | `v1.7.0` | Released 2026-07-14: ephemeral local labels, generic positional identity, clearer setup feedback, focus restoration, and privacy-safe export isolation |
| Precision Search & Deep Inspection | Released | `v1.8.0` | Released 2026-07-14: visible sanitized exact-match metadata, safe highlighting, non-wrapping exact-match navigation, comparison support, privacy/export isolation, accessibility, responsive, offline, and performance hardening |
| Visible Search Contract Integrity | Released | `v1.9.0` | Released 2026-07-15: declared visible-column row filtering with privacy, accessibility, export, responsive, browser, and workflow parity verified |
| Apple-Inspired Inspector Workspace | Released | `v2.0.0` | Released 2026-07-16: all Slices 20A–20H complete and frozen; Phase 20 closed |

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

Completed in `v0.5.0-alpha`.

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

## Completed Roadmap: v0.6.0-alpha

Theme: Apple Diagnostics Expansion.

Phase 1 goal: Diagnostic Classification Architecture. This work recognizes diagnostic families safely before parser implementation, while preserving the existing `parseInput(text, options) -> SectionModel[]` contract for supported files.

### Phase 1: Diagnostic Classification Architecture

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 1A | Complete | Added `classifyDiagnostic(input)` with compact `type`, `family`, `subtype`, `supported`, `parserType`, `legacyType`, `structure`, and `bugType` metadata |
| Slice 1B | Complete | Made `detectFileType(input)` a compatibility wrapper over `classifyDiagnostic(input).legacyType` |
| Slice 1C | Complete | Routed `parseInput()` through `classifyDiagnostic(input).parserType` while preserving public parser behavior |
| Slice 1D | Complete | Added safe friendly messages for recognized-but-unsupported diagnostics |
| Slice 1E | Complete | Aligned README, ROADMAP, CHANGELOG, and Phase 5 historical notes with classification architecture |

### Phase 2: AccessoryCrash `bug_type: 305`

Phase 2 goal: add narrow AccessoryCrash support without claiming broad Accessory/Firmware diagnostics support.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 2A | Complete | Designed the AccessoryCrash parser, section model, fictional fixture shape, and privacy policy |
| Slice 2B | Complete | Added `parseAccessoryCrash()` and direct parser tests against fictional sanitized data |
| Slice 2C | Complete | Flipped AccessoryCrash classification/routing support and routed `parseInput()` through the parser |
| Slice 2D | Complete | Hardened AccessoryCrash privacy handling for identifiers, paths, serials, MACs, ECIDs/chip IDs, crashlog IDs, nested values, and raw mode |
| Slice 2E | Complete | Aligned docs and QA checklist for narrow AccessoryCrash support |

### Phase 3: Resource Diagnostics

Phase 3 goal: add narrow Resource Diagnostics support for CPU, Disk Writes, and Stackshot reports without expanding into App Usage Metrics, Wi-Fi, Diagnostic Request, sysdiagnose extraction, symbolication, or full stack rendering.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 3A | Complete | Designed CPU Resource, Disk Writes Resource, and Stackshot Resource parser boundaries, fictional fixture schemas, privacy rules, and test strategy |
| Slice 3B | Complete | Added direct `parseCpuResource()` parser tests |
| Slice 3C | Complete | Flipped CPU Resource classification/routing support and routed `parseInput()` through the parser |
| Slice 3D | Complete | Added Disk Writes Resource parser, classification/routing support, service-worker precache entry, and privacy tests |
| Slice 3E1 | Complete | Added direct Stackshot Resource parser tests with summary-only rendering and 100-row top-process cap |
| Slice 3E2 | Complete | Flipped Stackshot Resource classification/routing support and routed `parseInput()` through the parser |
| Slice 3F | Complete | Added cross-resource privacy, search, copy, raw-mode, and Stackshot row-cap regression coverage |
| Slice 3G | Complete | Browser QA, documentation alignment, validation, and release-readiness report |

Recognized but not parsed yet:

- App Usage Metrics
- Wi-Fi Connectivity
- Diagnostic Request

Recognition is not parser support. These families show safe unsupported messages and do not emit `SectionModel[]` yet.

Supported by the v0.6 Apple Diagnostics Expansion release:

- AccessoryCrash `.ips` reports with `bug_type: 305`.
- CPU Resource reports with `bug_type: 202`.
- Disk Writes Resource reports with `bug_type: 142`.
- Stackshot Resource reports with `bug_type: 288`, summary parsing only.

AccessoryCrash support summarizes crashlogs and does not render raw nested crashlog bodies. Broad Accessory/Firmware diagnostics remain future work unless explicitly planned.
Stackshot Resource support summarizes trigger, process overview, and capped top-process rows. It does not render full stacks, frame symbols, frame addresses, or perform symbolication.

### Future Parser-Family Work

These parser families remain future work and are not blockers for the v0.7 to v1.0 stabilization path unless explicitly approved later.

- Broader Accessory/Firmware diagnostics.
- App Usage Metrics parser work.
- Wi-Fi Connectivity parser work.
- Diagnostic Request parser work.

Future work beyond the classification/parser-family sequence:

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
- Full stack rendering.
- New framework dependencies without explicit approval.
- Runtime caching of unknown requests.
- Report persistence, recent files, or history.
- Full raw CoreAnalytics JSON rendering by default.
- AI-style diagnosis or confident root-cause claims.
- Framework or build-system migration.

### Testing Direction

- Preserve existing Node/assert regression tests.
- Add focused tests for classification, parser routing, privacy redaction, search/copy visibility, row caps, and malformed input.
- Keep static checks for service worker cache boundaries and forbidden persistence APIs when service-worker-adjacent files change.
- Run syntax checks for touched JavaScript modules.
- Keep browser/mobile checks manual unless browser automation is explicitly approved.
- Do not migrate the test runner unless the cost is justified and approved.

## Completed Roadmap: v0.7.0-alpha

Theme: Human-Readable Diagnostic Explanations.

Goal: improve user understanding of already-supported diagnostics without adding new parser families, AI diagnosis, exact root-cause claims, symbolication, or full stack rendering.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 7A | Complete | Added the pure deterministic explanation helper in `src/explanations/diagnosticExplanations.js` |
| Slice 7B | Complete | Integrated explanation sections into `parseInput()` while preserving the `SectionModel[]` contract |
| Slice 7C | Complete | Added search, copy, privacy, raw-mode, and unsupported-diagnostic regression coverage |
| Slice 7D | Complete | Completed Browser/UI smoke QA for rendered explanation sections |
| Slice 7E | Complete | Documentation alignment, validation, Phase 7 summary, and release-readiness report |

Supported explanation coverage is limited to already-supported diagnostics:

- `EXC_BREAKPOINT` / `SIGTRAP`
- `EXC_BAD_ACCESS`
- `EXC_CRASH` / `SIGABRT`
- `EXC_RESOURCE`
- `EXC_GUARD`
- Watchdog
- Jetsam
- Panic
- AccessoryCrash
- CPU Resource
- Disk Writes Resource
- Stackshot Resource

Explanation rules are deterministic, local-only, and based on already-parsed safe fields. They participate in existing section rendering, section navigation, search, and copy behavior.

Still out of scope for `v0.7.0-alpha`:

- AI diagnosis.
- Exact root-cause claims.
- New parser families.
- App Usage Metrics parser work.
- Wi-Fi Connectivity parser work.
- Diagnostic Request parser work.
- Broad Accessory/Firmware support.
- Symbolication.
- Full stack rendering.
- Backend, cloud storage, analytics, or report persistence.

## Completed Path To v1.0

`v1.0.0` is released following the completed RC1 verification. The completed path prioritized documentation accuracy, privacy, browser/PWA confidence, and release stability over adding more parser families.

### v0.7.0-alpha: Human-Readable Diagnostic Explanations

Status: released.

Goal: improve user understanding without adding risky new parser families.

Scope:

- Add conservative human-readable explanation notes for already-supported report types.
- Focus on explaining exception and termination patterns in plain language.
- Do not claim exact root cause unless the report directly proves it.
- Keep explanations local, deterministic, and based on parsed fields.
- Add no AI diagnosis.
- Add no confident root-cause claims.
- Require no new parser family by default.

Possible explanation targets:

- `EXC_BREAKPOINT` / `SIGTRAP`
- `EXC_BAD_ACCESS`
- `EXC_CRASH` / `SIGABRT`
- `EXC_RESOURCE`
- `EXC_GUARD`
- Watchdog termination
- Jetsam memory pressure
- Panic-full summary
- Resource Diagnostics summary notes

Required wording style:

- Use cautious language such as "usually", "often", "may indicate", and "check the triggered thread/backtrace".
- Avoid wording like "this crash was caused by X" unless the report directly proves it.

Example safe wording:

> This usually means the app intentionally trapped or hit a runtime stop condition. Check the triggered thread backtrace to identify the exact function.

Out of scope for `v0.7.0-alpha`:

- AI diagnosis.
- App Usage Metrics parser.
- Wi-Fi Connectivity parser.
- Diagnostic Request parser.
- Symbolication.
- Full stack rendering.

### v0.8.0-alpha: Release Hardening And QA Polish

Goal: improve release quality, security posture, documentation, and QA repeatability.

Status: released.

Completed scope:

- Slice 8A: UI polish for spacing, typography, wrapping, table containment, status feedback, and mobile readability.
- Slice 8A.5: documentation foundation with `PLANS.md` and `ARCHITECTURE.md`.
- Slice 8B: accessibility polish for keyboard usability, focus visibility, accessible names, live-region behavior, touch targets, and reduced-motion guardrails.
- Slice 8C: browser and mobile QA across supported parser families, unsupported diagnostics, user flows, PWA behavior, and responsive widths.
- Slice 8D: platform hardening for service-worker cache boundaries, manifest/install metadata, navigation fallback behavior, offline shell, static guards, and PWA verification.
- Slice 8E: documentation alignment and release-readiness verification.

Not included:

- GitHub Release creation.
- Package metadata changes.
- Screenshots or demo capture.
- Hosting migration or deploy-time response-header configuration.

Out of scope for `v0.8.0-alpha` unless explicitly approved:

- New parser families.
- Large UI redesign.
- Framework migration.
- Backend or cloud features.
- Report persistence.

### v0.9.0-beta: Feature Freeze / Release Candidate Preparation

Status: released.

Goal: prepare for stable `v1.0.0`.

Rules:

- No new parser families.
- No parser architecture redesign.
- No new storage, backend, or cloud behavior.
- No large UI changes.
- Bug fixes, tests, docs, QA, accessibility, and release polish only.

Scope:

- Fix public/beta feedback issues.
- Final mobile Safari QA.
- Final PWA/offline QA.
- Final privacy/search/copy QA.
- Final supported/unsupported matrix.
- Final known limitations review.
- Final release checklist.

Completed beta slices:

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 9A | Complete | Reconciled post-`v0.8.0-alpha` release-state documentation and documented `v0.9.0-beta` beta scope |
| Slice 9B | Complete | Audited parser behavior, explanations, privacy guarantees, search/copy behavior, service-worker boundaries, and local-first architecture with no regressions found |
| Slice 9C | Complete | Completed Chrome and Edge browser/mobile/accessibility/PWA release-candidate QA with no blockers; Firefox, Safari, and Mobile Safari require separate available environments |
| Slice 9D | Complete | Aligned release-candidate documentation, repository presentation, known limitations, and Phase 9 summary |

### v1.0.0 RC1: Final Verification

Status: complete.

Goal: verify the current implementation is stable enough for the stable `v1.0.0` release.

Scope:

- Final parser, explanation, privacy, search/copy, and local-first regression verification.
- Final browser, mobile, accessibility, and PWA verification.
- Final documentation consistency audit.
- Release-blocker review.

Result: RC1 verification completed successfully with no unresolved release blockers. `v1.0.0` was subsequently published as the stable release.

Not included:

- New parser families.
- Parser routing changes.
- Explanation redesign.
- UI or accessibility redesign.
- Package metadata changes.
- Tags, releases, or publishing actions without explicit approval.

### v1.0.0: Stable Release

Goal: declare the original product complete and stable.

`v1.0.0` criteria:

- Supported parser list is clear and accurate.
- Unsupported families are clearly documented.
- Privacy behavior is documented and tested.
- Offline/PWA behavior is verified.
- Browser QA passes.
- Automated validation passes.
- No unresolved release blockers remain.
- Known limitations are accepted and documented.

Do not block `v1.0.0` on:

- App Usage Metrics.
- Wi-Fi Connectivity.
- Diagnostic Request.
- Broad Accessory/Firmware support.
- Symbolication.
- `.dSYM` support.
- Sysdiagnose extraction.
- Full stack rendering.
- AI-style diagnosis.
- Virtualization or streaming.

These can become future `v1.1`, `v1.2`, or `v2.0` work if explicitly planned.

## Active Roadmap: v1.1.0

Theme: Multi-Report Comparison.

Goal: compare a small set of already-supported diagnostics without changing parser contracts, retaining reports, or widening privacy boundaries.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 11A | Complete | Pure deterministic comparison model with compatibility validation and ordinary comparison `SectionModel[]` output |
| Slice 11B | Complete | Compact comparison workflow that reuses the existing renderer, navigation, search, copy, and accessibility patterns |
| Slice 11C | Complete | Parser, privacy, local-first, search/copy, cleanup, mobile, and PWA regression hardening |
| Slice 11D | Complete | Final browser QA, documentation alignment, validation, and release-readiness review |

Supported comparison boundaries:

- Compare exactly 2 or 3 reports.
- Reports must share a supported `parserType`.
- Each report is parsed independently and only sanitized `SectionModel[]` data enters comparison.
- Insertion order is preserved as Report 1, Report 2, and Report 3.
- Comparison output is ordinary `SectionModel[]`, so existing navigation, search, and copy behavior applies.
- Raw Local View remains single-report only.

Not included:

- Mixed parser comparison.
- Fuzzy matching, confidence scores, diagnosis, or root-cause inference.
- Source-text retention, raw comparison, report persistence, exports, new parser families, backend, cloud processing, uploads, or analytics.

`v1.1.0` release readiness completed successfully, and the release has been tagged and published on GitHub.

## Completed Milestone: v1.2.0

Status: released.

Goal: provide a local sanitized visible-output download without changing parser, explanation, comparison, search, copy, or privacy contracts.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 12A | Complete | Pure deterministic visible-export serialization contract for ordered eligible `SectionModel[]` output |
| Slice 12B | Complete | Accessible single-report and comparison `.txt` download workflow using existing search and table-visibility rules |
| Slice 12C | Complete | Parser-matrix, privacy, comparison, large-report, URL-lifecycle, and local-first regression hardening |
| Slice 12D | Complete | Documentation alignment, final QA, validation, and manual release-readiness review |

Implemented boundaries:

- Export is sanitized-only and uses ordered sections eligible under existing search, copy, and table-visibility rules.
- Active search affects exported sections and rows; collapsed, capped, filtered-out, unrendered, raw, and source-only content is excluded.
- Viewport position and scrolling do not affect export eligibility.
- Single reports use `ios-diagnostic-export.txt`; comparisons use `ios-diagnostic-comparison.txt`.
- Downloads are local, memory-only plain text. Blob URLs are revoked after use.

Not included:

- Raw, original-file, CSV, or PDF export.
- Export history, report persistence, uploads, cloud processing, analytics, or background export.
- New parser families, parser redesign, comparison redesign, or additional export formats.

## Completed Milestone: v1.3.0

Status: released.

Goal: provide deterministic structured JSON downloads while preserving the existing visible-export, privacy, comparison, and local-first contracts.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 13A | Complete | Pure schema-versioned JSON serializer with explicit scalar allowlisting |
| Slice 13B | Complete | Single-report and comparison JSON download workflow reusing existing visibility and Blob lifecycle rules |
| Slice 13C | Complete | Parser-matrix, privacy, prototype/inherited-property, comparison, parity, and download-lifecycle hardening |
| Slice 13D | Complete | Documentation alignment, final QA, validation, and manual release-readiness review |

Implemented boundaries:

- JSON export accepts only ordered, already-visible, sanitized sections.
- Schema version is `1`; section, field, column, and visible-row order is deterministic.
- Search, copy, text export, and JSON export share the same visibility rules.
- Raw Local View, raw, hidden, capped-out, filtered-out, unrendered, nested unsupported, inherited, prototype-style, source-only, and internal rendering values are excluded.
- Single reports use `ios-diagnostic-export.json`; comparisons use `ios-diagnostic-comparison.json`.
- JSON downloads use `application/json;charset=utf-8` Blob content and revoke temporary object URLs.

Not included:

- Raw, original-file, CSV, or PDF export.
- Export history, report persistence, uploads, cloud processing, analytics, or background export.
- New parser families, parser redesign, comparison redesign, or v1.4.0 implementation work.

## Completed Roadmap: v1.4.0

Status: released and published on GitHub.

Theme: CoreAnalytics Investigation Workflow. The milestone makes existing sanitized and capped CoreAnalytics facet data easier to investigate without changing parser output, search semantics, comparison behavior, export contracts, or the local-first architecture.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 14A | Complete | Deterministic fictional large-report Node workloads and parse/search/comparison/export/clear baselines |
| Slice 14B | Complete | Chrome browser performance and UX baselines using the retained stress workloads and harness |
| Slice 14C | Complete | Pure CoreAnalytics facet view-model contract from sanitized rendered/capped rows |
| Slice 14D | Complete | Accessible interactive facet controls using the existing search-input path |
| Slice 14E | Complete | Privacy, search/copy/export parity, repeated-workflow, focus-restoration, and regression hardening |
| Slice 14F | Complete | Browser QA, documentation reconciliation, and manual release-readiness preparation |

The Slice 14A and 14B measurements did not demonstrate a user-visible performance bottleneck. Speculative optimization, virtualization, workers, renderer replacement, and state-management redesign remain deferred. The performance fixtures and browser harness remain regression infrastructure.

MetricKit remains deferred because its exact serialized legacy payload shape did not pass the authoritative fixture gate. It is not part of v1.4.0 support.

## Released Roadmap: v1.5.0

Status: released and fully closed. The `v1.5.0` tag and published GitHub
Release point to `88c2c6301e9f32a86c6bb91b21924a469dd79360`.

Theme: Complete Supported Diagnostic Examples. All 11 supported parser
families have one compact fictional production example using the existing
manifest, loader, parser, sanitized rendering, search, export, comparison,
accessibility, and service-worker workflows.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 15A | Complete | Five fictional production example fixtures and privacy-reviewed parser contracts |
| Slice 15B | Complete | Manifest integration, one-example-per-family coverage, and explicit offline precaching |
| Slice 15C | Complete | Cross-family parsing, switching, search, navigation, copy, export, comparison, privacy, and regression QA |
| Slice 15D | Complete | Documentation, final deterministic validation, Chrome workflow QA, responsive QA, and release readiness |

The five added examples are `coreanalytics.ips.ca.synced`, `accessory-crash.ips`,
`cpu-resource.ips`, `disk-writes-resource.ips`, and `stackshot-resource.ips`.
They remain fictional, deterministic, compact, sanitized, and separate from
the 5,000-record stress workloads.

The Slice 15C privacy pass fixed hexadecimal address exposure in sanitized
Panic output without changing Raw Local View behavior or other parser
families. The completed browser QA covered Chrome system channel
`150.0.7871.101` on Windows, including offline loading from the explicit
service-worker precache allowlist.

The 11-family catalog and v1.5.0 implementation are complete. No v1.5.0
implementation tasks remain.

## Released Roadmap: v1.6.0

Status: released and fully closed. The `v1.6.0` tag and published, non-draft,
non-prerelease GitHub Release point to
`d7ddb1cc0c4b3fd3ae7f6463522d2c7b29cc6dfe`.

Theme: Search Result Navigation. The milestone adds ordered section-level
navigation metadata and accessible Previous/Next controls while preserving the
existing substring-search, sanitized SectionModel, export, comparison, and
local-first contracts.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 16A | Complete | Additive `navigationTargets` contract from filtered sanitized sections |
| Slice 16B | Complete | Accessible non-wrapping Previous/Next controls, current-position status, stable-anchor scrolling, and focus retention |
| Slice 16C | Complete | Privacy, workflow, comparison, Raw Local View, accessibility, offline, and regression hardening |
| Slice 16D | Complete | Documentation, final validation, browser QA, and release-readiness preparation |

The navigation target contract represents one visible matching sanitized
section, preserves rendered order, and exposes only `id`, `title`, and
`position`. Navigation does not wrap, does not scan the DOM or raw input, and
does not change filtered content, copy, text export, JSON export, or comparison
semantics.

QA covered all 11 bundled parser families, CoreAnalytics facets, comparison,
Raw Local View, clear/reset workflows, responsive widths, accessibility
contracts, offline search/navigation, and 20 repeated browser cycles. The
known Node and Chrome budgets passed. Safari, Firefox, Mobile Safari, physical
devices, native screen readers, and browser heap snapshots were not directly
validated.

MetricKit remains deferred pending an authoritative serialized fixture
contract. Speculative performance optimization remains deferred while the
established budgets pass. No v1.6.0 implementation tasks remain.

## Released Roadmap: v1.7.0

Status: released and fully closed on 2026-07-14. The `v1.7.0` tag and
published, non-draft, non-prerelease GitHub Release point to
`d7ee0d77b5739bc963c12cc8ec2b2dd7b2cdc7dc`.

Theme: Comparison Workflow Clarity. The milestone clarifies selection and
management of two or three compatible reports without changing sanitized
comparison output, exports, parser behavior, search, or local-first privacy.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 17A | Complete | Privacy-safe in-memory `localLabel` contract, Unicode normalization, immutable updates, deterministic removal, and export/search isolation |
| Slice 17B | Complete | Accessible local-label inputs, parser-type display, setup feedback, responsive layout, and removal focus restoration |
| Slice 17C | Complete | Test-only privacy, workflow, accessibility, responsive, offline, export, search, and repeated-cycle hardening |
| Slice 17D | Complete | Documentation reconciliation, final validation, browser QA evidence, and release-readiness preparation |

The completed workflow uses generic positional identities (`Report 1`, `Report 2`,
and `Report 3`) with the parser type visible. Optional local labels are
user-supplied, normalized, ephemeral, and visible only in the setup UI. They
remain attached to surviving entries after removal, are discarded on removal,
clear, report reset, reload, and session end, and never enter comparison
sections, copy, text export, JSON export, filenames, search, or navigation.

Comparison still requires two or three supported reports of the same parser
type and remains sanitized-only. Raw Local View restrictions remain unchanged.
No production defect was reproduced during Slice 17C, and all automated,
Chrome, responsive, accessibility, offline, and performance checks passed.

## Completed Roadmap: v1.8.0

Status: released and fully closed on 2026-07-14.
Release status: released. Release commit: `ad19143f76a9bac6d704c078846a518b13a44dcb`. Tag: `v1.8.0`. GitHub Release: published, non-draft, non-prerelease.

Theme: Precision Search & Deep Inspection. The milestone adds additive exact-
match metadata, safe visual highlighting, and deterministic non-wrapping
Previous/Next exact-match navigation within visible sanitized content while
preserving substring search, section navigation, comparison, exports, Raw
Local View, offline, local-only, privacy, and performance boundaries.

| Slice | Status | Scope |
| --- | --- | --- |
| Slice 18A | Complete | Deterministic `matchRegions` metadata for visible sanitized rendered regions |
| Slice 18B | Complete | Safe visual match identification, exact-match controls, keyboard movement, focus, status, and responsive behavior |
| Slice 18C | Complete | Reproduced chart-only regression fix, privacy/accessibility/responsive/comparison/export/offline/performance hardening, and browser QA |
| Slice 18D | Complete | Documentation reconciliation, final validation, and explicit release-readiness preparation |

The final outcome covers all supported visible match kinds, supported two- and
three-report same-parser comparisons, Raw Local View isolation, copy/export
isolation, accessibility and responsive hardening, service-worker cache
consistency, and regression evidence across all 11 bundled examples. Search
remains case-insensitive substring matching over generated visible sanitized
section data. It does not add regex, fuzzy, semantic, raw-source, capped-out,
hidden-data, or DOM-derived search.

Any new or changed precached production asset must update the service-worker
allowlist and cache version in the same slice. This remains a release-
consistency guard and does not authorize runtime report caching, dynamic cache
discovery, persistent report storage, or service-worker redesign.

## Released Roadmap: v1.9.0

Status: released and fully closed on 2026-07-15.
Release status: released. Release commit: `5ee166b7dba49dd7522a1d5c3c27bf60265a540a`. Annotated tag object: `8eb5700ed8272768d2b239284feca933d5cb2a6f`. Tag: `v1.9.0`. GitHub Release: published, non-draft, non-prerelease.

Theme: Visible Search Contract Integrity.

Objective: ensure a table row is retained by search only when its visible,
sanitized table columns match the query, so filtering, exact-match metadata,
navigation, rendering, copy, and export describe the same user-visible data.

### Planning Evidence

Before Slice 19A, `filterSectionsByQuery()` counted table-row matches across
`Object.values(row)`, while exact-match metadata traversed only declared visible
`tableColumns`. A synthetic contract-valid row containing a non-column property
could therefore retain its section and row without producing a visible exact
match. The checked bundled fixture and production-example corpus had no surplus
row keys, so this was not reproduced in current bundled parser data. It was a
reproducible shared-contract defect, corrected in the shared filter path.

### Boundaries

- Preserve case-insensitive substring search and all released v1.8.0 exact-match behavior.
- Search only visible sanitized section data; do not inspect raw, hidden,
  capped-out, parser-private, local-label, filename, or path values.
- Preserve `SectionModel[]`, parser families, comparison limits, Raw Local View,
  copy/export schemas, service-worker strategy, and local-only processing.
- Keep native controls, keyboard behavior, focus visibility, live status, and
  responsive behavior intact.

### Non-Goals

- No new parser family, parser refactor, schema redesign, raw-source search,
  DOM search, second filtering pipeline, regex/fuzzy/semantic search, table
  virtualization, worker-based parsing, browser-engine expansion, MetricKit,
  export format, backend, upload, analytics, persistence, tag, or release.

### Completed Slices

| Slice | Status | Scope | Dependencies |
| --- | --- | --- | --- |
| Slice 19A | Complete | Aligned shared row filtering with declared visible columns; added hidden-only, visible-cell, and header-regression coverage while preserving row shape and search schemas. Commit: `678ce2f3a513cee39b37ed6326381a9d13d5f912`. | Existing `filterSectionsByQuery()` and v1.8.0 match-region contract |
| Slice 19B | Complete | Hardened workflow, privacy, accessibility, responsive, browser, copy, and export coverage in tests and the browser harness only; no production defect was reproduced and no production code changed. Commit: `f7c3223a2af6852931affaeb047d10f3a2e2d9a7`. | Completed 19A contract |
| Slice 19C | Complete | Reconciled documentation, reran final QA, and recorded release-readiness evidence without production, test, harness, service-worker, or dependency changes. | Completed 19A and 19B evidence |

### Success Criteria

1. A non-column table property cannot retain a filtered row, section, navigation target, or exact-match state.
2. Visible matching table columns retain current case-insensitive substring behavior.
3. Filtering and exact-match metadata use one equivalent visible-column contract.
4. Hidden, raw, capped-out, parser-private, comparison-label, filename, and path data remain excluded.
5. Section navigation, exact-match navigation, rendering, copy, text export, JSON export, comparison, and Raw Local View contracts remain unchanged except for removing invisible-row matches.
6. Keyboard operation, disabled boundary states, live status, focus visibility, reduced motion, and responsive containment remain accessible.
7. All automated tests, relevant syntax checks, established large-report budgets, available browser QA, privacy checks, and diff hygiene pass.

### Release Readiness

- [x] The implementation diff contains one shared search-path correction and no parser, `SectionModel`, comparison-model, export-schema, or rendering redesign.
- [x] Automated tests, relevant syntax checks, established large-report budgets, and available direct Microsoft Edge browser QA passed.
- [x] Hidden-only and visible-cell workflows, comparison, Raw Local View, copy, text/JSON export, Clear Search, Clear Report, responsive containment, focus, and accessibility status consistency were covered.
- [x] No report persistence, transmission, service-worker cache expansion, or hidden-value export was introduced.
- [x] README, ROADMAP, CHANGELOG, PLANS, and `PHASE_19_SUMMARY.md` are reconciled for the released milestone.
- [x] Manual release review approved.
- [x] The annotated `v1.9.0` tag and published, non-draft, non-prerelease GitHub Release point to the release commit.

## Completed Roadmap: v2.0.0

Status: Released on 2026-07-16. Slices 20A–20H are complete and frozen; Phase 20 is closed.

Theme: Apple-Inspired Inspector Workspace.

Objective: reorganize the existing application into a deliberate, restrained,
accessible inspection workspace. The plan changes information architecture,
navigation, visual/component systems, responsive strategy, interaction
hierarchy, accessibility architecture, and design tokens while preserving all
released data and behavior contracts.

The selected architecture is Approach B — Inspector workspace: a calm import
state that becomes a two-region desktop workspace with persistent control
chrome, a section rail, and an opaque report canvas. Tablet and mobile keep
search and mode visible, use an accessible section-navigation sheet, and move
only secondary report actions to a labeled menu.

Liquid Glass is limited to a restrained regular-material approximation on
navigation, toolbar, menu, and transient control layers. Report sections,
tables, charts, comparison content, Raw Local View, and status/error content
remain opaque. Clear glass and glass-on-glass are prohibited. Solid,
high-contrast, reduced-transparency, reduced-motion, and unsupported-
`backdrop-filter` fallbacks are release requirements.

The normative design and traceability audit are in
`docs/design/V2_INTERFACE_DESIGN.md`. Slice objectives, boundaries, tests,
rollback points, risks, and release gates are in `PHASE_20_PLAN.md`.

Slices:

1. 20A — complete and frozen: isolated prototype and visual design approval recorded for `b86a44cf2cbb0a3400a307ede92e7623c7417b48`.
2. 20B — complete and frozen: semantic tokens, light/dark themes, restrained material fallbacks, responsive workspace shell, and preserved v1.9 behavior.
3. 20C — complete and frozen: calm import state, desktop section rail, accessible tablet/mobile section dialog, and safe workspace-entry/reset focus.
4. 20D — complete and frozen: continuous opaque report content, semantic field relationships, accessible tables/charts, and CoreAnalytics presentation.
5. 20E — complete and frozen: search, exact match, and report actions.
6. 20F — complete and frozen: comparison and Raw Local View workspace treatment.
7. 20G — complete and frozen: responsive and accessibility hardening.
8. 20H — complete and frozen: final browser, performance, PWA, documentation, and release validation.

No parser, `SectionModel[]`, sanitizer, comparison model, search semantic,
copy/export contract, schema, dependency, backend, persistence, or
service-worker strategy changed during Phase 20. Release publication is
recorded in `PHASE_20_SUMMARY.md`.

## Future Hardening And Exploratory Work

These items remain outside the completed v2.0 scope unless explicitly approved later.

| Area | Future work |
| --- | --- |
| CSP/header hardening | Stronger response-header CSP on a host that supports custom headers, such as Cloudflare Pages |
| Browser QA | Additional browser lanes beyond the completed Chrome smoke and performance harness |
| Release operations | Package metadata/version cleanup if release process moves beyond Git tags/docs |
| Visual QA | Screenshot/demo capture for README and GitHub Releases |

## Historical Planning Notes

The original four-week checklist and task IDs have been replaced by completed milestone summaries and slice records above. Those old checklist items were useful while planning, but they no longer reflect the released project state.

The current source of truth is:

- `README.md` for user-facing support and limitations.
- `CHANGELOG.md` for release history.
- `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, `PHASE_3_SUMMARY.md`, `PHASE_4_SUMMARY.md`, `PHASE_5_SUMMARY.md`, `PHASE_6_SUMMARY.md`, `PHASE_7_SUMMARY.md`, `PHASE_8_SUMMARY.md`, `PHASE_9_SUMMARY.md`, `PHASE_11_SUMMARY.md`, `PHASE_12_SUMMARY.md`, `PHASE_13_SUMMARY.md`, `PHASE_14_SUMMARY.md`, `PHASE_15_SUMMARY.md`, `PHASE_16_SUMMARY.md`, `PHASE_17_SUMMARY.md`, `PHASE_18_SUMMARY.md`, `PHASE_19_SUMMARY.md`, and `PHASE_20_SUMMARY.md` for phase details.
- This roadmap for active and future project direction.

## Exploratory Ideas

These ideas are intentionally out of scope for the completed v1.9 milestone unless explicitly approved later.

| Area | Idea |
| --- | --- |
| Symbolication | Client-side `.dSYM` symbolication for resolving raw addresses without a backend |
| Diagnostics | Confidence-based diagnosis rules for known crash signatures |
| Panic analysis | Optional panic repair hint rules for repeated panic-full signatures |
| MetricKit | `MXCrashDiagnostic` format support, deferred pending an authoritative serialized fixture contract |
| Sysdiagnose | Local sysdiagnose archive extraction and file picker |
| Comparison | Additional comparison modes beyond the bounded, same-parser, sanitized-only workflow |
| Sharing | Additional local-only share/export formats beyond sanitized visible `.txt` and `.json` downloads |

## Next Planning Step

v2.0.0 is released and fully closed. The approved prototype remains frozen at
`b86a44cf2cbb0a3400a307ede92e7623c7417b48`. Slices 20A–20H and Phase 20 are
complete and frozen after production implementation, regression validation,
browser and performance QA, PWA cache reconciliation, documentation, annotated
tagging, and GitHub Release publication. Slices 21A through 21F and Phase 21 are
complete and frozen. The annotated `v2.1.0` tag and GitHub Release are published;
the next action is planning-only work for v2.2.0, with no later implementation
milestone started.

- Preserve the released `v1.1.0` comparison boundaries and implemented v1.2 export contract.
- Keep App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, broader Accessory/Firmware diagnostics, MetricKit without an authoritative serialized fixture contract, additional export formats beyond `.txt` and `.json`, and additional comparison modes as future planning candidates.
- Preserve the released v1.3.0 JSON schema and export boundaries.
- Preserve the completed v1.5.0 example catalog, privacy fix, and offline QA evidence.
- Preserve the completed v1.6.0 search-navigation contract, accessibility behavior, and QA evidence.
- Preserve the completed v1.7.0 comparison identity, setup feedback, privacy, export, accessibility, and QA contracts.
- Preserve the completed v1.8.0 exact-match, privacy, export, accessibility, responsive, offline, and performance contracts.
- Preserve existing parser behavior and PWA privacy boundaries.
- Create tags, releases, package metadata changes, or publishing actions only after explicit approval.

## Completed Roadmap: v2.1.0

Status: Phase 21 complete and frozen. `v2.1.0` is released through the annotated
tag and published GitHub Release. The repository is moving toward planning v2.2.0;
no v2.2.0 implementation has started.

Theme: Battery and Charging Insights.

The approved Phase 21 direction is a conservative optional Battery and
Charging section for supported CoreAnalytics evidence. The complete field
audit, corpus verdict, precedence policy, privacy boundary, normalized model,
and future implementation slices are recorded in
[`PHASE_21_PLAN.md`](PHASE_21_PLAN.md).

| Slice | Status | Scope |
| --- | --- | --- |
| 21A | Complete | Battery field research, record-family audit, corpus audit, architecture proposal, and implementation plan |
| 21B | Complete and frozen | CoreAnalytics extraction, normalization, duplicate handling, privacy-safe internal metadata, and parser-only tests |
| 21C | Complete and frozen | Privacy-safe sanitized battery report model attached internally without visible, comparison, charging, or Raw Local View integration |
| 21D | Complete and frozen | Optional sanitized direct battery section in the frozen Inspector Workspace; existing generic visible search/copy/export paths reused, with no charging or comparison expansion |
| 21E | Complete and frozen | Sanitized corpus expansion, cross-variant hardening, and accessor-safety regression coverage |
| 21F | Complete and frozen | Final parser/privacy/presentation QA, synthetic browser-harness validation, documentation reconciliation, and release readiness |

Phase 21 does not authorize changes to the v2.0 parser, search, export,
comparison, Raw Local View, privacy, or PWA contracts outside the listed future
slices. Thermal interpretation, charging faults, health grades, service
recommendations, and broader device diagnostics remain deferred to v2.2.0 or
later. Browser automation was unavailable because no browser executable or
Playwright dependency was installed; the existing synthetic harness passed and
the limitation is recorded. Release publication is complete; future v2.2.0 work
remains planning-only.

## Planned Roadmap: v2.2.0

Status: Phase 22 planning started; implementation has not started.

Theme: Charging Evidence and Power Context.

Current slice: 22A — Charging Field and Corpus Audit.

The milestone keeps a conservative direct-evidence boundary. Charging fields
may proceed only after their event family, meaning, origin, type, units,
privacy, precedence, duplicate behavior, and conflict behavior are established
from strong evidence. Diagnosis, recommendation, estimation, thermal
interpretation, comparison expansion, export changes, and broad diagnostics
remain deferred.

| Slice | Status | Scope |
| --- | --- | --- |
| 22A | Planning and research active | Charging field/corpus audit, retain/reject/insufficient-evidence matrix, event-family review, and architecture decision |
| 22B | Blocked | Charging normalization only after 22A approves retained fields and deterministic policies |
| 22C | Proposed | Sanitized charging model only after approved normalization |
| 22D | Proposed | Direct charging observations in the existing Battery and Charging section only after approved sanitized data |
| 22E | Proposed | Independent synthetic corpus hardening for approved fields |
| 22F | Proposed | Final parser, privacy, workflow, accessibility, performance, PWA, and documentation QA |

The current recommendation is Approach C - research-only deferral. No
charging field is retained by the current 22A evidence review. The existing
v2.1.0 battery behavior and all parser, search, copy, export, comparison, Raw
Local View, accessibility, responsive, and PWA contracts remain frozen.

No release operation is authorized: do not create a tag, publish a release,
change package metadata, or describe v2.2.0 as implemented until separately
approved.
