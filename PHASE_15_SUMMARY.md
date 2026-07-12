# Phase 15 Summary: Complete Supported Diagnostic Examples

## Milestone

`v1.5.0` — Complete Supported Diagnostic Examples

Status: released and fully closed. The `v1.5.0` tag and published, non-
prerelease GitHub Release point to `88c2c6301e9f32a86c6bb91b21924a469dd79360`.
This post-release reconciliation commit follows the tag and is not part of the
tagged release.

## Objective

Provide one compact, fictional, sanitized production example for every parser
family already supported by the application. Reuse the existing manifest,
example loader, `parseInput()` workflow, rendering, search, navigation, copy,
text export, JSON export, comparison, accessibility, and service-worker paths.

## Final Scope

The complete bundled catalog contains exactly one example for each supported
family:

- App Crash - `examples/app-crash.ips`
- Legacy Crash - `examples/legacy.crash`
- Watchdog - `examples/watchdog.ips`
- Jetsam - `examples/jetsam-event.ips`
- Panic - `examples/panic-full.ips`
- Generic Analytics - `examples/analytics.txt`
- CoreAnalytics - `examples/coreanalytics.ips.ca.synced`
- AccessoryCrash - `examples/accessory-crash.ips`
- CPU Resource - `examples/cpu-resource.ips`
- Disk Writes Resource - `examples/disk-writes-resource.ips`
- Stackshot Resource - `examples/stackshot-resource.ips`

The five new files are fictional, deterministic, compact, sanitized, privacy-
reviewed, and separate from internal test fixtures and large stress workloads.

## Slice History

### Slice 15A - Production Example Fixture Contract

Created and validated the five new production examples without changing
parsers, classifiers, routing, UI, exports, or service-worker behavior.

Commit: `c2a5afaf899a6658946fc38d17cb7cb253fed197`
(`test(v1.5): define complete supported example fixtures`)

### Slice 15B - Example Manifest and Offline Integration

Added the five approved files to the existing manifest and explicit service-
worker precache list. The manifest now represents all 11 supported families.

Commit: `c2e6e914947fb88b79bff508a36dfa664880deb7`
(`feat(v1.5): complete supported example catalog`)

The cache version is:

`v1.5.0-slice15b-supported-examples-2026-07-12`

No runtime caching, `cache.put()`, report persistence, uploads, analytics,
telemetry, or user-report storage was introduced.

### Slice 15C - Cross-Family Workflow and Regression QA

Verified all 11 examples through the normal application workflow, including
classification, parsing, explanations, search, navigation, copy, text export,
JSON export, comparisons, Raw Local View, CoreAnalytics facets, switching, and
clear/reset behavior.

The privacy pass reproduced a defect where hexadecimal addresses could appear
in sanitized Panic output. The surgical fix is local to the Panic parser,
redacts address-shaped values in sanitized output, preserves Raw Local View,
and does not alter other parser families.

Commit: `9ff6c9e625ec96851742eb0d143dd25b32a4475b`
(`fix(v1.5): verify complete example workflow`)

The later browser-QA retry changed no project files.

### Slice 15D - Documentation and Release Readiness

Reconciles README, roadmap, changelog, and this summary after publication.
Final deterministic validation, benchmark checks, and Chrome workflow QA are
recorded below. No v1.5.0 implementation tasks remain.

## Architecture And Privacy

The new examples use the existing flow:

```text
manifest entry
  -> existing example loader
  -> parseInput()
  -> parser-specific sanitized SectionModel[]
  -> existing rendering, search, navigation, copy, export, and comparison paths
```

No second example-loading or parsing path was introduced. Parser contracts,
classification, explanations, comparison semantics, export schemas, Raw Local
View boundaries, and PWA strategy remain unchanged except for the verified
Panic address-sanitization fix.

All example values are fictional. Privacy review covered identifiers, paths,
addresses, process data, nested payloads, manifest labels, visible sections,
search, navigation, facets, copy, text export, JSON export, comparison output,
and status messages. No real diagnostic data was added.

## Validation

The deterministic validation suite passed:

```powershell
npm.cmd test
node --check examples\manifest.js
node --check service-worker.js
node --check src\parsers\parsePanic.js
node --check tests\parser.test.js
node --check tests\largeReportPerformance.bench.js
node --check tests\fixtures\largeReportWorkloads.js
node tests\largeReportPerformance.bench.js
git diff --check
```

All 11 examples classify correctly and parse successfully. Privacy sentinel,
workflow, export, comparison, Raw Local View, cap, immutability, manifest,
precache, and local-first guards pass.

Latest known Node stress results:

| Workload | Parse p95 |
| --- | ---: |
| CoreAnalytics, 5,000 records | 7.9345 ms |
| Stackshot, 5,000 processes | 8.5805 ms |

All measured search, comparison, text-export, and JSON-export performance
budgets passed. Exact values for the other metrics are not claimed here.

## Browser QA

Final workflow QA used the Chrome system channel on Windows:

- Chrome: `150.0.7871.101`
- Playwright: `1.61.1`
- Mode: headless Chrome

The browser pass verified:

- all 11 examples load and classify correctly;
- CoreAnalytics facet query insertion, replacement, manual-search reset,
  Clear Search, and focus restoration;
- single-report text and JSON downloads with generic filenames;
- two-report comparison text and JSON downloads with comparison JSON mode;
- no CoreAnalytics facets in comparison or Raw Local View;
- Raw Local View disables text and JSON export and sanitized mode restores them;
- 20 repeated parse/search/clear cycles without stale state, duplicate
  controls, progressive slowdown, or errors;
- containment at 320, 375, 390, 414, and 768 px;
- skip-link focus, keyboard progression, accessible facet names, and touch-safe
  controls;
- service-worker readiness and offline reload;
- all five new examples loading offline from precache;
- no external requests, console errors, page errors, or failed requests.

The retained browser performance harness also completed at a 1280x900
viewport. CoreAnalytics p95 values were 14.3 ms parse-to-render, 4.3 ms
search, 4.3 ms comparison, and 4.3 ms clear-report. Stackshot p95 values were
13.8 ms, 5.8 ms, 6.8 ms, and 5.5 ms for the same operations. Repeated workflow
p95 was 25.1 ms. The harness reported no accessibility naming or focus
failures, no page overflow, and service-worker API readiness.

Safari, Mobile Safari, and Firefox were not directly validated. Native
screen-reader software, every browser/operating-system combination, and native
screen-reader certification were not tested. The repository contains
`tests/browserPerformanceHarness.html` for browser performance measurements,
but no dedicated automated Safari or Mobile Safari harness.

## Known Limitations And Deferred Work

- Examples are demonstration assets and do not represent every possible report
  shape or field.
- CoreAnalytics remains sanitized and capped; raw and uncapped records are not
  exposed.
- Stackshot Resource remains summary-only; full stacks, symbols, addresses, and
  symbolication are unsupported.
- App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, and broad
  Accessory/Firmware diagnostics remain unsupported.
- MetricKit remains deferred pending an authoritative serialized fixture
  contract.
- Speculative optimization remains deferred because established budgets pass.
- AI diagnosis, exact root-cause analysis, `.dSYM`, sysdiagnose extraction,
  backend/cloud processing, uploads, analytics, telemetry, and persistence
  remain unsupported.

## Release Readiness

- [x] All four v1.5.0 slices complete.
- [x] Exactly one fictional bundled example per supported parser family.
- [x] Existing parser and workflow contracts preserved.
- [x] Panic sanitized-address defect fixed and covered.
- [x] Automated validation and performance regression checks pass.
- [x] Chrome workflow, responsive, accessibility, PWA, and offline QA pass in
      the available environment.
- [x] Documentation reconciled after publication.
- [x] The `v1.5.0` tag remains on the release-readiness commit.
- [x] The published GitHub Release is a non-prerelease and non-draft.
- [x] Post-release documentation reconciliation completed after the tag.

The v1.5.0 release is complete and closed. Future work returns to planning-only
mode for v1.6.0; no v1.6.0 implementation scope is approved.
