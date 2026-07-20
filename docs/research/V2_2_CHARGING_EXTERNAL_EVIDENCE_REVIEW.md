# v2.2.0 - Charging Evidence and Power Context

## Phase 22A.1 - External Charging Evidence Research

Status: External evidence review; research only; production implementation not
started.

Access date: 2026-07-20.

Current decision: Approach C - research-only deferral.

22B readiness decision: **Still blocked pending stronger evidence**.

No charging field is retained by this review. The original Phase 22A local
evidence findings remain in force and are not replaced by this document.

## 1. Question

Phase 22A identified plausible charging candidates but could not establish the
exact CoreAnalytics event-family meaning, units, lifecycle, duplicate behavior,
conflict behavior, or precedence needed for safe presentation. This review asks
whether authoritative or technically credible public evidence resolves those
blockers for:

- `AdapterDetails.bucketed_Watts`;
- `AdapterDetails.isWireless`;
- `PowerModesDailyEngagement.PowerMode`;
- `PowerModesDailyEngagement.daily_total_Duration`; and
- exact charging-state, external-power, voltage, current, power, and charging-
  session fields, if public evidence identifies any.

The question is not whether a field name has a plausible interpretation. The
question is whether an exact field can be safely normalized and presented as a
direct observation from supported `.ips.ca.synced` CoreAnalytics records.

## 2. Method

### Source hierarchy

Evidence was ranked as follows:

1. Apple Developer documentation, Apple open-source code, headers, schemas,
   and framework interfaces.
2. Established open-source diagnostic or device-analysis tools that parse the
   relevant Apple surface and document their contract.
3. Independent technical research with reproducible evidence.
4. Forums, public report hosts, gists, repair pages, and other research leads.

Tier 4 material was used only to suggest searches. It was not used to justify
any verdict or to establish a field meaning.

### Search method

The exact identifiers were searched individually and in combinations with:

- `CoreAnalytics`, `iOS analytics`, `Apple analytics`, `ips.ca.synced`, and
  `iPhone`;
- unit-related terms such as `watts`, `voltage`, `current`, `power`,
  `seconds`, `milliseconds`, `minutes`, and `duration`;
- event-family, snapshot, aggregate, session, duplicate, precedence, and
  conflict terms; and
- case and spelling variants, including underscore and duration-name
  variants.

Public GitHub code-search pages were attempted for the exact identifiers. The
browser could not load the global code-search result pages because of cache or
authentication limitations. Public repository search, direct GitHub repository
pages, and direct source inspection were still performed. The Appium source
found during that search is a separate advanced battery endpoint, not a parser
for the target CoreAnalytics records.

### Privacy controls

No local or public diagnostic report was downloaded, copied, bundled, or added
to the repository. Public-report search hits with unclear consent or provenance
were not used as evidence. No identifiers, UUIDs, serial numbers, device names,
paths, account data, carrier data, timestamps, or complete records are retained
here. Only field and event-family names, source descriptions, and generalized
evidence status are recorded.

The private local sample was not available in the checkout. Historical local
findings are used only as the prior Phase 22A baseline; they are not treated as
publicly verified evidence.

### Retain threshold

A candidate could move to `retain` only if public evidence established all of
the following for the exact CoreAnalytics field and family:

- direct meaning and exact field identity;
- stable scalar type and known unit, or a safely unitless state;
- snapshot, aggregate, category, or event semantics;
- record lifecycle and platform scope;
- privacy-safe value boundary;
- deterministic duplicate, conflict, and precedence behavior; and
- a user-facing label that does not overstate the observation.

At least one Tier 1 source or multiple genuinely independent strong Tier 2
sources were required. Copies, mirrors, forks, and multiple reports with the
same uncertain provenance were counted as one lead, not independent evidence.

## 3. Search coverage

### Exact identifiers

The following exact identifiers were searched:

- `AdapterDetails`;
- `bucketed_Watts`;
- `isWireless`;
- `PowerModesDailyEngagement`;
- `PowerMode` with `PowerModesDailyEngagement`;
- `daily_total_Duration`;
- `BatteryConfigValueHistogram_WithAllSafetyKeys_V2`;
- `BatteryConfigValueHistogramFinal_V2`;
- `BHUI_NCC_iOSwatchOS`; and
- `ips.ca.synced` combined with `AdapterDetails`, `bucketed_Watts`,
  `isWireless`, and `PowerModesDailyEngagement`.

### Concept searches

The following exact or near-exact concept searches were also performed:

- CoreAnalytics charging state field;
- CoreAnalytics external power field;
- CoreAnalytics charger power;
- CoreAnalytics charging voltage;
- CoreAnalytics charging current;
- CoreAnalytics wireless charging;
- CoreAnalytics adapter details;
- iOS Analytics Data `AdapterDetails`;
- charging session boundaries;
- charging fault and interruption fields; and
- thermal context associated with charging.

Each concept was also combined with Apple, iOS, iPhone, `.ips.ca.synced`,
units, and field/schema terms where useful.

### Source classes and repositories reviewed

- Apple Developer documentation for `UIDevice`, `UIDeviceBatteryState`,
  `IOPowerSources`, and I/O Kit power-source keys.
- Apple open-source distribution indexes and the public
  `apple-oss-distributions/PowerManagement` repository.
- The established `appium/appium-xcuitest-driver` repository, including its
  `mobile: batteryInfo` documentation and advanced battery type definitions.
- A technical CoreAnalytics artifact analysis from CrowdStrike, used only for
  general artifact and lifecycle boundaries because it covers macOS rather
  than the target iOS event families.
- GitHub global code-search attempts, public repository search results, and
  public report-host, gist, forum, and technical-blog search leads.

### Searches producing no useful evidence

The following searches produced no authoritative or strong independent source
that defined the target field:

- `"bucketed_Watts"` with Apple, iOS, CoreAnalytics, units, or charging terms;
- `"PowerModesDailyEngagement"` with Apple, CoreAnalytics, iOS, units, or
  charging terms;
- `"daily_total_Duration"` with Apple or CoreAnalytics terms;
- `"iOS Analytics Data" "AdapterDetails"`;
- `"ips.ca.synced"` combined with each of the four exact candidate names;
- exact GitHub code-search pages for `bucketed_Watts`,
  `PowerModesDailyEngagement`, `AdapterDetails` with CoreAnalytics, and
  `isWireless` with `AdapterDetails`; and
- exact charging-state, external-power, voltage, current, power, and session
  searches scoped to CoreAnalytics.

Search results did expose public report pages, gists, forums, and unrelated
duration fields. Those results were research leads only. They did not provide a
verifiable schema, unit definition, provenance chain, cross-platform corpus,
or duplicate/conflict rule and are therefore not source evidence for retain.

## 4. Source register

All URLs in this register were opened and inspected on 2026-07-20. No raw
diagnostic content from any source is reproduced here.

| Source | Source type and date | Accessed | Tier | Independence | Relevant field or family | Direct finding | Limitation | Verdict impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [UIDevice](https://developer.apple.com/documentation/uikit/uidevice) and [UIDeviceBatteryState](https://developer.apple.com/documentation/uikit/uidevicebatterystate) | Apple Developer documentation; current page, publication date not exposed | 2026-07-20 | 1 | Independent Apple public API surface; same publisher as the I/O Kit sources | Public battery state | Apple documents a public battery state surface with unknown, unplugged, charging, and full states, plus a separate battery-level property. | It documents an app-facing API, not private CoreAnalytics records, `AdapterDetails`, or any `.ips.ca.synced` lifecycle. | Establishes a generic state vocabulary only; no Phase 22 field moves. |
| [IOPowerSources.h](https://developer.apple.com/documentation/iokit/iopowersources_h), [IOPSKeys.h defines](https://developer.apple.com/documentation/iokit/iopskeys_h/defines), and [kIOPSIsChargingKey](https://developer.apple.com/documentation/iokit/kiopsischargingkey) | Apple Developer documentation; current pages, publication dates not exposed | 2026-07-20 | 1 | Independent public API surface, but not independent provenance from the other Apple documentation rows | Public power-source state, current, voltage, and adapter-watt keys | Apple documents a public I/O Kit power-source interface and typed keys for power-source state and electrical properties, including charging state and adapter-related values. | This is a public system power-source interface, primarily documented for a different data surface; it does not define the target CoreAnalytics family, report aggregation, or precedence. | Confirms that explicit meanings can exist in a documented API, but does not transfer those meanings to same-named analytics fields. No Phase 22 field moves. |
| [Apple OSS Distributions](https://github.com/apple-oss-distributions/PowerManagement) and the public [PowerManagement repository](https://github.com/apple-oss-distributions/PowerManagement) | Apple open-source repository; current public repository, date not used | 2026-07-20 | 1 | Same Apple publisher as the Apple Developer sources; not an independent definition of private analytics | Apple power-management implementation context | The public Apple source distribution exposes power-management source repositories, but the reviewed public repository index did not provide the target CoreAnalytics field names or a `.ips.ca.synced` schema. | Public source availability for power management is not evidence that private analytics event families share its keys or units. | Supports separating public power APIs from private analytics evidence; no field moves. |
| [Appium `mobile: batteryInfo` documentation](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/execute-methods.md) | Established open-source iOS automation tool; current `master`, date not exposed | 2026-07-20 | 2 | Same repository and maintainer group as the Appium type definitions; one source family | Battery state and advanced battery endpoint | Appium documents a real-device battery endpoint with basic level/state data and optional advanced fields on newer iOS versions. | The endpoint is not a CoreAnalytics report parser. Its availability and advanced-field set vary by device and OS; it does not document Phase 22 record lifecycle or `.ips.ca.synced` precedence. | Useful boundary evidence only; no CoreAnalytics candidate moves. |
| [Appium advanced battery type definitions](https://github.com/appium/appium-xcuitest-driver/blob/master/lib/commands/advanced-battery-types.ts) | Established open-source source code; current `master`, date not exposed | 2026-07-20 | 2 | Same Appium source family as the documentation row; not independent confirmation | `AdapterDetails`, adapter, charger, and battery fields | The separate endpoint has typed fields named `AdapterDetails`, `AdapterVoltage`, `Current`, `IsWireless`, `Watts`, `ChargingCurrent`, `ChargingVoltage`, `ExternalConnected`, and `IsCharging`. | The file defines a TypeScript shape, not units, provenance, CoreAnalytics family identity, snapshot/aggregate semantics, duplicate behavior, or conflicts. `Watts` is not `bucketed_Watts`. | Confirms that similar names exist on another Apple-device data surface; it does not establish semantics for the target fields. All candidates remain unchanged. |
| [I Know What You Did Last Month: A New Artifact of Execution on macOS 10.13](https://www.crowdstrike.com/en-us/blog/i-know-what-you-did-last-month-a-new-artifact-of-execution-on-macos-10-13/) | Independent technical artifact analysis; 2018-07-24 | 2026-07-20 | 2 | Independent of Apple and Appium, but a different platform and artifact family | CoreAnalytics record and aggregate lifecycle | The analysis describes different CoreAnalytics subsystems with different record shapes, daily diagnostic periods, staging aggregates, and cautious field interpretation. It explicitly distinguishes observed structure from meanings described only as likely. | It analyzes macOS 10.13 execution artifacts, not iOS charging families or the target fields. | Reinforces that event-family lifecycle and field meaning must be proven per family; no candidate moves. |

The UNPKG copy of the Appium type file was not counted separately from the
GitHub source. Public report hosts, gists, forums, and technical blogs were not
counted as evidence because their report provenance, consent, independence,
units, or schema definitions could not be established safely.

## 5. Field-by-field findings

### `AdapterDetails.bucketed_Watts` - insufficient evidence

No public source defines this exact field. Apple documents an adapter-watt key
in a public I/O Kit power-source API, and Appium exposes a separate numeric
`Watts` property, but neither source names or defines `bucketed_Watts`.

The external review therefore cannot determine whether the value is a literal
watt measurement, a bucket/category, a range boundary, adapter capability,
negotiated power, or an observation of power delivered at a particular time.
The scalar type observed locally does not resolve that distinction. Snapshot
versus session semantics, cross-platform stability, duplicate handling, and
conflict precedence remain unknown. Verdict: `insufficient evidence`.

### `AdapterDetails.isWireless` - insufficient evidence

Appium's separate advanced battery type surface uses a boolean `IsWireless`
field, but that does not establish that the CoreAnalytics field has the same
origin or lifecycle. Apple’s public `UIDevice` battery-state documentation
distinguishes charging state from unplugged state but does not define wired,
Qi, MagSafe, USB, dock, or accessory classification for CoreAnalytics.

There is no strong independent CoreAnalytics corpus establishing a true value,
the meaning of false outside an active charging observation, or behavior when
records disagree. False cannot safely be presented as wired without that
lifecycle evidence. Verdict: `insufficient evidence`.

### `PowerModesDailyEngagement.PowerMode` - insufficient evidence

No Apple documentation, public schema, or independent parser reviewed defines
this exact event family and field. The name does not establish whether the
subsystem describes charging, battery preservation, system performance, user
settings, or generic device engagement. No stable enum, allowed-value set,
record origin, or conflict rule was found.

Presenting the value in Battery and Charging would require an unsupported
interpretation of “power mode.” Verdict: `insufficient evidence`.

### `PowerModesDailyEngagement.daily_total_Duration` - insufficient evidence

Exact searches found unrelated fields with similar duration names and public
report search leads, but no credible source defines the unit or interval for
this exact field. Seconds, milliseconds, minutes, ticks, and another aggregate
measure remain possible. The external evidence does not establish whether the
value is per mode, per day, per record, cumulative, or an engagement total, and
does not define null behavior or precedence against similarly named fields.

The duration name is therefore not a safe basis for conversion or a user-facing
label. Verdict: `insufficient evidence`.

### Charging-state concept - insufficient evidence

Apple’s public `UIDeviceBatteryState` and I/O Kit charging-state keys establish
that Apple has documented charging-state concepts on public APIs. They do not
identify an exact charging-state field in the supported CoreAnalytics records.
No exact event family, scalar contract, record lifecycle, duplicate rule, or
precedence source was found. Verdict: `insufficient evidence`.

### External-power concept - insufficient evidence

The Appium type definitions include `ExternalConnected` on a separate advanced
battery surface, and Apple’s I/O Kit documentation describes power-source
state. Neither establishes an exact `.ips.ca.synced` external-power field or
whether it is a current snapshot, daily aggregate, accessory state, or a
historical observation. Verdict: `insufficient evidence`.

### Voltage concept - insufficient evidence

Apple documents voltage keys in the public I/O Kit power-source surface, and
Appium exposes several voltage-named fields. The exact CoreAnalytics field,
origin, unit scale, range, and snapshot or aggregate semantics remain
unverified. Cross-surface name similarity is not sufficient to label a value in
volts. Verdict: `insufficient evidence`.

### Current concept - insufficient evidence

The same-surface problem applies to current. Public APIs and the Appium type
file show that current-valued battery data can exist, but no reviewed source
maps a current-named field to a supported CoreAnalytics charging record with a
known unit and lifecycle. Verdict: `insufficient evidence`.

### Power concept - insufficient evidence

The only exact local candidate is `bucketed_Watts`; the external sources expose
other-surface adapter or power-source fields, not its bucket semantics. No
exact instantaneous, session, negotiated, maximum, or aggregate power field
with a proven unit was established. Verdict: `insufficient evidence`.

### Charging-session concept - insufficient evidence

No exact public field or event family establishes charging-session start,
stop, boundary, or duration semantics. Daily records and fields named for
duration do not prove sessions. No duplicate, overlap, interruption, or
conflict rule can be defined. Verdict: `insufficient evidence`.

## 6. Event-family findings

| Event family or family group | External finding | Lifecycle and semantics status | Support verdict |
| --- | --- | --- | --- |
| `AdapterDetails` | The exact CoreAnalytics family was not defined by any authoritative source. A separate Appium endpoint exposes an `AdapterDetails` TypeScript object, and public macOS power-source tooling uses similar names. | Cross-surface identity is unproven; snapshot, aggregate, and active-connection semantics are unresolved. | `insufficient evidence` for the candidate fields; no implementation. |
| `PowerModesDailyEngagement` | No authoritative documentation or independent parser defining the family was found. | Daily engagement wording does not establish charging origin, allowed values, or precedence. | `insufficient evidence`; do not present as charging context. |
| `BatteryConfigValueHistogram_WithAllSafetyKeys_V2`, `BatteryConfigValueHistogramFinal_V2`, and `BHUI_NCC_iOSwatchOS` | These remain the frozen v2.1 battery baseline. External research did not establish them as charging sources. | Existing battery snapshot semantics and precedence remain frozen by the repository plan; no charging extension is authorized. | Frozen battery baseline; not a new charging source. |
| Charging-named search leads such as `BatteryUISmartCharging`, `BatteryUISmartChargingv2`, `SlowChargingReason`, `UnpluggedDurationEnergyViewNew`, and other charging-named families | Public searches surfaced names in report-host or log material, but no reliable public schema, provenance chain, or independent parser established their field meanings. | Lifecycle, source ownership, units, privacy boundary, and user-facing meaning are unresolved. | `reject` as unsupported Phase 22 sources until separately proven; names alone are not evidence. |
| Public power and battery APIs | Apple documents public power-source and battery-state surfaces; Appium documents a separate advanced-device endpoint. | These surfaces have their own contracts and cannot be treated as CoreAnalytics event families. | Supporting boundary evidence only; no Phase 22 field moves. |
| Thermal and diagnostic families | Appium’s separate type surface and search leads include thermal, charging-limit, and diagnostic names. | No exact charging-family mapping or safe user-facing interpretation was established. | `reject`; thermal interpretation and diagnostic presentation remain out of scope. |
| General CoreAnalytics artifact family | Independent macOS research shows that different subsystems can write different record shapes and that some meanings remain only likely without stronger validation. | Useful general caution, not an iOS charging schema. | Supports the evidence gate; no field moves. |

## 7. Independence analysis

- Apple Developer pages and Apple open-source repositories share Apple
  provenance. They are independent public surfaces for different purposes, but
  they are not multiple independent definitions of the private CoreAnalytics
  schema.
- Appium’s documentation and its TypeScript definitions are two files in one
  repository and one toolchain. They count as one strong technical source
  family, not two independent confirmations.
- The UNPKG copy of the Appium file is a package mirror and was not counted
  separately.
- Public report-host pages, gists, forum posts, and copied technical articles
  were treated as leads only. Multiple pages showing similar report-shaped
  content may derive from the same report or copied explanation; provenance
  and consent could not be established.
- The CrowdStrike analysis is independent of Apple and Appium, but it covers
  macOS execution artifacts. Its value here is the documented caution about
  family-specific lifecycle and inferred semantics, not a charging-field
  definition.

No set of genuinely independent sources established the exact CoreAnalytics
fields, units, lifecycle, or precedence required by the retain threshold.

## 8. Updated evidence matrix

The following matrix combines the original Phase 22A local-evidence verdict
with the external review. No original local finding is removed.

| Candidate | Prior verdict | New external evidence | Evidence tier | Semantics status | Unit status | Lifecycle status | Precedence status | Privacy status | Updated verdict | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AdapterDetails.bucketed_Watts` | `insufficient evidence` | Public Apple and Appium sources define other-surface watt fields only. | 1-2, non-mapping | Exact bucket meaning is unknown. | Unknown for this field. | Snapshot/category/session role unknown. | No deterministic rule. | Potentially safe only after strict allowlist; source metadata excluded. | `insufficient evidence` | Same-name fields on other surfaces do not prove literal watts or bucket semantics. |
| `AdapterDetails.isWireless` | `insufficient evidence` | Appium has a boolean on a separate endpoint; Apple public state docs do not map wired/wireless to CoreAnalytics. | 1-2, non-mapping | Active connection meaning unproven. | Unitless but lifecycle unknown. | Current, historical, or daily observation unknown. | No rule for duplicates/conflicts. | Boolean could be safe only after origin is proven. | `insufficient evidence` | False cannot be labeled wired without positive and lifecycle evidence. |
| `PowerModesDailyEngagement.PowerMode` | `insufficient evidence` | No authoritative definition or independent parser found. | None useful | Charging relation and enum set unknown. | Unitless not enough. | Daily engagement role only from local evidence. | None. | Arbitrary strings are not safe to expose. | `insufficient evidence` | The name does not prove charging context. |
| `PowerModesDailyEngagement.daily_total_Duration` | `insufficient evidence` | Searches found unrelated duration names and unverified report leads only. | None useful | Aggregate interval meaning unknown. | Unknown. | Per-day/per-mode/per-record meaning unknown. | Null and conflicts unresolved. | Scalar alone does not make it safe. | `insufficient evidence` | Conversion or labeling would require guessing. |
| Unverified charging-state fields | `insufficient evidence` | Apple documents public state APIs, but no exact CoreAnalytics field was found. | 1, non-mapping | Exact field identity absent. | Unitless only if exact state is proven. | Unknown. | Unknown. | Unknown until exact source is known. | `insufficient evidence` | A concept without an exact field is not implementable. |
| Unverified external-power fields | `insufficient evidence` | Apple I/O Kit and Appium expose other-surface power-state fields. | 1-2, non-mapping | Exact CoreAnalytics origin absent. | Unitless candidate, unproven. | Unknown. | Unknown. | Unknown until exact field is known. | `insufficient evidence` | Cross-surface evidence cannot establish report semantics. |
| Unverified voltage fields | `insufficient evidence` | Public I/O Kit and Appium expose voltage names on different surfaces. | 1-2, non-mapping | Exact source field absent. | Unit scale unknown for target field. | Unknown. | Unknown. | Numeric value does not remove source risk. | `insufficient evidence` | No safe volts label can be established. |
| Unverified current fields | `insufficient evidence` | Public I/O Kit and Appium expose current names on different surfaces. | 1-2, non-mapping | Exact source field absent. | Unit scale unknown for target field. | Unknown. | Unknown. | Numeric value does not remove source risk. | `insufficient evidence` | No safe current-unit label can be established. |
| Unverified power fields other than `bucketed_Watts` | `insufficient evidence` | No exact CoreAnalytics field with proven rate or aggregate semantics found. | None useful | Instantaneous/capability/aggregate role unknown. | Unknown. | Unknown. | Unknown. | Unknown. | `insufficient evidence` | No direct power observation is proven. |
| Unverified charging-session fields | `insufficient evidence` | No public source identifies exact session boundaries. | None useful | Start/stop semantics absent. | Unknown. | Session lifecycle absent. | Overlap/conflict rules absent. | Unknown. | `insufficient evidence` | Daily aggregation is not a session contract. |
| Adapter model | `reject` | No external evidence made source identity privacy-safe or user-meaningful. | None useful | Not needed for direct evidence. | Unitless. | Not relevant. | Not relevant. | May expose hardware identity or source metadata. | `reject` | Keep outside the milestone. |
| Manufacturer | `reject` | No external evidence changed the privacy concern. | None useful | Not needed for direct evidence. | Unitless. | Not relevant. | Not relevant. | May expose identifying source metadata. | `reject` | Keep outside the milestone. |
| Thermal telemetry | `reject` | Separate APIs and search leads expose thermal names, not a safe charging interpretation. | 1-2, non-mapping | Diagnostic meaning would invite inference. | Varies/unknown. | Charging relationship unknown. | Unknown. | Diagnostic and contextual risk. | `reject` | Thermal interpretation is out of scope. |
| Guessed duration aliases | `reject` | No source established that similarly named duration fields are aliases. | None useful | Alias relationship unproven. | Unknown. | Unknown. | Unknown. | Unknown. | `reject` | Do not broaden field matching by name similarity. |
| Low-power-mode fields | `reject` | Public battery/power state APIs do not make low-power mode a charging observation. | 1, non-mapping | Charging relation absent. | Unitless but unrelated. | Unknown. | Unknown. | Low-to-medium; still outside scope. | `reject` | Do not present low-power mode as charging state. |
| Charging-fault concepts | `reject` | No safe direct fault field or non-diagnostic public mapping found. | None useful | Would require diagnosis. | Unknown. | Unknown. | Unknown. | High diagnostic/privacy risk. | `reject` | Fault diagnosis is explicitly out of scope. |
| Unsupported charging event families | `reject` | Charging-named public search leads lacked schemas and provenance. | None useful | Family identity and semantics unproven. | Unknown. | Unknown. | Unknown. | Raw family metadata must not be exposed. | `reject` | Do not add parser families from names alone. |

## 9. Architecture decision

Approach C remains recommended.

- Approach A is not approved because the external evidence does not establish
  that charging candidates share the frozen v2.1 battery lifecycle or
  precedence rules.
- Approach B remains the conditional future runtime architecture if a later
  evidence audit produces at least one retained field. Its separate charging
  model would better isolate materially different event families, but no model
  is approved now.
- Approach C is the only supported current decision because no candidate meets
  the complete retain threshold. It preserves every frozen v2.1.0 behavior and
  avoids misleading presentation.

No production parser, normalizer, model, attachment, renderer, export,
comparison path, test fixture, service-worker asset, or PWA behavior is changed
or authorized by this review.

## 10. 22B readiness decision

**Still blocked pending stronger evidence**

Slice 22B must not begin. Before separate 22B planning approval, evidence must
identify an exact supported CoreAnalytics field and family, establish its
meaning, type, unit or safe unitless boundary, lifecycle, privacy boundary,
duplicate behavior, conflict suppression, and precedence. A synthetic corpus
must then be designed from the approved contract, not from private or
uncertain public reports.

## 11. Limitations

- Apple’s public documentation does not document the private CoreAnalytics
  event families or the exact candidate fields under review.
- Apple Developer documentation pages require JavaScript in this research
  browser; their public page descriptions were inspected, but they do not
  expose a private `.ips.ca.synced` schema.
- Global GitHub code-search result pages were inaccessible in this browser;
  direct public repository pages and web-scoped repository searches were used
  instead.
- The Appium evidence is a separate advanced battery endpoint and does not
  establish CoreAnalytics report semantics or units.
- Public report hosts and log gists had uncertain provenance, privacy status,
  or consent and were not treated as evidence.
- No independent, privacy-approved public sample set established wireless-
  positive values, conflicting records, duplicate behavior, or precedence.
- The private local sample was unavailable, so its contents could not be
  reverified during this external review.
- Platform variation between public iOS APIs, macOS I/O Kit, Appium/XCTest,
  and private CoreAnalytics records cannot be separated from the available
  sources.
- No external source established a safe user-facing label for any candidate.

## 12. Final conclusion

### Facts established

- Apple publicly documents battery-state and power-source APIs with explicit
  concepts and, for those APIs, typed state or electrical properties.
- An established open-source iOS automation tool exposes a separate advanced
  battery surface containing typed adapter, charging, voltage, current, and
  external-connection names.
- Independent CoreAnalytics research shows that subsystem-specific record
  shapes and lifecycle matter, and that plausible field meanings may remain
  only likely without stronger validation.
- No reviewed public source maps those public or open-source surfaces to the
  exact Phase 22 CoreAnalytics event families and fields.

### Reasonable but unapproved hypotheses

- `bucketed_Watts` may be related to an adapter-power category or a value
  derived from an adapter observation.
- `isWireless` may be a connection classification.
- `PowerMode` may describe a system or engagement mode rather than charging.
- `daily_total_Duration` may be a daily aggregate.

These hypotheses remain unapproved and must not be presented as meanings,
units, or implementation contracts.

### Unsupported interpretations

- `bucketed_Watts` is an instantaneous watt measurement, negotiated power,
  maximum adapter capability, or a range boundary.
- `isWireless: false` universally means wired charging or proves that charging
  is active.
- `PowerMode` is charging state or charging quality.
- Any duration field is seconds, milliseconds, minutes, or a charging-session
  duration.
- Any voltage, current, power, thermal, fault, or session concept can be
  derived from names or from a different Apple data surface.

### Evidence still needed

- A privacy-approved corpus containing the exact fields across multiple
  relevant iOS versions and device/accessory conditions.
- Authoritative Apple documentation, headers, schemas, or reproducible strong
  technical analysis that defines the exact event family and field.
- Evidence for scalar type, unit, lifecycle, snapshot/aggregate/category/event
  semantics, duplicate behavior, conflict behavior, and precedence.
- A privacy review proving that the retained value can be allowlisted and
  presented without identifiers, raw source metadata, diagnosis, or inference.

Until that evidence exists, the combined verdict remains: no retained fields,
Approach C, and 22B blocked. Phase 22 remains limited to Charging Evidence and
Power Context; no general diagnostics expansion is authorized.
