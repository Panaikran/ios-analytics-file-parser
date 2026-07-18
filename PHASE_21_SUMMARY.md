# Phase 21 Summary - Battery and Charging Insights

Status: `Complete and frozen`

Release status: `v2.1.0 ready for release but unreleased`

Phase 21 adds a conservative, privacy-safe Battery and Charging report
boundary for supported CoreAnalytics evidence. The completed implementation
exposes direct battery observations only. Charging extraction, health
judgments, diagnostics, service recommendations, and broader device analysis
remain deferred.

## Objective and boundaries

The phase objective was to determine whether battery insights could be
supported safely, then add the narrowest parser, sanitization, presentation,
and regression layers supported by local evidence.

Preserved contracts:

- local-only parsing with no uploads, backend, analytics, cloud storage, or
  report persistence;
- frozen parser-family, `SectionModel[]`, search, copy, export, comparison,
  Raw Local View, accessibility, responsive, and PWA behavior;
- optional output with strict fallback and omission when evidence is absent,
  malformed, unsupported, or unresolved;
- no `RealCapacity` or `Real Capacity` mapping and no derived battery-health
  ratio.

## Slice summary

### 21A - Battery Field Research and Corpus Audit

Completed the local field and record-family audit. The exact
`RealCapacity`, `realCapacity`, `real_capacity`, `Real_Capacity`, and
`last_value_RealCapacity` fields were not found. `last_value_AppleRawMaxCapacity`
remains a related direct field only and is presented as Raw Maximum Capacity.
The corpus verdict is **Sufficient for provisional implementation with strict
fallback**.

### 21B - Battery Record Detection and Normalization

Added exact event-family recognition and direct field extraction for the
approved snapshot and BHUI percentage families. Final-snapshot precedence,
identical deduplication, complementary non-conflicting fill, and field-level
conflict suppression are deterministic. Charging-shaped records remain
unsupported.

### 21C - Battery Sanitization and Report Model Integration

Added an explicit allowlist sanitizer for cycle count, maximum capacity
percentage, Maximum FCC, Nominal Charge Capacity, Raw Maximum Capacity,
Maximum Qmax, and Qmax cell values. The sanitized model retains only value,
unit, direct origin, and cell index metadata. It is attached to the report
model through a non-enumerable, read-only, non-configurable property and is
omitted when no safe metric remains.

### 21D - Battery and Charging Report Presentation

Added the optional `Battery and Charging` section through the existing
continuous report-document path. Rows use stable labels, units, numeric
formatting, and ascending Qmax cell order. Partial models render only their
safe rows; absent or invalid models render no section. The generic visible
search, copy, and export paths are reused, while comparison and Raw Local View
remain excluded.

### 21E - Sanitized Corpus Hardening and Regression Coverage

Added 71 hand-authored privacy-safe synthetic cases: 23 record cases and 48
normalized-model cases. Coverage includes supported-family variation,
unsupported charging-shaped input, scalar and range validation, units,
origins, duplicates, conflicts, Qmax ordering, accessors, inherited
properties, hostile metadata, RealCapacity-like input, partial output, and
serialization/presentation boundaries. Only verified accessor-safety repairs
were required; no event family or field alias was broadened.

### 21F - Final QA, Documentation, and Release Readiness

Completed the final QA matrix and reconciled release documentation. No
release blocker was found, so no production, test, fixture, style,
service-worker, dependency, search, serializer, comparison, or Raw Local View
repair was required. The separate tag and publication operation remains
outside this phase.

## Approved fields and evidence boundary

Retained direct concepts:

- `last_value_CycleCount` -> Cycle Count, cycles;
- `last_value_MaximumCapacityPercent` and the approved BHUI percentage ->
  Maximum Capacity, percent;
- `last_value_MaximumFCC` -> Maximum FCC, mAh inferred from field context;
- `last_value_NominalChargeCapacity` -> Nominal Charge Capacity, mAh inferred
  from field context;
- `last_value_AppleRawMaxCapacity` -> Raw Maximum Capacity, mAh inferred from
  field context;
- `last_value_MaximumQmax` -> Maximum Qmax, mAh inferred from field context;
- the approved Qmax cell 0 field -> observed Cell 0 Qmax, with no inferred
  cell count.

Direct Maximum Capacity Percentage remains authoritative. No ratio is
calculated from capacity values, and no value is labeled official Apple
Battery Health, battery condition, service status, or a diagnosis.

## Precedence and conflict rules

- collect only recognized families and exact fields;
- prefer the final-named snapshot only when its evidence metadata is
  compatible with the secondary snapshot;
- deduplicate identical observations;
- fill missing fields only with non-conflicting approved observations;
- suppress the affected field when a conflict cannot be resolved by the frozen
  evidence rule;
- preserve unrelated safe fields;
- never sum, average, choose a max/min guess, or expose conflict metadata.

## Privacy and presentation

The report model excludes source-family names, raw records, record positions,
conflict values, identifiers, paths, timestamps, carrier data, charging data,
and diagnostic flags. Unknown keys are not copied. Numeric values are validated
as own finite data properties, supported units and direct origins; accessor
properties are rejected without executing getters.

The user-visible section is continuous report content, not a dashboard. It
contains no gauge, chart, score, grade, warning, diagnosis, recommendation,
color judgment, hidden DOM, or charging placeholder. Search and Copy Visible
see only rendered rows through their existing generic SectionModel paths.
Text/JSON export remains serializer-independent and comparison/Raw Local View
remain outside the battery section.

## Corpus and validation evidence

The synthetic corpus contains 23 record cases and 48 normalized-model cases,
for 71 total. Expected normalized output, sanitized output, visible rows,
omissions, conflict/fallback resolution, section presence, and privacy notes
are authored independently of production code.

The private positive sample was inspected locally only. The approved direct
anchors were found and rendered, the sanitized attachment contained only the
approved fields, its descriptor remained non-enumerable and read-only, and no
internal battery names or source metadata entered serialized report output.
The sample remains ignored and untracked and is not a fixture.

The full Node/assert suite, JavaScript syntax checks, service-worker syntax
check, 71-case matrix, privacy/export/search/comparison/Raw assertions, and
established Node performance benchmark passed. Existing and stress benchmark
budget statuses were within budget. Rendering remains proportional to the
number of visible battery metrics.

## Browser, accessibility, and PWA evidence

The existing synthetic browser harness covers full, partial, absent, search,
Raw Local View, comparison, clear/reset, duplicate-ID, hidden-focus, semantic,
and page-overflow battery workflow checks. Repository assertions verify the
heading/definition-list path, safe text rendering, generic visible search/copy
and export behavior, comparison/Raw exclusion, and PWA asset boundaries.

No browser executable or Playwright dependency was installed in the local
environment. Therefore real-browser automation, screenshots, native
screen-reader testing, physical-device testing, and runtime offline reload
are not claimed. No dependency or service-worker architecture change was
needed. The battery parser and renderer remain in the existing precache
allowlist, the cache identity remains coherent, and no fixture or private file
is precached.

## Deferred scope

The following remain outside v2.1.0 and are deferred to v2.2.0 or later:

- adapter wattage, wired/wireless state, charging sessions, current, voltage,
  duration, thermal interpretation, and power-mode charging inference;
- battery-health ratios, degradation, replacement, damage, service, or
  remaining-life judgments;
- advanced raw battery diagnostics, undocumented charge algorithms, and broad
  device diagnostics;
- battery comparison expansion, new export schema fields, and Raw Local View
  interpretation.

## Separate release-readiness checklist

Before the separate v2.1.0 release operation, recheck:

- clean repository on `main` with `HEAD == origin/main`;
- full tests, syntax checks, established performance budgets, and harness/PWA
  assertions;
- private sample ignored, untracked, and absent from the diff;
- no sensitive identifiers, raw records, prohibited labels, or derived health
  claims;
- documentation consistency and unchanged v2.0.0 tag;
- no existing v2.1.0 tag;
- final readiness commit identified;
- annotated `v2.1.0` tag, tag push, and release publication performed only by
  the separate approved release operation;
- service-worker cache identity rechecked if release-specific cache metadata
  is required by repository convention.

Phase 21 is complete and frozen. v2.1.0 is ready for release but remains
unreleased and untagged. No later milestone has started.
