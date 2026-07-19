# v2.2.0 — Charging Evidence and Power Context

Version: `v2.2.0`

Phase: `Phase 22`

Status: `Planning approved; implementation not started`

Current slice: `22A — Charging Field and Corpus Audit`

Decision: `Approach C - research-only deferral; Slice 22B is blocked`

## 1. Objective

Continue the Battery and Charging work from v2.1.0 by auditing charging-related
evidence in supported CoreAnalytics records. Only direct observations whose
event family, meaning, origin, scalar type, units, privacy boundary, duplicate
behavior, conflict behavior, and precedence can be established from strong
evidence may proceed.

Field names, one-sided observations, inferred units, and related diagnostics are
not sufficient. Ambiguous, conflicting, unsupported, or weak evidence is either
rejected or classified as insufficient evidence. No charging diagnosis,
quality judgment, recommendation, estimate, or interpretation is part of this
milestone.

## 2. Existing frozen baseline

v2.1.0 and Phase 21 are complete and frozen. The following behavior must not
change while Phase 22 is planned or implemented later:

- The local-first, privacy-first static browser application.
- Browser-native ES modules, no backend, no uploads, no analytics, no cloud
  storage, no telemetry, and no report persistence.
- The independent parser-family boundaries and the public
  `parseInput(text, options) -> SectionModel[]` contract.
- The sanitized-by-default report path and opt-in Raw Local View restrictions.
- The optional Battery and Charging section containing only the frozen direct
  battery observations: Maximum Capacity, Cycle Count, Maximum FCC, Nominal
  Charge Capacity, Raw Maximum Capacity, Maximum Qmax, and approved Qmax cell
  observations.
- The v2.1.0 battery allowlist, strict scalar/range/unit/origin/own-property
  checks, deterministic duplicate handling, precedence, conflict suppression,
  non-enumerable sanitized attachment, and omission behavior.
- Existing SectionModel rendering, section ordering, search, exact-match
  navigation, copy, text export, JSON export, sanitized-only comparison, and
  Raw Local View behavior.
- Existing Inspector Workspace layout, keyboard and accessibility behavior,
  responsive behavior, privacy mode, Clear Report behavior, and performance
  budgets.
- Existing PWA cache-first behavior, explicit service-worker allowlist, cache
  version discipline, and exclusion of reports, fixtures, and raw output from
  the cache.

The annotated `v2.1.0` tag remains unchanged and peels to
`1349811835069fe807ebef58f19681d36ec809e0`.

Potentially in scope after evidence approval, but not approved by this audit:

- Direct charging-state and external-power observations.
- Wired or wireless classification where the direct state is proven.
- Privacy-safe adapter or power-source observations.
- Direct voltage, current, or power values only when semantics and units are
  proven.
- Direct power-mode context that is user-meaningful without inference.
- Charging duration or session boundaries only when their units and lifecycle
  are proven.
- Charging-associated thermal context only as an audit input; thermal
  interpretation remains out of scope.

## 3. Research sources

Repository evidence reviewed:

- `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `ROADMAP.md`, `PLANS.md`, and
  `CHANGELOG.md` for current contracts and release state.
- `PHASE_21_PLAN.md` and `PHASE_21_SUMMARY.md` for the frozen battery baseline,
  prior charging boundary, and recorded evidence limitations.
- `src/parsers/battery.js`, `src/parsers/parseCoreAnalytics.js`,
  `src/models/sectionModel.js`, and `src/ui/renderBatterySection.js` for the
  implemented normalization, sanitized attachment, and projection paths.
- `docs/research/V2_1_BATTERY_FIELD_AUDIT.md` and
  `docs/design/V2_1_BATTERY_AND_CHARGING_DESIGN.md` for the prior charging
  candidate inventory. These documents are historical planning evidence, not
  proof of universal support.
- `tests/parser.test.js`, `tests/fixtures/batteryCorpus.js`,
  `tests/browserPerformanceHarness.html`, and the existing CoreAnalytics
  fixtures for parser, corpus, search, copy, export, comparison, Raw Local
  View, hostile-object, accessibility, performance, and PWA boundaries.
- Recent history: the post-release documentation commit, the v2.1.0 release
  readiness commit, and the completed v2.1 implementation commits.

Private local sample usage:

- The private local sample is not present in the current checkout, so no new
  private report was inspected for this plan.
- Historical Phase 21 documents record that one private local positive sample
  was previously inspected locally. This plan retains only generalized
  findings from those documents: repeated daily adapter records, positive
  integer adapter-category values, repeated wired/wireless booleans, daily
  power-mode records, and an unresolved duration unit.
- No private raw value, identifier, path, complete record, filename, or sample
  copy is included here. The historical sample is not a fixture, example,
  bundled asset, staged file, or documentation source.
- The current checkout has no matching tracked or historical sample path, and
  the requested ignore check produced no match because the file is absent.
  This is a privacy verification limitation, not evidence that the sample may
  be inspected or committed.

## 4. Evidence standards

Every candidate receives exactly one verdict:

### Retain

Use only when the event family is identified, the field is directly observed,
the meaning is sufficiently clear, the scalar type is stable, the unit is known
or safely label-free, the origin is understood, precedence is defensible,
duplicate and conflict behavior are testable, privacy risks are understood,
and the value can be presented without diagnosis or inference.

No candidate reaches `retain` in the current 22A audit.

### Reject

Use when a candidate contains identifiers or sensitive source data, is
misleading or unrelated, is derived/opaque/unstable/unsafe, has unestablished
units that would mislead, is implementation metadata rather than meaningful
evidence, requires unsupported interpretation or diagnosis, or belongs to an
unsupported event family.

### Insufficient evidence

Use when a plausible meaning exists but cannot be proven, only an ambiguous or
one-sided occurrence is available, event-family relationships are unclear,
units are uncertain, precedence is unknown, duplicates conflict without a
defensible rule, or platform/device variation cannot be separated safely.

When uncertain, use `insufficient evidence` rather than `retain`.

## 5. Charging field matrix

The matrix below records all exact charging and power-context candidates found
in the reviewed repository evidence and historical Phase 21 audit. Values are
generalized; private raw values are intentionally omitted.

| Event family | Field name | Observed value type | Generalized observed values or range | Unit | Direct or derived | Likely user-facing meaning | Privacy classification | Duplicate behavior | Conflict behavior | Possible precedence source | Proposed label | Verdict | Rationale | Implementation dependency or blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AdapterDetails` | `bucketed_Watts` | number, positive integer in the historical record set | Multiple positive integer categories across three daily records | Unit is described historically as recorded watts/category, but bucket semantics are not proven | Direct candidate, not a derived rate | Recorded adapter-power category | Low after strict allowlist; source metadata must be discarded | Repeated categories are present; cross-report duplicate policy is untested | No conflicting category corpus is available | None established beyond same-family daily records | Detected Adapter Power | insufficient evidence | The field name and one historical sample do not prove instantaneous power, maximum charger capability, stable units, or user meaning across platforms | Additional identifier-free reports, unit confirmation, category semantics, and deterministic duplicate/conflict rules |
| `AdapterDetails` | `isWireless` | boolean | Repeated `false` values only in the historical record set | Unitless | Direct candidate | Wired or wireless connection state | Low after allowlist | Repeated observations agree in one historical sample | No wireless-positive or conflicting corpus exists | None established | Charging Connection | insufficient evidence | A one-sided false observation cannot establish universal wired state or precedence | Wireless and conflicting samples plus a source-lifecycle rule |
| `AdapterDetails` | `AdapterModel` | string | Empty strings in the historical target records | Unitless | Direct source string | Adapter model | Sensitive/opaque source metadata | Empty values are omitted; non-empty behavior is untested | Conflict and privacy behavior are unestablished | None | Adapter Model | reject | No usable value was observed; non-empty values could identify hardware and are not needed for a safe charging observation | Do not add unless a separate privacy review approves a narrowly useful, non-identifying contract |
| `AdapterDetails` | `Manufacturer` | string | Empty strings in the historical target records | Unitless | Direct source string | Adapter manufacturer | Sensitive/opaque source metadata | Empty values are omitted; non-empty behavior is untested | Conflict and privacy behavior are unestablished | None | Manufacturer | reject | Brand/source data is not required for direct charging evidence and may expose identifying metadata | No implementation; separate approval would be required |
| `PowerModesDailyEngagement` | `PowerMode` | string | Repeated daily mode strings; exact private strings omitted | Unitless | Direct context, not direct charger telemetry | Observed power mode | Medium; arbitrary strings must not pass the allowlist | Repeated daily records; no stable deduplication contract | Conflicting mode records are not resolved | None | Observed Power Mode | insufficient evidence | The field may describe device engagement rather than charging; presenting it as charging context would require interpretation | Establish event semantics, safe label, allowed values, duplicate handling, and privacy limits |
| `PowerModesDailyEngagement` | `daily_total_Duration` | number and null | Finite numeric values and at least one null in the historical audit | Unknown | Direct context candidate | Power-mode duration | Medium; scalar only, no raw record | Repeated daily values; aggregation behavior unknown | Null-versus-present and conflicting values are unresolved | None | Daily Power-Mode Duration | insufficient evidence | Unit, interval meaning, and aggregation are not established; seconds/minutes conversion would mislead | Authoritative unit and lifecycle evidence plus conflict corpus |
| Related power-mode families | `daily_total_duration`, `daily_total_DurationInMS`, `daily_total_DurationMinutes` | Name-like candidates; no approved stable contract | Field-name variants only | Unknown | Unproven | Possible duration or mode context | Medium | Relationship to the approved duration field is unknown | No conflict policy | None | None | reject | Similar names are not aliases; accepting them would invent units or semantics | Do not broaden field aliases without independent evidence |
| Related power-mode families | `lowPowerModeEnabled` | Not established as a supported charging scalar | Presence is not proven in the current corpus | Unknown | Unproven | Possible power-mode state | Medium | Unknown | Unknown | None | None | reject | Power mode is not equivalent to charging state or external power | No implementation under this milestone |
| Thermal and mitigation families | `thermalPressureLevel` | string | Repeated strings across broader thermal-related records | Unitless | Direct telemetry candidate, but user meaning would be derived | Thermal context | Medium/high; diagnostic telemetry and interpretation risk | Many records across unrelated families; no charging-specific duplicate rule | Conflicts and precedence are unresolved | None | None | reject | Thermal interpretation, overheating, throttling, and damage conclusions are out of scope and unsupported | Keep as audit-only context; no normalized or user-facing field |
| CoreAnalytics charging-state concept | No exact verified field established | None | No field-level contract in the reviewed repository evidence | Unknown | None established | Charging state | Unknown | Unknown | Unknown | None | None | insufficient evidence | A requested concept without an exact field and lifecycle cannot be normalized | A source-backed exact field and corpus are required |
| CoreAnalytics external-power concept | No exact verified field established | None | No field-level contract in the reviewed repository evidence | Unknown | None established | External power connected/disconnected | Unknown | Unknown | Unknown | None | None | insufficient evidence | No direct field, unitless state, or precedence rule is established | A source-backed exact field and corpus are required |
| CoreAnalytics wired/wireless concept | `isWireless` is the only reviewed candidate | See `AdapterDetails.isWireless` above | Historical evidence is one-sided | Unitless | Direct candidate only | Connection type | Low after allowlist | Unknown outside one sample | Unknown | None | Charging Connection | insufficient evidence | The concept remains blocked by platform variation and absent wireless-positive evidence | Additional corpus and deterministic agreement rule |
| CoreAnalytics voltage concept | No exact verified field established | None | No field-level contract in the reviewed repository evidence | Unknown | None established | Charging voltage | Unknown | Unknown | Unknown | None | None | insufficient evidence | No field meaning or voltage unit is established | Exact field, unit, origin, range, and corpus evidence |
| CoreAnalytics current concept | No exact verified field established | None | No field-level contract in the reviewed repository evidence | Unknown | None established | Charging current | Unknown | Unknown | Unknown | None | None | insufficient evidence | No field meaning or current unit is established | Exact field, unit, origin, range, and corpus evidence |
| CoreAnalytics power concept other than `bucketed_Watts` | No exact verified field established | None | No direct instantaneous-power field is established | Unknown | None established | Charging power | Unknown | Unknown | Unknown | None | None | insufficient evidence | The only named candidate is a historical category field whose rate semantics are unproven | Additional field-level evidence and category/rate separation |
| CoreAnalytics session concept | No exact verified field established | None | No start/end or boundary contract is established | Unknown | None established | Charging-session boundary | Unknown | Unknown | Unknown | None | None | insufficient evidence | Daily records do not prove sessions or boundaries | Event lifecycle, boundary fields, and duplicate/conflict rules |
| CoreAnalytics fault concept | No exact verified field established | None | No safe direct fault field is established | Unknown | None established | Charging interruption or fault | High; fault interpretation can expose sensitive diagnostics | Unknown | Unknown | None | None | reject | Fault presentation would require diagnosis and is explicitly out of scope | No implementation under v2.2.0 |

No field is retained. No candidate may be added to a production model, section,
search path, copy path, export, comparison path, or Raw Local View path from
this matrix alone.

## 6. Event-family matrix

| Event family or family group | Role | Record lifecycle | Snapshot or event semantics | Candidate fields | Privacy concerns | Support verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | Frozen v2.1 battery source | Daily snapshot family; frozen battery precedence only | Snapshot-like battery observations, not a charging session | Nested records must remain behind the existing battery allowlist | Frozen battery baseline; not a new charging source |
| `BatteryConfigValueHistogramFinal_V2` | Frozen v2.1 battery source | Later daily snapshot family in the historical audit | Snapshot-like battery observations; final-name precedence is limited to the frozen battery contract | Same as the secondary snapshot | Frozen battery baseline; not a new charging source |
| `BHUI_NCC_iOSwatchOS` | Frozen v2.1 supporting battery source | Daily record observed historically | Direct percentage context only; no watchOS support claim | Exact allowlist only; no family-wide promotion | Frozen battery baseline; not a new charging source |
| `AdapterDetails` | Charging-context candidate | Repeated daily records in the historical audit; current corpus absent | Repeated adapter observations, not proven session events or instantaneous samples | `bucketed_Watts`, `isWireless`, `AdapterModel`, `Manufacturer` | Adapter identity and arbitrary strings must be discarded | `insufficient evidence` for scalar candidates; no implementation |
| `PowerModesDailyEngagement` | Power-context candidate | Daily engagement records in the historical audit | Daily context snapshots; not proven charger telemetry or session records | `PowerMode`, `daily_total_Duration` | Arbitrary mode strings and hidden metadata must not be promoted | `insufficient evidence`; no implementation |
| `PowerModesEngagement`, `PowerModesEngagementByBatteryLevel`, `PowerModesEngagementByDuration`, `PowerModesExitReasons` | Related power-mode context | Lifecycle and relation to the daily family are not established | Event/snapshot semantics unclear | Related mode and duration names only | Could expose unrelated device telemetry or inferred meaning | `reject` as unsupported charging sources |
| `battery_analysis_bounded_error_distribution_V2`, `battery_analysis_error_distribution`, `BatteryHeatmapSoCAggregationViewCorrected`, `BatteryTimeAtHighSocLast`, `Battery_LowVoltageResidencyCountersLastValue`, `BatteryAuthFailureReasons_ASBM` | Advanced battery diagnostics | Lifecycle not established | Diagnostic/histogram/residency semantics not established | No approved charging scalar | Diagnostic metadata and health inference risk | `reject` |
| `B0AP_charge_all`, `JITCharging_undercharge_rate_hist`, `JITCharging_undercharge_rate_with_trial`, `OBC_Qmax_Reading_Updates`, `OBC_Qmax_Reading_Updates_On_Plugin`, `SmartCharging_PowerNPerf_Analysis_v1` | Charging-named research families | Lifecycle, record shape, and source ownership not established | Names suggest charging or Qmax, but no field-level contract is proven | No approved field | Could expose raw algorithms, implementation metadata, or unsupported diagnostics | `reject` as unsupported event families; names alone are not evidence |
| `ThermalKeys_*`, `SMCThermalKeys_90DayRotation`, `thermalKeys_TH0x`, ARKit thermal-mitigation families | Thermal context | Repeated thermal-related records; charging relationship not established | Thermal telemetry or mitigation context, not a charging observation | `thermalPressureLevel` and related fields are not approved | High risk of overheating, throttling, or damage interpretation | `reject` for Phase 22 presentation |
| Other power, haptics, storage, Wi-Fi, and sensor-power families | Unrelated or unverified context | Not established | Not established | No approved fields | Unrelated telemetry and identifier risk | `reject` unless a later milestone separately approves an exact family |

Event-family names are routing clues only. No family in this matrix supplies a
proven charging field with stable lifecycle and precedence suitable for 22B.

## 7. Architecture comparison

| Criterion | Approach A - extend battery normalization | Approach B - separate charging model | Approach C - research-only deferral |
| --- | --- | --- | --- |
| Correctness | High coupling risk because frozen battery snapshots and charging-context records have different observed lifecycles | Best future fit if charging evidence becomes retainable; keeps distinct source rules | Highest correctness now because no unsupported value is emitted |
| Privacy | Requires a larger shared allowlist and increases accidental battery/charging leakage risk | Strong isolation between battery and charging allowlists and attachments | Strongest boundary because no charging model or output is created |
| Complexity | Lowest code addition, but hidden precedence coupling is difficult to prove | Moderate code addition with explicit model and resolver boundaries | Lowest implementation complexity; documentation-only |
| Coupling | Material coupling to frozen v2.1 precedence and sanitizer | Low coupling; projection can remain in the existing section later | No runtime coupling |
| Testability | Mixed-family tests would be harder to interpret | Independent corpus, resolver, sanitizer, and projection tests are clearer | Evidence and privacy decisions are directly reviewable |
| v2.1 compatibility | Higher risk of changing frozen battery behavior | Preserves the battery model and existing attachment | Preserves all v2.1 behavior |
| Future extensibility | Encourages accidental battery/charging schema growth | Supports later direct fields without merging parser families | Preserves the option to choose B after evidence improves |
| Misleading presentation risk | High while units and lifecycle are unresolved | Low only with a strict allowlist and no inferred labels | None because no charging presentation is added |

Approach A is not selected because the evidence does not establish shared
lifecycle or precedence rules. Approach B is the safer conditional runtime
architecture if a future evidence audit produces retained fields, but it is
not approved for implementation now. Approach C is the current recommendation.

## 8. Approved or recommended architecture

Recommend **Approach C - research-only deferral** for the current Phase 22
state.

- Keep the v2.2.0 milestone and six-slice structure as planning direction.
- Keep Slice 22A active until a privacy-approved charging corpus or stronger
  evidence is available and reviewed.
- Do not create a charging normalizer, charging attachment, new parser family,
  presentation row, export field, comparison field, or service-worker change.
- Keep Slice 22B blocked. No retained field, precedence rule, or normalized
  model is approved.
- If a later 22A evidence refresh passes the retain standard, revisit Approach
  B first because the candidate event families have materially different
  lifecycles from the frozen battery snapshots.

## 9. Normalized model proposal

There are no retained fields, so there is no approved normalized charging
property, type, unit, null/omission rule, origin metadata, precedence rule, or
conflict behavior to implement.

The only approved model decision is negative: do not attach a charging model,
do not extend the frozen battery model, and do not expose source-family,
conflict, record-order, raw-record, identifier, or diagnostic metadata. Any
future proposal must be re-reviewed against the complete matrix before 22B.

## 10. Presentation proposal

There are no retained fields, so no new user-facing label, value format, unit,
section ordering entry, or accessibility row is approved.

The existing Battery and Charging section remains unchanged and continues to
show only the frozen v2.1 direct battery observations. No charging placeholder,
unsupported value, neutral-looking guess, warning, grade, or diagnostic note
may be added. Existing search, copy, export, comparison, and Raw Local View
paths must therefore remain unchanged during planning.

## 11. Privacy boundary

Phase 22 must never expose, retain, stage, commit, copy, bundle, or publish:

- Raw CoreAnalytics records, raw source excerpts, complete source lines, or
  source-record dumps.
- Device identifiers, incident identifiers, UUIDs, serial numbers, ECIDs,
  account data, carrier data, aliases, paths, filenames from inside reports,
  or adapter identity strings.
- Private local sample material, exact private values, screenshots, sanitized
  copies, fixtures derived line by line, or private corpus paths.
- Source-family names, record positions, duplicate/conflict metadata, hidden
  diagnostics, thermal telemetry, or arbitrary nested payloads in user-facing
  output, search, copy, export, comparison, or Raw Local View.

Any future implementation must use exact family and field allowlists, own data
properties only, safe scalar validation, explicit units, deterministic
precedence, duplicate handling, and conflict suppression before sanitized
projection. Accessors must not execute. Unknown keys, inherited properties,
arrays, objects, strings used as numeric values, non-finite values, and
unsupported units must be omitted or rejected.

## 12. Compatibility boundary

The milestone preserves all of these contracts:

- Static browser application, browser-native modules, no backend, local-only
  processing, memory-only uploaded/pasted reports, and sanitized output by
  default.
- Existing parser-family boundaries, classification, parseInput contract, and
  SectionModel shape.
- Existing search substring semantics, exact-match targets and navigation,
  visible-content filtering, section navigation, and copy behavior.
- Existing text export schema and JSON export format/version/scalar boundary.
- Sanitized-only comparison limits, comparison allowlists, and missing-field
  behavior.
- Raw Local View opt-in restrictions and export disablement.
- Existing Inspector Workspace design, accessibility, responsive behavior,
  focus behavior, Clear Report, and performance expectations.
- Existing PWA precache allowlist, cache-first strategy, cache version policy,
  navigation fallback, and exclusion of reports, fixtures, and raw output.
- All frozen v2.1.0 battery normalization, sanitized attachment, section
  projection, and omission behavior.

No comparison expansion, export-schema change, Raw Local View extension, or
service-worker change is authorized by this planning record.

## 13. Non-goals

The following are explicitly out of scope for v2.2.0:

- Battery-health grades; charging-quality grades; good, poor, healthy, weak,
  replace-soon, or similar judgments.
- Charging-fault diagnosis, battery diagnosis, thermal conclusions, or
  overheating diagnosis.
- Service recommendations, repair guidance, remaining battery-life estimates,
  remaining charging-time estimates, degradation predictions, or damage and
  replacement predictions.
- AI-generated interpretation, unsupported explanation, or exact root-cause
  claims.
- Raw source presentation, source-record dumps, private report display, or
  expanded raw diagnostic browsing.
- New parser families; MetricKit support; sysdiagnose extraction; symbolication.
- Comparison expansion, battery comparison, or charging comparison.
- Export-schema changes or new export formats.
- Backend, authentication, uploads, analytics, telemetry, persistence, cloud
  processing, or report storage.
- Framework migration, package metadata changes, or dependency expansion.
- Tag creation and release publication.
- Broadening Phase 22 into a general diagnostics milestone without explicit
  approval.

Thermal-related fields may be audited for context only. Thermal interpretation
remains out of scope unless separately approved later.

## 14. Slice plan

The six proposed slices remain fixed. Their later implementation gates are
conditional on the 22A evidence decision.

### 22A - Charging Field and Corpus Audit

- Objective: identify real event families and candidate fields; complete the
  evidence matrix; define privacy, units, duplicates, conflicts, and
  precedence; compare architectures.
- Likely files: `PHASE_22_PLAN.md`, `ROADMAP.md`, `PLANS.md`; read-only review
  of the existing parser, research, fixture, and test files listed above.
- Tests/evidence: repository gate, private-sample privacy checks when a sample
  exists, synthetic corpus review, existing parser tests, static privacy
  assertions, and documentation diff review.
- Dependencies: frozen v2.1.0 baseline and an available privacy-approved
  evidence source if a retain decision is requested.
- Exit criteria: matrix and event-family audit are complete, one verdict is
  assigned to every candidate, architecture is reviewed, and the privacy and
  compatibility boundaries are documented.
- Stop conditions: missing corpus, unknown units, unsupported family,
  unproven lifecycle, unresolved precedence, conflicting records, or any need
  to infer a user-facing meaning. Current outcome: 22A remains active for
  evidence purposes and 22B is blocked.

### 22B - Charging Record Normalization

- Objective: implement only fields marked `retain` by 22A, if any.
- Likely files: a focused parser-local charging normalizer and the existing
  CoreAnalytics integration only after Approach B is approved; no new parser
  family. Exact production paths remain unapproved while 22A is blocked.
- Tests: focused tests first for exact family/field matching, scalar/origin/
  unit/range/own-property/accessor safety, duplicate handling, precedence,
  fallback, conflict suppression, and unsupported-family rejection.
- Dependencies: a completed 22A matrix, approved architecture, approved
  fields, units, and corpus.
- Exit criteria: approved fields normalize deterministically without changing
  `parseInput` or visible sections.
- Stop conditions: any unapproved field, inferred unit, accessor execution,
  raw metadata retention, diagnosis, or unresolved conflict. **Blocked.**

### 22C - Sanitized Charging Model

- Objective: create a privacy-safe charging model only from the approved 22B
  result.
- Likely files: the approved parser-local normalizer/sanitizer and the
  existing CoreAnalytics attachment path; no file is authorized now.
- Tests: allowlist, reference isolation, non-enumerable attachment, descriptor
  safety, JSON/stringification privacy sentinels, hostile objects, inherited
  properties, and accessor-backed fields.
- Dependencies: 22B complete and reviewed.
- Exit criteria: only approved scalar values and explicitly approved generic
  origin metadata survive; raw records, identifiers, paths, source metadata,
  conflicts, and diagnostics do not.
- Stop conditions: any need to change export, comparison, Raw Local View,
  SectionModel shape, or frozen battery behavior.

### 22D - Charging Report Presentation

- Objective: extend the existing Battery and Charging section only with
  approved direct observations.
- Likely files: existing battery section projection and generic renderer;
  service-worker allowlist only if a new production module is actually added.
- Tests: section order, omission, formatting, accessibility, responsive
  layout, search, exact matches, copy, and no-diagnosis assertions.
- Dependencies: 22C sanitized model and approved labels/units.
- Exit criteria: direct observations render through the existing SectionModel
  path with no UI redesign, hidden content, or unsupported interpretation.
- Stop conditions: labels imply rate, capability, quality, health, fault,
  thermal state, or service status.

### 22E - Corpus Hardening

- Objective: add independently fictional synthetic cases for the approved
  fields and all relevant failure boundaries.
- Likely files: `tests/fixtures/batteryCorpus.js` or a separate charging corpus
  fixture only after 22A approval, plus `tests/parser.test.js`.
- Tests: wired, wireless, partial, malformed, duplicate, conflicting,
  unsupported, hostile-object, inherited-property, accessor-backed, unit,
  origin, and scalar-variation cases where relevant.
- Dependencies: approved field matrix and normalized model.
- Exit criteria: cases are hand-authored, privacy-safe, independent of private
  records, and cover every approved duplicate/conflict/fallback rule.
- Stop conditions: fixture derivation from private records, hard-coded private
  anchors, missing negative cases, or broad field aliases.

### 22F - Final QA and Release Readiness

- Objective: validate all preserved parser, privacy, presentation, workflow,
  accessibility, performance, and PWA contracts and reconcile documentation.
- Likely files: approved implementation files, tests, service worker only if a
  production asset changed, and milestone documentation.
- Tests: full parser suite, syntax checks, corpus/privacy sentinels, browser
  harness, search/exact-match, copy, text/JSON export boundaries,
  comparison isolation, Raw Local View, accessibility, responsive behavior,
  performance budgets, and service-worker allowlist/cache tests.
- Dependencies: 22B through 22E complete and no unresolved evidence blocker.
- Exit criteria: all gates pass, documentation describes only implemented
  behavior, and release readiness is separately reviewed.
- Stop conditions: browser, privacy, PWA, export, comparison, accessibility,
  performance, or documentation failure; no tag or publication is created by
  this slice.

## 15. Validation strategy

For any future implementation, validation must include:

- Focused parser and normalizer tests before production changes.
- The full `npm.cmd test` suite and JavaScript syntax checks for modified files.
- Synthetic corpus tests with independent expected outputs and no private
  line-by-line derivation.
- Privacy sentinels for identifiers, paths, aliases, raw records, source
  metadata, conflicts, diagnostic fields, and unsupported labels.
- Hostile-object tests covering inherited fields, prototype pollution,
  accessor-backed properties, throwing getters, malformed scalars, and nested
  payloads.
- Search and exact-match boundaries through visible SectionModel content only.
- Copy, text export, JSON export, comparison, and Raw Local View isolation.
- The existing browser harness for parsing, search, copy, navigation, mobile
  layout, privacy mode, Clear Report, comparison, and offline-shell behavior.
- Existing performance budgets for CoreAnalytics parsing, large reports, and
  visible rendering.
- Service-worker syntax, explicit allowlist, cache identity, no-runtime-cache,
  and no-fixture/no-private-asset assertions when production assets change.
- `git diff --check`, complete planning-diff review, and documentation-only
  checks for this planning phase.

Current planning validation is documentation-only; no production or test
changes are authorized by this plan.

## 16. Risks and blockers

- Field-name ambiguity: charging-related words do not establish semantics.
- Unknown units: watt buckets and duration values may be mislabeled if shown
  as rates or minutes/seconds.
- Platform variation: one historical positive sample cannot establish iOS,
  device-family, or report-variant support.
- Contradictory records: no real conflict corpus establishes precedence for
  charging candidates.
- Private-corpus overfitting: historical sample findings are not universal
  support and must not become hard-coded fixtures.
- Unsupported event families: charging-named, thermal, and power-mode families
  may be implementation metadata or unrelated diagnostics.
- Misleading user-facing labels: labels such as power, connection, or mode can
  imply capability, rate, health, or diagnosis without evidence.
- Missing current private corpus: the sample is absent in this checkout, and
  the current ignore check cannot confirm an active ignore rule for it.
- Browser automation: no browser executable or Playwright dependency was
  available in the v2.1 baseline; real-browser QA remains a future risk if the
  environment is unchanged.
- Scope drift: comparison, export, thermal, diagnosis, and broad diagnostics
  must remain outside the fixed theme and slice boundaries.

The primary blocker is evidence, not implementation effort. Slice 22B cannot
begin until at least one charging candidate satisfies the retain standard and
the privacy-approved corpus supports deterministic behavior.

## 17. Decision record

- Theme is fixed: **Charging Evidence and Power Context**.
- Version is fixed: **v2.2.0**.
- Phase 22 and its six-slice structure are fixed; the current slice is 22A.
- Planning is approved and implementation has not started.
- No charging field is retained by this audit. Historical candidates remain
  provisional until the evidence audit is complete and reviewed.
- Approach C is recommended now; Approach B is only a conditional future
  architecture if evidence improves. Approach A is not approved.
- Slice 22B is blocked pending stronger, privacy-approved evidence, stable
  units and meanings, and defensible duplicate/conflict/precedence rules.
- v2.1.0 behavior remains frozen; no comparison, export, Raw Local View, or
  PWA contract changes are authorized.
- No tag, release, GitHub Release, package metadata change, or publication is
  authorized.
