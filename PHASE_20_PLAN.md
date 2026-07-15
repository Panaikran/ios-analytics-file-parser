# Phase 20 — Apple-Inspired Inspector Workspace

Version: `v2.0.0`

Status: `Planned`

Implementation status: `Not started`

Release status: `Not scheduled; no implementation or release-readiness claim`

## Title

`v2.0.0 — Apple-Inspired Inspector Workspace`

## Objective

Reorganize the existing static application into an accessible, responsive
inspection workspace with restrained Apple-inspired visual craft while
preserving every released parser, privacy, search, comparison, copy, export,
offline, schema, keyboard, responsive, and performance contract.

The normative design specification is `docs/design/V2_INTERFACE_DESIGN.md`.

## User Value

- Reach report content and search faster after parsing.
- Keep section navigation, report identity, privacy mode, and inspection tools
  predictable across dense desktop and narrow mobile layouts.
- Improve visual hierarchy and light/dark accessibility without turning the app
  into a marketing page, generic dashboard, or glass showcase.
- Make current behavior easier to understand without changing what it does.

## Major-Version Rationale

This is a major redesign, not a CSS refresh. It changes information
architecture, navigation, visual and component systems, responsive strategy,
interaction hierarchy, accessibility architecture, and design-token
architecture. The data and parser architecture remain unchanged.

## Architecture Boundaries

- Static browser application using browser-native ES modules.
- Local-only parsing; no backend, upload, analytics, cloud storage, or report
  persistence.
- Parser families and `SectionModel[]` remain independent and frozen.
- Existing app state, visible search, exact-match, copy, export, comparison,
  dense-table, Raw Local View, and service-worker contracts are reused.
- Presentation may be reorganized; behavior changes require a separate approved
  requirement and cannot be smuggled into a visual slice.
- No dependency is added without separate evidence and approval.

## Design Principles

Content first; local trust; tools near their effect; progressive workspace;
restraint; task-appropriate density; accessibility as architecture; behavior
frozen.

## Explicit Non-Goals

- No parser, classifier, model, sanitizer, comparison-model, search semantic,
  exact-match contract, copy contract, export schema, or file-validation change.
- No new parser family, MetricKit, symbolication, sysdiagnose, AI diagnosis,
  backend, upload, analytics, authentication, storage, or persistence.
- No clear Liquid Glass, glass content, marketing hero, dashboard KPI grid,
  decorative animation, custom gesture, sound, haptic, or new icon asset set.
- No tag, GitHub Release, or `Released` status until every slice and release gate
  is separately completed and approved.

## Success Criteria

1. Empty and parsed states follow the approved inspector-workspace information
   architecture at all five responsive ranges.
2. Report content is opaque and dominant; regular web material is limited to
   eligible navigation/control chrome with solid fallbacks.
3. All current workflows and visible-only/privacy contracts pass unchanged.
4. Light/dark, focus, contrast, zoom, reduced motion, reduced transparency,
   increased contrast, forced colors, keyboard, and available screen-reader
   checks pass.
5. Existing Node/assert, browser, privacy, export, responsive, PWA, and large-
   report performance gates pass without unapproved dependency or data changes.
6. Every changed precached asset is paired with an allowlist/cache-version
   update and a controlled-origin update-path test.
7. Documentation describes only verified implementation; no slice or release
   status advances without evidence.

## Planned Slices

No slice is active or complete.

### Slice 20A — Isolated Prototype and Design Approval

Status: `Planned`

- **Objective:** validate the frozen information architecture, design tokens,
  material scope, responsive behavior, and accessibility interactions before
  production changes.
- **Expected files:** isolated prototype files on a separate non-production
  branch; sanitized/synthetic fixtures; design-decision notes. No production
  file is expected to change.
- **Dependencies:** approved `V2_INTERFACE_DESIGN.md` and representative
  sanitized fixture states.
- **Boundaries:** no parser imports that mutate data, no production integration,
  no service-worker inclusion, no report-content transmission.
- **Non-goals:** production polish, implementation, parser behavior, release
  readiness.
- **Success:** structure, visual, interaction, accessibility, and performance
  approval gates are recorded for every representative state.
- **Testing:** keyboard, accessibility tree, contrast, zoom, preference modes,
  all five width ranges, and dense-content performance smoke.
- **Accessibility:** modal section navigation, focus return, status strategy,
  table treatment, and responsive reading order are proven.
- **Rollback:** discard the prototype branch; production remains unchanged.

### Slice 20B — Tokens, Themes, and Workspace Shell

Status: `Planned`

- **Objective:** introduce the approved semantic tokens, light/dark themes,
  content/control layers, and responsive workspace shell.
- **Expected files:** `index.html`, `styles/main.css`, narrowly scoped UI shell
  helpers under `src/ui/`, `src/main.js`, relevant tests/harness, and
  `service-worker.js` when a precached asset changes.
- **Dependencies:** Slice 20A approval.
- **Boundaries:** presentational shell only; reuse current state and render
  entrypoints.
- **Non-goals:** report component restyling, search redesign, comparison, Raw
  mode redesign, parser/model changes.
- **Success:** empty and parsed shell structures work at five width ranges;
  themes and material fallbacks are complete; no behavior regression.
- **Testing:** syntax, full suite, shell/browser smoke, theme contrast, zoom,
  reduced motion/transparency, forced colors, no page overflow.
- **Accessibility:** landmarks, heading order, skip target, DOM/visual order,
  focus not obscured by sticky chrome.
- **Rollback:** revert shell/tokens/cache bump as one commit; v1.9 document flow
  remains intact.

### Slice 20C — Import State and Workspace Navigation

Status: `Planned`

- **Objective:** make import calm and compact, then introduce desktop section
  rail and the accessible tablet/mobile section sheet.
- **Expected files:** `index.html`, `styles/main.css`, `src/main.js`,
  `src/ui/renderSectionNav.js`, a narrowly scoped navigation helper if proven
  necessary, tests/harness, and service-worker cache metadata.
- **Dependencies:** 20B shell.
- **Boundaries:** existing file, paste, drag/drop, example, clear, and section
  target behavior is reused.
- **Non-goals:** new import types, recent files, persistence, custom gesture
  drawer, parser changes.
- **Success:** import yields to the workspace after parsing; navigation remains
  complete, current, keyboard-operable, and recoverable at every width.
- **Testing:** all input routes, parse/error recovery, section selection,
  Escape/focus return, reload, narrow landscape, controlled-origin PWA update.
- **Accessibility:** persistent labels, linked error/help, modal semantics,
  focus trap/return, current-section state beyond color.
- **Rollback:** navigation and import presentation revert together without
  changing section IDs or state.

### Slice 20D — Report Content System

Status: `Planned`

- **Objective:** convert report output from repeated cards to a continuous,
  opaque, accessible inspection document.
- **Expected files:** `styles/main.css`, `src/ui/renderSection.js`,
  `src/ui/renderCoreAnalyticsOverview.js`, table/chart presentation helpers,
  tests/harness, service-worker cache metadata.
- **Dependencies:** 20B and 20C.
- **Boundaries:** render the existing visible `SectionModel[]`; keep all row
  caps, dense controls, copy eligibility, exact-match IDs, and chart data.
- **Non-goals:** parser/model/chart-data redesign, virtualization, hidden data,
  statistic-dashboard tiles.
- **Success:** fields, tables, charts, explanations, CoreAnalytics, Stackshot,
  App Crash, Jetsam, and raw notes meet the design and density rules.
- **Testing:** all 11 examples, dense/collapsed/limited tables, copy parity,
  captions/names, exact-match rendering, page/table overflow, performance.
- **Accessibility:** semantic definitions/tables, text alternative for visible
  chart data when available, no color-only status, readable technical type.
- **Rollback:** report presentation reverts without changing serialized data or
  state contracts.

### Slice 20E — Search, Exact Match, and Report Actions

Status: `Planned`

- **Objective:** consolidate search, section movement, exact-match movement,
  copy/export, and contextual report actions into the approved toolbar
  hierarchy.
- **Expected files:** `index.html`, `styles/main.css`, `src/main.js`, existing
  search/UI/clipboard helpers only where presentation requires it, tests/harness,
  and service-worker cache metadata.
- **Dependencies:** 20C navigation and 20D content.
- **Boundaries:** preserve visible-only substring search, 180ms settlement,
  non-wrapping targets, exact-match IDs, copy/export eligibility and schemas.
- **Non-goals:** regex, fuzzy, semantic, raw, hidden, DOM-derived search; new
  export formats; cloud sharing.
- **Success:** controls are compact and discoverable, focus remains stable,
  no-result recovery is direct, and all status/scope wording stays consistent.
- **Testing:** visible/hidden/capped matches, every match kind, boundaries,
  repeated queries, clear/reset, copy, text/JSON export, keyboard and live status.
- **Accessibility:** persistent search label, distinct groups, concise live
  announcements, focus not moved during filtering, menu names/states/return.
- **Rollback:** toolbar/action presentation reverts while search/clipboard
  modules remain unchanged.

### Slice 20F — Comparison and Raw Local View

Status: `Planned`

- **Objective:** apply the workspace hierarchy to comparison setup/output and
  Raw Local View with unmistakable mode and privacy boundaries.
- **Expected files:** `index.html`, `styles/main.css`, `src/main.js`, narrowly
  scoped UI helpers, tests/harness, and service-worker cache metadata.
- **Dependencies:** 20D/20E content and tools.
- **Boundaries:** 2–3 same-parser sanitized comparison; setup-only local labels;
  Raw single-report mode; existing disabled exports and safe return.
- **Non-goals:** new comparison modes, raw comparison, alias export/search,
  original-file export, parser changes.
- **Success:** both modes are visually and semantically distinct, retain all
  privacy constraints, and have predictable entry/exit focus.
- **Testing:** compatible/incompatible setup, three-report limit, aliases,
  search/export isolation, Raw entry/return, clear/report transitions.
- **Accessibility:** mode announced once, persistent visible mode text, linked
  setup help, focus recovery after removal/exit, no hidden data in output.
- **Rollback:** comparison/Raw presentation reverts as one bounded slice.

### Slice 20G — Responsive and Accessibility Hardening

Status: `Planned`

- **Objective:** close cross-surface issues after integration without expanding
  features.
- **Expected files:** touched UI/CSS files, tests, browser harness, and design
  documentation only where verified corrections are required.
- **Dependencies:** 20B–20F integrated.
- **Boundaries:** fixes must reproduce a defect against the approved design or
  released behavior.
- **Non-goals:** feature additions, parser work, dependency-driven rewrite.
- **Success:** five width ranges, landscape, 200% zoom, text scaling, light/dark,
  keyboard, focus, live regions, reduced motion/transparency, increased contrast,
  forced colors, and available screen-reader paths pass.
- **Testing:** full a11y order from the design spec plus regression suite and
  browser workflows.
- **Accessibility:** this slice is a hard release gate, not optional polish.
- **Rollback:** each reproduced issue is a small independent fix; the full slice
  can be reverted without data changes.

### Slice 20H — Browser, Performance, PWA, and Release Documentation

Status: `Planned`

- **Objective:** verify the integrated redesign and reconcile documentation
  without claiming release before approval.
- **Expected files:** tests/harness, `service-worker.js` only for required cache
  consistency, README/ROADMAP/PLANS/phase summary/changelog only after verified
  implementation status.
- **Dependencies:** 20A–20G complete with evidence.
- **Boundaries:** no speculative optimization, feature expansion, tag, or
  publication.
- **Non-goals:** release creation before manual approval.
- **Success:** complete tests, syntax, browser workflows, large-report budgets,
  offline/update path, accessibility, responsive, privacy, diff hygiene, and
  documentation consistency pass.
- **Testing:** `npm.cmd test`, relevant `node --check`, established benchmark,
  browser harness, controlled-origin service-worker update/reload, manual QA in
  available engines/devices.
- **Accessibility:** final keyboard, tree, screen-reader-when-available, zoom,
  and preference-mode evidence is recorded honestly.
- **Rollback:** final docs/cache-readiness commit is independent of feature
  commits; no tag or Release exists to unwind before approval.

## Migration Strategy

1. Prototype and approve before production edits.
2. Introduce tokens and shell without changing render data.
3. Move one presentation boundary at a time: navigation, content, tools, modes.
4. Keep compatibility selectors only while a slice needs them; remove only
   selectors made obsolete by that slice.
5. Pair every precached asset change with cache-version/allowlist consistency.
6. Preserve stable section IDs, control semantics, state transitions, and
   output contracts throughout.

## Rollback Strategy

- One focused commit per slice; no overlapping parser/model changes.
- Each slice must be revertible without a data migration.
- The v1.9 static document flow remains the behavioral baseline.
- If accessibility, privacy, update, or performance gates fail, revert the
  smallest responsible slice rather than shipping a partial mixed system.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Glass reduces contrast or costs frames | Restrict to chrome; solid/high-contrast fallbacks; measure dense scrolling |
| Sticky controls obscure focus/content | Scroll padding, focus checks, static fallback for short viewports |
| Responsive reordering changes reading order | DOM order follows task order; CSS does not semantically reorder |
| New shell couples to parser/model | Consume existing state and `SectionModel[]`; no parser imports in presentational helpers |
| Search/control consolidation changes behavior | Contract tests before movement; reuse existing handlers and IDs where practical |
| Mobile actions become hidden | Search, Sections, mode, and Raw return remain visible; only secondary report actions enter the labeled menu |
| Comparison/Raw privacy becomes ambiguous | Persistent mode headers, explicit scope text, current export restrictions |
| Service-worker serves mixed UI versions | Cache bump with every precached change; controlled-origin update test |
| Native screen-reader lanes remain unavailable | Accessibility-tree and keyboard evidence plus explicit limitation; no certification claim |
| Scope expands into a framework rewrite | No dependency or architecture rewrite without separate approval |

## Browser and Performance Requirements

- Preserve all established large-report parse, search, comparison, export, and
  repeated-workflow budgets.
- The integrated UI must not regress representative render/workflow p95 by more
  than 10% from a recorded v1.9 baseline without explicit review.
- No page-level horizontal overflow at any required width; only labeled table
  regions may scroll horizontally.
- Test current available Chromium/Edge paths and record Safari, Mobile Safari,
  Firefox, physical-device, heap, or screen-reader lanes honestly when absent.
- Validate `backdrop-filter` support and solid fallback, dark/light, zoom,
  reduced motion, reduced transparency where exposed, increased contrast, and
  forced colors.
- Validate service-worker installation, waiting-update activation, offline app
  shell, examples, and no report-data caching.

## Documentation and Release Readiness

- Keep `v1.9.0` released and fully closed throughout implementation.
- Update design/plan status only from measured evidence.
- Do not mark any v2 slice complete until its commit and validation evidence
  exist.
- Do not mark v2 implementation complete, ready for release, or released during
  ordinary slice work.
- Tag and GitHub Release creation require separate manual approval after all
  gates and documentation reconciliation.

## Design Freeze

The approved architecture, navigation, control placement, regular-material
scope, light/dark tokens, geometry, typography, spacing, mobile behavior,
desktop density, motion, and accessibility fallbacks are defined in
`docs/design/V2_INTERFACE_DESIGN.md`. A prototype may prove a detail invalid;
it may not silently replace the decision. Record and approve the correction
before production implementation.

There are no unresolved major design decisions and no active implementation
slice.
