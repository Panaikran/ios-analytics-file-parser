# Phase 6 Summary

## Overview

Phase 6 is the unreleased `v0.6.0-alpha` Apple Diagnostics Expansion milestone.

The milestone expands diagnostic family handling while preserving the static browser app, local-first privacy model, sanitized default output, no-backend constraint, and conservative PWA cache strategy.

No package metadata, release tag, GitHub release, backend, authentication, analytics, cloud storage, report persistence, runtime caching, framework dependency, symbolication, sysdiagnose extraction, or full stack rendering was added.

## Milestone Theme

Primary theme: Apple Diagnostics Expansion.

Primary goal: classify Apple diagnostic families more safely, add narrow parser support for selected diagnostics, and keep unsupported families explicit rather than treating every `.ips` file as a standard app crash.

## Completed Phases

### Phase 1: Diagnostic Classification Architecture

- Added `src/parsers/classifyDiagnostic.js`.
- Added compact classification metadata: `type`, `family`, `subtype`, `supported`, `parserType`, `legacyType`, `structure`, and `bugType`.
- Made `detectFileType(input)` a compatibility wrapper over `classifyDiagnostic(input).legacyType`.
- Routed `parseInput()` through `classification.parserType` while preserving `parseInput(text, options) -> SectionModel[]`.
- Added safe friendly messages for recognized-but-unsupported diagnostics.
- Added taxonomy and privacy regression tests.

### Phase 2: AccessoryCrash `bug_type: 305`

- Added `src/parsers/parseAccessoryCrash.js`.
- Routed AccessoryCrash reports through `parseInput()` as `accessory-crash`.
- Added sections for Summary, Accessory Information, Application Information, Crash Log Overview, Panic / Fault Notes, and Parser Notes.
- Summarized crashlogs without rendering raw nested crashlog bodies.
- Hardened privacy handling for identifiers, paths, serials, MAC addresses, ECIDs/chip identifiers, crashlog IDs, nested values, frame addresses, and raw-mode boundaries.
- Browser QA and focused privacy re-QA passed after the AccessoryCrash address-redaction hotfix.

### Phase 3: Resource Diagnostics

- Added `src/parsers/parseCpuResource.js` for CPU Resource `bug_type: 202`.
- Added `src/parsers/parseDiskWritesResource.js` for Disk Writes Resource `bug_type: 142`.
- Added `src/parsers/parseResourceStackshot.js` for Stackshot Resource `bug_type: 288`.
- Routed CPU Resource, Disk Writes Resource, and Stackshot Resource through `parseInput()`.
- Added cross-resource privacy, search, copy, raw-mode, malformed-input, and row-cap regression coverage.
- Stackshot Resource support is summary parsing only and caps Top Processes at 100 rendered rows.

## Supported In v0.6 Work

Supported parser families added during this milestone:

- AccessoryCrash `.ips` reports with `bug_type: 305`.
- CPU Resource reports with `bug_type: 202`.
- Disk Writes Resource reports with `bug_type: 142`.
- Stackshot Resource reports with `bug_type: 288`, summary parsing only.

Existing supported families remain:

- App Crash
- Legacy Crash
- Watchdog
- Jetsam
- Panic
- CoreAnalytics
- Generic Analytics

## Recognized But Not Parsed

These families remain unsupported and show safe unsupported messages:

- App Usage Metrics
- Wi-Fi Connectivity
- Diagnostic Request

Recognition does not mean parsing support. Unsupported recognized diagnostics do not emit `SectionModel[]`.

## Privacy Boundaries

Sanitized mode remains the default.

Raw local view remains opt-in and applies only to the current in-memory report.

The new parsers avoid rendering:

- raw nested payloads
- raw crashlog bodies
- full stack frames
- frame symbols
- frame addresses
- filesystem paths
- request IDs
- UUIDs and slice UUIDs
- incident IDs in sanitized mode
- serials
- MAC/Bluetooth/Wi-Fi/hardware addresses
- ECIDs/chip identifiers
- path-heavy write summaries

Search and copy operate on parsed rendered sections, not raw source text.

## PWA And Cache Boundaries

The service worker cache strategy remains unchanged.

The service worker still:

- precaches only explicit app-shell assets, parser modules, static assets, and sanitized fictional examples
- avoids runtime caching of unknown requests
- avoids dynamic `cache.put`
- does not cache user reports, pasted text, parsed output, raw-mode output, search state, dense-table state, clipboard output, test fixtures, unknown same-origin URLs, or external URLs

Parser modules added during the milestone were included in the precache allowlist when routed through production parsing.

## Browser QA Evidence

Slice 3G browser QA covered:

- bundled examples for App Crash, Legacy Crash, Watchdog, Jetsam, Panic, and Generic Analytics
- paste and file-input flows for all supported parser families
- section navigation
- section rendering
- search
- copy feedback
- sanitized mode
- raw local mode boundaries for high-risk fixtures
- Clear Report
- responsive widths at 320, 375, 414, and 768 px
- keyboard focus basics
- service worker registration
- offline app shell after first successful load
- unsupported App Usage Metrics, Wi-Fi Connectivity, and Diagnostic Request messages

No true release blockers were found during browser QA.

The service-worker update-ready flow was not naturally observable in the single-version local QA run because no waiting worker existed. Service-worker registration and offline shell behavior were verified.

## Automated Validation

Slice 3G validation commands:

```powershell
npm.cmd test
node --check src\main.js
node --check src\parsers\classifyDiagnostic.js
node --check src\parsers\index.js
node --check src\parsers\parseAccessoryCrash.js
node --check src\parsers\parseCpuResource.js
node --check src\parsers\parseDiskWritesResource.js
node --check src\parsers\parseResourceStackshot.js
node --check service-worker.js
node --check examples\manifest.js
node --check tests\parser.test.js
git diff --check
```

Result before documentation alignment: all commands passed.

## Known Limitations

- App Usage Metrics parsing is not supported.
- Wi-Fi Connectivity parsing is not supported.
- Diagnostic Request parsing is not supported.
- Broad Accessory/Firmware diagnostics are not supported.
- Stackshot Resource support is summary parsing only.
- Full stack rendering is not supported.
- Symbolication is not supported.
- `.dSYM` support is not implemented.
- Sysdiagnose archive extraction is not supported.
- Virtualization and streaming/incremental large-file parsing are not implemented.
- CoreAnalytics full raw JSON bodies are not rendered.
- CoreAnalytics grouped event rows and sample record rows remain capped at 100 rendered rows.
- Browser QA used fictional/sanitized fixtures only; no real diagnostic files are committed.

## Release Gate

`v0.6.0-alpha` should not be tagged or published until:

- browser QA remains free of unresolved blockers
- automated validation passes after final documentation alignment
- documentation reflects implemented behavior only
- privacy and service-worker scans pass
- `git status --short` produces no output

No release tag, GitHub release, package metadata change, or publish action is included in Slice 3G.

## v0.7.0-alpha Starting Point

Potential future work, subject to explicit approval:

- App Usage Metrics parser planning
- Wi-Fi Connectivity parser planning
- Diagnostic Request parser planning
- broader Accessory/Firmware diagnostics
- reusable browser smoke automation
- virtualization or incremental rendering for very large visible reports
- deeper CoreAnalytics drill-down without raw JSON dumping
- CSP/header hardening on a host that supports response headers
