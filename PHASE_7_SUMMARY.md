# Phase 7 Summary

## Overview

Phase 7 is the unreleased `v0.7.0-alpha` Human-Readable Diagnostic Explanations milestone.

The milestone adds cautious, deterministic explanation sections for already-supported diagnostics while preserving the static browser app, local-first privacy model, sanitized default output, no-backend constraint, parser-family boundaries, and conservative PWA cache strategy.

No package metadata, release tag, GitHub release, backend, authentication, analytics, cloud storage, report persistence, runtime caching, framework dependency, AI diagnosis, symbolication, sysdiagnose extraction, full stack rendering, or new parser family was added.

## Milestone Theme

Primary theme: Human-Readable Diagnostic Explanations.

Primary goal: help users understand what a supported diagnostic usually means without claiming an exact root cause.

## Completed Slices

- Slice 7A: added the pure deterministic explanation helper in `src/explanations/diagnosticExplanations.js`.
- Slice 7B: integrated explanation sections into `parseInput()` while preserving `parseInput(text, options) -> SectionModel[]`.
- Slice 7C: added search, copy, privacy, raw-mode, unsupported-diagnostic, and static regression coverage.
- Slice 7D: completed Browser/UI smoke QA for rendered explanation sections.
- Slice 7E: aligned README, ROADMAP, CHANGELOG, Phase 6 notes, and this Phase 7 summary.

## Explanation Coverage

Explanation rules cover selected already-supported report patterns:

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

CoreAnalytics and Generic Analytics remain supported parsers, but they do not currently receive explanation sections unless a safe rule is added later.

Recognized unsupported diagnostics still do not receive explanation sections:

- App Usage Metrics
- Wi-Fi Connectivity
- Diagnostic Request

## User-Facing Behavior

When a safe rule applies, `parseInput()` inserts one `diagnostic-explanation` section titled `What This Usually Means`.

The section appears after the first Summary-like section when practical. Panic reports, which do not have a Summary-like section, receive the explanation section at the end of the parsed section list.

Explanation sections use the same rendering, section navigation, search, and copy behavior as other sections.

## Privacy And Safety Boundaries

Explanations are:

- deterministic
- local-only
- based on already-parsed safe fields
- generic and cautious
- independent of raw source text

Explanations do not expose:

- UUIDs
- request IDs
- incident IDs
- serials
- ECIDs/chip IDs
- MAC/Bluetooth/Wi-Fi/hardware addresses
- filesystem paths
- command paths
- frame addresses
- raw stack frames
- nested payloads
- raw crashlog bodies

Explanations do not provide AI diagnosis, exact root-cause claims, symbolication, full stack rendering, or repair instructions.

## Browser QA Evidence

Slice 7D browser smoke QA covered:

- bundled examples for App Crash, Legacy Crash, Watchdog, Jetsam, Panic, and Generic Analytics
- paste flow for AccessoryCrash, CPU Resource, Disk Writes Resource, Stackshot Resource, CoreAnalytics, and recognized unsupported diagnostics
- file picker flow for bundled App Crash and Panic examples
- section navigation
- explanation section rendering
- explanation search
- explanation copy
- sanitized default mode
- raw local mode explanation safety
- Clear Report behavior
- responsive widths at 320, 375, 414, and 768 px
- keyboard focus basics
- service worker registration
- offline app shell after first successful load
- offline bundled example loading

No Slice 7D blockers were found.

The service-worker update-ready flow was not naturally observable in the single-version local QA run because no waiting worker existed. Service-worker registration and offline shell behavior were verified.

## Automated Validation

Slice 7E validation commands:

```powershell
npm.cmd test
node --check src\explanations\diagnosticExplanations.js
node --check src\parsers\index.js
node --check service-worker.js
node --check tests\parser.test.js
git diff --check
git status --short
```

## Known Limitations

- Explanations are general guidance, not exact diagnosis.
- No AI diagnosis is provided.
- No exact root-cause claims are provided.
- No symbolication is supported.
- Full stack rendering is not supported.
- App Usage Metrics parsing is not supported.
- Wi-Fi Connectivity parsing is not supported.
- Diagnostic Request parsing is not supported.
- Broad Accessory/Firmware diagnostics are not supported.
- CoreAnalytics and Generic Analytics currently do not receive explanation sections.
- Browser QA used fictional/sanitized fixtures only; no real diagnostic files are committed.

## Release Gate

`v0.7.0-alpha` should not be tagged or published until:

- documentation reflects implemented behavior only
- automated validation passes
- privacy and service-worker scans pass
- Browser/UI smoke QA remains free of unresolved blockers
- `git status --short` is reviewed and any release-intended changes are committed

No release tag, GitHub release, package metadata change, version number change, or publish action is included in Slice 7E.

## Next Starting Point

After `v0.7.0-alpha`, the planned path points toward `v0.8.0-alpha` release hardening and QA polish rather than new parser-family work by default.

Future parser-family work remains possible only if explicitly approved later.
