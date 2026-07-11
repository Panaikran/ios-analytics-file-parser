# Phase 12 Summary

## Overview

Phase 12 is the unreleased `v1.2.0` Sanitized Visible Export milestone. It adds a local plain-text download workflow above existing parsed sections without changing parser, explanation, comparison, search, copy, or privacy contracts.

## Completed Slices

- Slice 12A: added a pure deterministic serializer for ordered eligible visible sections.
- Slice 12B: added accessible single-report and comparison download controls, generic filenames, and temporary Blob URL cleanup.
- Slice 12C: added parser-matrix, privacy, visibility, large-report, comparison, repeated-download, and local-first regression coverage.
- Slice 12D: completed documentation alignment, final QA, validation, and manual release-readiness review.

## Export Contract

- Export receives only already-sanitized visible `SectionModel[]` data.
- Active search and the existing table-visibility rules define eligible sections and rows.
- Viewport position and scrolling do not affect export eligibility.
- Raw Local View, hidden, capped, filtered-out, unrendered, source-only, and raw report content are excluded.
- Single reports use `ios-diagnostic-export.txt`; generated comparisons use `ios-diagnostic-comparison.txt`.
- Downloads use a local UTF-8-compatible plain-text Blob and revoke its object URL after use.

## Privacy And Local-First Boundaries

- No backend, uploads, analytics, cloud processing, report persistence, export history, storage, runtime caching, or `cache.put` behavior was added.
- Export does not inspect raw source text or scrape DOM text.
- Raw, original-file, JSON, CSV, PDF, and background export are not supported.

## Validation And QA

```powershell
npm.cmd test
node --check src\main.js
node --check src\clipboard\serializeSection.js
node --check src\clipboard\downloadText.js
node --check service-worker.js
node --check tests\parser.test.js
git diff --check
git status --short
```

Automated coverage verifies export across every supported parser type, search/copy/table-visibility parity, Stackshot and CoreAnalytics caps, comparison ordering, hidden-data exclusion, Blob content, URL cleanup, and immutable parser output.

Browser QA in the available in-app browser verified paste parsing, sanitized single-report and comparison export controls, active search, Raw Local View disablement, clear/return workflows, copy parity, keyboard activation, 320-768 px containment, offline-ready status, and no console errors. Native download-event observation and forced offline reload were unavailable in that environment. Edge, Firefox, Safari, and Mobile Safari were unavailable.

## Known Limitations

- Export is sanitized visible plain text only; raw, original-file, JSON, CSV, and PDF exports are unsupported.
- Comparison remains limited to 2 or 3 reports with the same supported `parserType`.
- App Usage Metrics, Wi-Fi Connectivity, Diagnostic Request, and broad Accessory/Firmware diagnostics remain unsupported.
- No symbolication, `.dSYM` support, sysdiagnose extraction, full stack rendering, AI diagnosis, exact root-cause analysis, backend, cloud storage, uploads, analytics, or report persistence exists.

## Release Checklist

- Slices 12A-12D are complete and frozen.
- Automated validation and final available-browser QA pass.
- Documentation reflects implemented scope and keeps v1.2.0 unreleased.
- No release blockers remain for manual review.
- Tagging and publication require a separate explicit request.
