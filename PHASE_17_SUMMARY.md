# Phase 17 Summary

## Milestone

`v1.7.0` — Comparison Workflow Clarity

Status: implementation complete; ready for manual release review.

Release status: Unreleased. No `v1.7.0` tag or GitHub Release was created in
this phase.

## Objective

This milestone improves the clarity of selecting and managing two or three
compatible reports without weakening privacy or changing sanitized comparison
output, parser behavior, search, navigation, copy, or export contracts.

## Completed Slices

### Slice 17A - Comparison Identity Contract

Defined the optional `localLabel` comparison-entry field as ephemeral,
in-memory metadata. New entries start with an empty label. Labels trim and
collapse whitespace, remove control characters and line breaks, preserve
ordinary Unicode and punctuation, and are limited to 40 Unicode code points.
Updates are immutable. Removing an entry discards only its label while
remaining entries retain their labels and are re-numbered by insertion order.
Clear and report-reset paths discard identity state. Labels remain isolated
from comparison models, generated sections, exports, search, and navigation.

Commit: `f5f2fff1c0acfb947dde5e7006986362c088b3bc`
(`test(v1.7): define comparison clarity contract`)

Files changed: `src/appState.js`, `src/main.js`, `tests/parser.test.js`.

### Slice 17B - Comparison Setup Feedback

Added accessible per-report local-label inputs, parser-type visibility, generic
and aliased display formats, privacy help text, incomplete-selection feedback,
mixed-parser feedback, maximum-report feedback, predictable removal focus
restoration, and responsive comparison layout. Labels remain setup-only and
are rendered as safe text.

Commit: `5234b90a0152586f2119e5b9943035c9957250c4`
(`feat(v1.7): clarify comparison setup`)

Files changed: `src/main.js`, `styles/main.css`, `tests/parser.test.js`.

### Slice 17C - Workflow and Regression Hardening

Slice 17C changed tests only; no production defect was reproduced. Coverage
was strengthened for hostile-looking label rendering, duplicate-control
guards, eligibility and feedback transitions, immutable repeated workflows,
privacy, export, search, navigation, and persistence isolation. Chrome QA
covered two- and three-report setup, mixed-parser and maximum-report states,
focus, keyboard operation, responsive widths, offline behavior, and 20
repeated comparison cycles.

Commit: `299b2874f604b2099dd45473bf9fae2108fef89d`
(`test(v1.7): harden comparison workflow clarity`)

Files changed: `tests/parser.test.js` only.

### Slice 17D - Documentation and Release Readiness

Reconciles the README, roadmap, changelog, and this summary with the completed
v1.7.0 behavior. Final validation and existing browser evidence are recorded;
the milestone remains unreleased and awaits manual tag and GitHub Release
review.

Files changed: `README.md`, `ROADMAP.md`, `CHANGELOG.md`,
`PHASE_17_SUMMARY.md`.

## Final Behavior

- Comparison accepts two or three supported reports of the same parser type.
- Comparison remains sanitized-only and preserves generic positional identities:
  `Report 1`, `Report 2`, and `Report 3`.
- Each selected entry may have an optional local label. The parser type remains
  visible during setup.
- Labels appear only in the setup UI. They are retained on surviving entries
  after removal and discarded on removal, Clear Comparison, Clear Report, page
  reload, and session end.
- Removal re-numbers remaining entries deterministically without moving labels
  between entries.
- Incomplete selection, mixed parser types, and the three-report limit receive
  clear generic feedback.
- Raw Local View restrictions remain unchanged; sanitized comparison output is
  not exposed through raw-mode content.

## Architecture And Data Flow

The existing comparison selection state remains the only comparison state:

```text
selected sanitized report
  -> comparison entry + optional localLabel
  -> existing same-parser validation
  -> existing comparison SectionModel[] generation
  -> existing search, navigation, copy, and export paths
```

`localLabel` is not part of `SectionModel[]`, `comparisonModel.js`, generated
comparison sections, filenames, JSON schema, or JSON `mode`. No second
comparison validator, loader, search path, or export path was introduced.

## Privacy Contract

Local labels are user-supplied, local, ephemeral text. They are never derived
from filenames, paths, directory names, raw report text, parser metadata,
timestamps, identifiers, process names, bundle identifiers, or report content.

Labels are never added to comparison sections, copy, text export, JSON export,
filenames, search, Search Result Navigation, URLs, localStorage,
sessionStorage, IndexedDB, cookies, service-worker cache, network requests,
analytics, or telemetry. No persistence or upload behavior was introduced.

## Accessibility And Responsive Behavior

The setup uses native controls with programmatic labels, associated privacy
help text, keyboard editing, safe text insertion, visible focus, updated
positional accessible names, and predictable focus restoration after removal.
Eligibility feedback uses the existing status live region. Browser checks found
no unnamed controls, duplicate local-label IDs, or focus failures. Inputs and
remove controls retain touch-safe sizing, and comparison entries remain
contained at 320, 375, 390, 414, and 768 pixel widths.

Native screen-reader testing was not performed. WCAG certification is not
claimed.

## Testing And Validation

- `npm.cmd test` passed.
- All requested JavaScript syntax checks passed.
- The Node benchmark passed established parsing, search, comparison,
  text-export, and JSON-export budgets.
- All 11 bundled examples loaded through the existing workflow.
- Two- and three-report comparisons, Unicode normalization, hostile-label
  rendering, mixed-parser rejection, maximum-report handling, clear/reset
  behavior, generic exports, and Raw Local View restrictions passed.
- Search and Search Result Navigation remained isolated from local labels.
- Service-worker activation, offline example loading, offline comparison setup,
  and reload-based label reset passed.
- Chrome observed no console errors, page errors, failed requests, or
  unexpected external requests.

## Performance Evidence

Chrome system-channel QA used headless Chrome `150.0.7871.115` with cached
Playwright `1.61.1`.

| Workload | Parse/render p95 | Search p95 |
| --- | ---: | ---: |
| CoreAnalytics | 14.7 ms | 4.3 ms |
| Stackshot | 16.4 ms | 9.0 ms |

The Chrome repeated-workflow p95 was 25.1 ms. The Node stress benchmark also
passed all established budgets. No production optimization was required.

## Known Limitations

- Local labels are intentionally ephemeral and are not exported.
- Comparison remains limited to two or three same-parser reports and remains
  sanitized-only.
- Safari, Firefox, Mobile Safari, and physical-device testing were unavailable.
- Native screen-reader testing and browser heap snapshots were unavailable.
- The direct Playwright CLI wrapper failed with an npm cache permission error;
  cached Playwright browser QA succeeded independently. This was an environment
  limitation, not a project failure.
- MetricKit, speculative optimization, AI diagnosis, symbolication, `.dSYM`,
  sysdiagnose extraction, backend processing, uploads, telemetry, analytics,
  persistence, and additional export formats remain unsupported or deferred.

## Release Readiness

- [x] Slices 17A, 17B, 17C, and 17D complete.
- [x] Comparison identity and setup behavior matches the approved contract.
- [x] Privacy, export, search, navigation, accessibility, responsive, offline,
  and performance contracts preserved.
- [x] Automated validation and Chrome workflow QA passed.
- [x] Documentation reconciled for implementation-complete status.
- [ ] `v1.7.0` tag and GitHub Release - manual review required.

`v1.7.0` is ready for manual tag and GitHub Release review. It remains
unreleased, and no v1.8.0 implementation scope is approved.
