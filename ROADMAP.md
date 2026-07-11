# iOS Analytics File Parser Roadmap

Status: `v1.3.0` implemented and ready for manual release review; not released

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
| Structured Sanitized Export | Implemented, unreleased | `v1.3.0` | Deterministic schema-versioned JSON export for eligible sanitized visible single-report and comparison output |

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

## Active Roadmap: v1.3.0

Status: implemented and ready for manual release review. `v1.3.0` is not released.

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

## Future Hardening And Exploratory Work

These items remain outside the current v1.0 stabilization path unless explicitly approved later.

| Area | Future work |
| --- | --- |
| CSP/header hardening | Stronger response-header CSP on a host that supports custom headers, such as Cloudflare Pages |
| Browser QA | Optional reusable automated browser smoke tests beyond the Slice 3G release-readiness pass |
| Release operations | Package metadata/version cleanup if release process moves beyond Git tags/docs |
| Visual QA | Screenshot/demo capture for README and GitHub Releases |

## Historical Planning Notes

The original four-week checklist and task IDs have been replaced by completed milestone summaries and active milestone slices above. Those old checklist items were useful while planning, but they no longer reflect the released project state.

The current source of truth is:

- `README.md` for user-facing support and limitations.
- `CHANGELOG.md` for release history.
- `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`, `PHASE_3_SUMMARY.md`, `PHASE_4_SUMMARY.md`, `PHASE_5_SUMMARY.md`, `PHASE_6_SUMMARY.md`, `PHASE_7_SUMMARY.md`, `PHASE_8_SUMMARY.md`, `PHASE_9_SUMMARY.md`, `PHASE_11_SUMMARY.md`, and `PHASE_12_SUMMARY.md` for phase details.
- This roadmap for active and future project direction.

## Exploratory Ideas

These ideas are intentionally out of scope for the current v1.0 stabilization path unless explicitly approved later.

| Area | Idea |
| --- | --- |
| Symbolication | Client-side `.dSYM` symbolication for resolving raw addresses without a backend |
| Diagnostics | Confidence-based diagnosis rules for known crash signatures |
| Panic analysis | Optional panic repair hint rules for repeated panic-full signatures |
| MetricKit | `MXCrashDiagnostic` format support |
| Sysdiagnose | Local sysdiagnose archive extraction and file picker |
| Comparison | Additional comparison modes beyond the bounded, same-parser, sanitized-only workflow |
| Sharing | Additional local-only share/export formats beyond sanitized visible `.txt` and `.json` downloads |

## Next Planning Step

Before manual `v1.3.0` release review:

- Preserve the released `v1.1.0` comparison boundaries and implemented v1.2 export contract.
- Keep App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, broader Accessory/Firmware diagnostics, additional export formats beyond `.txt` and `.json`, and additional comparison modes as future planning candidates.
- Preserve the approved v1.3.0 JSON schema and export boundaries.
- Do not approve v1.4.0 implementation scope until a separate planning pass.
- Run `npm.cmd test`.
- Run focused syntax checks:
  - `node --check src\main.js`
  - `node --check service-worker.js`
  - touched JavaScript modules
- Preserve existing parser behavior and PWA privacy boundaries.
- Create tags, releases, package metadata changes, or publishing actions only after explicit approval.
