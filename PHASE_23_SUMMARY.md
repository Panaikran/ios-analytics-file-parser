# Phase 23 Summary — Bounded CoreAnalytics Investigation

Status: **Complete and frozen**

Release status: **v2.2.0 release-ready; not tagged or published**

Completed: 2026-09-21

## 1. Objective and boundaries

Phase 23 added a bounded way to investigate supported CoreAnalytics reports
using only values already parsed, sanitized, rendered, and capped by the
application. Existing global search remains the sole filter. The work adds no
raw-source exploration, event-family interpretation, or speculative diagnostic
meaning.

The static browser app remains local-only: there is no backend, upload,
telemetry, analytics, cloud processing, or user-report persistence. Parser
families, `parseInput`, and `SectionModel[]` remain unchanged.

## 2. Slice summary

- **23A — Evidence, Architecture, and Corpus Audit:** selected Approach B, a
  bounded facet-to-row investigation over existing sanitized and capped
  output; approved four facet keys and documented privacy, state, and search
  boundaries.
- **23B — CoreAnalytics Investigation Boundary:** added an ephemeral,
  scalar-only state boundary and strict allowlist; facet activation continues
  through the existing global search path.
- **23C — Sanitized Investigation Model:** added a privacy-safe projection
  over the current filtered visible results without parser or serializer
  changes.
- **23D — Investigation Presentation and Workflow Integration:** added
  compact context/status in sanitized single-report CoreAnalytics view and
  reused the existing Clear Search path.
- **23E — Corpus and Regression Hardening:** added fictional synthetic cases,
  exact cap and beyond-cap coverage, repeated workflow tests, privacy-mode
  reset hardening, and the large-text mobile search-navigation overflow fix.
- **23F — Final QA and Release Readiness:** completed final validation and
  documentation reconciliation. No production, test, fixture, or service
  worker files changed in this slice.

## 3. Approved interaction boundary

The existing CoreAnalytics facets are:

- `message` — Top Messages
- `name` — Top Names
- `aggregationPeriod` — Aggregation Periods
- `sampling` — Sampling Values

They provide context for visible values only; no subsystem or event semantics
are inferred.

## 4. Search and cap contract

Facet activation writes its existing sanitized query through the normal global
search input/event path. The existing filtered `SectionModel[]` and exact-match
targets remain authoritative. There is no second filter or facet-local
navigation.

Investigation reads only currently rendered rows. The existing caps remain at
100 event-group rows and 100 sample-record rows. Capped-out records do not
contribute to facets, search, exact matches, navigation, context, copy, or
exports.

## 5. Privacy boundary

Investigation state is ephemeral and scalar-only. It contains no raw source,
identifiers, source records, filenames, paths, timestamps, report identity,
row identity, hashes, or capped-out values. No persistence or network data
path was added. Sanitized output remains the default; Raw Local View remains
opt-in and isolated from investigation context.

## 6. Defensive empty-state conclusion

The defensive empty projection remains model-tested and fail-closed. Normal
facet activation selects a value from an already rendered searchable row, and
the existing search operates over those same rows, so a stable valid UI
selection naturally retains a match. No artificial browser route was added to
manufacture an empty state; this is not a release blocker.

## 7. Export, comparison, and Raw Local View

No investigation state or status is serialized. Section copy remains based on
visible sanitized sections; text and JSON export schemas and behavior are
unchanged. Automated boundary tests confirmed that copy and both serializers
remain unchanged by investigation projection. Comparison contains no
investigation context and retains its existing sanitized-only limits. Raw
Local View receives no facet-query bridge or investigation UI.

The browser copy workflow was exercised with investigation active. Text/JSON
serializer boundary tests passed; browser download actions were not triggered.

## 8. Accessibility and responsive evidence

Keyboard facet activation, exact-match navigation, and Clear Search focus
restoration passed. The mobile section dialog opened, navigated, closed, and
returned focus correctly. Facet controls and touch controls measured 44 CSS px
high.

Chrome 153 on Windows showed no page-level horizontal overflow at 320, 390,
768, or 1280 CSS-pixel widths. The harness's 200% root-font-size simulation
also showed no overflow at 320 and 390 CSS px. This simulation is not browser
zoom.

## 9. Corpus and regression evidence

`npm.cmd test` passed, including the hand-authored fictional CoreAnalytics
corpus, exact 100/101-row cap cases, beyond-cap sentinels, malformed-line
privacy sentinel, hostile keys, inherited properties, throwing accessors,
cyclic/unsafe values, repeated workflow cycles, and copy/export/comparison/Raw
isolation checks. All production JavaScript syntax checks and
`node --check service-worker.js` passed.

All 11 bundled fictional production examples parsed and rendered in the
browser; section navigation, search/clear, and Clear Report smoke checks
passed. CoreAnalytics facet activation, manual query replacement, exact-match
navigation, report replacement, Clear Report, Raw Local View transitions, and
2-/3-report comparison isolation passed.

## 10. Final performance evidence

Fresh Chrome 153 / Windows browser-harness measurements:

- Generated 5,000-record CoreAnalytics workload (1,705,267 bytes): parse p95
  387.9 ms; render p95 8.5 ms; parse-to-render p95 393.8 ms; search p95
  8.5 ms; investigation-render p95 8.5 ms.
- Generated 5,000-process Stackshot workload (2,311,697 bytes): parse p95
  17.1 ms; render p95 8.5 ms; search p95 10 ms.
- Repeated 20-cycle workflow p95: 425.1 ms.

Fresh Node v22.22.3 / Windows stress measurements:

- Generated 5,000-record CoreAnalytics: parse p95 7.6654 ms; search p95
  0.2101 ms.
- Generated 5,000-process Stackshot: parse p95 9.5346 ms; search p95
  0.1377 ms.

All configured budgets passed. These generated-workload measurements are
environment-specific, not performance guarantees.

## 11. Browser, PWA, and privacy evidence

The browser console showed no errors or warnings during the tested workflows.
After stopping the local server, the cached offline app shell loaded and a
bundled CoreAnalytics example opened. The explicit service-worker allowlist
remains in place, with the v2.2 development cache identity matching the
precached production assets.

Static privacy review found no telemetry or persistence APIs in the
investigation path; application fetches remain limited to local bundled
examples and service-worker behavior. No private or public diagnostic report
was added to the repository.

## 12. Limitations

- Browser QA used Chrome 153 on Windows only; no physical mobile or Safari
  lane was available.
- Native screen-reader testing was not performed.
- Forced-colors and reduced-motion behavior were statically reviewed but not
  runtime-emulated.
- Root-font-size simulation was performed; actual browser zoom was not tested.
- Heap snapshots and direct listener-count instrumentation were unavailable.
- Browser text/JSON download actions were not triggered; automated serializer
  boundary tests and the browser copy path passed.

## 13. Deferred scope

Charging implementation remains deferred under the closed Phase 22 Approach C
decision. Also deferred are semantic event interpretation, raw/hidden source
exploration, row inspectors, comparison expansion, export-schema changes,
broader diagnostics, MetricKit, sysdiagnose, panic/SEP work, and diagnosis or
recommendation features. Phase 23 does not authorize Phase 24.

## 14. Release gate

All available required validation passed, and no known release blocker remains.
Phase 23 is complete and frozen. **v2.2.0 is release-ready but unreleased.**
The v2.2.0 tag and GitHub Release have not been created. A separate explicit
release authorization is required. No post-release record is claimed here.

References: [PHASE_23_PLAN.md](PHASE_23_PLAN.md),
[CoreAnalytics investigation design](docs/design/V2_2_COREANALYTICS_INVESTIGATION_DESIGN.md),
[Phase 22 summary](PHASE_22_SUMMARY.md), and
[charging external evidence review](docs/research/V2_2_CHARGING_EXTERNAL_EVIDENCE_REVIEW.md).
