# Phase 11 Summary

## Overview

Phase 11 is the released `v1.1.0` Multi-Report Comparison milestone. It adds one local, deterministic workflow above the existing parser pipeline without changing parser contracts, routing, explanations, or report storage behavior.

## Completed Slices

- Slice 11A: added `src/comparison/comparisonModel.js`, a pure model that validates compatibility and emits comparison `SectionModel[]` output.
- Slice 11B: integrated Add to Comparison, Remove Report, Clear Comparison, and Compare controls with the existing renderer, navigation, search, copy, accessibility, and service-worker paths.
- Slice 11C: added parser-family, privacy, search/copy, deterministic-ordering, cleanup, mobile, and PWA regression coverage.
- Slice 11D: completed final browser QA, documentation alignment, and release-readiness verification.

## Supported Comparison Scope

- Compare exactly 2 or 3 reports.
- Reports must have the same supported `parserType`.
- Reports are parsed independently in sanitized mode before comparison.
- Report order remains Report 1, Report 2, and Report 3 in insertion order.
- The model emits ordinary comparison sections: Overview, Report Summaries, Common Fields, Differences, Recurring Indicators, and Notes.
- Existing section navigation, search, and copy operate on generated comparison sections.

Comparison does not support mixed parser types, fuzzy matching, raw source text, raw comparison, confidence scores, diagnosis, or root-cause inference. Raw Local View remains available only in the single-report workflow.

## Privacy And Local-First Boundaries

- Comparison receives sanitized parsed sections only; original source text is not retained in comparison entries.
- The comparison model uses allowlisted scalar fields and excludes raw notes, source tables, nested values, hidden table rows, and unsupported fields.
- Reports, comparison state, search state, parsed sections, and clipboard output remain memory-only.
- No backend, uploads, analytics, cloud storage, report persistence, runtime caching, or `cache.put` behavior was added.

## Validation And QA

```powershell
npm.cmd test
node --check src\main.js
node --check src\comparison\comparisonModel.js
node --check service-worker.js
node --check tests\parser.test.js
git diff --check
git status --short
```

Automated coverage verifies compatible comparison across every supported parser type, rejects mixed or malformed entries, preserves insertion order, and prevents excluded data from entering comparison, search, or copy.

Browser QA in the available Chromium environment verified the comparison workflow, mixed-type rejection, search, copy, clear/return behavior, 320 px and 768 px layouts, service-worker registration, and cached offline shell. Firefox, Safari, and Mobile Safari require separate environments for direct verification.

## Known Limitations

- Comparison is limited to 2 or 3 reports with the same supported `parserType`.
- Comparison is sanitized-only and does not support Raw Local View.
- App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, and broad Accessory/Firmware diagnostics remain unsupported.
- No symbolication, `.dSYM` support, sysdiagnose extraction, full stack rendering, AI diagnosis, exact root-cause analysis, backend, cloud storage, uploads, analytics, or report persistence exists.

## Release Checklist

- Comparison model and workflow are complete and frozen.
- Parser, explanation, privacy, search, copy, accessibility, and PWA regression coverage passes.
- Browser QA completed in the available environment; unavailable browser lanes are documented.
- Documentation matches the implemented comparison boundaries.
- No release blockers remain.
- `v1.1.0` has been tagged and published on GitHub.
