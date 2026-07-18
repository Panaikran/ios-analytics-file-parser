# v2.1 Battery Field Audit

Status: `Slice 21A research complete; Phase 21 implementation and QA complete`

Milestone: `v2.1.0` is ready for release but unreleased. Battery parsing,
sanitization, and the optional direct-metric report presentation are complete
and frozen; charging extraction remains deferred.

## 1. Executive verdict

The local evidence supports a narrow, provisional Battery and Charging feature
with strict fallback. The evidence is strong enough to plan implementation, but
not broad enough to claim universal iOS or device support.

Corpus verdict: **Sufficient for provisional implementation with strict
fallback**.

The safe v2.1 boundary is a small optional section containing explicitly
recognized direct values, conservative adapter categories, and no battery
diagnosis. Unsupported, absent, null, or unresolved conflicting values must be
omitted. Broader diagnostics remain deferred to v2.2.0 or later.

## 2. Corpus inventory

The audit used only local repository material and one private, locally ignored
positive sample. The sample was not copied into the repository, uploaded, or
used as a fixture.

| Corpus source | Inventory result | Battery evidence |
| --- | --- | --- |
| Private positive sample | One valid local analytics file; 25,350 valid line-delimited records and no invalid lines | Required battery, adapter, and power-mode families present |
| Repository CoreAnalytics fixtures | Three test fixtures and one production-style fixture | No battery field evidence found |
| Parser tests | Existing parser-family and malformed-input coverage | No battery-specific fixture or assertion found |
| Sanitized analytics examples and generated workload | Existing local examples and synthetic workload | No additional battery corpus found |

The corpus does not establish support across multiple iOS releases, device
families, battery states, or report variants. The positive sample is evidence of
one supported-looking shape, not proof of universal availability.

## 3. Positive sample description

The private sample is a local line-delimited CoreAnalytics-style report with
the required battery snapshot families, a watchOS-like battery UI family,
adapter detail records, and daily power-mode records. It supplied the approved
numeric anchors without exposing identifiers or complete records in this
document:

- battery snapshot values included cycle count 262, capacity values 4070,
  3922, and 3987, direct maximum-capacity percentage 100, and Qmax values
  4190;
- adapter wattage categories included 15, 39, and 45;
- the adapter records reported wired rather than wireless state;
- four daily power-mode records were observed.

These values are sanitized evidence anchors only. They are not constants for
production behavior.

## 4. Event-family inventory

| Event family | Local observation | Classification | v2.1 boundary |
| --- | --- | --- | --- |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | One daily battery snapshot with the required direct fields | Core v2.1 candidate | Approved secondary snapshot source |
| `BatteryConfigValueHistogramFinal_V2` | One later daily snapshot with identical required values | Core v2.1 candidate | Preferred final snapshot source when valid |
| `BHUI_NCC_iOSwatchOS` | One record with direct `maximumCapacityPercent` | Core v2.1 candidate | Direct percentage source; no watchOS UI assumption |
| `AdapterDetails` | Three records with wattage buckets and wired state | Supporting context | Optional charging summary only |
| `PowerModesDailyEngagement` | Four daily mode records and duration fields | Supporting context | Mode context only; not a charger measurement |
| Battery analysis, heatmap, histogram, and Qmax diagnostic families | Related names or nearby evidence were not sufficiently attributable for a user-facing metric | Advanced raw diagnostics | Exclude from initial v2.1 presentation |
| Thermal keys and thermal-mitigation families | Related names were present, but safe meaning and units were not established | Deferred to v2.2.0+ | No thermal interpretation in v2.1 |

Event-family names are routing evidence, not user-facing labels. Similar names
must not be treated as equivalent without a field-level match.

## 5. Field evidence table

Values below are sanitized observations from the local corpus. Repeated rows
show the same direct fields in the two overlapping snapshot families.

| Event family | Field | Observed type | Observed sanitized value | Proposed label | Proposed unit | Direct or derived | Confidence | Duplicate behavior | Privacy risk | Interpretation boundary | Proposed v2.1 status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_CycleCount` | number, integer | 262 | Cycle Count | cycles | Direct | High | Identical in final family; do not sum | Low after field allowlist | Recorded cycle count; not a service judgment | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_CycleCount` | number, integer | 262 | Cycle Count | cycles | Direct | High | Preferred final snapshot when compatible | Low after field allowlist | Same boundary as secondary snapshot | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_MaximumFCC` | number, integer | 4070 | Maximum FCC | mAh, inferred from field context | Direct | Medium | Identical in final family; do not average | Low after field allowlist | Capacity field; no Wh conversion | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_MaximumFCC` | number, integer | 4070 | Maximum FCC | mAh, inferred from field context | Direct | Medium | Preferred final snapshot when compatible | Low after field allowlist | Unit remains an inference | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_NominalChargeCapacity` | number, integer | 3922 | Nominal Charge Capacity | mAh, inferred from field context | Direct | Medium | Identical in final family; do not average | Low after field allowlist | No health interpretation | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_NominalChargeCapacity` | number, integer | 3922 | Nominal Charge Capacity | mAh, inferred from field context | Direct | Medium | Preferred final snapshot when compatible | Low after field allowlist | No health interpretation | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_AppleRawMaxCapacity` | number, integer | 3987 | Raw Maximum Capacity | mAh, inferred from field context | Direct | Medium | Identical in final family; do not average | Low after field allowlist | Related candidate only; not “Real Capacity” | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_AppleRawMaxCapacity` | number, integer | 3987 | Raw Maximum Capacity | mAh, inferred from field context | Direct | Medium | Preferred final snapshot when compatible | Low after field allowlist | Related candidate only; not “Real Capacity” | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_MaximumCapacityPercent` | number, integer | 100 | Maximum Capacity | percent | Direct | High | Identical in final family; direct percentage wins | Low after field allowlist | Do not turn into a grade or diagnosis | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_MaximumCapacityPercent` | number, integer | 100 | Maximum Capacity | percent | Direct | High | Preferred final snapshot when compatible | Low after field allowlist | Do not turn into a grade or diagnosis | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_MaximumQmax` | number, integer | 4190 | Maximum Qmax | mAh, inferred from field context | Direct | Medium | Identical in final family; do not average | Low after field allowlist | Internal capacity observation only | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_MaximumQmax` | number, integer | 4190 | Maximum Qmax | mAh, inferred from field context | Direct | Medium | Preferred final snapshot when compatible | Low after field allowlist | Internal capacity observation only | Core candidate |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2` | `last_value_QmaxCell0` | number, integer | 4190 | Cell Qmax | mAh, inferred from field context | Direct | Medium | Identical in final family; do not average | Low after field allowlist | Cell index is structural, not a health grade | Core candidate |
| `BatteryConfigValueHistogramFinal_V2` | `last_value_QmaxCell0` | number, integer | 4190 | Cell Qmax | mAh, inferred from field context | Direct | Medium | Preferred final snapshot when compatible | Low after field allowlist | Cell index is structural, not a health grade | Core candidate |
| `BHUI_NCC_iOSwatchOS` | `maximumCapacityPercent` | number, integer | 100 | Maximum Capacity | percent | Direct | High | Takes precedence over any calculated ratio | Low after field allowlist | Direct field; no diagnosis | Core candidate |
| `AdapterDetails` | `bucketed_Watts` | number, integer | 15, 39, 45 across three records | Detected Adapter Power | watts, as a recorded category | Direct | Low | Preserve observations; do not sum or call instantaneous rate | Low after field allowlist | Category, not guaranteed device power | Supporting context |
| `AdapterDetails` | `isWireless` | boolean | false in three records | Charging Connection | wired or wireless | Direct | Medium | Use only when records agree | Low after field allowlist | Connection state, not charger quality | Supporting context |
| `AdapterDetails` | `AdapterModel` | string, empty in target records | no usable value | Adapter Model | none | Direct | Low | Omit empty or conflicting values | Medium | Empty evidence does not identify an adapter | Omit |
| `AdapterDetails` | `Manufacturer` | string, empty in target records | no usable value | Manufacturer | none | Direct | Low | Omit empty or conflicting values | Medium | No manufacturer claim | Omit |
| `PowerModesDailyEngagement` | `PowerMode` | string | observed modes included charging and restricted-performance names | Observed Power Modes | none | Direct context | Low | Supporting context; do not infer charger rate | Medium | Engagement mode is not a direct measurement | Deferred or advanced |
| `PowerModesDailyEngagement` | `daily_total_Duration` | number and null observed | 55, 82, 1548, and 1738 in target records; one null elsewhere | Daily Power-Mode Duration | duration, unit not established | Direct context | Low | Do not aggregate or display until unit and semantics are established | Medium | No silent seconds/minutes conversion | Deferred |
| Related thermal families | `thermalPressureLevel` | string values observed in broader corpus search | field present, meaning and presentation boundary not established | none | none | Direct candidate | Low | Suppress; no conflict resolution can make meaning safe | Medium | No throttling, overheating, or damage claim | Unsupported |

The table intentionally distinguishes field presence from safe presentation.
The final status is a planning boundary, not an implementation claim.

## 6. Exact RealCapacity search result

No exact field named `RealCapacity` was found in the private sample or
repository corpus. The exact variants searched were:

- `RealCapacity`
- `realCapacity`
- `real_capacity`
- `Real_Capacity`
- `last_value_RealCapacity`

There were zero exact matches. `last_value_AppleRawMaxCapacity` is a related
candidate field only. The evidence does not prove that it means “Real
Capacity”; the preferred research-stage label is **Raw Maximum Capacity**.

## 7. Duplicate-record analysis

The two required battery snapshot families each occurred once in the private
sample. Their recognized direct values were identical. Both were daily records
with the same observed aggregation metadata, and the final-named family
occurred later in file order. No conflicting duplicate, null-versus-present
duplicate, or multiple-record sequence within either family was observed.

This supports treating the final-named family as the more credible source for
the observed shape, but it does not prove that the name always means a final
snapshot across all reports. Snapshot values must never be summed or averaged.

## 8. Source-precedence recommendation

Future extraction should use this deterministic policy:

1. Collect only recognized fields from approved families.
2. Prefer one valid final-named snapshot when the family and field shape match
   the documented evidence.
3. Use the other approved snapshot as a secondary source only to fill absent
   fields when the values do not conflict.
4. Collapse identical duplicates to one normalized observation.
5. Preserve an internal source and conflict state without exporting raw records.
6. Withhold a field when competing direct values conflict and the evidence does
   not establish a safe precedence.

The policy must not fabricate a complete snapshot from mutually conflicting
records. A future implementation should keep source provenance internal and
should not expose event names or raw metadata in the report.

## 9. Direct-versus-derived policy

The following are direct only when they appear in an approved analytics field:
cycle count, capacity fields, Qmax fields, maximum-capacity percentage,
adapter wattage category, and wired or wireless state.

Ratios such as nominal charge capacity divided by Maximum FCC, or Raw Maximum
Capacity divided by Maximum FCC, are possible derived context for future
research only. They must not be implemented in Slice 21A and must never be
called Apple Battery Health, official health, maximum capacity, battery
condition, or service status.

When direct `MaximumCapacityPercent` is present, it must take precedence over
any future calculated ratio. Two capacity values alone are not permission to
derive a percentage.

## 10. Unit and type assessment

- Cycle count is an integer count and may safely display as cycles when the
  value is finite and non-negative.
- Capacity and Qmax fields are integer-looking scalar values. mAh is inferred
  from naming and project context, so the unit is medium confidence. No Wh
  conversion is supported by this audit.
- Maximum-capacity percentage is a direct numeric percentage and should be
  bounded to 0 through 100 before future display.
- Adapter wattage values are integer categories. “Watts” describes the
  recorded bucket, not instantaneous power consumed by the device.
- Daily duration has an observed numeric/null shape, but its unit and exact
  semantics are not established. No duration conversion or aggregation is
  approved.
- No temperature, voltage, current, or other encoded value may be silently
  converted.

Numeric strings, non-finite numbers, negative counts, out-of-range percentages,
empty strings, and null values should be omitted by a future extractor unless a
later evidence audit establishes a different rule.

## 11. Charging-field assessment

`AdapterDetails` is the only approved charging-context family for a narrow
initial summary. Its `bucketed_Watts` values may be described as detected or
recorded adapter power categories. They must not be presented as actual
instantaneous charging rate, maximum supported speed, charger quality,
efficiency, fault, or thermal behavior.

`isWireless` can support a wired/wireless connection label only when the
recognized records agree. `AdapterModel` and `Manufacturer` were empty in the
target records and should not be presented without a usable, privacy-safe
value.

`PowerModesDailyEngagement` may provide observed power-mode context in a later
subsection, but it is not a direct charger measurement. Its duration field is
deferred because its unit is not independently established.

## 12. Privacy and sanitization risks

The source report may contain identifiers, incident references, carrier data,
configuration identifiers, app identities, and other telemetry unrelated to
battery metrics. Future extraction must use an explicit allowlist of event
families and fields, copy only validated scalar values, and discard source
records after normalization.

The user-facing report, search index, text export, structured export, and
comparison model must contain only sanitized battery fields and approved labels.
They must not contain source record blobs, raw file paths, event UUIDs, device
identifiers, carrier information, hidden diagnostic flags, or unsupported
interpretations. Raw Local View remains governed by its existing opt-in and
export restrictions.

## 13. Unsupported interpretations

This audit does not establish:

- an exact RealCapacity field;
- equivalence between AppleRawMaxCapacity and “Real Capacity”;
- official Apple Battery Health from any ratio;
- battery condition, damage, replacement status, or service status;
- instantaneous charging rate or charger capability;
- charging efficiency, thermal throttling, overheating, or charging fault;
- the unit or meaning of daily power-mode duration;
- universal availability across iOS, watchOS, device families, or report
  variants.

Where local evidence does not establish official meaning, the result is
**Undocumented or not independently verified**.

## 14. Corpus limitations

Only one private positive sample contains the required battery families. The
repository fixtures and tests provide no broader positive battery corpus. The
audit therefore lacks measured coverage for multiple iOS releases, device
families, low-capacity devices, replaced batteries, wireless charging, missing
families, null battery values, conflicting duplicates, and scalar-type changes.

The current sample also cannot establish whether the final-named snapshot is
always authoritative or whether the observed field units are stable across
versions.

## 15. Additional-sample recommendations

Risk would be reduced by sanitized, identifier-free samples representing:

- different iPhone generations and iOS releases;
- a device with maximum capacity below 100 percent;
- a replaced-battery case if available without identifying data;
- a report missing one snapshot family;
- a wireless-charging observation;
- conflicting duplicate snapshots;
- null or partial battery fields;
- changed scalar types or malformed records;
- watchOS-like and non-watchOS report variants.

Only fields needed to test the approved allowlist are necessary. Identifiers,
carrier data, app identities, and unrelated telemetry should not be collected.

## 16. Go/no-go recommendation for Slice 21B

**Go for provisional implementation with strict fallback.** Slice 21B may
begin only as the next planned slice, using a focused extractor and the
allowlisted direct fields described here. It must suppress unsupported or
unresolved values, retain deterministic source handling, and avoid adding the
private sample to fixtures.

At the time of Slice 21A, this was not a go-ahead for UI, search, export,
comparison, or runtime behavior. Slices 21A through 21D are now complete and
frozen; the following reassessment records the evidence added by Slice 21E.

## 17. Slice 21E Corpus Reassessment

Status: **Complete and frozen.**

The committed matrix at `tests/fixtures/batteryCorpus.js` contains 71
hand-authored, privacy-safe synthetic cases: 23 record-shape cases and 48
normalized-model boundary cases. It is a regression corpus, not a measurement
of real-world field frequency and not a replacement for additional scrubbed
reports. No private record was copied into it.

The matrix verifies full, alternate, BHUI-only, watchOS-like partial, charging-
shaped exclusion, each recognized family independently, absent and partial
models, exact-name rejection, RealCapacity-like rejection, all approved scalar
types and ranges, units, origins, Qmax ordering and conflicts, duplicate order,
source/conflict metadata stripping, HTML-like metadata, inherited properties,
accessors, prototype keys, and large finite values.

### Field decisions after hardening

| Field or concept | Decision | Accepted boundary | Unit and confidence | Duplicate, conflict, and fallback policy |
| --- | --- | --- | --- | --- |
| `last_value_CycleCount` | Retain | Own finite non-negative integer; zero valid | `cycles`; high confidence | Deduplicate identical values; use the frozen final-source precedence only when its metadata is compatible; otherwise suppress the conflicted field |
| `last_value_MaximumFCC` | Retain | Own finite positive number; no string coercion | `mAh` inferred from context; medium confidence | No sum or average; complementary fill only when values do not conflict |
| `last_value_NominalChargeCapacity` | Retain | Own finite positive number; no string coercion | `mAh` inferred from context; medium confidence | Same snapshot policy as Maximum FCC; no derived percentage |
| `last_value_AppleRawMaxCapacity` | Retain narrowly | Own finite positive number; label remains **Raw Maximum Capacity** | `mAh` inferred from context; medium confidence | Never mapped to `RealCapacity` or a health judgment |
| `last_value_MaximumCapacityPercent` | Retain | Own finite numeric value from 0 through 100 | `percent`; high confidence for snapshot evidence | Direct value is authoritative; no ratio fallback; conflicting unresolved values are suppressed |
| `maximumCapacityPercent` in `BHUI_NCC_iOSwatchOS` | Retain narrowly | Only the exact own finite 0–100 field | `percent`; medium confidence | Supplies only this direct percentage; it does not fill snapshot capacities or cycle fields |
| `last_value_MaximumQmax` | Retain narrowly | Own finite positive number; exact field only | `mAh` inferred; medium confidence; meaning remains undocumented or not independently verified | No inferred cell count or relationship; suppress unresolved duplicates |
| `last_value_QmaxCell0` | Retain narrowly | Own finite positive number at explicit cell 0 | `mAh` inferred; medium confidence | Identical duplicate once; conflicting duplicate withheld |
| Other Qmax cell aliases such as `last_value_QmaxCell1` | Reject | Not part of the frozen recognized-field contract | Unsupported | Do not broaden support from naming similarity |
| `AdapterDetails`, `bucketed_Watts`, `isWireless`, and power-mode fields | Reject for 21E battery output | Charging-shaped synthetic cases remain unaccepted | Charging units and semantics remain outside this slice | Defer charging extraction and presentation; do not infer a charger or power measurement |

The sanitizer and renderer now reject accessor-backed values without executing
their getters. Own data properties remain the only accepted metric boundary;
inherited properties, unsupported origins and units, non-finite values, arrays,
objects used as scalars, and unknown keys are omitted. Safe metrics remain when
an unrelated metric is malformed.

### Reassessed confidence and corpus verdict

The synthetic matrix confirms deterministic behavior for the existing contract,
but it does not add another real iOS version, device family, low-health device,
replaced-battery report, wireless report, or conflicting private report. The
corpus verdict therefore remains:

**Sufficient for provisional implementation with strict fallback.**

The implementation is not evidence for universal support. Additional
identifier-free scrubbed reports remain useful before release, especially for
multiple iOS releases and device families, a below-100 percentage, replaced or
missing battery cases, wireless context, and real cross-record conflicts.

Slice 21E changed no recognized family, field alias, charging contract, derived
metric, health interpretation, serializer, search model, comparison model, Raw
Local View behavior, or PWA policy. Slice 21F completed the final QA and
documentation reconciliation without changing those contracts. Phase 21 is
complete and frozen; the corpus verdict remains provisional and the separate
v2.1.0 release operation has not been executed.
