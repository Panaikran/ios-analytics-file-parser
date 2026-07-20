# v2.2.0 CoreAnalytics Investigation Design

## 1. Status and scope

- Phase: 23A - Evidence, Architecture, and Corpus Audit
- Theme: CoreAnalytics Investigation Depth
- Phase title: Bounded CoreAnalytics Investigation
- Status: Planning approved
- Implementation status: Not started
- 23B status: Ready for separate implementation approval

This document defines a bounded UX and architecture contract for investigating
already parsed, sanitized, and capped CoreAnalytics content. It is a planning
artifact. It does not add production code, a parser field, a fixture, a report
format, a new parser family, or a UI implementation.

The design does not reopen Phase 22 charging research. Phase 22 is closed and
frozen with no retained charging fields and Approach C research-only deferral.

## 2. Existing workflow

The current workflow is:

```text
local file or pasted text
  -> classifyDiagnostic
  -> parseInput
  -> CoreAnalytics SectionModel[]
  -> sanitized visible report (default)
  -> capped event-type and sample-record tables
  -> CoreAnalytics view model and four facet groups
  -> facet query written to the existing search input
  -> existing visible substring search and exact-match navigation
  -> report sections, visible copy, and visible text/JSON export
```

The parser renders a maximum of 100 event-group rows and 100 sample-record
rows. `getCoreAnalyticsView` and `getCoreAnalyticsFacetOptions` consume those
rendered sections, not source text or uncapped records. The existing facet
activation path writes `option.query` to the search input and dispatches the
normal `input` event. The design must preserve this fact.

## 3. User problem

The repository already supports safe facet activation, but the resulting
interaction is visually equivalent to ordinary global search. The overview
explains that it is hidden during search, and search metadata explains the
rendered/capped scope, but there is no dedicated bounded context describing
which visible facet initiated the current filtered view.

The user problem for this milestone is therefore:

> Help a user understand and return from a facet-led inspection of existing
> CoreAnalytics rows without exposing more data or changing search meaning.

This is a workflow clarification problem. It is not evidence that message,
name, aggregation-period, or sampling values have deeper subsystem meanings.

## 4. Interaction alternatives

### A - Selected-row inspector

Select one already visible row and show its existing cells in a detail surface.
This avoids raw data only if the row is copied by value from the visible capped
model. It still introduces row identity, selected-row persistence across
rerenders, hidden-row/reset behavior, mobile details, and a larger focus model.
It also risks suggesting that row position or a group row is a stable source
entity.

### B - Facet-to-row investigation

Select one existing facet value, reuse the exact global search query, and show a
small context/status projection over the filtered visible rows. There is no
second filter, no row identity, and no source-record access. This is the
selected alternative.

### C - Hybrid facet and selected-row context

Combine the facet workflow with a selected-row detail surface. This provides
more apparent depth but requires interacting facet state, row state, focus
rules, empty states, responsive detail layout, and a larger privacy test
surface. It is too close to a generic explorer for the approved boundary.

## 5. Selected interaction

Select **B - Facet-to-row investigation**.

The interaction has four bounded parts:

1. Existing native facet buttons remain the entry point.
2. The selected facet key/query is stored ephemerally for context only.
3. Existing global search remains the only filter and the only source of
   filtered visible sections and exact-match targets.
4. A compact context/status surface identifies the selected visible category,
   the displayed query, the rendered/capped scope, and a clear/reset action.

The context surface may be omitted when no facet is selected. It must not
duplicate entire rows, expose a hidden value, or add a second result list.

## 6. Workflow diagram

```text
                    +------------------------------+
                    | Existing sanitized CoreAnalytics |
                    | SectionModel[] and caps      |
                    +---------------+--------------+
                                    |
                                    v
                    +------------------------------+
                    | Existing CoreAnalytics view  |
                    | four rendered-row facet keys |
                    +---------------+--------------+
                                    |
                         facet button activation
                                    |
                                    v
                    +------------------------------+
                    | Ephemeral facet context      |
                    | key + visible scalar query  |
                    +---------------+--------------+
                                    |
                    existing search input event path
                                    |
                                    v
                    +------------------------------+
                    | filterSectionsByQuery         |
                    | existing visible substring    |
                    | search and exact-match model  |
                    +---------------+--------------+
                                    |
                     +--------------+---------------+
                     |                              |
                     v                              v
          Existing filtered report sections   Context/status only
          Existing copy and exports            No new serialized data
```

No arrow from the context state leads to raw source records, parser-private
objects, comparison entries, export serializers, or Raw Local View.

## 7. Component boundaries

| Boundary | Responsibility | Must not do |
| --- | --- | --- |
| CoreAnalytics parser | Parse the supported `.ips.ca.synced` family into existing bounded sections | Add investigation semantics, raw record access, or uncapped traversal |
| Sanitizer and visible model | Preserve the existing sanitized scalar and table boundary | Return source records, identifiers, nested values, or accessors |
| CoreAnalytics view model | Derive existing table counts and four facet groups | Interpret event names, invent identities, or inspect raw text |
| Investigation projection | Derive selected-facet context and visible match counts from existing view/search results | Filter independently, parse, serialize, persist, or inspect hidden rows |
| Main application state | Hold ephemeral selection and existing search state | Persist report/context or add a second search model |
| CoreAnalytics renderer | Render native facet/context/reset controls and status text | Render raw records, custom grids, modal explorers, or hidden rows |
| Generic search | Preserve visible substring, navigation, and exact-match behavior | Search parser-private or capped-out data |
| Copy/export | Serialize existing visible sanitized sections | Serialize context, facet keys, row positions, or source metadata |
| Comparison/Raw Local View | Preserve existing mode boundaries | Accept the investigation projection or bridge sanitized state into Raw |
| Service worker | Preserve explicit asset/cache rules if a later new module is approved | Cache reports, fixtures, raw output, or persistence state |

## 8. Provisional interfaces

These are names and shapes for planning discussion only:

```text
CoreAnalyticsInvestigationState {
  mode: "idle" | "active" | "empty",
  selectedFacetKey: "message" | "name" | "aggregationPeriod" | "sampling" | null,
  selectedFacetQuery: string
}

getCoreAnalyticsInvestigation(view, searchResult, state)
  -> {
       mode,
       selectedFacet: { key, label, query } | null,
       renderedScope: string,
       matchingTableCounts: [{ tableId, shown, total, capped }],
       statusText: string,
       resetLabel: string
     }

selectCoreAnalyticsFacet({ key, query })
  -> existing search input event path

clearCoreAnalyticsInvestigation()
  -> existing Clear Search path
```

The projection input is limited to the existing CoreAnalytics view, the
existing filtered visible sections/search result, and ephemeral state. The
projection does not accept `sourceText`, raw records, source objects, unknown
keys, comparison entries, or export models.

## 9. State transitions

| Event | Required state transition |
| --- | --- |
| No report | `idle`; no controls |
| Sanitized single CoreAnalytics report rendered | `idle`; current facets are available from current capped rows |
| Approved facet clicked | Set `active` with key/query; write query through current search input event path |
| Search query changed to another text | Clear facet context; leave ordinary search active with the new query |
| Search query still equals selected facet | Keep context and recompute visible counts from the current search result |
| Clear Search | Clear query, exact-match/navigation state, and context; return focus through existing behavior |
| Exact-match navigation | Preserve selected facet context; navigate existing global visible target list |
| Search result has zero visible matches | Set `empty`; show no-match status and existing clear path; do not inspect hidden rows |
| New report parsed | Clear old context before rendering new report |
| Clear Report | Clear context with all existing report state and focus behavior |
| Privacy mode changes | Clear context and rederive only the current permitted presentation |
| Enter comparison or Raw Local View | Clear/hide context; retain existing mode restrictions |
| Malformed, empty, or non-CoreAnalytics report | `idle`; use existing error/empty behavior |
| Responsive layout change | No state transition; controls remain reachable |

There is no persisted report identity. If a future focus operation requires a
row position, it is a render-pass-only positional index and is discarded when
the report, query, sort, cap, or mode changes. No hash, UUID, filename,
timestamp, or source identity is created.

## 10. Investigation allowlist

Only these four existing visible facet dimensions are approved for new
investigation interaction:

| Key | Label | Source | Safe type | Boundary |
| --- | --- | --- | --- | --- |
| `message` | Top Messages | Existing event-type and sample-record rendered rows | Sanitized scalar string | Existing 100-row cap per table and existing facet counts/order |
| `name` | Top Names | Existing event-type and sample-record rendered rows | Sanitized scalar string | Existing 100-row cap per table and existing facet counts/order |
| `aggregationPeriod` | Aggregation Periods | Existing rendered table cells | Sanitized scalar | Displayed value only; no conversion or duration interpretation |
| `sampling` | Sampling Values | Existing rendered table cells | Sanitized scalar | Displayed value only; no probability, quality, or rate interpretation |

Existing count, row-number, days-aggregated, summary, configuration,
record-overview, and parser-note values remain display-only. Incident IDs,
UUIDs, session IDs, raw/unknown/nested values, accessors, inherited values,
and source objects are rejected. Event-family meanings, hidden/capped-out
records, and stable row identities are insufficient evidence and remain out of
the interaction model.

## 11. Privacy and ephemeral identity

The privacy boundary is the existing sanitized rendered model. The design
does not introduce an identifier or a new privacy classification.

Prohibited data includes raw JSON, source lines, unknown keys, nested objects,
arrays, identifiers, aliases, paths, filenames, device/account/carrier data,
network identities, hardware identities, private samples, source timestamps,
record offsets, hashes, fingerprints, and capped-out rows.

The selected facet query is a visible scalar already in the bounded model. It
is ephemeral UI context and is not report data. It is not persisted in
localStorage, IndexedDB, cookies, URLs, history, telemetry, or exports.

The implementation must preserve own-property checks, hostile-key rejection,
scalar validation, accessor non-execution, reference isolation where values are
copied, and privacy sentinels for identifier-like values.

## 12. Search behavior

The global search contract remains unchanged:

- Search is case-insensitive substring matching over visible parsed content.
- Facet activation supplies the exact visible scalar as the query; it does not
  add a hidden token or create a compound filter.
- Existing filtered `SectionModel[]` output is authoritative for the report.
- Existing section navigation and exact-match navigation operate on that global
  visible result set.
- The scope message continues to say that CoreAnalytics search covers rendered
  capped rows only.
- Direct text editing clears facet context if the query changes; it does not
  alter ordinary search or create a facet history.
- Clear Search clears all query, navigation, exact-match, and context state.
- A no-match state is explicit and bounded; no fallback search of raw or hidden
  data occurs.

The context may say, in generalized terms, that the current view is filtered by
the selected visible facet and remains limited to rendered capped rows. It may
not claim event-family, usage, reliability, fault, charging, or diagnostic
meaning.

## 13. Copy and export behavior

Copy and export continue to operate on existing visible sanitized sections:

- Section copy does not include the selected facet key, context status,
  internal property name, row position, or reset action.
- Text export remains the current filtered visible text schema.
- JSON export remains the current schema and version; no investigation object
  or UI state is serialized.
- The selected facet does not change export schema or add a third export format.
- Export eligibility in Raw Local View and invalid comparison remains exactly as
  it is today.

## 14. Comparison and Raw Local View

Facet controls and investigation context are available only to the sanitized
single-report CoreAnalytics presentation. They are unavailable in sanitized
comparison mode and Raw Local View.

Comparison remains same-parser, sanitized-only, and limited to its existing
report count and field allowlist. No CoreAnalytics investigation state is
compared, persisted, or serialized.

Raw Local View remains an independent opt-in source view with its existing
restrictions. It does not receive facets, context, sanitized selected values,
row selection, or a bridge to the investigation projection. Switching modes
clears the ephemeral state.

## 15. Accessibility contract

- Facets and reset actions are native buttons with accessible names containing
  category, visible value, and occurrence count where applicable.
- Selected facet state uses the existing `aria-pressed` pattern.
- Context and no-match status use a concise polite live region; the full table
  is not repeated into the announcement.
- Keyboard focus remains visible and predictable. Existing focus restoration
  after facet-triggered rerender is preserved.
- Clear Search remains in the existing tab order and retains its current focus
  behavior. No ordinary query change steals focus.
- Existing headings, table semantics, definition lists, section navigation,
  and exact-match focus treatments remain unchanged.
- Controls meet the existing 44px touch target and forced-colors/focus rules.
- The design does not introduce a custom ARIA grid, hover-only action, or
  precision drag interaction.
- Reduced motion, large text, zoom, and keyboard-only operation remain
  supported.

## 16. Responsive behavior

The existing Apple-inspired Inspector Workspace remains the design authority.
The context is a compact block in the existing report flow rather than a new
navigation shell, modal, or side panel.

- Desktop and tablet layouts keep the existing section rail and report canvas.
- Narrow mobile layouts allow facet values, counts, and status text to wrap.
- No page-level horizontal overflow or fixed-width detail surface is added.
- Touch users can activate facets and reset context without hover.
- Long values and large zoom remain readable without clipped labels.
- Forced colors and reduced motion remain supported.

The installed UI/UX skill package did not expose its prescribed search helper
as a runnable local script in this checkout. No external design system is being
introduced; the repository's existing Inspector Workspace, semantic CSS, and
accessibility tests remain authoritative.

A non-persistent design-system lookup classified this workflow as a data-dense
analytics surface with WCAG-AA-oriented guidance. The useful constraints are
consistent with the repository baseline: readable tables, visible keyboard
focus, reduced-motion support, and checks at narrow, tablet, and desktop
widths. Generic suggestions such as hover-only detail, animated filtering, or
dashboard expansion are not adopted because they conflict with the frozen
Inspector Workspace and bounded-investigation boundary.

## 17. Performance and caps

The projection reads only the existing two capped tables: at most 200 visible
rows and four facet keys. It may derive bounded counts from the existing
filtered result, but it must not reparse source text, visit capped-out rows,
build a full-text index, increase caps, persist state, or add a worker.

The expected projection work is linear in the existing visible row count and
facet count. The added DOM is one context/status region and a reset control at
most, alongside existing facet controls. Repeated report replacement and clear
cycles must not retain old state or grow the DOM.

Existing Node and browser synthetic performance baselines remain the budget.
If 23B or 23D needs a new data structure, unbounded option list, virtualization,
worker, cap increase, or parser redesign, stop and return to planning.

## 18. Error and empty states

- No report: show no investigation controls.
- Non-CoreAnalytics report: keep the existing report workflow; no CoreAnalytics
  context.
- Empty CoreAnalytics tables: keep existing empty/facet omission behavior.
- Malformed records: preserve parser notes and visible invalid-record counts;
  never show malformed raw lines.
- No visible matches: show a concise no-match status tied to the existing Clear
  Search action; never fall back to uncapped or raw records.
- Report replacement: remove old context before new content appears.
- Clear Report: use the existing report reset and focus path.
- Comparison/Raw: hide or disable the context and preserve mode-specific
  restrictions.

## 19. Corpus and testing

No test or fixture changes are part of 23A. The later corpus must use fictional
inputs and cover:

- one and multiple event families without assigning unsupported meanings;
- repeated message/name/period/sampling values and deterministic existing
  facet counts;
- empty, missing, malformed, and cap-boundary rows;
- facet activation, direct query replacement, clear, exact-match navigation,
  no match, report replacement, and Clear Report;
- Raw Local View and comparison transitions;
- inherited properties, hostile prototype keys, cyclic values, throwing
  accessors, nested unknown values, and identifier sentinels;
- large synthetic workloads and repeated render/reset cycles.

Focused tests should assert that the projection cannot access `sourceText`, raw
records, serializers, comparison models, persistent storage, or uncapped data.
Existing parser, search, exact-match, copy, export, comparison, Raw Local View,
accessibility, responsive, PWA, and performance tests remain regression gates.

## 20. Rejected alternatives

- **Selected-row inspector:** rejected because it adds row identity and focus/
  mobile complexity without stronger user value than existing search results.
- **Hybrid facet plus row detail:** rejected as over-scoped and too close to a
  generic explorer; it increases state and privacy regression risk.
- **Raw or arbitrary CoreAnalytics explorer:** rejected by the sanitized,
  local-first, capped boundary and lack of approved semantics.
- **New parser or event-family interpretation:** rejected because names and
  presence do not establish subsystem meaning or lifecycle.
- **Multi-select or compound facet filtering:** rejected because it would
  redefine existing search and exact-match semantics.
- **Persistent investigation history or URL state:** rejected by the memory-
  only privacy contract.
- **CoreAnalytics comparison or export metadata:** rejected by frozen
  comparison and export contracts.

## 21. Open risks

- The user-facing delta must be clearly additive because the repository already
  has facet-to-search activation.
- Visible message/name strings may still contain sensitive text after ordinary
  sanitization; privacy sentinels must remain strict.
- Users may overread visible categories as event-family semantics; labels and
  status text must stay literal.
- Rendered caps may be mistaken for complete source coverage; every context
  state must retain the cap warning.
- Real browser automation may remain unavailable. Synthetic harness and static
  checks must not be reported as full cross-browser or screen-reader QA.
- Any request for raw detail, hidden rows, stable source identity, compound
  filters, export/comparison changes, or diagnosis is a stop condition.

## 22. Implementation stop conditions

Stop 23B or later and return to planning if any requirement needs:

- raw source records, arbitrary nested values, unknown fields, identifiers,
  aliases, paths, filenames, or source timestamps;
- uncapped data, a cap increase, hidden-row retrieval, or a full-text index;
- undocumented event-family or subsystem semantics;
- a new parser family, schema, model attachment, comparison field, export field,
  Raw Local View bridge, persistence layer, backend, upload, or telemetry;
- stable row fingerprints, hashes, UUIDs, or report identity persistence;
- diagnosis, confidence scores, recommendations, charging interpretation,
  thermal conclusions, fault claims, or AI-generated explanations;
- a modal/generic explorer, custom grid, broad navigation redesign, or a
  responsive/accessibility change that cannot be proven within the existing
  Inspector Workspace contracts;
- a new dependency, framework migration, PWA strategy change, or release
  operation.

23B may begin only after a separate implementation approval confirms that the
selected bounded projection remains within this document and
`PHASE_23_PLAN.md`.
