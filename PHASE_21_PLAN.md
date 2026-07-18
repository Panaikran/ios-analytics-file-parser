# Phase 21 - Battery and Charging Insights

Version: `v2.1.0`

Status: `Slice 21D complete and frozen; v2.1.0 remains unreleased`

Current slice: `21E - Sanitized Corpus Expansion and Cross-Variant Hardening (next; not started)`

Baseline: released and frozen `v2.0.0` at `39aa68a98260d379d4fff71cd0758b6177fc2c64`

This document preserves the Slice 21A research record and the Phase 21
implementation plan. Slices 21B and 21C add parser-local battery normalization
and a privacy-safe internal report model. Slice 21D adds only the optional
sanitized battery presentation; charging, comparison expansion, and release
work remain future scope.

## 1. Decision Summary

Verdict: **Sufficient for provisional implementation with strict fallback.**

The local evidence proves that one private CoreAnalytics report contains useful
direct battery and adapter fields. It does not prove universal support. The
future implementation must emit no Battery and Charging section when approved
evidence is absent, partial, ambiguous, or conflicting.

Confirmed in the private positive sample:

- 25,350 valid line-delimited JSON records; zero invalid records.
- All five required event families are present.
- `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` and
  `BatteryConfigValueHistogramFinal_V2` each occur once and contain the same
  seven direct battery values.
- The final-named record occurs later in file order and has the same daily
  aggregation metadata as the first battery record.
- `AdapterDetails` occurs three times with `bucketed_Watts` values 15, 39,
  and 45, and `isWireless` is `false` in all three records.
- The exact `RealCapacity`, `realCapacity`, `real_capacity`, `Real_Capacity`,
  and `last_value_RealCapacity` field names do not occur.

No implementation or test fixture was added by Slice 21A. The private sample
remains local and ignored through `.git/info/exclude`.

## 2. Evidence Boundary and Method

Evidence used:

- Repository source, tests, fixtures, examples, and project documentation.
- One private local positive CoreAnalytics sample.
- Local structural parsing that emitted only approved event names, field names,
  scalar types, record positions, aggregation metadata, and approved numeric
  anchors.

No external research, upload, cloud analysis, third-party battery tool, or raw
record copy was used. Device identifiers, UUIDs, incident identifiers, carrier
data, configuration identifiers, and raw file paths are intentionally absent
from this document.

## 3. Corpus Audit

| Corpus | Evidence | Battery coverage | Risk |
| --- | --- | --- | --- |
| Private positive sample | 25,350 valid CoreAnalytics records | One positive report with all required families except no exact RealCapacity field | Does not establish device, OS, battery health, or schema universality |
| Existing CoreAnalytics fixtures | Three test fixtures plus one production example; one test fixture has one invalid line | No required battery event or field names | Useful for parser shape, malformed-line, cap, privacy, and export contracts only |
| Generated CoreAnalytics workload | Deterministic synthetic 5,000-event workload with 250 groups | No battery fields | Useful for performance and 100-row cap behavior, not battery semantics |
| Other bundled examples | Existing supported-family catalog | No battery evidence | Negative for battery extraction, not a battery-specific negative corpus |

Coverage findings:

- Positive battery samples: 1 private report.
- Negative battery samples: no dedicated battery-negative fixture; existing
  non-battery CoreAnalytics fixtures are negative for the proposed extractor.
- Real iOS version coverage: one private battery sample at one iOS version;
  repository fixtures include synthetic/demo version labels but no additional
  battery reports.
- Device families: not established. One private report cannot demonstrate
  multiple device families, and identifier-bearing device values are not
  retained for this research.
- watchOS-like evidence: the private sample contains the event name
  `BHUI_NCC_iOSwatchOS`, but no independent watchOS report or watchOS OS
  version is present.
- Malformed records: one existing non-battery fixture contains one invalid
  line; the private positive sample contains none.
- Partial records: `BHUI_NCC_iOSwatchOS` supplies only
  `maximumCapacityPercent`; no battery conflict or null battery snapshot case
  is represented.
- Duplicate records: the two battery snapshot families are duplicate
  observations with identical values. No conflicting duplicate is present.
- Scalar stability: the seven snapshot fields are numeric in both records;
  adapter wattage is numeric; wireless state is boolean; adapter strings are
  empty strings; power mode and thermal pressure fields are strings. No
  alternate scalar representation is covered.

Additional samples that would reduce risk, without retaining identifying data:

- Two or more additional iPhone generations and two or more iOS releases.
- A device with `MaximumCapacityPercent` below 100 and a replaced-battery case.
- A report containing only one snapshot family, and a report containing only
  the final-named family.
- A report with conflicting duplicate values, null fields, missing fields, and
  malformed lines around otherwise valid battery records.
- A wireless adapter report and a report with non-empty adapter metadata.
- An independent watchOS-like report if that family is intended to remain in
  scope.
- Numeric integer, numeric float, string, null, and nested-shape variants for
  the approved fields.

Synthetic, scrubbed records are sufficient for most of these cases. Real
identifiers are not required.

## 4. Required Event Family Audit

| Event family | Local evidence | Slice 21A classification | Boundary |
| --- | --- | --- | --- |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | One nested daily record; seven direct snapshot fields; `Count` 3; `numDaysAggregated` 1; sampling 100 | Core v2.1 candidate | Primary snapshot source candidate; do not sum histogram values |
| `BatteryConfigValueHistogramFinal_V2` | One later nested daily record; same seven values and same metadata as the primary snapshot | Core v2.1 candidate | Final-source precedence candidate, not an official meaning claim |
| `BHUI_NCC_iOSwatchOS` | One nested daily record with `maximumCapacityPercent` 100; `Count` 10 | Supporting context | Candidate source for a direct percent only; event meaning is undocumented or not independently verified |
| `AdapterDetails` | Three nested daily records; watt buckets 39, 15, 45; wireless false; adapter strings empty | Core v2.1 candidate | Conservative detected adapter category and connection state only |
| `PowerModesDailyEngagement` | Four nested daily records; two observed mode strings; daily duration values; `Count` values 1, 146, 5, 5 | Supporting context | May support an observed power-mode subsection; not a charger measurement |

Closely related names were also observed. They are not automatically included:

| Observed family group | Classification | Reason |
| --- | --- | --- |
| `PowerModesEngagement`, `PowerModesEngagementByBatteryLevel`, `PowerModesEngagementByDuration`, `PowerModesExitReasons` | Supporting context | Power-mode context is not direct adapter telemetry |
| `battery_analysis_bounded_error_distribution_V2`, `battery_analysis_error_distribution`, `BatteryHeatmapSoCAggregationViewCorrected`, `BatteryTimeAtHighSocLast`, `Battery_LowVoltageResidencyCountersLastValue`, `BatteryAuthFailureReasons_ASBM` | Advanced raw diagnostics | Names indicate battery-related diagnostics, but local evidence does not establish safe fields, units, or presentation semantics |
| `B0AP_charge_all`, `JITCharging_undercharge_rate_hist`, `JITCharging_undercharge_rate_with_trial`, `OBC_Qmax_Reading_Updates`, `OBC_Qmax_Reading_Updates_On_Plugin`, `SmartCharging_PowerNPerf_Analysis_v1` | Unsupported or insufficiently understood | Charging or Qmax naming alone does not establish a safe normalized contract |
| `ThermalKeys_*`, `SMCThermalKeys_90DayRotation`, `thermalKeys_TH0x`, and ARKit thermal-mitigation families | Deferred to v2.2.0+ | Broad thermal diagnostics would invite unsupported throttling, overheating, or damage claims |
| Other power, haptics, storage, Wi-Fi, and sensor power families | Unsupported or insufficiently understood | Lexical similarity is not evidence of battery or charger meaning |

The classification is deliberately based on observed structure, not on an
official interpretation inferred from an event name.

## 5. Field-Level Evidence Audit

All listed fields were found nested rather than as top-level record fields.
`High`, `Medium`, and `Low` describe the field's suitability as a future
normalized input, not an official Apple definition.

| Exact field | Evidence in private sample | Type/nullability/duplicates | Unit policy | Confidence |
| --- | --- | --- | --- | --- |
| `last_value_CycleCount` | 262 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `cycles` is safe for this direct counter | High |
| `last_value_MaximumFCC` | 4070 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `mAh` is inferred from the capacity field context; no conversion | Medium |
| `last_value_NominalChargeCapacity` | 3922 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `mAh` is inferred; no conversion | Medium |
| `last_value_AppleRawMaxCapacity` | 3987 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `mAh` is inferred; retain user-facing label `Raw Maximum Capacity` | Medium |
| `last_value_MaximumCapacityPercent` | 100 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `percent` is explicit in the field name | High |
| `last_value_MaximumQmax` | 4190 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `mAh` is inferred; Qmax meaning is not independently verified | Medium |
| `last_value_QmaxCell0` | 4190 in both snapshot families | Number; 2 occurrences in 2 records; identical; no null | `mAh` is inferred; preserve cell index | Medium |
| `maximumCapacityPercent` | 100 in `BHUI_NCC_iOSwatchOS` | Number; 1 occurrence; no duplicate; no null | `percent` is explicit; do not equate automatically with the last-value field | Medium |
| `bucketed_Watts` | 39, 15, and 45 in three `AdapterDetails` records | Number; three records; no null; multiple categories | Display only as a recorded/detected wattage category | Medium |
| `isWireless` | `false` in all three `AdapterDetails` records | Boolean; three records; no null; no conflict | Direct wired/wireless state only; false is not proof that all reports are wired | High |
| `AdapterModel` | Three `AdapterDetails` occurrences; empty strings | String; empty usable value | Omit empty values; do not infer a model | Low |
| `Manufacturer` | Three `AdapterDetails` occurrences; empty strings | String; empty usable value in target records | Omit empty values; do not infer an adapter brand | Low |
| `PowerMode` | 22 sample-wide occurrences; four in `PowerModesDailyEngagement` | String; no null in observed occurrences | Supporting context; do not label as charger state | Medium |
| `thermalPressureLevel` | 1,695 sample-wide occurrences, spread beyond the target charging records | String; no null in observed occurrences | No user-facing thermal interpretation in v2.1 | Low |
| `daily_total_Duration` | Nine sample-wide occurrences; one null; four numeric occurrences in the target power-mode family | Number or null; no stable unit | Do not display as a duration until its unit is established | Low |
| `RealCapacity` and exact variants | Zero exact matches in the private sample and repository corpus | Absent | Unsupported | Unsupported |

Related exact-looking keys such as `last_value_CycleCountLastQmax`,
`daily_total_duration`, `daily_total_DurationInMS`,
`daily_total_DurationMinutes`, `is_wireless`, `manufacturer`, and
`lowPowerModeEnabled` were observed. They are not equivalent to the required
fields and must remain separate until independently validated.

## 6. RealCapacity Conclusion

Exact matches found:

- None for `RealCapacity`.
- None for `realCapacity`.
- None for `real_capacity`.
- None for `Real_Capacity`.
- None for `last_value_RealCapacity`.

`last_value_AppleRawMaxCapacity` is retained only as a candidate direct field
with the preferred research label **Raw Maximum Capacity**. It is not declared
equivalent to Real Capacity, Apple Battery Health, maximum capacity, battery
condition, or service status.

## 7. Direct Versus Derived Metrics

### Direct candidates

The future extractor may accept only an explicitly recognized scalar from an
approved event family:

- Cycle Count: `last_value_CycleCount`.
- Maximum FCC: `last_value_MaximumFCC`.
- Nominal Charge Capacity: `last_value_NominalChargeCapacity`.
- Raw Maximum Capacity: `last_value_AppleRawMaxCapacity`.
- Maximum Capacity Percent: `last_value_MaximumCapacityPercent` or, only with
  separate source provenance, `maximumCapacityPercent`.
- Maximum Qmax: `last_value_MaximumQmax`.
- Cell Qmax: `last_value_QmaxCell0`.
- Detected adapter power category: `bucketed_Watts`.
- Wired/wireless state: `isWireless`.
- Observed power mode: `PowerMode`, as supporting context.

### Derived candidates

The following are research notes only and must not be implemented in Slice
21A or presented as health judgments:

- `NominalChargeCapacity / MaximumFCC`.
- `AppleRawMaxCapacity / MaximumFCC`.

They must never be labeled Apple Battery Health, official health, maximum
capacity, battery condition, or service status. If a direct
`MaximumCapacityPercent` field is present and accepted, it always takes
precedence over any future derived percentage. No percentage is derived merely
because two mAh-like values exist.

## 8. Unit Policy

| Unit | Future policy |
| --- | --- |
| Cycles | Safe for the direct cycle counter; preserve the numeric value and do not round a non-integer without evidence |
| Percent | Safe only for explicit `*CapacityPercent` fields; validate a finite range and never substitute a ratio when direct data is absent |
| mAh | Provisional and medium-confidence for explicit capacity/FCC/Qmax fields; document the inference, preserve the scalar, and perform no conversion |
| Watts | Safe only as a recorded adapter bucket; use wording such as `Detected Adapter Power`, never instantaneous rate or maximum supported speed |
| Duration | Not safe for user-facing display yet; `daily_total_Duration` has no established unit and includes a null occurrence |

Do not convert mAh to Wh, infer temperature units, decode voltage/current
encodings, or reinterpret duration buckets in v2.1.

## 9. Duplicate and Precedence Strategy

### Evidence-tested observations

- The two battery snapshot families each occur once.
- They occur at different record positions, with the final-named family later.
- Both use `Daily`, `Count` 3, one aggregated day, and sampling 100.
- All seven shared direct values are identical.
- No conflicting duplicate, null snapshot field, or repeated final family is
  present in the positive sample.

### Proposed deterministic policy for Slice 21B

1. Collect only exact approved battery records and exact approved fields.
2. Keep source family, record order, aggregation period, day count, sampling,
   and conflict state as internal provenance metadata.
3. Treat `BatteryConfigValueHistogramFinal_V2` as the preferred source only
   when there is exactly one valid final-named record and its aggregation
   metadata is compatible with the primary snapshot. The later order and
   `Final` name support this proposal, but do not establish an official
   definition.
4. If both families contain the same valid scalar, emit one value and select
   the final-named source internally. Never sum or average snapshots.
5. If the preferred source is missing a field, fill it from the primary source
   only when the available values do not conflict. A null or empty value does
   not become a user-facing row.
6. If both sources conflict, the final-named source may win only under the
   exact single-final/compatible-metadata conditions above; record an internal
   conflict flag and lower confidence. If those conditions are not met,
   suppress that field rather than fabricate certainty.
7. If multiple records remain after this policy, use deterministic record order
   and field order only for provenance; never aggregate snapshot values.

This policy is a proposal for validation in 21B, not an approval to implement
it now.

## 10. Proposed Normalized Model

The narrowest future architecture is a parser-local pure extraction helper that
returns an optional normalized model. `parseInput(text, options) ->
SectionModel[]` remains unchanged. The normalized model must not contain raw
records or identifiers.

```js
{
  battery: {
    cycleCount: {
      value: Number,
      unit: 'cycles',
      source: 'direct',
      confidence: 'high',
      sourceFamily: String
    },
    maximumFcc: {
      value: Number,
      unit: 'mAh',
      source: 'direct',
      confidence: 'medium',
      sourceFamily: String
    },
    nominalChargeCapacity: Metric,
    rawMaximumCapacity: Metric,
    maximumCapacityPercent: Metric,
    maximumQmax: Metric,
    qmaxCells: [
      {
        cell: 0,
        value: Number,
        unit: 'mAh',
        source: 'direct',
        confidence: 'medium',
        sourceFamily: String
      }
    ]
  },
  charging: {
    adapterPowerCategories: [
      { value: Number, unit: 'watts', source: 'direct', confidence: 'medium' }
    ],
    connection: { value: 'wired' | 'wireless', source: 'direct', confidence: 'high' },
    observedPowerModes: [
      { value: String, source: 'supporting', confidence: 'medium' }
    ]
  }
}
```

Model rules:

- `battery` and `charging` are optional; absent evidence produces no section.
- A field is omitted when absent, null, empty, non-finite, or invalid. No
  placeholder value is invented.
- Direct numeric fields accept finite numbers only; do not coerce numeric
  strings. Cycle counts and watt buckets must be non-negative integers when
  that constraint is supported by corpus evidence. Capacity values preserve
  finite numeric precision without rounding.
- Percent values must be finite and within a documented safe range. Out-of-
  range values are suppressed and recorded as invalid provenance.
- Field order is stable: maximum capacity, cycle count, maximum FCC, nominal
  capacity, raw maximum capacity, maximum Qmax, cell Qmax, then charging
  categories, connection, and supporting modes.
- `source: 'direct'` is reserved for approved scalar fields. `source:
  'supporting'` is not a charger measurement. Derived metrics remain outside
  the user-facing model.
- Source family and conflict metadata are internal only and contain no raw
  record, identifier, path, or hidden diagnostic flag.
- Empty adapter model/manufacturer strings are omitted. Non-empty strings
  require a separate privacy review before presentation.

## 11. Charging Model Boundary

The future main section may contain a small optional Charging Activity
subsection with:

- `Detected Adapter Power`: unique recorded `bucketed_Watts` categories,
  shown as categories rather than a sum, average, current rate, or maximum.
- `Charging Connection`: `Wired` or `Wireless` only when the direct boolean
  evidence is consistent.
- `Observed Power Modes`: optional supporting strings from
  `PowerModesDailyEngagement`, explicitly labeled as observed modes.

The charging model must not claim actual instantaneous charging rate, maximum
supported speed, charger quality, efficiency, fault, thermal throttling,
overheating, battery damage, or service status. `PowerMode` and
`thermalPressureLevel` must not be used to manufacture those claims.

`daily_total_Duration` remains out of the user-facing subsection until its unit
and aggregation semantics are independently established.

## 12. Existing Architecture Audit

The narrowest future integration point is the existing CoreAnalytics parser:

- Classification already recognizes CoreAnalytics line-delimited JSON from a
  metadata record with `bug_type` 211 or timestamp/OS/incident fields, plus a
  bounded first-24-record shape check for CoreAnalytics keys in
  `src/parsers/classifyDiagnostic.js`.
- `src/parsers/parseCoreAnalytics.js` parses records, groups event records,
  sanitizes visible scalar values, and emits the existing six
  `SectionModel` sections with a 100-row cap.
- Detection uses the first metadata line plus a bounded early-record check; it
  does not branch on iOS version. Battery extraction must therefore avoid
  treating one OS version as universal support.
- `src/models/sectionModel.js` is the shared output shape. No new parser family
  is needed.
- `src/ui/renderSection.js` renders fields and tables with existing semantics;
  an optional section can reuse it without DOM-coupled parsing.
- `src/search/filterSections.js` searches section titles, fields, visible
  table columns/cells, charts, and raw section text. Battery search must enter
  this path only through rendered sanitized sections.
- `src/clipboard/serializeSection.js` already serializes visible fields and
  tables for text and JSON export. It excludes raw content from text export
  normalization and allows only scalar JSON values.
- `src/comparison/comparisonModel.js` compares a bounded allowlist of sanitized
  fields for two or three same-parser reports. Battery fields require explicit
  allowlist additions and regression coverage in a later slice.
- `src/privacy/sanitize.js` provides shared text sanitization, but battery
  extraction must also avoid copying nested records into `raw` or arbitrary
  fields.
- Raw Local View and comparison mode are controlled by `src/main.js`; existing
  export/search mode boundaries remain authoritative.

No redesign of classification, `SectionModel[]`, search, serializer, comparison,
or Raw Local View is justified by Slice 21A evidence.

## 13. Privacy and Sanitization Policy

The future normalized battery path must preserve the existing local-first and
sanitized-visible contracts:

- Sanitized output contains only fixed user-facing labels and validated scalar
  values. It never contains a raw event object, raw record text, source path,
  device identifier, UUID, incident identifier, carrier value, or configuration
  identifier.
- Internal source-family, record-order, conflict, unit-confidence, and
  validation metadata is not rendered, searched, copied, exported, compared,
  persisted, or placed in a `SectionModel.raw` value.
- String fields use the existing sanitizer before rendering. Empty adapter
  strings are omitted. Arbitrary nested strings are not recursively promoted
  into visible fields.
- The optional section is absent when no safe field survives validation. A
  conflict does not become a warning or judgment; it is either internal
  metadata or a suppressed field.
- Raw Local View remains an explicit local-only mode. It does not authorize a
  new raw battery section, structured export path, comparison path, storage
  path, upload, or analytics path.
- Private samples remain local-only and must never become committed fixtures,
  screenshots, documentation examples, or commit-message content.

## 14. UI Presentation Boundary

Slice 21D presents the optional section title **Battery and Charging** only when
at least one approved sanitized battery metric remains.

Candidate rows, in stable order:

1. Maximum Capacity - direct percent only.
2. Cycle Count.
3. Maximum FCC.
4. Nominal Charge Capacity.
5. Raw Maximum Capacity.
6. Maximum Qmax.
7. Cell Qmax.
8. Detected Adapter Power, reserved for a later charging slice.
9. Charging Connection, reserved for a later charging slice.
10. Observed Power Modes, only when supporting evidence is accepted in a later
    charging slice.

The section is a continuous report-document section inside the frozen
Inspector Workspace. It is not a dashboard, tile grid, ring, gauge, health
score, grade, color judgment, warning, or service recommendation. No labels
such as `Excellent`, `Service Required`, `Healthy`, or `Damaged` are allowed.

If all approved battery fields are absent, the section is omitted. Partial
sections may contain only the validated direct rows; missing rows are not shown
as `Unknown` unless a later approved copy contract explicitly requires it.

## 15. Search, Export, and Comparison Boundary

Slice 21D reuses the existing contracts without adding a battery-specific
search index, serializer, comparison model, or Raw Local View path:

- Search sees only the rendered sanitized Battery and Charging section, its
  fixed labels, and visible scalar values. It does not search source event
  names, internal provenance, conflict metadata, raw records, or capped-out
  CoreAnalytics data.
- Text export receives the same visible sanitized sections used by current
  export. It includes only user-facing rows and no source-family or conflict
  metadata.
- JSON export remains format `ios-analytics-visible-export`, version 1, with
  scalar fields only. The presentation section enters this existing generic
  visible-section path; no raw record blob, path, identifier, or hidden field
  is added.
- Raw Local View remains opt-in and keeps structured export unavailable. A
  future battery implementation must not make raw mode a second export path.
- Sanitized comparison remains limited to two or three compatible
  `coreanalytics` reports. Only approved direct user-facing battery fields may
  enter the comparison allowlist. Derived ratios, source provenance, conflicts,
  and setup-only labels stay excluded.
- Missing comparison fields follow existing `Not present` behavior only after
  the battery comparison contract is explicitly tested. No battery field is
  implicitly added to comparison by creating the section.

## 16. Complete Phase 21 Plan

Slices 21A through 21D are complete and frozen. Slice 21E is next and has not
started.

### Slice 21A - Battery Field Research and Corpus Audit

Status: `Complete`

Delivered by this planning record:

- Field-level evidence audit and exact RealCapacity conclusion.
- Required and related record-family classification.
- Duplicate, precedence, direct/derived, unit, privacy, and sanitization
  policies.
- Normalized model, charging model, UI boundary, search/export/comparison
  boundary, corpus verdict, and implementation plan.

Validation:

- Repository gate passed at the approved v2.0 release commit.
- Private sample exists, is locally ignored, is untracked, and was analyzed
  locally only.
- Source, fixtures, tests, and documentation were inspected.
- No production behavior, fixture, test, or runtime file changed.

### Slice 21B - Battery Record Detection and Normalization

Status: `Complete and frozen`

Scope:

- Added one focused pure extractor for the approved event families and exact
  fields.
- Added deterministic duplicate/precedence handling from Section 9.
- Added the optional normalized model from Section 10 as non-enumerable
  internal parser metadata.
- Kept `parseInput() -> SectionModel[]` and all existing CoreAnalytics sections
  compatible.

Files changed: one parser-local battery helper, the existing CoreAnalytics
parser, focused tests, and this minimal planning reconciliation. No UI, export,
comparison, or service-worker change.

Validation completed: private positive sample through a local-only harness,
synthetic identical/partial/conflicting records, invalid scalar values,
numeric validation, absence behavior, exact field-name rejection, visible
output/search/export isolation, syntax checks, existing full parser tests, and
the established performance benchmark. The private sample did not become a
fixture.

Implementation commit message: `feat(v2.1): normalize battery analytics records`.

### Slice 21C - Battery Sanitization and Report Model Integration

Status: `Complete and frozen`

Scope:

- Convert the Slice 21B normalized battery result through a focused pure
  sanitizer with an explicit approved-field allowlist.
- Retain only validated direct values, stable units, direct-origin metadata,
  and ordered Qmax cell values; remove source-family, conflict, raw-record,
  identifier, diagnostic, derived, and charging data.
- Attach the optional sanitized model to the CoreAnalytics report array through
  a non-enumerable, read-only, non-configurable property for future use.
- Preserve the existing visible `SectionModel[]`, UI, search, export,
  comparison, Raw Local View, and charging boundaries.

Non-goals: battery report rendering, dashboard tiles, gauge/ring, health score,
warning judgments, thermal claims, raw event rendering, charging insights, or
a new UI component system.

Validation completed: synthetic valid, partial, absent, malformed, duplicate,
conflict, prototype-pollution, reference-isolation, stable-ordering, report
attachment, serializer, search, comparison, and Raw Local View boundary tests;
private-sample anchor verification; syntax checks; the full parser suite; and
the established performance benchmark. No private sample became a fixture.

Implementation commit message: `feat(v2.1): integrate sanitized battery model`.

### Slice 21D - Battery and Charging Report Presentation

Status: `Complete and frozen`

Scope:

- Render the optional `Battery and Charging` section through the existing
  report-document field/table path using only the sanitized internal model.
- Add only the approved direct battery rows. Charging extraction and charging
  presentation remain outside this slice.
- Preserve the frozen Inspector Workspace hierarchy and accessibility rules.
- Reuse the existing visible search, copy, and export paths without changing
  their serializers or adding comparison or Raw Local View output.
- Repair only the verified service-worker precache gap for the battery parser
  and the focused presentation module; preserve the existing cache lifecycle.

Validation completed: section ordering, absent/partial output, fixed labels,
semantic fields, synthetic search/copy/export boundaries, parser-to-section
private-sample verification, syntax checks, the full parser suite, and the
established Node performance benchmark. Browser automation was unavailable in
the local environment; the browser harness was extended for later execution.

Implementation commit message: `feat(v2.1): render battery report section`.

### Slice 21E - Sanitized Corpus Expansion and Cross-Variant Hardening

Status: `Future; not started`

Scope:

- Add sanitized synthetic fixtures or approved scrubbed samples for the risk
  cases listed in Section 3.
- Verify iOS-version, device-family, watchOS-like, wireless, low-percent,
  replaced-battery, null, malformed, partial, duplicate, conflict, and scalar
  variation behavior.
- Reassess confidence and precedence from measured corpus results.

No identifying data is required. If the expanded corpus contradicts the
current policy, suppress or narrow the affected field rather than guessing.

### Slice 21F - Browser QA, Documentation, and Release Readiness

Status: `Future; not started`

Scope:

- Run the existing parser, search, copy, section navigation, mobile layout,
  privacy mode, Clear Report, comparison, export, hostile-content, and offline
  checks for the new optional section.
- Reconcile README, ROADMAP, phase summary, and CHANGELOG only from completed
  implementation evidence.
- Prepare release readiness without tagging or publishing automatically.

Release gate: no v2.1 release claim until corpus, privacy, automated tests,
browser workflows, documentation, and diff hygiene pass.

## 17. Frozen and Deferred Scope

Frozen and unchanged:

- v2.0.0, Phase 20, Slices 20A-20H, Inspector Workspace architecture,
  parser-family boundaries, `SectionModel[]`, search, export, comparison, Raw
  Local View, privacy, and PWA contracts.

Deferred to v2.2.0 or later:

- Thermal interpretation, charging fault, overheating, throttling, battery
  damage, service recommendations, broad device diagnostics, advanced raw
  battery histograms, undocumented charge algorithms, and unsupported event
  families.

Slice 21A remains complete and frozen as research and planning. Slice 21B is
complete and frozen after its implementation commit. Slice 21C is complete and
frozen after its sanitization and report-model commit. Slice 21D is complete
and frozen after its presentation commit. Slice 21E is next but has not
started; charging extraction, comparison expansion, and broader diagnostics
remain future work.
