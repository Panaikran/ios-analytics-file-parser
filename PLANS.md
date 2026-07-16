# Project Planning Workflow

This document describes how development work is planned and landed in this
repository. It is a workflow guide, not a roadmap. Use `ROADMAP.md` for
milestone scope and release sequencing.

## Development Principles

- Keep the app static, local-first, and privacy-first.
- Prefer small slices over broad rewrites.
- Preserve parser behavior unless a verified bug requires a fix.
- Keep parser families independent.
- Keep sanitized output as the default and raw local view as opt-in.
- Do not add backend, analytics, cloud storage, report persistence, or release
  actions unless explicitly approved.

## Typical Lifecycle

```text
Planning
  -> Review
  -> Implementation by slice
  -> Validation
  -> Browser QA
  -> Documentation
  -> Commit
  -> Tag / Release
```

Tagging and publishing are separate release actions. They require an explicit
user request.

## Planning

Planning happens before implementation when work affects user-visible behavior,
release scope, parser routing, privacy, PWA behavior, or documentation.

Planning should answer:

- What milestone does this belong to?
- What is in scope?
- What is explicitly out of scope?
- What files are likely to change?
- What behavior must remain unchanged?
- What validation proves the slice is complete?
- What risks or blockers could stop the slice?

Planning should not quietly expand the roadmap. If a useful idea is outside the
active milestone, document it as future work instead of implementing it.

## Review

Before editing, review the narrowest useful set of files:

- `AGENTS.md` for local working rules.
- `ROADMAP.md`, `CHANGELOG.md`, and phase summaries for milestone context.
- `ARCHITECTURE.md` for the current implementation model.
- The specific source files owned by the slice.
- Existing tests that protect the touched behavior.

If documentation and implementation disagree, stop and report the mismatch
instead of guessing.

## Slice-Based Implementation

Each slice should be independently understandable and verifiable.

Good slices usually follow this shape:

1. Add or adjust tests when behavior changes.
2. Make the smallest production change that satisfies the slice.
3. Update service-worker cache metadata when precached assets change.
4. Run focused validation.
5. Report files changed, behavior changed, validation, and remaining risks.

Avoid:

- Broad refactors.
- Parser cleanups unrelated to the slice.
- New parser families outside roadmap scope.
- UI redesign during hardening slices.
- Documentation claims for work that has not landed.

## Testing Philosophy

The primary automated test entrypoint is:

```powershell
npm.cmd test
```

Use focused static checks when files change:

```powershell
node --check <modified-js-file>
node --check tests\parser.test.js
git diff --check
```

When `service-worker.js` changes, also run:

```powershell
node --check service-worker.js
```

Tests should protect real behavior:

- Parser classification and routing.
- `parseInput(text, options) -> SectionModel[]`.
- Sanitized default output.
- Raw local mode boundaries.
- Search and copy behavior.
- Large-report table caps and visibility.
- PWA cache allowlist and no-runtime-cache rules.

Do not weaken assertions just to make a failing test pass. If a test is wrong,
document why before changing it.

## Browser QA

Run browser QA when changes touch UI, CSS, rendering, search, copy, privacy
controls, service-worker behavior, or PWA/offline behavior.

At minimum, verify:

- App load.
- Example load where examples exist.
- File picker.
- Paste flow.
- Section navigation.
- Search.
- Copy.
- Privacy toggle and raw local view.
- Clear Report.
- Explanation sections where applicable.
- Dense tables and table controls.
- Mobile widths relevant to the slice.
- Service-worker registration and offline shell when affected.

Browser QA should report what was actually tested. If Safari or Mobile Safari
cannot be run in the current environment, say so.

## Documentation Updates

Documentation updates usually happen after implementation and QA, not before.

Use these boundaries:

- `README.md`: user-facing capabilities and usage.
- `ROADMAP.md`: planned and completed milestone scope.
- `CHANGELOG.md`: release notes for completed work only.
- `PHASE_*_SUMMARY.md`: milestone summaries and validation evidence.
- `PLANS.md`: development workflow.
- `ARCHITECTURE.md`: implementation architecture.

Do not claim support for unsupported parser families or future features.

## Release Readiness

A release-readiness pass should confirm:

- Automated validation passes.
- Browser QA passes or known limitations are documented.
- Privacy expectations are still true.
- Service-worker and PWA behavior are verified when relevant.
- Documentation matches implemented behavior.
- No release blockers remain.
- Working tree state is understood before any tag or release.

Useful commands:

```powershell
npm.cmd test
git diff --check
git status --short
```

A clean working tree is required before tagging or publishing.

## Commit And Release Workflow

Commits should be slice-sized and describe completed work.

Before committing:

- Review the diff.
- Confirm no unrelated files were edited.
- Confirm validation passed.
- Confirm docs were updated when the slice requires docs.

Do not create tags, GitHub releases, package version changes, or publishing
actions unless the user explicitly asks for that release action.

## Approved Milestone Plan: v1.8.0

Release title: `v1.8.0 — Precision Search & Deep Inspection`

Status: `Released and fully closed on 2026-07-14`

This section records the approved milestone direction and its completed
implementation boundaries. Slices 18A through 18D are complete and closed.
Release commit: `ad19143f76a9bac6d704c078846a518b13a44dcb`. Tag: `v1.8.0`.
GitHub Release: published, non-draft, non-prerelease.

### Objective

Improve investigation of long diagnostic reports by making exact matches
within visible sanitized content easier to identify and inspect, while
preserving existing substring search semantics, section navigation, privacy
boundaries, comparison behavior, export contracts, offline operation, and
local-only processing.

### Core Search Contract

Search metadata identifies exact matches only within visible sanitized fields,
rows, labels, chart labels, and rendered values while preserving the existing
case-insensitive substring search semantics.

The search workflow must not search or expose raw source data, parser-private
data, values excluded by sanitization, capped-out records that are not
rendered, hidden source-only fields, filenames, file paths, report identifiers,
or DOM text outside the supported rendered section model.

The current application behavior remains the baseline: case-insensitive
substring search, filtering of generated parsed sections, section-level
Previous and Next result navigation, single-report search, sanitized
comparison search, search-aware text and JSON export, local-only operation,
and the existing Raw Local View boundaries. v1.8.0 extends this workflow; it
does not replace it.

### Approved User Outcome

By the end of the milestone, users should be able to:

- identify exactly where visible sanitized matches occur;
- distinguish matching fields, table rows, labels, chart labels, and rendered values;
- move through matching rendered regions predictably;
- understand first, previous, next, final, and no-result boundaries;
- use the workflow with keyboard navigation;
- retain existing section-level navigation behavior;
- use the workflow in supported two- and three-report comparisons; and
- rely on current privacy, export, offline, and performance boundaries.

### Success Criteria

1. Existing case-insensitive substring semantics remain unchanged.
2. Match metadata is derived only from generated sanitized visible content.
3. Matching visible fields, rows, labels, chart labels, and supported rendered
   values can be identified without parsing raw source text.
4. Users can move through matching rendered regions with deterministic boundary
   behavior.
5. Existing section-level Previous and Next search-result navigation remains
   available.
6. Search behavior works across all 11 supported parser families and bundled
   examples.
7. Search behavior works in supported two- and three-report sanitized
   comparisons.
8. CoreAnalytics and other capped or grouped views describe their searched and
   visible boundaries accurately.
9. Match metadata never includes capped-out, hidden, raw, or parser-private data.
10. Raw Local View restrictions remain unchanged.
11. Copy behavior remains based on visible sanitized content.
12. Text export behavior remains unchanged.
13. JSON export schema, version, mode, and visibility behavior remain unchanged.
14. Search filtering continues to affect visible sanitized exports according to
    the existing contract.
15. Comparison labels remain UI-only and excluded from search metadata and
    exports.
16. Keyboard navigation, focus visibility, and live status behavior remain
    accessible.
17. Responsive checks pass at 320 px, 375 px, 390 px, 414 px, and 768 px.
18. Offline/PWA behavior remains functional.
19. No report content is persisted or transmitted.
20. Full tests, syntax checks, Node benchmarks, browser QA, privacy checks, and
    regression checks pass.
21. No unexpected external requests are introduced.
22. Existing large-report performance budgets remain green.

### Non-Goals

The milestone does not include regex, fuzzy, semantic, AI-assisted, or
natural-language search; raw-source search; full-text indexing; searching
capped-out or hidden source data; DOM scraping; a second filtering pipeline;
new parser families; MetricKit; new diagnostic formats; uncapped CoreAnalytics
rendering; table virtualization; worker-based parsing; framework migration;
parser output or `SectionModel[]` redesign; filename or path search; saved
searches; search history; report persistence; cloud processing; uploads;
telemetry; analytics; mixed-parser comparison; comparison of more than three
reports; comparison redesign; CSV, PDF, raw, or original-file export; JSON
schema redesign; AI diagnosis; symbolication; or root-cause diagnosis claims.

### Architectural Boundaries

Preserve the static browser ES-module architecture, no-build operation, no
framework, no backend, no uploads, no analytics, no report persistence,
parser output separated from application UI state, search operating on
generated sanitized section data, rendering driven by supported models rather
than arbitrary DOM scanning, existing comparison boundaries, existing text and
JSON export contracts, Raw Local View isolation, and offline/PWA support.

Implementation must reuse the current search and rendering architecture. A
parallel search state, duplicate filtering engine, or DOM-derived search model
is not approved.

### Privacy, Security, and Rendering Boundaries

Search match data must never contain or derive from raw report source,
filenames, file paths, device or user identifiers, UUIDs, excluded process or
bundle identifiers, addresses, source-only timestamps, hidden nested payloads,
parser-private fields, or records excluded by caps or visibility controls.

Search match text must be rendered safely. User-controlled report content must
not be inserted through unsafe `innerHTML`; safe text nodes, DOM ranges, or
another evidence-based non-interpreting rendering method must be used.

### Export Boundaries

Preserve visible sanitized text export, visible sanitized JSON export, the
existing schema version and JSON mode values, generic comparison identities,
search-filter visibility rules, Raw Local View export restrictions, and the
existing Blob/Object URL lifecycle. Match highlighting, focus state, internal
match IDs, offsets, and navigation metadata must not enter exported data. No
v1.8.0 export-schema change is approved.

### Comparison Boundaries

Preserve two or three reports, same-parser-type requirements, sanitized-only
comparison, insertion order, generic exported `Report 1`, `Report 2`, and
`Report 3` identities, and setup-only optional local labels. Local labels remain
excluded from search metadata, sections, navigation targets, copy, exports,
filenames, and schemas.

### Service-Worker Maintenance Guard

Any new or changed precached production asset must update the service-worker
allowlist and cache version in the same slice. This is a release-consistency
guard only. It does not authorize service-worker redesign, runtime report
caching, dynamic cache discovery, or persistent report storage. It applies
only when a slice adds, removes, renames, or changes a precached production
asset whose cache identity must be refreshed. The stale current cache-version
label may be recorded as a maintenance signal, but it is not a reproduced
production defect without evidence.

### Provisional Slices

All slices are `Complete`.

#### Slice 18A — Search Match Contract

Objective: define deterministic match metadata for visible sanitized fields,
table rows, labels, chart labels, and supported rendered values without changing
substring search semantics.

Likely areas: `src/search/filterSections.js`, a focused search-metadata module
only if justified, and `tests/parser.test.js`.

Acceptance criteria: existing filtering results are unchanged; metadata
identifies exact rendered regions deterministically; raw, hidden, capped-out,
and parser-private values are absent; Unicode, case-insensitive, empty-query,
immutability, comparison, and export contracts remain correct; focused unit
and integration tests pass.

Stop rules: stop if parser output, `SectionModel[]`, raw content, DOM scraping,
or a second filtering pipeline is required; stop before visible highlighting or
keyboard navigation assigned to 18B.

Dependencies: existing fixtures and bundled examples only; no new dependency
or diagnostic fixture.

#### Slice 18B — Primary Inspection Workflow

Objective: add safe visual identification and keyboard movement through
matching rendered content using the approved 18A metadata contract.

Likely areas: `src/main.js`, `src/ui/renderSection.js`, existing UI helpers,
`index.html`, `styles/main.css`, `tests/parser.test.js`, and
`service-worker.js` only when required by the asset-version guard.

Acceptance criteria: visible matches are identifiable; presentation cannot
interpret report content as HTML; keyboard movement, focus, boundaries,
filtered-section synchronization, comparison mode, no-results feedback, and
responsive containment are predictable; section navigation and all export and
schema behavior remain unchanged.

Stop rules: no raw-source navigation, regex/fuzzy/semantic mode, DOM-wide text
scanning, duplicate search state, broad renderer redesign, or unapproved
framework/dependency introduction; stop before 18C hardening or documentation.

Dependencies: frozen 18A metadata contract, existing native controls and live
status region, and the existing browser harness.

#### Slice 18C — Regression and QA Hardening

Objective: prove privacy, accessibility, responsive, comparison, export, Raw
Local View, offline, repeated-workflow, and performance stability.

Likely areas: `tests/parser.test.js`, browser harness, benchmark files only if
measurement coverage must be extended, and production code only for reproduced
defects.

Acceptance criteria: all 11 examples, representative fields/rows/labels/charts
and rendered values, keyboard/focus behavior, comparisons, CoreAnalytics caps,
Raw Local View, copy, text/JSON export, privacy, no persistence/transmission,
responsive widths, offline workflow, repeated cycles, console/page/request
health, and established Node/browser budgets pass.

Stop rules: production changes require a reproduced defect and failing
regression test; stop on raw/hidden-data leakage, material performance
regression, or a privacy/accessibility blocker requiring milestone expansion;
do not begin documentation or release publication.

Dependencies: completed and frozen 18A/18B, cached or available Chrome QA, and
honest reporting of unavailable Safari, Mobile Safari, physical-device, and
native-screen-reader lanes.

#### Slice 18D — Documentation and Release Readiness

Objective: reconcile documentation, complete final validation, and record the
v1.8.0 release state.

Likely areas: `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and
`PHASE_18_SUMMARY.md` after implementation and validation. The phase summary
records the completed and released milestone state.

Acceptance criteria: verified behavior, slice status, privacy, accessibility,
responsive, offline, performance evidence, and limitations are documented
accurately; implementation and release status are reconciled after validation.

Stop rules: no new production functionality, invented next-milestone scope, or
unsupported release claim; stop if final validation finds a production blocker.

Dependencies: completed validation evidence and the approved release record.

## Approved Milestone Plan: v1.9.0

Release title: `v1.9.0 — Visible Search Contract Integrity`

Status: `Released and Fully Closed on 2026-07-15`

Release status: `Released`

Slices 19A, 19B, and 19C are complete. No implementation slice remains active.
Release commit: `5ee166b7dba49dd7522a1d5c3c27bf60265a540a`. Annotated tag
object: `8eb5700ed8272768d2b239284feca933d5cb2a6f`. Tag: `v1.9.0`.
GitHub Release: published, non-draft, non-prerelease.

### Objective

Align table-row filtering with the visible sanitized table-column contract
already used by exact-match metadata. A search result must never be retained
solely by a row value that the renderer cannot display or highlight.

### Evidence And Scope Decision

Before Slice 19A, the shared filter checked every `Object.values(row)`, while
exact-match metadata checked declared visible `tableColumns`. A direct
shared-function probe reproduced a retained row and section with zero visible
exact-match regions when a row had a non-column property. The checked fixture
and production-example corpus had no such surplus row keys, so this was not
confirmed as a released parser-family regression. Slice 19A aligned the two
visible search projections without changing parser or output contracts.

### Boundaries

- Preserve existing case-insensitive substring semantics for visible sanitized values.
- Reuse the existing search path; do not add a second filter, DOM scanning, or
  independent search state.
- Do not change parser output, `SectionModel[]`, supported parser families,
  comparison identity or limits, Raw Local View restrictions, copy/text/JSON
  export schemas, PWA strategy, or local-only privacy model.
- Keep hidden, raw, capped-out, parser-private, local-label, filename, and path
  values outside search and exact-match metadata.

### Non-Goals

No new parser support, MetricKit, broader browser-support project, performance
optimization, virtualization, new export format, raw search, regex/fuzzy/
semantic search, UI redesign, dependency, backend, upload, analytics,
persistence, release tag, or publication.

### Slices

#### Slice 19A — Visible Row Search Contract

Status: `Complete`

Completion commit: `678ce2f3a513cee39b37ed6326381a9d13d5f912`

Objective: add a focused regression contract for a non-column row property and
make shared filtering count only the visible table-column values used by
exact-match metadata.

Likely areas: `src/search/filterSections.js` and `tests/parser.test.js`.

Acceptance criteria: a hidden row value cannot retain a row, section, or
navigation target; visible-column matches keep current behavior; exact-match
metadata stays visible-sanitized-only; focused tests pass.

Stop rules: stop if parser changes, `SectionModel[]` changes, DOM scanning, raw
data access, a second filtering path, or a search feature expansion is needed.

#### Slice 19B — Search Workflow Regression Hardening

Status: `Complete`

Completion commit: `f7c3223a2af6852931affaeb047d10f3a2e2d9a7`

Objective: verify the corrected contract through existing rendering and user
workflows, fixing production code only for a reproduced defect.

Likely areas: `tests/parser.test.js`, existing browser harness, and production
files only when evidence requires a narrow fix.

Acceptance criteria: table filtering, exact-match and section navigation,
comparison, Raw Local View, copy, text/JSON export, privacy, keyboard/focus,
live status, responsive containment, repeated search, and large-report budgets
remain correct.

Stop rules: no browser-engine expansion, accessibility redesign, parser work,
or performance rewrite. Unavailable environments are recorded as limitations.

Dependencies: frozen 19A filtering contract and existing v1.8.0 fixtures,
examples, browser harness, and performance budgets.

#### Slice 19C — Documentation And Release Readiness

Status: `Complete`

Objective: record verified behavior and complete final validation without
expanding production scope.

Likely areas: `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and
`PHASE_19_SUMMARY.md` after implementation and QA.

Acceptance criteria: only verified behavior and known limitations are
documented; validation and privacy evidence are complete; release status is
accurate; no unsupported claim, tag, or publication occurs without approval.

Dependencies: completed 19A/19B evidence.

Completion commit: `5ee166b7dba49dd7522a1d5c3c27bf60265a540a`.
Documentation reconciliation and final QA are recorded in
`PHASE_19_SUMMARY.md`.

### Completed Release-Readiness Validation

Final Slice 19C validation reran `npm.cmd test`, relevant JavaScript syntax
checks, `node tests\\largeReportPerformance.bench.js`, `git diff --check`, and
available direct Microsoft Edge browser QA. Existing coverage verifies all 11
examples, comparison, Raw Local View, search navigation, exact-match navigation,
copy, both exports, Clear Search, Clear Report, privacy mode, responsive widths,
and static service-worker readiness. No persistence, network transmission,
export leakage, or service-worker cache expansion was introduced.

### Risks and Testing Expectations

The reviewed risks were safe highlighting across nested rendered structures,
filtered-section and exact-match synchronization, focus stability during
rerender, Unicode and offset correctness, table and capped-row boundary
wording, large-report rendering overhead, comparison parity, export isolation,
Chromium-heavy evidence, unavailable Safari/Mobile Safari/physical-device and
native-screen-reader lanes, and service-worker consistency when assets change.

Mitigation remains tests before production changes, safe text rendering, immutable
metadata, deterministic navigation, existing fixtures, browser QA, responsive
checks, performance measurement, and no new dependency without evidence.
Validation must include `npm.cmd test`, relevant syntax checks,
`node tests\largeReportPerformance.bench.js`, browser QA, privacy and export
regression checks, responsive widths, offline checks, and the existing
large-report budgets. Safari, Firefox, Mobile Safari, physical devices, native
screen readers, heap snapshots, Playwright through WSL, and runtime offline
reload remain unavailable environmental lanes and are not claimed.

## Active Milestone: v2.0.0

Release title: `v2.0.0 — Apple-Inspired Inspector Workspace`

Status: `In progress`

Implementation status: `Slices 20A–20E complete and frozen; Slice 20F next but not started`

### Scope Decision

The milestone is justified as a major version because it changes information
architecture, navigation, visual/component systems, responsive strategy,
interaction hierarchy, accessibility architecture, and design-token
architecture. A visual-only refresh would remain a v1.x proposal and is not the
approved scope.

The selected direction is Approach B — Inspector workspace with a progressive
initial state, a two-region desktop inspection layout, intentional mobile
navigation/action prioritization, opaque report content, and restrained regular
material on eligible control chrome only.

### Source of Truth

- `docs/design/V2_INTERFACE_DESIGN.md` defines the normalized design system,
  attached-design audit, Liquid Glass research, information architecture,
  workflows, responsive behavior, motion, accessibility, prototype gates, and
  design freeze.
- `PHASE_20_PLAN.md` defines the milestone boundaries, slices, success criteria,
  testing, risks, migration, rollback, and release gates.

### Frozen Boundaries

All v1.9 parser, classification, `SectionModel[]`, sanitization, Raw Local View,
comparison, visible-only search, exact-match, copy, text/JSON export, schema,
capped-content, local-alias, service-worker/PWA, keyboard, responsive, and
performance behavior remains frozen. Slice 20B changed only the approved
presentation foundation and shell. No dependency, tag, or GitHub Release was
added.

### Slices

| Slice | Status | Scope |
| --- | --- | --- |
| 20A | Complete and frozen | Isolated sanitized prototype and visual design approval recorded for `b86a44cf2cbb0a3400a307ede92e7623c7417b48` |
| 20B | Complete and frozen | Semantic tokens, light/dark themes, material fallbacks, and workspace shell |
| 20C | Complete and frozen | Compact import state, desktop section rail, accessible section dialog, and safe workspace-entry/reset focus |
| 20D | Complete and frozen | Continuous opaque report content, semantic field relationships, accessible tables/charts, and CoreAnalytics presentation |
| 20E | Complete and frozen | Search, section/exact navigation, copy/export, and contextual report actions |
| 20F | Next — not started | Comparison and Raw Local View workspace treatment |
| 20G | Planned | Responsive and accessibility hardening across all required preference modes |
| 20H | Planned | Browser, performance, PWA update-path, documentation, and release-readiness validation |

The Slice 20A prototype at
`b86a44cf2cbb0a3400a307ede92e7623c7417b48` received visual approval for its
structure, visual system, interaction/accessibility behavior, and performance
review. Slice 20A is complete and frozen. Slices 20B–20E are complete and frozen
after full regression, accessibility, responsive, browser, performance, and PWA
validation. Slice 20C is recorded by the focused implementation commit
`feat(v2.0): implement import state and workspace navigation`; Slice 20D is
recorded by `feat(v2.0): implement report content system`; Slice 20E is recorded
by `feat(v2.0): redesign search and report actions`. Slice 20F is next but not
started.

