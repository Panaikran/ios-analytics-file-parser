# Phase 19 — Visible Search Contract Integrity

Version:
`v1.9.0`

Status:
`Implementation Complete`

Release status:
`Unreleased — Ready for Manual Release Review`

Current released version:
`v1.8.0 — Precision Search & Deep Inspection`

## Objective

Align table-row filtering with the declared visible sanitized table-column
contract already used by exact-match metadata, so filtering, counts,
navigation, rendering, copy, and exports describe the same user-visible data.

## Original Defect and Scope

Before Slice 19A, table filtering counted every enumerable row property through
`Object.values(row)`, while match metadata and rendering used declared visible
`tableColumns`. A contract-valid row with a matching non-column property could
therefore retain a row and section without visible matching content.

The defect was reproduced with a synthetic shared-contract probe. The checked
fixture and current bundled production-example corpus had no surplus row keys,
so current bundled parser data did not reproduce the behavior. This milestone
corrected a shared-contract mismatch; it does not claim that bundled parser
examples previously exposed hidden-only results or exported hidden values.

The narrow correction makes row filtering use the same declared visible-column
projection as exact-match metadata. No parser, `SectionModel`, comparison model,
export schema, or rendering redesign was required.

## Completed Slices

### 19A — Visible Row Search Contract

- Aligned row filtering with declared visible table columns.
- Added focused hidden-only, visible-cell, and header-regression coverage.
- Preserved retained row shape, case-insensitive substring behavior, return
  schema, navigation schema, and match-region schema.
- Preserved the established header-only zero-result behavior.

Commit:
`678ce2f3a513cee39b37ed6326381a9d13d5f912`

### 19B — Search Workflow Regression Hardening

- Hardened hidden-only and visible-cell workflows, query transitions, report
  and comparison transitions, Raw Local View, Clear Search, and Clear Report.
- Covered section and exact-match navigation, focus retention, status
  consistency, comparison privacy, capped content, copy, text export, JSON
  export, responsive containment, browser execution, and performance.
- Changed only `tests/parser.test.js` and
  `tests/browserPerformanceHarness.html`.
- Reproduced no production defect and changed no production code.

Commit:
`f7c3223a2af6852931affaeb047d10f3a2e2d9a7`

### 19C — Documentation and Release Readiness

- Reconciled README, roadmap, changelog, planning status, and this summary.
- Reran final automated, syntax, performance, browser, responsive,
  accessibility, privacy, and repository-diff checks.
- Prepared the implementation-complete milestone for manual release review.
- Created no tag or GitHub Release.

## Final Behavior

- Table-row filtering examines declared visible table columns only.
- Non-column row properties cannot retain rows or sections, increment match
  counts, or create metadata or navigation targets.
- Visible table-cell search remains unchanged.
- Retained rows may continue carrying unrelated helper properties internally;
  those properties are not made searchable, renderable, copyable, or
  exportable.
- Header-only search keeps its established zero-result behavior.
- Search counts, match regions, section navigation, exact-match navigation,
  highlighting, copy, text export, and JSON export remain aligned to visible
  sanitized content.
- Comparison and Raw Local View boundaries remain unchanged.
- Processing remains local-only, with no uploads, backend, analytics, cloud
  storage, or report persistence.

## Architecture and Privacy Boundaries

- The correction stays in the existing shared `filterSectionsByQuery()` path.
- Parser families remain independent and `SectionModel[]` remains unchanged.
- Comparison remains sanitized-only for two or three same-parser reports.
- Raw Local View remains separate from structured search and exports.
- Raw source, local comparison aliases, source tables, capped-out content,
  filenames, paths, parser-private values, and non-visible helper properties
  remain excluded from visible search metadata and output.
- Copy, text export, and JSON export remain visible-sanitized only.
- No report content was added to service-worker caches or persisted or
  transmitted by the app.

## Final QA Evidence

### Automated and Syntax Validation

- `npm.cmd test` passed the complete Node/assert suite.
- `node --check src/search/filterSections.js` passed.
- `node --check tests/parser.test.js` passed.
- The suite retained coverage for all 11 bundled parser examples and the
  existing search, comparison, Raw Local View, copy, export, clear/reset,
  privacy, service-worker, and local-first contracts.

### Browser and Workflow Evidence

- Direct headless Microsoft Edge `150.0.0.0` QA completed through the existing
  browser harness at actual `390×844` and `1440×1000` viewports.
- The application loaded, the bundled CoreAnalytics workflow parsed, and
  visible-cell search produced visible matching results.
- Hidden-only search produced no section, row, match, navigation target,
  rendered mark, accessible output, copy output, text export, or JSON section.
- Exact-match navigation retained focus and non-wrapping boundary behavior.
- Comparison search, local-alias exclusion, Raw Local View, Clear Search, Clear
  Report, and report/comparison transitions reset state deterministically.
- The harness reported no page errors, unhandled promise rejections, or
  unexpected workflow errors.
- Service-worker registration/readiness succeeded. Runtime offline reload was
  not measured.

### Accessibility and Responsive Evidence

- Controls exposed accessible names in the automated browser inventory.
- No focus failures were reported.
- Next retained focus, and Clear Search returned focus to the search input.
- Disabled exact-match boundaries remained programmatic and understandable.
- General result status and exact-match status remained consistent.
- Hidden values did not enter rendered or accessible output.
- Active exact-match styling remains distinguishable beyond color, and the
  existing reduced-motion behavior is unchanged.
- Both requested viewport checks remained contained and usable without
  page-level horizontal overflow.

Native screen-reader validation was unavailable; no native screen-reader or
WCAG certification claim is made.

### Performance Evidence

`node tests\\largeReportPerformance.bench.js` passed all established p95
budgets for existing and 5,000-record stress workloads. The measured paths
included parse, visible search, two- and three-report comparison, text export,
JSON export, repeated workflow, and clear/reset simulation. No production
optimization was required.

| 5,000-record workload | Parse p95 | Search p95 | Repeated workflow p95 |
| --- | ---: | ---: | ---: |
| CoreAnalytics | 7.619 ms | 0.184 ms | 9.355 ms |
| Stackshot | 8.497 ms | 0.103 ms | 11.720 ms |

## Known Environmental Limitations

- The repository Playwright route through WSL was unavailable because no WSL
  distribution was installed. No WSL or dependency installation was attempted.
- Safari, Mobile Safari, Firefox, physical devices, and native screen readers
  were unavailable.
- Browser heap snapshots were unavailable.
- Runtime offline reload was unavailable; static service-worker guards and
  browser registration/readiness passed.

Unavailable automation or browser lanes are environmental limitations, not
application failures.

## Release Checklist

- [x] Slices 19A, 19B, and 19C complete.
- [x] Shared visible-row search contract corrected without parser or schema expansion.
- [x] Full tests and relevant syntax checks passed.
- [x] Established performance budgets passed.
- [x] Available Edge, accessibility, responsive, privacy, and service-worker readiness checks passed.
- [x] Documentation reconciled for an implementation-complete, unreleased milestone.
- [x] No known release blocker remains.
- [ ] Manual release review approval.
- [ ] Create the `v1.9.0` tag after approval.
- [ ] Publish the `v1.9.0` GitHub Release after approval.

No `v1.9.0` tag or GitHub Release has been created. v1.9.0 remains unreleased
and is ready for manual release review.
