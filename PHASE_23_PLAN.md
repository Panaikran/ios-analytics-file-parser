# v2.2.0 — CoreAnalytics Investigation Depth

## 1. Phase identity and status

- Version: `v2.2.0`
- Theme: **CoreAnalytics Investigation Depth**
- Phase: **Phase 23 — Bounded CoreAnalytics Investigation**
- Status: Planning approved
- Implementation status: Not started
- Current slice: **23A - Evidence, Architecture, and Corpus Audit**
- 23B status: Ready for separate implementation approval; not started

The user approved the CoreAnalytics direction for planning. The previously
audited Evidence-Bounded Panic Guidance direction is the fallback only and was
not selected. Approval of this plan does not authorize production code, new
fixtures, new UI behavior, package changes, tags, or releases.

## 2. User approval record

The approved planning direction is to improve investigation of supported
CoreAnalytics reports using only information that the repository already
parses, sanitizes, allowlists, caps, renders, and searches. The approved
direction is not permission to reconstruct private schemas, expose raw source
records, or add a general diagnostic explorer.

The implementation gate is explicit:

- 23A is planning, architecture, privacy, UX-contract, and corpus-audit work
  only.
- Slice 23B requires separate implementation approval after this plan and the
  design document are reviewed.
- No production implementation has started in Phase 23.
- No Phase 23 release, tag, package change, or GitHub Release is authorized.

## 3. Objective

Make supported CoreAnalytics reports easier to investigate by adding a bounded
facet-to-row context workflow around existing sanitized and capped content.
Selecting a value that is already visible in the CoreAnalytics facet view may
focus the user on matching rendered rows through the existing global search
contract and provide explicit scope/context. The workflow must not add source
semantics that the parser cannot prove.

The objective is therefore an investigation aid, not a schema reconstruction,
raw record browser, usage profiler, charging feature, or diagnostic engine.
Every proposed value must already be a safe scalar in the visible bounded
model, or 23A must establish that carrying it through the existing allowlist
does not add meaning, privacy exposure, or an uncapped data path.

## 4. Existing frozen baseline

The following v2.1.0 behavior and contracts remain frozen:

- Static browser application using browser-native ES modules.
- Local-only, memory-only processing of uploaded and pasted reports.
- No backend, uploads, analytics, telemetry, persistence, cloud processing,
  authentication, or report storage.
- Existing classifier, parser-family boundaries, `parseInput` contract, and
  `SectionModel[]` contract.
- Independent parser families; no mega-parser and no new parser family in this
  milestone.
- Sanitized output by default and the opt-in Raw Local View restrictions.
- Frozen Battery and Charging behavior from v2.1.0. Phase 23 does not reopen
  charging research or alter the sanitized battery model.
- Existing CoreAnalytics `.ips.ca.synced` parsing, summary/configuration/
  record-overview/event-type/sample-record/parser-note sections, and the
  existing 100-row event-group and 100-row sample-record display caps.
- Case-insensitive substring search over visible parsed output, existing
  section navigation, exact-match navigation, and their current scope notes.
- Existing visible sanitized copy behavior and existing text and JSON export
  schemas and visibility rules.
- Sanitized-only same-parser comparison limits, comparison field allowlists,
  report-count limits, and missing-field behavior.
- Existing Inspector Workspace structure, focus management, keyboard behavior,
  touch-target rules, responsive layout, reduced-motion behavior, and semantic
  report document.
- Existing PWA explicit precache allowlist, cache-first shell strategy,
  no-runtime-report-cache rule, and cache-version policy.
- No v2.2.0 tag or release. The version remains unreleased.

Phase 22 is closed and frozen as research only. It retained no charging fields,
selected Approach C, and delivered no user-facing charging functionality.
Charging implementation remains deferred and is not part of Phase 23.

## 5. Existing CoreAnalytics architecture

The current supported path is:

```text
classifyDiagnostic(.ips.ca.synced)
  -> parseInput(text, options)
  -> CoreAnalytics SectionModel[]
  -> sanitized visible sections by default
  -> getCoreAnalyticsView(activeSections)
  -> getCoreAnalyticsFacetOptions(view)
  -> native facet controls
  -> existing search input event path
  -> filterSectionsByQuery(activeSections, searchQuery)
  -> visible sections, exact-match targets, copy, and visible exports
```

The parser currently provides these bounded visible sections:

| Section | Existing role | Boundary relevant to Phase 23 |
| --- | --- | --- |
| `coreanalytics-summary` | General report metadata and parse counts | Existing scalar fields only; no new semantic interpretation |
| `coreanalytics-configuration` | Sanitized configuration facts and redactions | Identifier values remain unavailable for investigation |
| `coreanalytics-record-overview` | Counts and observed category summaries | Display-only context; not a source-record index |
| `coreanalytics-event-types` | Grouped event rows | At most the existing 100 rendered rows |
| `coreanalytics-sample-records` | Sample event rows | At most the existing 100 rendered rows |
| `coreanalytics-parser-notes` | Invalid-line, cap, and privacy notes | Display-only boundary explanation |

The existing view model derives four facet dimensions from rendered rows in the
two capped tables:

- `message` - Top Messages
- `name` - Top Names
- `aggregationPeriod` - Aggregation Periods
- `sampling` - Sampling Values

Facet options are sanitized scalar values from the rendered rows. They exclude
hostile property names and non-scalar or unsafe values. The current facet
activation writes the option query to the existing search input and dispatches
the normal `input` event; it does not implement a second filtering or export
path. This existing behavior is a primary constraint and a useful base for the
selected architecture.

## 6. User-problem evidence from the repository and workflow

This is repository and workflow evidence, not telemetry or a claim about user
behavior outside the project:

- Phase 14 established that users need to inspect long CoreAnalytics output
  through bounded facets and the existing search workflow.
- The current UI already exposes facet values, but facet activation becomes an
  ordinary global search query. While search is active, the overview states
  that it is hidden; the user receives the normal filtered sections and search
  counts but no explicit facet-context status or bounded investigation reset
  explanation.
- Search metadata already states that CoreAnalytics search covers rendered
  capped rows only. Phase 23 can make that boundary easier to follow without
  searching additional records.
- Exact-match navigation already operates on visible search match regions.
  Reusing it avoids a second row-navigation model and avoids inventing row
  identity.
- Existing copy and export tests establish that filtered visible rows are the
  safe user-facing boundary. A new investigation state must remain outside
  those serializers.
- Existing CoreAnalytics fixtures and the 5,000-record synthetic workload
  provide a deterministic base for testing repeated values, caps, no matches,
  hostile objects, and reset behavior.
- The approved candidate audit found no evidence-supported need to add a new
  parser family, private field, or broader diagnostic format for this theme.

The specific additive problem for Phase 23 is therefore contextual clarity
around an already safe workflow, not access to more source data.

## 7. Interaction architecture comparison

Three bounded approaches were evaluated against the existing Inspector
Workspace and the frozen contracts.

| Approach | User value | Privacy and semantic risk | State and UI complexity | Search/exact-match behavior | Copy/export/comparison/Raw impact | Accessibility/responsive/testability | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A - Selected-row inspector | Lets a user select one already visible capped row and see its existing cells in context. | Low only if the row is never expanded; risk of implying that the row has a stable source identity or of duplicating visible content. | Medium to high: selected-row identity, focus restoration, hidden-row states, mobile details, and repeated-render cleanup. | Would need to explain whether row selection is independent of global search; this creates avoidable interaction ambiguity. | High risk of accidental hidden copy/export metadata or a Raw Local View bridge. Comparison must remain absent. | More controls and states to test; a custom row/details interaction could weaken keyboard and narrow-layout behavior. | Reject for this milestone. |
| B - Facet-to-row investigation | Makes an existing visible facet lead to matching rendered rows and explicit scope/context. | Lowest: only existing sanitized scalar facet values and existing filtered rows are used. | Low: one ephemeral facet context plus the existing search query; no row identity or second filter. | Reuses the exact current facet-to-search event path and existing exact-match/navigation behavior. | No serializer changes; context is UI-only; comparison and Raw Local View remain ineligible. | Native buttons, existing focus restoration, one live context/status region, and current responsive report flow are testable. | **Select.** |
| C - Hybrid facets plus selected-row context | Combines facet filtering, a context summary, and a selected-row detail surface. | Could remain safe but creates more opportunities to expose hidden values or imply row semantics. | Highest: facet state, row state, focus rules, empty states, and responsive layout all interact. | Risks compound-filter or subset-specific exact-match semantics unless carefully constrained. | Highest regression surface even if serializers remain unchanged. | Larger DOM and accessibility matrix; likely too close to a generic explorer. | Reject as over-scoped. |

Approach B is selected because it delivers bounded navigation and context with
the least new state and no new source interpretation. It is not selected merely
because the existing facet model is convenient; it is selected because the
existing data, search, and privacy boundaries already align.

## 8. Selected architecture

Use a **facet-to-row investigation projection** over the existing sanitized
CoreAnalytics view. The projection is UI state and derived visible context,
not a new parser model and not a source-record attachment.

The selected behavior is:

1. A sanitized single-report CoreAnalytics view exposes the existing four
   facet groups.
2. Activating a facet records its key and exact visible scalar query in an
   ephemeral UI state and continues to write that query through the existing
   search input event path.
3. The existing `filterSectionsByQuery` result remains the sole filtered report
   result. No second filter, facet index, raw record scan, or compound query is
   introduced.
4. A small context/status projection may identify the selected facet category,
   visible query, rendered-row scope, and bounded match count. It may offer a
   clear path that delegates to the existing Clear Search behavior.
5. Existing section cards, search navigation, exact-match navigation, copy, and
   export continue to consume the existing visible `SectionModel[]` result.
6. Comparison mode and Raw Local View do not expose the investigation context.

This architecture keeps the parser and `SectionModel[]` contracts unchanged.
If implementation later proves that the context cannot be expressed through
existing render inputs without a new module, that module must remain a pure
sanitized view-model helper and receive a separate service-worker review.

## 9. Investigation allowlist matrix

The matrix distinguishes values that may receive new investigation interaction
from values that are already visible only, rejected values, and values for
which evidence is insufficient. “Existing display only” does not authorize a
new filter, drill-down, semantic label, or source interpretation.

### 9.1 Value and privacy boundary

| ID | Classification | User-facing label | Internal sanitized property | Source section/cell | Type | Cap, order, and lifecycle | Omission and duplicate behavior | Privacy boundary | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I1 | Approved for investigation | Top Messages | `message` | `coreanalytics-event-types.message`, `coreanalytics-sample-records.message` | Sanitized string scalar | Existing rendered rows only; each source table remains capped at 100; existing facet ordering is retained | Blank/unsafe values remain omitted by existing view rules; repeated visible rows contribute to the existing facet count; no new deduplication | Existing scalar sanitizer and hostile-key guards apply; no raw source value | Already rendered, bounded, searchable, and used by the existing facet contract without claiming message semantics |
| I2 | Approved for investigation | Top Names | `name` | `coreanalytics-event-types.name`, `coreanalytics-sample-records.name` | Sanitized string scalar | Same existing 100-row table caps and facet ordering | Existing repeated-value counting only; no inferred event-family meaning | Sanitized visible scalar only; identifiers in text remain subject to existing redaction | Same as I1; the label describes the visible column, not what the name means |
| I3 | Approved for investigation | Aggregation Periods | `aggregationPeriod` | Event-type and sample-record table cells | Sanitized scalar, normally string | Existing rendered/capped row lifecycle and facet ordering | Existing visible-value counting; no conversion to a time duration or rate | No raw record or derived interval; only the displayed scalar survives | It is safe to filter by the displayed value without asserting what subsystem produced it |
| I4 | Approved for investigation | Sampling Values | `sampling` | Event-type and sample-record table cells | Sanitized scalar, normally string | Existing rendered/capped row lifecycle and facet ordering | Existing visible-value counting; no numeric interpretation | No conversion, unit, rate, or sampling methodology is added | It is safe as a visible category query, not as a quality or probability claim |
| I5 | Existing display only | Event Groups / Count | `table[].count` | `coreanalytics-event-types` | Sanitized scalar display value | Existing grouped rows, at most 100 shown; parser-defined count | Existing grouped-row behavior; no new aggregation | Visible count only; no hidden group members | Useful context but not approved as a new metric or drill-down key |
| I6 | Existing display only | Row | `table[].rowNumber` | `coreanalytics-sample-records` | Sanitized scalar display value | Existing visible row order and 100-row cap | Row position is not a source identity and is not persisted | No source line, UUID, incident, or filename | Display helps orientation but must not become a stable identifier |
| I7 | Existing display only | Days Aggregated | `table[].numDaysAggregated` | `coreanalytics-sample-records` | Sanitized scalar display value | Existing rendered rows only | No inferred duration conversion or cumulative calculation | No source record or aggregate recomputation | Existing display is preserved; its meaning is not expanded in this milestone |
| I8 | Existing display only | Existing summary fields | `fields[].label/value` in summary | `coreanalytics-summary` | Sanitized scalar fields | One existing summary section; no extra records | Existing parser omission and field order | Existing sanitizer; no new metadata | These facts remain searchable/displayed through the generic path, not facet-investigated |
| I9 | Existing display only | Existing configuration fields | `fields[].label/value` excluding identifiers | `coreanalytics-configuration` | Sanitized scalar fields | One existing configuration section | Existing parser omission/order; no new grouping | Redacted identifiers stay redacted and are not interaction values | Configuration context is not proven to be an investigation dimension |
| I10 | Existing display only | Record overview | Existing overview fields | `coreanalytics-record-overview` | Sanitized scalar fields | One existing overview section | Existing parser-defined counts and observed categories | No uncapped record access | Counts provide scope only; they must not become usage, reliability, or diagnostic claims |
| I11 | Existing display only | Parser Notes | `fields[].label/value` or warning text | `coreanalytics-parser-notes` | Sanitized text | One existing notes section | Existing note order and omission | No raw invalid lines or source excerpts | Notes explain boundaries and remain visible; they are not source data to explore |
| I12 | Rejected | Identifier values | `incident_id`, `configUuid`, `sessionId`, and equivalent sensitive keys | Summary/configuration/source records | Sensitive identifier or redaction placeholder | Not an investigation source; no lifecycle is exposed | Never deduplicated into user-facing values | Reject identifiers, aliases, paths, UUIDs, incident IDs, and any source identity even if a redacted placeholder is visible | Would expose or encourage identity-oriented exploration and has no user-safe value for this milestone |
| I13 | Rejected | Raw or unknown record content | `raw`, unknown keys, nested values, source objects | Parser-private/source record | Object, array, arbitrary string, or unknown scalar | Uncapped/undocumented and outside the visible model | No safe duplicate or conflict rule | Reject raw records, nested payloads, accessors, inherited properties, private values, and hidden rows | A generic explorer would weaken the sanitized-by-default boundary |
| I14 | Insufficient evidence | Event-family interpretation | Derived label not present in the model | Any `message`/`name` value | Unproven semantic category | Lifecycle and origin are unknown | No precedence or conflict rule | Do not turn names into subsystem, feature, fault, or usage labels | Presence of a name does not prove what produced it |
| I15 | Insufficient evidence | Hidden or capped-out rows | No existing sanitized property | Parser source beyond table cap | Unknown | Not present in the approved model; lifecycle is unknown | Duplicate/conflict behavior unavailable | Never retrieve or summarize hidden source rows | The existing cap is a privacy and performance boundary, not a prompt to bypass it |
| I16 | Insufficient evidence | Stable row identity or fingerprint | No approved property | Existing row position or source record | Would require derived identity | No stable lifecycle across report replacement or sorting | Hashing/identity precedence is undefined | Do not hash, retain, or expose UUIDs, filenames, timestamps, or source positions as identity | Approach B avoids row selection and therefore does not need an identity model |

### 9.2 Interaction and contract matrix

The following contract applies to each ID and makes explicit which existing
paths may be reused. `A` means the new investigation interaction is approved;
`D` means existing display only; `R` means rejected; `I` means insufficient.

| ID | Proposed interaction | Search behavior | Exact-match behavior | Copy behavior | Text export | JSON export | Comparison | Raw Local View | Verdict | Required tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I1 | Native facet button may select the visible message query and show bounded context | Reuse global case-insensitive substring search with the exact facet query; rendered rows only | Existing global exact-match targets within the filtered visible report | Existing visible section copy only; no facet metadata | Existing filtered visible sections only; schema unchanged | Existing filtered visible sections only; schema/version unchanged | No facet controls or investigation state in comparison | No facet controls or investigation state in Raw Local View | A | Facet activation, duplicate values, no match, clear, focus, copy/export/privacy |
| I2 | Same as I1 for Top Names | Same existing search path | Same existing global visible target set | Same existing visible copy | Same existing text export | Same existing JSON export | None | None | A | Category separation, identifier redaction, search/exact/copy/export |
| I3 | Same as I1 for displayed aggregation-period values | Query is the displayed scalar; no duration conversion | Existing visible exact matches only | No new row serializer | No schema change | No schema change | None | None | A | Scalar variation, malformed values, no unit inference, search/exact |
| I4 | Same as I1 for displayed sampling values | Query is the displayed scalar; no probability or quality inference | Existing visible exact matches only | No new row serializer | No schema change | No schema change | None | None | A | Scalar variation, repeated values, search/exact |
| I5-I11 | No new interaction; remain visible result content | Generic existing search may match the rendered cells | Generic existing exact-match behavior remains | Existing visible copy only | Existing visible text export only | Existing visible JSON export only | Existing comparison rules unchanged | Existing Raw Local View rules unchanged | D | Regression parity, omission, cap, search/copy/export |
| I12 | None; do not render as an investigation option | Redacted/omitted under existing rules; no identifier query surface | No identifier target | Never copied as new metadata | Never added | Never added | Never added | No bridge | R | Identifier sentinel and redaction tests |
| I13 | None; never expose or traverse | Never search raw/unknown data | No raw target | No raw copy | No raw export | No raw export | No raw comparison | Raw view remains independently restricted | R | Raw-boundary, hostile-object, accessor, inherited-key tests |
| I14-I16 | None until separately evidenced; no derived labels or identities | No new query vocabulary | No derived target model | No metadata | No schema change | No schema change | No comparison | No Raw Local View bridge | I | Documentation gate and negative tests against inferred labels/identity |

The approved interaction values are therefore I1 through I4 only. The
existing display values remain available through their frozen generic paths,
but do not become a second investigation vocabulary.

## 10. State model

The minimum proposed state is ephemeral and derived from the current report:

```text
CoreAnalyticsInvestigationState
  mode: idle | active | empty
  selectedFacetKey: message | name | aggregationPeriod | sampling | null
  selectedFacetQuery: string
```

`searchQuery` remains the sole source of truth for filtering. The selected facet
fields only explain how the current query was initiated and are cleared when
the query no longer equals the selected facet query. No report identity,
source record, row object, hash, UUID, filename, timestamp, persistence key,
localStorage value, IndexedDB value, cookie, URL parameter, or telemetry event
is stored.

| Transition | State result and required behavior |
| --- | --- |
| Initial empty app | `idle`; no context controls or investigation status |
| Sanitized CoreAnalytics report loaded | `idle`; facets derive from current capped view |
| Approved facet activated | `active`; record only facet key/query, write the exact query to the existing search input, dispatch the existing input path, and derive context from filtered visible sections |
| Direct text search changes the query | Keep `active` only when the query is exactly the selected facet query; otherwise clear facet context while preserving ordinary search |
| Clear Search | `idle`; clear query, results navigation, exact-match state, context, and return focus through the existing path |
| Exact-match Previous/Next | Preserve context; navigate the existing global visible match target list, not a new facet-only list |
| Facet value has no visible matches after filtering | `empty`; show a bounded no-match status and the existing Clear Search path; never fetch hidden rows |
| Report replacement or reparse | Reset to `idle` before the new report is rendered; no stale selection crosses reports |
| Clear Report | Reset to `idle` with the existing report and search reset/focus behavior |
| Raw Local View or comparison | Set context to `idle`/unavailable; hide or disable investigation controls and preserve existing mode restrictions |
| Empty, malformed, or non-CoreAnalytics report | `idle`; no facet state; existing parser/error/empty behavior remains |
| Narrow mobile or zoomed layout | No state change; context, reset, and search controls remain keyboard and touch reachable |

No row is selected. If a future implementation needs a transient result-row
reference for focus only, it may use the current bounded positional index in
the visible render pass and must discard it on every rerender/report change.
It must not invent a hash or source identity.

## 11. Data flow and provisional interfaces

The approved data flow is:

```text
parsed report text
  -> existing classifier and parser
  -> existing sanitized SectionModel[]
  -> existing capped CoreAnalytics tables
  -> approved facet projection (I1-I4)
  -> ephemeral selected-facet state
  -> existing search input event path
  -> existing visible filtered SectionModel[]
  -> existing CoreAnalytics renderer, search navigation, copy, and export
```

No raw source record crosses the parser-to-view boundary. The following names
are planning-level interfaces, not implementation instructions:

```text
getCoreAnalyticsInvestigation(view, searchResult, state)
  -> { mode, selectedFacet, renderedScope, matchingTableCounts, resetLabel }

selectCoreAnalyticsFacet({ key, query })
  -> delegates to the existing search input event path

clearCoreAnalyticsInvestigation()
  -> delegates to the existing Clear Search behavior
```

The projection may receive only the existing CoreAnalytics view and existing
filtered visible sections. It must not receive parser source text, raw records,
unfiltered private objects, comparison entries, or export serializers.

## 12. Search contract

- Preserve existing case-insensitive substring search semantics.
- A facet activation writes the displayed scalar query to the existing search
  input and uses the existing debounced input path. It does not add a hidden
  query token or a second filter.
- The existing `filterSectionsByQuery` result remains authoritative for visible
  rows, section visibility, search counts, and search navigation.
- Exact-match navigation continues to use the existing visible match regions
  over the global filtered report. It does not become facet-local navigation.
- Search scope remains rendered parsed output; for CoreAnalytics it continues
  to say that search covers rendered capped rows only.
- Directly editing the query clears the facet context when the query differs,
  but does not clear or reinterpret the ordinary search result.
- Clear Search clears the facet context, query, section navigation, and
  exact-match state through the existing reset path and returns focus as today.
- There is no compound search, multi-select facet filter, fuzzy search,
  semantic search, hidden-row search, raw-source search, or saved search.
- No search state is persisted or included in copy, text export, JSON export,
  comparison, or Raw Local View.

## 13. Copy, export, comparison, and Raw Local View boundaries

The investigation context is UI-only:

- Copy uses the existing visible `SectionModel` serializer. A selected facet,
  status sentence, option count, internal key, or context object is not copied
  as new metadata.
- Text export remains the existing sanitized visible export. No facet,
  investigation, source-family, row-index, or context field is added.
- JSON export keeps its current schema, version, mode, scalar rules, and
  filtered-visible-section behavior. No investigation object is serialized.
- CoreAnalytics comparison remains unsupported for investigation context.
  Existing sanitized-only comparison continues unchanged.
- Raw Local View remains opt-in and independent. It does not gain facets,
  investigation context, raw-row selection, or a bridge from sanitized state.
- Mode transitions clear ephemeral investigation state so no sanitized context
  leaks into comparison or Raw Local View.

## 14. Privacy boundary

Phase 23 may use only existing sanitized scalar values from the current capped
CoreAnalytics tables. It must never expose, retain, search, copy, export,
compare, persist, or send:

- raw records, raw JSON, complete source lines, nested payloads, arbitrary
  keys, unknown fields, inherited properties, or accessor-backed values;
- incident IDs, UUIDs, serial numbers, device IDs, ECIDs, account values,
  carrier values, aliases, bundle IDs, paths, filenames, network identities,
  hardware identities, or unique source timestamps;
- parser-private source objects, capped-out records, source line offsets,
  hashes, fingerprints, or invented stable row identities;
- charging fields, thermal fields, power-mode meanings, diagnostic labels,
  fault concepts, grades, recommendations, or inferred event-family names;
- private local samples, public report copies, screenshots, raw excerpts, or
  fixtures derived line by line from a real report.

23B must preserve own-property and accessor safety at every boundary. It must
add privacy sentinels for identifiers, raw values, unknown keys, nested values,
inherited properties, throwing getters, and capped-out source content.

## 15. Accessibility and responsive contract

The selected interaction must preserve the existing Inspector Workspace:

- Use native buttons for facet and reset actions; do not introduce a custom
  ARIA grid or a hover-only explorer.
- Preserve visible keyboard focus and the current facet focus restoration after
  rerender.
- Expose facet category, visible value, occurrence count, and selected state
  through the existing accessible name and `aria-pressed` pattern.
- Provide a concise `aria-live="polite"` status for investigation context and
  no-match state without repeating the entire table.
- Keep Clear Search and any context reset reachable in the normal tab order.
- Do not move focus unexpectedly after ordinary text search; restore focus
  predictably after a facet activation or reset.
- Preserve headings, table headers, definition lists, list semantics, and
  existing section navigation.
- Meet the existing 44px minimum touch target and visible focus requirements.
- Support keyboard-only operation, forced colors, large text/zoom, reduced
  motion, and touch input without relying on color, hover, or precision.
- At narrow widths, allow long facet values and status text to wrap; do not add
  page-level horizontal overflow, fixed-width inspector panels, or a modal.
- Preserve desktop, tablet, 320px-class mobile, and intermediate responsive
  behavior.

## 16. Performance and caps

The existing CoreAnalytics caps are hard limits, not defaults to increase:

- no more than 100 rendered event-group rows;
- no more than 100 rendered sample-record rows;
- no traversal of capped-out records for facets, context, search, or display;
- no full-text index, row cache, persistence layer, or worker is introduced.

The proposed projection is bounded by at most 200 visible table rows and four
facet keys. Its expected work is a small linear scan over the existing view and
filtered visible rows; it does not parse or visit source records again. The
additional DOM should be limited to the selected-facet context, bounded counts,
and a reset action. No virtualization or unbounded result explorer is needed.

23B/23D must preserve existing CoreAnalytics parser, search, render, clear,
comparison, copy, export, and large-workload budgets. Recompute-on-render is
acceptable only when it remains bounded and stale state is discarded on report
replacement, Clear Report, mode changes, and no-report transitions. If a
performance fix requires a new index, cap increase, worker, persistence, or
parser redesign, stop and request a new milestone decision.

## 17. Corpus and fixture plan

No fixture or test file changes are authorized in 23A. Later implementation
work may use:

- existing fictional small, medium, and large CoreAnalytics fixtures;
- existing deterministic large workloads with many event records and grouped
  values;
- independently hand-authored fictional cases for one and multiple event
  families, repeated facet values, duplicates, empty values, missing columns,
  malformed lines, cap boundaries, and no-match searches;
- workflow cases for facet activation, direct query replacement, Clear Search,
  exact-match navigation, selected facet hidden by a query, report replacement,
  Clear Report, privacy-mode transitions, comparison entry/exit, and Raw Local
  View entry/exit;
- hostile cases with inherited keys, `__proto__`/`constructor`/`prototype`,
  throwing accessors, cyclic values, nested unknown objects, and identifier
  sentinels;
- synthetic large workloads that prove no uncapped scan or progressively
  growing context DOM occurs.

Fixtures must be fictional and independently authored. No private or public
diagnostic report may be copied into the repository or sanitized line by line.

## 18. Slice structure

The conservative six-slice structure is:

### 23A - Evidence, Architecture, and Corpus Audit

- Objective: freeze the evidence boundary, interaction architecture, approved
  visible-value allowlist, state transitions, privacy rules, caps, and corpus
  plan.
- Likely files: `PHASE_23_PLAN.md`,
  `docs/design/V2_2_COREANALYTICS_INVESTIGATION_DESIGN.md`, `ROADMAP.md`,
  `PLANS.md`; read-only review of existing source and tests.
- Tests/evidence: existing parser/view/search/privacy/accessibility/PWA tests,
  fixture inventory, test inventory, and documentation diff review. No test
  changes.
- Dependencies: frozen v2.1.0 behavior, closed Phase 22, approved CoreAnalytics
  candidate direction, and existing capped model.
- Exit criteria: one architecture selected; I1-I4 and all non-approved values
  classified; state/search/copy/export/comparison/raw/a11y/responsive/performance
  contracts written; corpus and stop conditions defined.
- Stop conditions: any need for raw/arbitrary/uncapped/undocumented data, a new
  parser family, identifier exposure, a schema change, or a generic explorer.

### 23B - CoreAnalytics Investigation Boundary

- Objective: implement only the approved pure investigation projection and
  state boundary over existing sanitized capped data.
- Likely files: existing CoreAnalytics view/render/main paths and focused test
  assertions; avoid new modules unless a pure boundary is proven necessary.
- Tests: focused state transitions, allowlist, own-property/accessor safety,
  cap preservation, mode reset, and no-parallel-filter tests first.
- Dependencies: completed 23A review and separate 23B implementation approval.
- Exit criteria: no raw record enters the projection; only I1-I4 can initiate
  context; existing search remains authoritative; comparison/export/Raw paths
  are unchanged.
- Stop conditions: inferred semantics, hidden-row access, second filtering
  pipeline, row identity, persistence, export/comparison changes, or any
  unresolved privacy/accessibility contract.

### 23C - Sanitized Investigation Model

- Objective: make the approved bounded context model explicit and sanitized
  without changing `SectionModel[]` or report export schemas.
- Likely files: existing CoreAnalytics view-model path and focused tests; a new
  pure browser-native helper only if necessary and separately precached.
- Tests: scalar-only output, reference isolation, omission, hostile objects,
  identifier sentinels, and JSON/stringification exclusion of context state.
- Dependencies: 23B boundary and approved state transitions.
- Exit criteria: model contains only ephemeral selected facet and derived visible
  scope; no source objects, raw fields, IDs, persistence, or mode leakage.
- Stop conditions: attachment of raw data, new parser metadata, `SectionModel`
  redesign, schema change, or comparison bridge.

### 23D - Investigation Presentation and Workflow Integration

- Objective: add the smallest accessible context/reset presentation within the
  existing CoreAnalytics and search workflow.
- Likely files: existing CoreAnalytics renderer, shared report rendering/main
  event path, and existing report-content styles only if needed.
- Tests: keyboard and focus behavior, `aria-pressed`, live status, no-match,
  clear/reset, exact-match, search navigation, copy/export, responsive widths,
  reduced motion, and Raw/comparison restrictions.
- Dependencies: 23C sanitized model and existing Inspector Workspace contract.
- Exit criteria: facet-to-row context is understandable, bounded, responsive,
  searchable through existing semantics, and absent from serialized outputs.
- Stop conditions: UI redesign, modal/explorer surface, custom grid, hidden
  row rendering, semantic diagnosis, or page-level overflow.

### 23E - Corpus and Regression Hardening

- Objective: add independently fictional cases for all approved positive and
  negative workflow boundaries.
- Likely files: focused CoreAnalytics fixture/test files and existing browser
  harness only where coverage must be extended.
- Tests: repeated values, caps, malformed/empty input, no matches, search
  replacement, mode transitions, hostile objects, privacy sentinels, and large
  workload/repeated-cycle budgets.
- Dependencies: stable 23B-23D behavior and authored expected outcomes.
- Exit criteria: corpus proves deterministic bounded behavior without private
  anchors or line-by-line source derivation.
- Stop conditions: missing negative cases, fixture overfitting, new identifiers,
  uncapped traversal, or a regression in frozen parser-family behavior.

### 23F - Final QA and Release Readiness

- Objective: validate the full preserved application contract and prepare
  documentation for a separately authorized release review.
- Likely files: approved implementation/tests, service worker only if a new
  module was actually added, and final milestone documentation.
- Tests: `npm.cmd test`, syntax checks, browser harness, search/exact-match,
  copy, text/JSON export, comparison isolation, Raw Local View, accessibility,
  responsive, performance, PWA precache/cache identity, privacy, and clean
  report replacement workflows.
- Dependencies: 23B-23E complete; no unresolved privacy, UX, browser, or
  performance blocker.
- Exit criteria: all frozen contracts remain intact and release-readiness is
  documented without claiming publication.
- Stop conditions: any contract regression, unavailable required QA lane,
  documentation mismatch, tag/release request, or scope expansion.

## 19. Non-goals

Phase 23 explicitly does not include:

- charging implementation, charging-state interpretation, or reopening the
  Phase 22 evidence decision;
- raw source presentation, arbitrary nested-record exploration, source-record
  dumps, uncapped CoreAnalytics rendering, or hidden-row retrieval;
- new parser families, App Usage Metrics, Wi-Fi Connectivity, Diagnostic
  Request, broad Accessory/Firmware expansion, MetricKit, or sysdiagnose;
- battery-health grades, charging-quality grades, good/poor/healthy/weak/
  replace-soon judgments, battery diagnosis, charging-fault diagnosis,
  thermal conclusions, overheating diagnosis, or service recommendations;
- remaining battery-life or charging-time estimates, degradation predictions,
  repair guidance, or unsupported root-cause claims;
- AI-generated interpretation, confidence scoring, opaque classifications,
  symbolication, or panic guidance;
- comparison expansion, CoreAnalytics comparison, mixed-parser comparison, or
  comparison report-limit changes;
- text/JSON export schema changes, new export formats, sharing services,
  uploads, backend, authentication, analytics, telemetry, persistence, or
  cloud processing;
- Raw Local View expansion, raw/search bridges, report storage, URL state,
  localStorage, IndexedDB, cookies, or saved investigations;
- framework migration, package metadata changes, dependency expansion, worker
  parsing, virtualization, or PWA strategy changes;
- UI redesign, new navigation shell, modal explorer, custom data grid, or
  general-purpose diagnostic dashboard;
- tag creation, GitHub Release publication, or release/version metadata
  changes.

## 20. Risks and blockers

- **Existing-feature duplication:** Phase 14 already provides facet-to-search
  activation. 23B must add only clearly bounded context and reset clarity; it
  must not reimplement or fork search.
- **Field-name ambiguity:** `message`, `name`, `aggregationPeriod`, and
  `sampling` are visible labels, not proof of subsystem semantics.
- **Privacy leakage through visible strings:** message/name values can contain
  sensitive text; existing sanitization and identifier sentinels must remain
  mandatory.
- **Cap misunderstanding:** users may mistake rendered counts for complete
  source coverage. Scope notes and status must preserve the cap explanation.
- **Contradictory or repeated rows:** facet counts are existing rendered-row
  counts, not source-level deduplication or event-frequency claims.
- **Search and facet ambiguity:** a selected facet must never silently become a
  compound filter or redefine exact-match navigation.
- **State leakage:** context must reset on report replacement, Clear Report,
  comparison, Raw Local View, privacy changes, malformed input, and empty state.
- **Accessibility and responsive regression:** an added status/reset surface
  must not steal focus, remove keyboard access, or create narrow-screen
  overflow.
- **Hostile objects:** any future allowlist adjustment must reject inherited
  properties, prototype keys, cycles, and throwing accessors.
- **Performance drift:** no additional source scan, index, cap increase, or
  unbounded facet DOM is allowed.
- **Browser automation availability:** the repository records that a real
  browser/Playwright lane may be unavailable. The synthetic harness and static
  tests must remain honest, and missing browser coverage must be reported rather
  than implied as completed.
- **Scope pressure:** requests for row identity, raw detail, semantic event
  families, comparison, export, or diagnosis are milestone blockers, not small
  follow-up enhancements.

## 21. 23B readiness decision

**Ready for separate 23B implementation approval**

23A has selected Approach B and defined the approved I1-I4 allowlist, existing
display-only/rejected/insufficient values, state transitions, data flow,
privacy boundary, caps, search/exact-match behavior, copy/export/comparison/Raw
restrictions, accessibility, responsive behavior, performance boundary, corpus
cases, likely files, and stop conditions. This readiness statement is not
approval to begin 23B. A separate implementation approval is still required.

If implementation reveals that the selected workflow needs raw, arbitrary,
uncapped, undocumented, identifier-bearing, persistent, comparison, export,
or new-parser data, 23B must stop and return to planning.

## 22. Release boundary and decision record

- Phase 23 planning is approved; production implementation is not started.
- Current slice is 23A; 23B has not started.
- v2.2.0 remains unreleased and available for this approved implementation
  milestone only after later slices pass their gates.
- No tag, GitHub Release, package metadata change, dependency change, or
  publication is authorized by this plan.
- Phase 22 remains closed and frozen as charging research with Approach C;
  charging implementation is deferred.
- The selected Phase 23 architecture is Approach B - facet-to-row
  investigation over existing sanitized and capped CoreAnalytics output.
- The fallback Panic Guidance direction is not selected for this milestone.
- The exact implementation boundary is documented in
  [V2_2_COREANALYTICS_INVESTIGATION_DESIGN.md](docs/design/V2_2_COREANALYTICS_INVESTIGATION_DESIGN.md).
- The earlier candidate audit remains the evidence record for why this
  CoreAnalytics direction was selected over the deferred and rejected
  candidates: [V2_2_NEXT_MILESTONE_CANDIDATE_AUDIT.md](docs/research/V2_2_NEXT_MILESTONE_CANDIDATE_AUDIT.md).
