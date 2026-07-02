# Architecture

This document describes the architecture that is currently implemented. It is
not a redesign proposal and not a roadmap.

## Philosophy

iOS Analytics File Parser is a static browser application.

The architecture preserves these boundaries:

- Local-first parsing.
- Privacy-first output.
- No backend.
- No uploads.
- No analytics.
- No cloud storage.
- No report persistence.
- Sanitized output by default.
- Raw local view only by explicit opt-in.

## High-Level Flow

```text
User input
  -> file validation or pasted text
  -> classifyDiagnostic(input)
  -> parseInput(input, options)
  -> parser-specific SectionModel[]
  -> optional diagnostic explanation section
  -> app state
  -> search/copy/table-view layers
  -> DOM rendering
```

Unsupported recognized diagnostics stop before parsing and show safe unsupported
messages. Unknown input keeps the generic unsupported message.

## Diagnostic Classification

`src/parsers/classifyDiagnostic.js` is the source of truth for diagnostic
classification.

The classifier returns compact metadata:

- `type`
- `family`
- `subtype`
- `supported`
- `parserType`
- `legacyType`
- `structure`
- `bugType`

The classifier uses shape, structure, and safe fields such as `bug_type`. It
must not expose raw identifiers, request IDs, paths, UUIDs, raw payloads, or
private diagnostic body snippets.

`src/parsers/detect.js` remains a compatibility wrapper:

```js
detectFileType(input) -> classifyDiagnostic(input).legacyType
```

New routing should use classification metadata, not duplicate detection logic.

## Parser Routing

`src/parsers/index.js` owns public parser routing.

The public contract is:

```js
parseInput(text, options) -> SectionModel[]
```

`parseInput()` classifies input once, routes by `classification.parserType`, and
throws this exact error for unsupported direct parsing:

```text
Unsupported or unrecognized file type.
```

Container-style `.ips` reports are normalized with `parseIpsContainer()` only
for parser families that expect that shape. Resource parsers that own full-input
normalization receive the original input string.

## Supported Parser Families

Current supported parser families are:

- App Crash `.ips`: `ips`.
- Legacy Crash `.crash`: `crash`.
- Watchdog stackshot `.ips`: `ips-watchdog-stackshot`.
- Jetsam memory diagnostics: `jetsam`.
- Panic-full reports: `panic`.
- Generic analytics text: `analytics`.
- CoreAnalytics line-delimited JSON: `coreanalytics`.
- AccessoryCrash `bug_type: 305`: `accessory-crash`.
- CPU Resource `bug_type: 202`: `resource-cpu`.
- Disk Writes Resource `bug_type: 142`: `resource-diskwrites`.
- Stackshot Resource `bug_type: 288`: `resource-stackshot`.

Parser families should stay independent. Do not merge them into a mega-parser.

## Recognized But Unsupported

The classifier recognizes some families for safe user messaging only:

- App Usage Metrics.
- Wi-Fi Connectivity.
- Diagnostic Request.
- Broad Accessory/Firmware diagnostics outside narrow AccessoryCrash support.

Recognition is not parsing support. These families do not emit sections.

## SectionModel Flow

Parsers return arrays of section objects created directly or through
`src/models/sectionModel.js`.

The section shape is:

- `id`
- `title`
- `priority`
- `fields`
- `raw`
- `table`
- `tableColumns`
- `tableSummary`
- `chart`

Search, copy, navigation, and rendering operate on these parsed sections rather
than raw source text.

## Explanation Layer

`src/explanations/diagnosticExplanations.js` provides deterministic,
plain-English explanation rules.

The explanation layer:

- Uses already-parsed `SectionModel[]` data and classification metadata.
- Does not inspect raw source text.
- Returns no explanation when no safe rule applies.
- Uses cautious wording.
- Avoids exact root-cause claims and AI diagnosis.
- Emits at most one `diagnostic-explanation` section.

`parseInput()` inserts the explanation after the first summary-like section when
possible. If no summary-like section exists, it appends the explanation section.

## UI Rendering Pipeline

`src/main.js` owns app state transitions and browser interactions:

- file picker
- paste parsing
- drag-and-drop
- examples
- privacy toggle
- search input
- copy actions
- dense table controls
- service-worker status UI

`src/ui/renderApp.js` renders status and delegates section rendering.

`src/ui/renderSection.js` renders each section card, fields, tables, charts,
raw notes, dense table controls, and copy controls.

`src/ui/renderSectionNav.js` builds section navigation from rendered sections.

`src/ui/renderCoreAnalyticsOverview.js` renders a CoreAnalytics overview panel
from parsed sections when applicable.

The UI should not inspect raw report text except where `src/main.js` owns the
current in-memory source for reparsing raw/sanitized mode.

## Search

`src/search/filterSections.js` filters parsed sections by query.

Search operates on section titles, fields, tables, raw section text, chart
labels, and explanation text when those sections are present. It does not search
original source text.

`src/search/searchMetadata.js` describes search scope for large and capped
reports so the UI can distinguish parsed output, rendered rows, capped rows,
visible rows, and known source totals.

## Copy

Copy is section-based.

- `src/clipboard/visibleSection.js` derives the currently visible section.
- `src/clipboard/serializeSection.js` serializes that section to plain text.
- `src/clipboard/copyMetadata.js` describes visible rows, total rows, collapsed
  rows, limited rows, rendered-only rows, and capped CoreAnalytics rows.

Copy should preserve current visible-section behavior and should not serialize
hidden source data.

## Dense Tables And Large Reports

`src/ui/tableView.js` centralizes table visibility decisions.

It supports:

- plain tables
- compact tables
- limited rows
- grouped thread tables
- collapsed/expanded dense tables

`src/ui/denseTables.js` contains helpers for threads, Jetsam row limits, and
large loaded-kext tables.

Stackshot Resource top-process rendering is summary-only and capped by the
parser. Full stacks, frame symbols, and frame addresses are intentionally not
rendered.

## Privacy Model

Sanitized mode is the default.

Parser privacy rules should:

- Redact or omit identifiers, UUIDs, request IDs, serials, MAC addresses,
  ECIDs/chip IDs, paths, command paths, raw addresses, and nested payloads.
- Summarize nested or large structures instead of dumping them.
- Keep raw local mode bounded and local-only.
- Avoid exposing raw source bodies through search or copy.

`src/privacy/sanitize.js` provides shared sanitization helpers, and some parser
families have additional parser-local hardening where their schemas require it.

## Service Worker And PWA

`service-worker.js` precaches the app shell, source modules, icons, manifest,
and bundled examples listed in `PRECACHE_URLS`.

The service worker strategy is intentionally conservative:

- Cache only the explicit allowlist.
- Use cache-first for allowlisted app assets.
- Use the cached `index.html` as navigation fallback.
- Delete old app caches during activation.
- Support explicit `SKIP_WAITING` update activation.
- Do not use `cache.put`.
- Do not runtime-cache arbitrary requests.
- Do not cache user reports, raw output, clipboard output, search state, or
  parsed sections.

When a precached asset changes, bump `CACHE_VERSION`.

## Intentionally Unsupported

These capabilities are intentionally outside the current architecture:

- App Usage Metrics parsing.
- Wi-Fi Connectivity parsing.
- Diagnostic Request parsing.
- Broad Accessory/Firmware support beyond narrow AccessoryCrash.
- Symbolication.
- `.dSYM` support.
- Sysdiagnose archive extraction.
- Full stack rendering.
- AI diagnosis.
- Backend, auth, cloud storage, analytics, uploads, or report persistence.

