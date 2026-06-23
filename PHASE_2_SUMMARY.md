# Phase 2 Summary

## Phase 2 Status

Phase 2 is implemented for the current static browser app.

Implemented:

- Full section rendering for standard `.ips` crash reports.
- Full section rendering for legacy `.crash` reports.
- JetsamEvent parser with normalized real-world schema support.
- Real `.panic-full` parser with plain-text and JSON-wrapped `.ips` support.
- Generic analytics text fallback parser.
- Flexible table rendering per section.
- Simple Canvas memory chart support.
- Node/assert-only regression tests and sanitized fictional fixtures.

Not implemented:

- Phase 3 UI polish.
- Phase 4 PWA/deployment work.
- Symbolication.
- `.dSYM` support.
- Sysdiagnose archive extraction.
- Backend, authentication, analytics, cloud storage, external services, or framework dependencies.

## Architecture Changes

The app remains a static, browser-native ES module application with no build step.

Phase 2 extended the existing Phase 1 architecture instead of replacing it:

- `src/parsers/index.js` now dispatches additional detected file types.
- `src/parsers/parseIps.js` now supports normalized metadata for standard `.ips` reports and emits additional sections.
- `src/parsers/parseCrash.js` now emits all-thread and binary-image sections.
- `src/parsers/parseJetsam.js` implements real JetsamEvent parsing and normalization.
- `src/parsers/parsePanic.js` replaces the Phase 1 panic placeholder and unwraps JSON panic containers.
- `src/parsers/parseAnalytics.js` provides generic text fallback parsing.
- `src/models/sectionModel.js` now supports section-specific `tableColumns` and optional `chart` data.
- `src/ui/renderSection.js` now renders flexible tables and simple memory bar charts.

The parser contract remains:

```js
parseInput(text) -> SectionModel[]
```

Sanitized output remains the default.

## New Parsers

### JetsamEvent

`parseJetsam()` renders:

- `summary`
- `victim`
- `process-table`
- `system-memory`
- `limits`

It supports both the original synthetic fixture schema and real-world Jetsam fields such as:

- metadata JSON line
- `date`
- `build`
- `product`
- `incident`
- `bug_type`
- `memoryStatus.pageSize`
- `memoryStatus.memoryPages`
- process `rpages`
- process `physicalPages`
- process `states`
- process `priority`
- process `reason`
- process `killDelta`
- `largestProcess`

### Panic-Full

`parsePanic()` renders:

- `panic-string`
- `panic-flags`
- `kernel-backtrace`
- `loaded-kexts`
- `system-info`

The parser supports:

- plain-text panic-full logs
- `.ips` panic containers with metadata JSON line plus body JSON
- `body.panicString`
- `body.panicFlags`
- body/metadata fields such as `build`, `product`, `kernel`, `date`, `bug_type`, and `incident`
- traditional `frame : return address` backtrace rows
- iOS `lr` / `fp` backtrace rows
- kext/dependency rows from the panic backtrace section
- rows from the `loaded kexts:` block

The parser is still regex/section based and intentionally limited to readable Phase 2 extraction. It does not symbolicate addresses.

### Analytics Fallback

`parseAnalytics()` renders:

- `analytics-summary`
- `analytics-sections`

It groups generic text by `---` delimiters or timestamp-looking section starts.

## New Section/Table Rendering Behavior

`SectionModel` now supports:

- `tableColumns`: per-section column definitions.
- `chart`: optional chart data.

Tables are no longer hardcoded to crash-frame columns only. Existing crash-frame sections still work through default columns:

- Frame
- Binary
- Address
- Symbol

New table shapes include:

- All Threads tables.
- Binary Images tables.
- Jetsam process tables.
- Panic backtrace tables.
- Loaded kext tables.
- Analytics grouping tables.

The memory chart is a simple Canvas bar chart for Jetsam system memory pages. It is intentionally minimal and not a general charting system.

Panic backtrace tables can now show:

- frame number
- traditional frame address / return address
- `lr`
- `fp`
- raw line

Loaded kext tables can now show:

- kext name
- version
- address range
- row kind: backtrace, dependency, or loaded

## Real-World Validation Results

### Real Application Crash `.ips`

Validated against a real Threads app crash report.

Result:

- Detection: `ips`
- Parsed sections:
  - `summary`
  - `exception`
  - `crashed-thread`
  - `all-threads`
  - `binary-images`

The metadata normalization fix now extracts:

- App: `Threads`
- Bundle ID: `com.burbn.barcelona`
- Version: `350.0.0`
- Build: `644469579`
- Device: `iPhone18,1`
- OS Version: `iPhone OS 27.0 (24A5370h)`
- Incident Date: extracted from metadata
- Incident ID: extracted and redacted by sanitizer

Known crash-report limitation:

- All Threads is still a flat table, not grouped or collapsible.

### Real JetsamEvent `.ips`

Validated against a real JetsamEvent report.

Result:

- Detection: `jetsam`
- Parsed sections:
  - `summary`
  - `victim`
  - `process-table`
  - `system-memory`
  - `limits`

The updated parser now:

- Populates summary from metadata/body.
- Derives memory from `rpages * pageSize`.
- Sorts process table by derived memory.
- Maps `states` into role/state display.
- Preserves priority and per-process reason.
- Shows missing limits as `Not available`.
- Labels inferred culprit as `Victim / Likely Culprit`.

### Real Panic-Full `.ips`

Validated against a real JSON-wrapped panic-full report.

Result:

- Detection: `panic`
- Parsed sections:
  - `panic-string`
  - `panic-flags`
  - `kernel-backtrace`
  - `loaded-kexts`
  - `system-info`

The updated parser now extracts:

- Panic string from `body.panicString`
- Panic flags from `body.panicFlags`
- 15 iOS `lr` / `fp` kernel backtrace rows from the validation file
- 244 kext rows from backtrace kext/dependency lines and the loaded kexts block
- OS/build from metadata/body
- product/device from body
- kernel version from body
- date/timestamp from metadata/body
- bug type
- incident ID, redacted by sanitizer

The parser deliberately does not render `crashReporterKey`.

## Jetsam Normalization Fix

The Jetsam parser now normalizes:

- timestamp/date from metadata or body
- OS version/build from metadata or body
- device/product
- incident ID, sanitized by default
- bug type
- process memory from `rpages`
- process memory from `physicalPages`
- process memory from `footprintMB`, `rssMB`, or `residentMemoryBytes`
- raw page counts where useful
- process states when role is missing
- per-process reason

Sorting order for process table:

1. Derived footprint MB from page counts.
2. Explicit `footprintMB`.
3. `rssMB`.
4. `residentMemoryBytes`.
5. Source order only when no memory data exists.

Culprit selection order:

1. Top-level `victim`.
2. Process with both `reason` and `killDelta`.
3. Process with per-process `reason`.
4. `largestProcess`.
5. Highest-memory process.

## Panic-Full Normalization Fix

The panic parser now normalizes:

- metadata JSON line plus body JSON containers
- `panicString` as the panic text source
- first panic line for the `panic-string` section
- `panicFlags` from body JSON
- plain-text `Panic flags:` lines
- OS/build from metadata or body
- product/device from body
- kernel version from body or panic text
- date/timestamp from metadata or body
- bug type
- incident ID, sanitized by default

Backtrace extraction supports:

1. Traditional panic rows like `0xffff... : 0xffff...`.
2. iOS rows like `lr: 0xffff... fp: 0xffff...`.

Loaded kext extraction supports:

1. Backtrace kext rows such as `com.apple.driver.Name(version)[UUID]@start->end`.
2. Dependency rows prefixed with `dependency:`.
3. Loaded kext block rows such as `com.apple.driver.Name    version`.

Sanitizer behavior for parsed panic output:

- incident IDs are redacted by default
- kext names are preserved
- panic addresses are preserved
- `crashReporterKey` is not rendered
- UUID-like values are not rendered as explicit table fields

## Test Commands

Use PowerShell:

```powershell
npm.cmd test
```

Direct command:

```powershell
node tests/parser.test.js
```

Syntax check used during Phase 2:

```powershell
Get-ChildItem -Path 'src' -Recurse -Filter '*.js' | ForEach-Object { node --check $_.FullName }
```

Focused Jetsam syntax check:

```powershell
node --check src\parsers\parseJetsam.js
```

Focused panic syntax check:

```powershell
node --check src\parsers\parsePanic.js
```

## Known Limitations

- No symbolication.
- No `.dSYM` support.
- No sysdiagnose archive extraction.
- Panic parser is regex based and may need expansion for uncommon panic layouts.
- Panic kext rows may include duplicates when a kext appears as both a backtrace/dependency row and a loaded kext row.
- Panic backtrace rows are not symbolicated.
- Panic parser does not render `crashReporterKey`.
- Panic parser avoids explicit UUID columns; future raw-text display must review sanitizer behavior before exposing full panic text.
- Jetsam culprit selection is heuristic when no explicit victim exists.
- Jetsam RSS remains blank when the report only provides page counts.
- Jetsam memory values are rounded to whole MB.
- All Threads rendering is flat and can be dense for large reports.
- No table search, filtering, tabs, copy buttons, or collapse controls yet.
- Memory chart is intentionally simple and only supports the current Jetsam page-bar use case.
- Sanitizer policy redacts incident IDs and UUID-like identifiers unless preserved explicitly in structured binary-image fields.

## Exact Phase 3 Starting Point

Begin Phase 3 with UI/UX polish on top of the existing parser contract.

Recommended order:

1. Add drag-and-drop input while preserving file picker and paste textarea.
2. Add tab navigation between parsed sections.
3. Add search/filter across rendered sections and tables.
4. Add copy-section buttons.
5. Add privacy mode toggle UI:
   - sanitized output remains default
   - raw/local inspection is opt-in
6. Add load-example buttons for sanitized fictional fixtures.
7. Add dark/light mode via `prefers-color-scheme`.
8. Improve responsive layout for iPhone Safari.
9. Add thread grouping/collapse UI for large All Threads sections.
10. Add table affordances for dense Jetsam process tables.
11. Add table affordances for dense panic kext/backtrace tables.

Keep Phase 3 within these constraints:

- static browser app
- browser-native ES modules
- no backend
- no authentication
- no analytics
- no cloud storage
- no external services
- no framework dependencies unless explicitly approved
- sanitized output by default
