# Phase 20 — Apple-Inspired Inspector Workspace

Version:
`v2.0.0`

Status:
`Released`

Release status:
`Released`

Release date:
`2026-07-16`

Release commit:
`release: v2.0.0`

Tag:
`v2.0.0`

GitHub Release:
`Published, non-draft, non-prerelease`

## Objective

Reorganize the existing static, local-first parser into a deliberate Inspector
Workspace without changing parser output, privacy boundaries, search semantics,
comparison rules, Raw Local View restrictions, export schemas, or persistence
behavior.

## Completed Slices

- **20A — Isolated prototype and approval:** the sanitized prototype at
  `b86a44cf2cbb0a3400a307ede92e7623c7417b48` received visual approval and is
  frozen.
- **20B — Tokens, themes, and shell:** semantic light/dark tokens, system and
  technical typography, responsive workspace regions, restrained material,
  and accessibility preference fallbacks.
- **20C — Import and navigation:** calm import hierarchy, desktop section rail,
  accessible mobile section dialog, active-section tracking, and predictable
  workspace-entry/reset focus.
- **20D — Report content:** an opaque continuous report document, semantic
  field relationships, accessible tables, textual chart equivalents, and
  responsive technical density.
- **20E — Search and actions:** persistent search labeling, visible result and
  exact-match position, non-wrapping navigation, Clear Search, Copy Visible,
  and text/JSON actions.
- **20F — Comparison and Raw Local View:** distinct production workspace
  treatments that preserve sanitized-only comparison and raw-mode restrictions.
- **20G — Responsive and accessibility hardening:** narrow, tablet, desktop,
  zoom, focus, contrast, reduced-motion, reduced-transparency, and forced-colors
  foundations.
- **20H — Final QA and release:** complete regression, browser, performance,
  privacy, hostile-content, PWA, documentation, tag, and release validation.

## Final Architecture

- A calm import state progresses into a two-region desktop workspace.
- Tablet and mobile use an accessible section-navigation dialog and prioritize
  search over secondary actions.
- Report, comparison, Raw Local View, table, chart, note, warning, and error
  content remains opaque and content-first.
- A near-solid Liquid Glass approximation is limited to eligible navigation,
  toolbar, menu, and transient control surfaces, with solid fallbacks.
- System typography, a true monospace technical stack, one blue interaction
  accent, normalized semantic tokens, and responsive content widths provide the
  visual foundation.

## Preserved Contracts

- All 11 supported parser families and the existing `SectionModel[]` contract.
- Sanitized-by-default local processing with no backend, uploads, analytics,
  cloud storage, or report persistence.
- Visible-only case-insensitive substring search and non-wrapping exact-match
  navigation.
- Visible sanitized copy, text export, structured JSON schema version 1,
  generic filenames, and temporary object-URL lifecycle.
- Sanitized-only comparison for two or three same-parser reports, including
  local-alias exclusion.
- Opt-in Raw Local View with structured export and comparison restrictions.
- Existing PWA install, update, cleanup, navigation fallback, and explicit
  app-shell precache strategy.

No battery, charging, app-stability, memory-pressure, thermal, storage, modem,
or broader diagnostic extraction was added.

## Final QA Evidence

### Automated and Syntax Validation

- `npm.cmd test` passed the complete Node/assert suite.
- Syntax checks passed for every production JavaScript module,
  `service-worker.js`, and the test suite.
- The suite retained coverage for parsing, sanitization, hostile text, visible
  search, exact-match boundaries, copy/export, comparison, Raw Local View,
  responsive/accessibility rules, manifest metadata, and service-worker assets.

### Browser and Workflow Evidence

- Chromium 150 ran the production app and browser performance/workflow harness
  from fresh localhost origins with no recorded page errors or unhandled
  rejections.
- Import, CoreAnalytics, Stackshot, search transitions, exact-match first and
  final boundaries, Clear Search, comparison, Raw Local View, hostile content,
  report clearing, semantic tables, focus retention, duplicate-ID checks, and
  page-level overflow checks passed.
- Hidden-only search returned no visible or accessible match, copied content,
  text export, JSON section, or local-alias signal.
- Hostile script, image, event-handler, and link strings remained literal and
  created no hostile DOM elements or execution.
- Service-worker registration and readiness passed on a fresh origin.

### Accessibility and Responsive Evidence

- The import and workspace states retain one logical H1, logical H2/H3 report
  hierarchy, labeled landmarks, persistent form labels, semantic description
  lists and tables, named scroll regions, native dialog/disclosure controls,
  programmatic disabled states, and concise live status.
- Automated control inventory found no unnamed controls, duplicate IDs, clipped
  focus failures, or hidden-focus leaks. Exact-match navigation retained focus,
  and mode/disclosure/dialog transitions restored focus predictably.
- CSS and regression assertions cover 320, 375, 390, 414, 768, 1024, and wide
  desktop layouts, 44px targets, zoom/reflow containment, reduced motion,
  reduced transparency, increased contrast, and forced colors.
- Live browser containment passed at the available desktop widths. Runtime
  preference emulation, native screen readers, and every requested live mobile
  viewport were unavailable, so no formal WCAG certification or unsupported
  live-mode claim is made.

### Performance Evidence

All established Node and browser budgets passed. Representative Node p95:

| 5,000-record workload | Parse p95 | Search p95 | Repeated workflow p95 |
| --- | ---: | ---: | ---: |
| CoreAnalytics | 7.138 ms | 0.257 ms | 9.742 ms |
| Stackshot | 8.721 ms | 0.103 ms | 11.737 ms |

Representative browser p95:

| Workload | Parse p95 | Render p95 | Combined p95 | Search p95 |
| --- | ---: | ---: | ---: | ---: |
| CoreAnalytics | 9.1 ms | 6.2 ms | 6.6 ms | 6.1 ms |
| Stackshot | 6.4 ms | 6.1 ms | 7.3 ms | 7.5 ms |

Repeated browser workflow p95 was 29.5 ms. No performance optimization was
required.

### PWA Release Blocker and Repair

Final audit found that seven explicitly precached production assets had changed
after the Slice 20D cache identity. The allowlist itself was complete: 63
required assets, 63 entries, with no missing, extra, or duplicate entry.

The smallest safe repair advanced `CACHE_VERSION` to the v2.0 release identity
and updated its exact regression assertion. Install, activate, old-cache
cleanup, message, fetch, and navigation behavior did not change. This prevents
existing installations from retaining a mixed pre-release shell.

Runtime registration and readiness passed. A full browser-offline reload and a
live old-cache-to-new-cache upgrade could not be emulated in the available
browser lane; static inventory, lifecycle, cleanup, and version assertions
passed, and no broader offline claim is made.

## Design Audit

The Hallmark 58-gate audit closed with no failed or waived gate. Marketing,
hero, testimonial, remote-font, image, and other non-applicable gates were
trivially satisfied. The production UI preserves the approved Inspector
Workspace, content-first hierarchy, system typography, restrained geometry,
one blue accent, opaque content, limited material, responsive control
prioritization, visible focus, and preference fallbacks.

The UI UX Pro Max helper was available through its installed plugin cache, but
its generated portfolio/orange/external-font direction conflicted with the
approved design authority and was not adopted. Its applicable accessibility and
responsive checks were covered manually and by the existing harness.

No new durable design decision was introduced, so `.hallmark/log.json` was not
created.

## Environmental Limitations

- Runtime offline reload and live old-cache upgrade were unavailable.
- Runtime emulation of reduced transparency, increased contrast, forced colors,
  and every requested zoom/viewport combination was unavailable.
- Safari, Firefox, Mobile Safari, physical devices, native screen readers, and
  browser heap snapshots were unavailable.

Unavailable lanes are reported as limitations, not application failures.

## Release Checklist

- [x] Slices 20A–20H complete and frozen.
- [x] Complete tests, syntax checks, Node benchmark, and browser benchmark passed.
- [x] Available workflow, responsive, keyboard, focus, accessibility, privacy,
  hostile-content, manifest, and service-worker checks passed.
- [x] Verified PWA cache-version blocker repaired narrowly with regression coverage.
- [x] README, ROADMAP, PLANS, PHASE_20_PLAN, CHANGELOG, design status, and this
  summary reconciled.
- [x] Annotated `v2.0.0` tag created and pushed.
- [x] GitHub Release published as stable, non-draft, and non-prerelease.
- [x] No v2.1 implementation started.

v2.0.0 is released and Phase 20 is fully closed.
