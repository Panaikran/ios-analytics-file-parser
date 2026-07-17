# v2.1 Battery and Charging Design

Status: `Proposed future architecture; not implemented`

Milestone: `v2.1.0` is unreleased. This design follows the Slice 21A field
audit and does not change production behavior.

## 1. Scope

The future feature would add an optional `Battery and Charging` section to the
existing Inspector Workspace report document. It would expose a small,
allowlisted set of direct battery observations and conservative charging
context when recognized evidence is present.

The initial user-facing scope would be limited to cycle count, direct maximum
capacity percentage, selected capacity and Qmax observations, recorded adapter
power categories, and an agreed wired/wireless state. Every value would remain
optional.

## 2. Non-goals

The feature would not diagnose battery condition, damage, replacement status,
service need, overheating, throttling, charging faults, charger quality,
charging efficiency, instantaneous charging rate, or maximum supported speed.
It would not add a dashboard, gauge, ring, health score, grade, warning, or
new raw-diagnostics browser.

Derived capacity ratios, undocumented duration conversions, temperature or
voltage conversions, and broad device diagnostics would remain outside the
initial feature.

## 3. Architecture

The future implementation should preserve the existing parser-family boundary:
CoreAnalytics parsing would remain separate from other diagnostic families. A
focused pure extraction helper would read the already traversed CoreAnalytics
records and return an optional normalized battery object. The existing
`parseInput() -> SectionModel[]` contract would remain authoritative.

The report layer would receive an optional section model, use the existing
continuous report-document rendering path, and avoid coupling extraction to DOM
structure. Existing search, text serialization, structured serialization,
comparison, privacy, and Raw Local View contracts would remain the integration
boundaries.

## 4. Extraction boundary

The extractor would recognize only the approved event-family and field
allowlists from the field audit. It would accept scalar values with the expected
types, validate them, normalize field names to stable application names, and
discard all other record content.

It would not infer a field from a similar name, search arbitrary nested text,
or treat a related family as equivalent. Empty, null, malformed, non-finite,
and unsupported values would be omitted. No battery section would be created
when no supported value survives validation.

## 5. Proposed normalized model

The following is a design candidate, not a production schema:

```js
battery: {
  cycleCount: { value: 262, unit: "cycles", source: "direct" },
  maximumFcc: { value: 4070, unit: "mAh", source: "direct" },
  nominalChargeCapacity: { value: 3922, unit: "mAh", source: "direct" },
  rawMaximumCapacity: { value: 3987, unit: "mAh", source: "direct" },
  maximumCapacityPercent: { value: 100, unit: "percent", source: "direct" },
  maximumQmax: { value: 4190, unit: "mAh", source: "direct" },
  qmaxCells: [
    { cell: 0, value: 4190, unit: "mAh", source: "direct" }
  ],
  charging: {
    adapterPowerCategories: [15, 39, 45],
    connection: "wired"
  }
}
```

The values above illustrate the audited shape only. A real report would be
constructed from the current input and would not use hard-coded anchors.

The model would be optional. Each metric would be independently optional, with
no placeholder zero. Null and empty source values would be omitted. Capacity,
Qmax, cycle, and wattage scalars would be finite non-negative integers for the
initial contract; percentage would be finite and bounded from 0 through 100.
Floating-point values would be rejected unless a later corpus audit explicitly
approves them. Units would be stable display metadata: cycles, mAh, percent,
and recorded watts. The duration candidate would remain absent until its unit
and semantics are established.

Field order would be stable: maximum capacity, cycle count, Maximum FCC,
nominal charge capacity, Raw Maximum Capacity, Maximum Qmax, cell Qmax, then
the optional charging context. Every metric would carry direct origin metadata
internally; derived values would not be emitted in the initial user-facing
model.

## 6. Validation rules

Future extraction would:

- require exact approved event-family and field names;
- accept only expected scalar types, not numeric strings;
- reject null, empty, non-finite, negative, and out-of-range values;
- validate percentage as 0 through 100;
- validate cycle, capacity, Qmax, and wattage values as finite non-negative
  integers;
- preserve the observed value without converting mAh to Wh or changing encoded
  temperature, voltage, current, or duration values;
- omit a field rather than guess when its unit or meaning is unsupported.

Validation would be pure and bounded by the records already being parsed. It
would not retain raw values outside the approved scalar fields.

## 7. Duplicate resolution

The future resolver would collect recognized observations, record their source
family internally, and select at most one value for each normalized field. For
the observed corpus, a valid final-named snapshot would be preferred over the
secondary snapshot family because it occurred later and carried identical
values.

That preference would apply only when the family shape remains compatible with
the documented evidence. Identical duplicates would collapse to one value;
snapshot values would never be summed or averaged. A secondary family could
fill a missing field only when it did not conflict with a selected direct
value.

## 8. Conflict handling

Conflicting direct values would be retained as internal conflict metadata only.
If the documented final-source evidence is not sufficient to resolve the
conflict, the affected user-facing field would be withheld. The implementation
would not choose the largest, latest-looking, or most plausible number without
evidence.

A partial record could contribute a missing field when the value is valid and
non-conflicting. A null or invalid duplicate would not erase a valid selected
value, but a conflict between valid direct observations would remain visible to
internal diagnostics and absent from the user-facing section.

## 9. Sanitization

Sanitization would occur before report-model construction. The allowlist would
copy only validated battery and approved charging scalars. It would not copy
record blobs, raw nested objects, identifiers, incident references, carrier
data, app identities, configuration identifiers, raw paths, or hidden flags.

Source provenance could remain as non-exported internal metadata sufficient for
deterministic resolution and debugging. It would not be serialized into the
sanitized report unless a later privacy review explicitly approves a generic
source label.

## 10. Report presentation

The future section title would be `Battery and Charging` and would use the
existing continuous report-document presentation. Candidate rows, in stable
order, would be:

- Maximum Capacity;
- Cycle Count;
- Maximum FCC;
- Nominal Charge Capacity;
- Raw Maximum Capacity;
- Maximum Qmax;
- Cell Qmax;
- Detected Adapter Power;
- Charging Connection.

The section would appear only when at least one supported value exists. Partial
reports would show only the rows with safe values. Labels would describe
recorded observations and would not imply health or service conclusions.

Detected adapter power and agreed connection state would belong in the main
section. Power-mode observations, if later approved, would belong in an
optional `Charging Activity` subsection and would remain supporting context,
not a direct charger measurement. The duration candidate would remain deferred.

## 11. Search behavior

The future section would participate through the existing visible report search
path. Searchable content would be the sanitized section title, fixed labels,
and formatted values. Source event names, raw record text, internal source
metadata, and suppressed conflicts would not be searchable.

Exact-match highlighting and hidden-row behavior would follow the existing
`SectionModel` contract. No battery-specific search index or DOM-coupled search
logic would be introduced.

## 12. Text export

Text export would use the existing report serializer and include only the
visible sanitized battery section. It would preserve stable field order and
generic existing filenames. It would not include raw records, source paths,
conflict metadata, derived health ratios, or unsupported fields.

If the section is absent, the existing report text remains unchanged. The
existing Blob and object-URL lifecycle would remain unchanged.

## 13. JSON export

Structured export would include the optional normalized battery object only
after the model and schema contract are implemented and tested. It would use
the existing schema-version strategy, stable application field names, scalar
values, units, and direct-origin metadata approved for the sanitized contract.

Raw event objects, source identifiers, private paths, conflict internals, and
unsupported interpretations would be excluded. Absent metrics would be
omitted rather than represented as fabricated zeros. Generic existing
filenames and Blob/object-URL lifecycle would be preserved.

## 14. Comparison behavior

Battery fields would not enter comparison automatically. After the normalized
section is stable, a future slice could add an explicit fixed-field allowlist
using the existing comparison semantics for same-family reports. Missing values
would retain the existing `Not present` behavior.

Comparison would use direct sanitized values only. It would not compare raw
records, event provenance, suppressed conflicts, derived ratios, adapter model
identifiers, or unsupported power-mode interpretations.

## 15. Raw Local View boundary

Raw Local View would remain a separate opt-in diagnostic boundary. Battery
support would not add a raw-event section, expose the private sample, or make
raw battery fields eligible for sanitized text/JSON export. Existing Raw Local
View restrictions, privacy mode behavior, and export disablement would remain
authoritative.

## 16. Accessibility

The section would use the existing semantic report structures: a heading for
the section, label/value rows or a semantic table for repeated cell values, and
plain text units. It would remain usable with keyboard navigation, narrow
layouts, reduced motion, and contrast settings.

No meaning would depend on color, position, gauges, icons, grades, or red/green
state. A withheld or unavailable value would be represented by omission or the
existing neutral absence semantics rather than a visual warning.

## 17. Empty and unsupported states

No supported values would mean no battery section. A partial recognized report
would show only valid direct rows. Unsupported families, unknown units, null
values, invalid scalars, and unresolved conflicts would be omitted without
inventing a replacement label.

The product would not display “healthy,” “degraded,” “service required,” or
similar judgments when evidence is absent or ambiguous.

## 18. Error handling

Malformed lines and unrelated records would continue through the existing
parser error-tolerance behavior. A battery extraction failure would be scoped
to the optional battery result and would not invalidate otherwise supported
CoreAnalytics sections.

The user-facing behavior for unsupported battery evidence would be omission,
not a diagnostic warning. Internal test diagnostics may identify a rejected
shape without exposing source records.

## 19. Testing strategy

Before implementation is considered complete, focused local tests should cover:

- each exact approved field and scalar type;
- absent, null, empty, malformed, non-finite, negative, and out-of-range values;
- identical, partial, final-preferred, and conflicting duplicates;
- missing event families and no-section behavior;
- direct percentage precedence over any derived-ratio candidate;
- sanitized report/search/text/JSON boundaries;
- comparison allowlist and missing-value semantics;
- Raw Local View separation;
- hostile scalar text handling and existing parser regressions.

The private sample must not become a committed fixture. Sanitized synthetic
records or approved scrubbed examples should cover risk cases that the current
corpus lacks.

## 20. Performance expectations

The future extractor should make one bounded pass over the records already
visited by CoreAnalytics parsing, with fixed-size allowlists and no additional
network, persistence, or cloud work. It should not materially change existing
parse complexity or duplicate the full input in memory.

Performance claims would be verified with the repository’s existing test and
workload checks after implementation. Slice 21A adds no runtime behavior.

## 21. Privacy review

The feature would remain local-first and privacy-first: no uploads, backend,
analytics, cloud storage, or report persistence. The review gate would confirm
that only allowlisted scalar metrics reach the normalized model and that search,
copy, text export, JSON export, and comparison cannot leak raw analytics data.

The private positive sample would remain ignored and local. No identifier,
UUID, incident value, carrier value, or unrelated telemetry would be placed in
fixtures or documentation.

## 22. Future diagnostics boundary

Thermal interpretation, charging faults, overheating, throttling, battery
damage, service recommendations, advanced raw histograms, undocumented charge
algorithms, and broad device diagnostics would remain deferred to v2.2.0 or
later. `PowerModesDailyEngagement` would remain supporting context until its
semantics and units are established.

Slice 21B would be the next implementation slice, but it has not started.
Slice 21A is complete and frozen as documentation-only research and planning.
