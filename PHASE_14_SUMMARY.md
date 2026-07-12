# Phase 14 Summary

## Milestone

`v1.4.0` - CoreAnalytics Investigation Workflow

Status: implemented and ready for manual release review. The release remains
unreleased until an explicit tag and GitHub Release are created.

## Objective

Make existing sanitized and capped CoreAnalytics facet data easier to
investigate without changing parser output, substring-search semantics,
comparison behavior, export contracts, privacy boundaries, or the static
local-first architecture.

## Investigation And Redirection

MetricKit Crash Diagnostics was investigated first. The fixture gate failed
because the exact legacy serialized `MXDiagnosticPayload` JSON shape could not
be verified from an authoritative source. No MetricKit parser, fixture, routing,
or broad MetricKit support was added.

The fallback performance investigation was measurement-first. The deterministic
Node and Chrome baselines did not demonstrate a user-visible bottleneck, so
production optimization, virtualization, Web Workers, renderer replacement,
and state-management redesign remain deferred.

## Completed Slices

- Slice 14A: created deterministic fictional 5,000-record CoreAnalytics and
  5,000-process Stackshot workloads and Node baselines.
- Slice 14B: measured browser rendering, search, comparison, clear/reset,
  accessibility, containment, repeated workflow, and service-worker readiness
  with the retained stress workloads.
- Slice 14C: defined the pure facet contract from sanitized rendered/capped
  CoreAnalytics view data.
- Slice 14D: added accessible native facet controls that populate the existing
  search input and reuse its normal `input` path.
- Slice 14E: hardened privacy, search/copy/export parity, repeated workflows,
  non-CoreAnalytics boundaries, and keyboard focus restoration.
- Slice 14F: completed final browser QA, documentation reconciliation, and
  release-readiness preparation.

## Architecture And Data Flow

```text
getCoreAnalyticsView(activeSections)
  -> getCoreAnalyticsFacetOptions(view)
  -> native facet controls
  -> searchInput.value = option.query
  -> existing search input event path
  -> filterSectionsByQuery()
  -> existing visible sections, copy, text export, and JSON export
```

Facet controls are rendered only for the sanitized single-report CoreAnalytics
view. Comparison mode and Raw Local View do not expose interactive facets.
No second filtering pipeline, parser route, SectionModel shape, renderer
architecture, comparison model, export serializer, worker, or persistence
layer was introduced.

## Privacy And Visibility

- Facet values come only from sanitized, rendered, capped CoreAnalytics rows.
- Raw, uncapped, hidden, nested, inherited, prototype-style, source-only, and
  unrendered values are excluded.
- Existing CoreAnalytics event-group and sample-record caps remain unchanged.
- Search remains ordinary substring matching with one active facet query.
- Copy, text export, and JSON export use the same filtered visible-content rules.
- Raw Local View and comparison mode remain outside the facet workflow.
- No storage, persistence, uploads, analytics, telemetry, cloud processing, or
  network filtering/export behavior exists.

## Accessibility And Responsive QA

Chrome QA verified native keyboard-operable controls, category-and-value
accessible names, selected-state semantics, visible focus, focus restoration
after rerender, and 44px touch targets. Manual search, Clear Search, raw-mode,
comparison, report-clear, and reparse transitions were exercised.

Exact application containment checks passed at 320px, 375px, 390px, 414px,
and 768px with no page-level overflow or clipped controls. Facet groups,
search, Clear Search, copy, and export controls remained reachable.

## Performance Evidence

Provisional budgets remained satisfied.

Latest Node stress p95 results:

| Workload | Parse | Search | Comparison | Text export | JSON export |
| --- | ---: | ---: | ---: | ---: | ---: |
| CoreAnalytics 5,000 records | 7.91 ms | 0.11 ms | 0.06 ms | 0.22 ms | 0.17 ms |
| Stackshot 5,000 processes | 8.53 ms | 0.03 ms | 0.03 ms | 0.08 ms | 0.06 ms |

The Chrome harness used three warmups and ten measured samples. At the
available 746px CSS viewport, CoreAnalytics parse/search/comparison/clear p95
values were 18.0/18.1/17.8/17.3 ms. Stackshot values were
18.2/17.5/17.2/17.4 ms. Repeated workflow p95 was 84.2 ms across 20 cycles.

No progressively slower behavior or user-visible performance bottleneck was
demonstrated.

## Retained Regression Infrastructure

- `tests/fixtures/largeReportWorkloads.js` provides deterministic fictional
  stress inputs.
- `tests/largeReportPerformance.bench.js` measures Node parse, search,
  comparison, serialization, and clear/reset behavior.
- `tests/browserPerformanceHarness.html` measures browser render and workflow
  behavior with the same workloads.

These files remain regression tooling. They are not the v1.4 user-facing
feature.

## Browser And PWA QA

Available Chrome `150.0.7871.101` on Windows `10.0.26200.0` passed parsing,
facet activation, keyboard activation, search replacement, no-result and
restore states, copy/export eligibility, Raw Local View, comparison entry and
clear, report clear and reparse, service-worker readiness, and console/network
guards. No unexpected external requests were observed.

Edge, Firefox, Safari, and Mobile Safari were unavailable. Native screen-reader
testing, browser heap snapshots, native download observation, network
interception, and forced offline reload were unavailable. Deterministic tests
and static guards cover the underlying privacy, export, cache-boundary, and
workflow contracts where those environments were unavailable.

## Known Limitations

- Facets use sanitized rendered/capped values only.
- Filtering is substring-based and supports one active facet query at a time.
- Exact-match, fuzzy, semantic, compound, and multi-select filtering are not
  supported.
- Facet controls are not available in comparison mode or Raw Local View.
- MetricKit remains deferred pending an authoritative serialized fixture
  contract.
- App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, and broad
  Accessory/Firmware diagnostics remain unsupported.
- Symbolication, `.dSYM`, sysdiagnose extraction, AI diagnosis, exact
  root-cause analysis, backend/cloud processing, uploads, analytics, and
  persistence remain unsupported.

## Validation

The release-readiness validation passed:

```powershell
npm.cmd test
node --check src\main.js
node --check src\ui\coreAnalyticsView.js
node --check src\ui\renderApp.js
node --check src\ui\renderCoreAnalyticsOverview.js
node --check service-worker.js
node --check tests\parser.test.js
node --check tests\largeReportPerformance.bench.js
node --check tests\fixtures\largeReportWorkloads.js
node tests\largeReportPerformance.bench.js
git diff --check
```

## Release Checklist

- Slices 14A through 14F are complete and frozen.
- Parser, explanation, comparison, search, copy, export, privacy, and PWA
  contracts remain unchanged.
- Browser QA and responsive checks passed in the available environment.
- Documentation reflects implemented behavior and known limitations.
- `v1.4.0` remains unreleased.
- No `v1.5.0` implementation scope is approved.

Remaining manual release work is review, followed by explicit tag creation and
GitHub Release publication. No tag or release was created by Phase 14.
