# v2.2.0 Next Milestone Candidate Audit

Status: Candidate audit complete
Recommendation: Provisional; user approval required
Phase 23 implementation: Not started
Access date for external sources: 2026-07-20

## 1. Status and decision boundary

This document audits possible implementation themes for the actual v2.2.0
release after the research-only closure of Phase 22. It does not approve a
theme, create a Phase 23 plan, or authorize implementation.

The provisional recommendation is:

- v2.2.0 theme: CoreAnalytics Investigation Depth
- Phase 23 title: Bounded CoreAnalytics Investigation
- fallback: Evidence-Bounded Panic Guidance

The recommendation is subject to explicit user approval. Until approval,
v2.2.0 remains unreleased, Phase 23 remains unassigned, and no production work
may begin.

## 2. Current project baseline

The released v2.1.0 baseline provides:

- a static browser application using browser-native ES modules;
- local-only, memory-only report processing;
- independent parser families behind the existing parseInput and SectionModel
  contracts;
- sanitized output by default and an opt-in Raw Local View;
- deterministic search, exact-match navigation, copy, text export, JSON export,
  and sanitized-only comparison;
- a privacy-safe Battery and Charging section containing only approved direct
  battery observations;
- a bounded CoreAnalytics parser that already produces summary,
  configuration, record-overview, event-type, capped-sample, and parser-note
  sections;
- a CoreAnalytics view model with bounded facets for values already rendered;
- synthetic examples and corpus workloads suitable for parser, privacy, and
  performance regression tests.

Phase 22 then completed the local and external charging evidence review. No
charging field met the retain threshold. Approach C remains final for Phase
22, 22B through 22F did not start, and charging implementation remains
deferred. The v2.2.0 version number is still available for a separate
implementation milestone.

## 3. Selection principles

The audit uses these principles:

- evidence first;
- privacy first;
- deterministic behavior;
- bounded scope;
- local-only architecture;
- safe fictional or authoritative fixtures;
- no speculative interpretation;
- no backend, uploads, telemetry, persistence, or cloud processing;
- no weakening of sanitized-by-default behavior;
- no changes to frozen parser, search, export, comparison, Raw Local View,
  accessibility, or PWA contracts without explicit approval.

An existing parser or UI surface is evidence of implementation fit, not proof
that every source field has a user-facing meaning. A candidate must still pass
the evidence and privacy gates in its own 23A audit.

## 4. Candidate inventory

The following candidates were reviewed:

1. Bounded CoreAnalytics Investigation
2. App Usage Metrics
3. Wi-Fi Connectivity Insights
4. Diagnostic Request Support
5. Accessory or Firmware Diagnostics Expansion
6. MetricKit Diagnostic Support
7. Evidence-Bounded Panic Guidance
8. Confidence-Based Diagnostic Rules
9. Additional Comparison Mode
10. Additional Local Export or Sharing Format
11. Sysdiagnose File Discovery or Extraction

The first candidate is the already documented roadmap direction for deeper
CoreAnalytics drill-down using parsed and capped data, without rendering full
raw JSON bodies by default. It is not a new product direction.

## 5. Method and external research

### Local review

The review read the project instructions, architecture and roadmap documents,
the Phase 21 and Phase 22 research, parser-family implementations, the
CoreAnalytics parser and view model, explanation and diagnostic modules,
comparison and export paths, service-worker allowlisting, test inventory,
synthetic corpus inventory, and bundled examples.

The local review found a working CoreAnalytics presentation and search path,
fictional CoreAnalytics fixtures, and existing performance workloads. It found
only classifier coverage, not supported parser contracts, for App Usage
Metrics, Wi-Fi Connectivity, and Diagnostic Request inputs.

### Internet and GitHub method

Searches used exact candidate and format names, relevant Apple API names,
CoreAnalytics terms, panic-report terms, browser file and compression terms,
and GitHub repository and code-search leads. Search-result snippets were used
only to identify pages. Every public URL cited below was opened and inspected.

The GitHub search pass included:

- MXDiagnosticPayload and MXCrashDiagnostic parser and JSON searches;
- CoreAnalytics parser and fixture searches;
- sysdiagnose browser, archive, and parser searches;
- exact Phase 22 charging identifiers carried forward from the prior external
  evidence review.

The exact Phase 22 charging identifiers produced no public source that
established the missing field contracts. No GitHub fork, mirror, gist, or
single public sample was counted as independent proof of an undocumented
format.

### Privacy controls

No public report was downloaded into the repository or converted into a
fixture. The research did not preserve identifiers, paths, account data,
network identity, hardware identity, timestamps, complete records, or unique
values. The private local sample was not inspected or copied for this audit.
Only generalized source findings and repository-level fixture facts are
recorded here.

### Evidence threshold and limitations

The evidence threshold is higher for a new parser family or a new source
semantic than for a bounded presentation of values the repository already
parses and sanitizes. The recommended CoreAnalytics candidate still requires
23A to prove that its proposed interaction uses only existing allowlisted
values and capped rows.

The external browser could not render the dynamic body of several Apple
Developer pages; those pages were opened, and their official page identity was
verified, but their dynamic text was not treated as a serialized fixture
definition. This limitation is recorded rather than filled with inference.

## 6. Source register

| Source | Source type | Tier | Relevant candidate or family | Direct finding | Limitation | Verdict impact |
| --- | --- | --- | --- | --- | --- | --- |
| [Understanding the exception types in a crash report](https://developer.apple.com/documentation/xcode/understanding-the-exception-types-in-a-crash-report) | Apple Developer documentation | Tier 1 | Panic Guidance Rules | Apple provides an official crash-report exception-classification topic. | The dynamic page did not expose a serialized panic fixture or a universal guidance rule. | Supports a narrow evidence review; does not authorize diagnosis. |
| [Analyzing a crash report](https://developer.apple.com/documentation/xcode/analyzing-a-crash-report) | Apple Developer documentation | Tier 1 | Panic Guidance Rules | Apple frames crash-report analysis as investigation of report evidence. | It does not establish that a report label proves a single root cause or repair action. | Supports cautious wording only. |
| [xnu osfmk/kern/debug.c](https://github.com/apple-oss-distributions/xnu/blob/main/osfmk/kern/debug.c) | Apple open-source code | Tier 1 | Panic Guidance Rules | The source contains kernel panic handling, panic-log state, and control flow. | It is not an iOS user-facing report schema and does not define application guidance. | Makes Panic Guidance possible only as source-fact navigation, not diagnosis. |
| [MXDiagnosticPayload](https://developer.apple.com/documentation/metrickit/mxdiagnosticpayload) | Apple Developer documentation | Tier 1 | MetricKit Diagnostic Support | Apple documents a MetricKit diagnostic-payload API surface. | The page does not provide an authoritative serialized fixture contract usable by this repository. | MetricKit remains deferred. |
| [MXCrashDiagnostic](https://developer.apple.com/documentation/metrickit/mxcrashdiagnostic) | Apple Developer documentation | Tier 1 | MetricKit Diagnostic Support | Apple documents a bounded crash-diagnostic object within MetricKit. | No supported local input format, version matrix, or safe fixture contract was established. | MetricKit remains deferred. |
| [fetchCurrent(completionHandler:)](https://developer.apple.com/documentation/networkextension/nehotspotnetwork/fetchcurrent%28completionhandler%3A%29) | Apple Developer documentation | Tier 1 | Wi-Fi Connectivity Insights | Apple exposes a platform API for current hotspot-network context. | It is an entitled runtime API, not a CoreAnalytics report schema; network identity remains sensitive. | Wi-Fi parser work remains deferred. |
| [How to put your iPhone in diagnostics mode](https://support.apple.com/en-ca/101944) | Apple Support documentation | Tier 1 | Diagnostic Request Support | Apple describes a user-triggered diagnostics-mode session used to identify potential hardware or software issues. | It does not define a serialized diagnostic-request file contract for this browser parser. | Diagnostic Request Support remains deferred. |
| [MetricKit MXDiagnosticPayload Integration](https://github.com/getsentry/sentry-cocoa/issues/1661) | Maintainer issue with implementation discussion | Tier 3 | MetricKit Diagnostic Support | The discussion distinguishes daily aggregate metric payloads from diagnostic payloads and describes JSON decoding work. | It is secondary, dated, and not an Apple schema or fixture guarantee. | Supporting context only; no readiness change. |
| [Sysdiagnose Analysis Framework](https://github.com/EC-DIGIT-CSIRC/sysdiagnose) | Established open-source analysis tool | Tier 2 | Sysdiagnose; accessory and broad diagnostics | The framework converts a large sysdiagnose archive into structured data and uses many parser and analysis modules. | It is a Python forensic framework with broad resource and privacy assumptions, not a browser contract for this project. | Strong evidence that sysdiagnose is too broad for this milestone. |
| [Compression Standard](https://compression.spec.whatwg.org/) | WHATWG web-platform specification | Tier 1 | Sysdiagnose archive inspection | The standard defines browser compression streams for formats such as brotli, deflate, and gzip. | It does not define ZIP or general archive traversal. | Browser capability does not remove the archive-scope blocker. |
| [CompressionStream constructor](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream/CompressionStream) | MDN web-platform reference | Tier 2 | Sysdiagnose archive inspection | MDN documents the browser CompressionStream API and its supported compression formats. | It is not an archive reader and does not define sysdiagnose contents. | Confirms that a ZIP or tar workflow would need additional code and limits. |
| [Using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications) | MDN web-platform reference | Tier 2 | Sysdiagnose file discovery | The File API supports user-selected files and browser-managed file reads. | It does not provide arbitrary local filesystem discovery or permission-free recursive inspection. | File discovery remains out of scope. |

### Source independence

The Apple Developer pages and Apple XNU source are independent primary sources,
but they describe different diagnostic layers. They do not combine into a
serialized report schema. The Sentry issue is not independent of Apple
documentation for MetricKit API facts; it is one secondary implementation
discussion and is counted only once. The Sysdiagnose Analysis Framework is an
independent Tier 2 implementation, but its breadth and Python runtime are
reasons to defer rather than evidence of browser compatibility. The WHATWG
specification and MDN page are related sources; the specification is primary
for supported compression formats and MDN is explanatory, not a second
independent format contract.

## 7. Evidence and feasibility matrix

The following two matrices together contain the complete requested evaluation.
Impact cells describe the expected boundary if a candidate were approved; no
listed impact is an implementation change in this task.

### Evidence and feasibility

| Candidate | Proposed user-facing value | Exact source format or parser family | Current repository evidence | External authoritative evidence | Fixture availability | Privacy risk | Identifier risk | Complexity and browser fit | Expected size and principal blockers | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bounded CoreAnalytics Investigation | More navigable inspection of already parsed and capped CoreAnalytics observations. | Existing CoreAnalytics .ips.ca.synced parser and CoreAnalytics view model. | Supported parser, bounded tables, facets, search path, fictional examples, and performance workloads already exist. | No new private-field semantics are required; Apple sources reviewed do not define this private report family. | Strong: existing fictional CoreAnalytics fixtures and synthetic workloads. | Low if existing allowlist, caps, sanitization, and raw-view boundary remain unchanged. | Medium if arbitrary future record values are exposed; requires explicit allowlist. | Medium; browser-native DOM and existing modules are sufficient. | One milestone. 23A must freeze exact detail scope and prove no raw or identifier leakage. | strong candidate |
| App Usage Metrics | Bounded app-usage observations without profiling. | Unsupported App Usage Metrics classifier candidate; exact serialized family not supported. | Classifier and unsupported message only; no parser, model, or safe fixture. | No authoritative serialized CoreAnalytics contract was found. | Weak; no repository fixture contract. | High for behavioral history and application data. | High for app, account, and path identity. | High; new family and privacy policy, although basic text parsing is browser-compatible. | Large for one milestone; missing schema, provenance, and safe value boundary. | defer |
| Wi-Fi Connectivity Insights | Direct connection-state context without network identity. | Unsupported Wi-Fi classifier candidate; exact report family not supported. | Classifier only; no parser or sanitized model. | Apple documents a runtime network API, not a CoreAnalytics report schema; network identity is sensitive. | Weak; no safe fictional schema based on authoritative fields. | High for location and network history. | High for network identity and hardware fingerprinting. | High; new family and filtering rules, with no external browser blocker for text input. | Large; missing report contract and privacy-safe lifecycle. | defer |
| Diagnostic Request Support | A bounded view of an Apple diagnostic-request record. | Unsupported Diagnostic Request classifier candidate; exact serialized family not supported. | Classifier and safe unsupported message only. | Apple Support documents a user-triggered diagnostics session, not a local report-file schema. | None suitable for implementation. | High; diagnostics may include sensitive device and session data. | High for request, device, and path identity. | High; new family and safe model required. | Large; no stable input contract or privacy boundary. | defer |
| Accessory or Firmware Diagnostics Expansion | Direct facts from one already evidenced accessory or firmware family. | Existing narrow AccessoryCrash boundary; broader family not supported. | AccessoryCrash parser exists, but broad expansion is intentionally unsupported. | No complete public schema and lifecycle contract for a bounded broader family was found. | Limited to existing accessory-crash fixtures; not enough for expansion. | Medium to high for hardware and accessory identity. | High for serial, accessory, and firmware identity. | High; new family boundaries and privacy rules. | Large; scope would broaden beyond the existing parser family. | defer |
| MetricKit Diagnostic Support | Sanitized crash, hang, CPU, or disk diagnostic summaries. | MetricKit MXDiagnosticPayload and subtype APIs. | No MetricKit parser or serialized fixture in the repository. | Apple documents APIs; the reviewed secondary source confirms JSON decoding work but not a repository-ready fixture contract. | None authoritative enough for implementation. | High for stack and app context. | High for app and binary identity. | High; new schema, version, and browser input contract. | Large; authoritative serialized fixture and privacy policy missing. | defer |
| Evidence-Bounded Panic Guidance | Neutral navigation from existing panic facts to narrowly proven context. | Existing panic parser and deterministic diagnostic-explanation layer. | Panic sections, fictional fixtures, and cautious generic explanation already exist. | Apple Xcode docs and XNU source support report investigation and panic-source context, not root-cause guidance. | Strong for parser behavior; rule fixtures still need independent fictional cases. | Medium; backtrace and system details must remain sanitized. | Medium to high for paths, addresses, and hardware names. | Medium; existing browser path, but rule semantics require careful review. | One milestone if strictly bounded. Rule evidence and diagnosis boundary are blockers. | possible candidate |
| Confidence-Based Diagnostic Rules | Consistent classification for known signatures. | Existing explanation layer; no independent confidence schema. | No confidence model or evidence-calibrated rule contract. | No authoritative scoring or confidence standard for this application was found. | Weak; fictional cases cannot prove confidence calibration. | High if users read scores as diagnoses. | Medium for source details. | High conceptual risk despite simple code. | Fails the no-speculative-interpretation gate. | reject |
| Additional Comparison Mode | One additional sanitized comparison workflow. | Existing same-parser, two-or-three-report comparison model. | Strong comparison implementation and tests exist, but current limits are deliberately narrow. | No external evidence establishes a required new comparison domain. | Strong for existing formats. | Low to medium if sanitized-only boundary survives. | Medium through additional recurring fields. | Medium; compatibility impact is larger than parser complexity. | One milestone possible, but user need and exact contract are not established. | defer |
| Additional Local Export or Sharing Format | Another local, privacy-safe representation. | Existing visible text and JSON export paths. | Strong existing export contracts and tests. | No external standard or demonstrated user requirement identifies a necessary third format. | Strong for current reports; new format fixtures would be invented. | Medium if sharing encourages broader disclosure. | Medium through schema expansion. | Low to medium code complexity; high contract maintenance. | Small technically, but low additive value and schema risk. | defer |
| Sysdiagnose File Discovery or Extraction | Inspect selected archive contents locally. | Sysdiagnose archive, tar/gzip or ZIP variants, many contained families. | Explicitly unsupported; no archive reader, extraction model, or resource contract. | SAF demonstrates broad multi-parser analysis; WHATWG and MDN do not provide general ZIP/archive support. | None safe and bounded enough for this repository. | Very high for system-wide data. | Very high for paths, accounts, network, and hardware identity. | Very high; browser and resource limits are material. | Exceeds one milestone and fails archive, fixture, and privacy gates. | reject |

### Compatibility and contract impact

| Candidate | Architecture impact | Parser impact | UI impact | Search impact | Copy impact | Export impact | Comparison impact | Raw Local View impact | Accessibility impact | PWA impact | Likely performance impact | Testability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bounded CoreAnalytics Investigation | Reuse existing CoreAnalytics workflow and internal view model. | None or a small allowlist-only adjustment after 23A. | Add bounded inspection affordances within the existing section. | Reuse exact visible facet and row search semantics. | Reuse visible-content copy. | None; retain text and JSON schemas. | None; do not add CoreAnalytics comparison. | None; keep source records out. | Extend existing semantic controls, focus, and status patterns. | None unless a new module is added; then update the explicit precache list. | Bounded row/facet scans and DOM only. | Very high with existing parser, fixtures, and harnesses. |
| App Usage Metrics | New parser family and sanitized model. | New parser and classifier branch. | New section or workflow. | New visible field semantics. | New visible content rules. | Potential schema expansion. | Potential new report compatibility. | New restrictions required. | New controls and privacy messaging. | New module and cache review. | Unknown; potentially high. | Low until a safe schema exists. |
| Wi-Fi Connectivity Insights | New parser family. | New report parser and state normalizer. | New section or event summary. | New state and time-window semantics. | New network-context copy rules. | Potential schema expansion. | Comparison impact likely. | New identifier restrictions. | New controls and warnings. | New module and cache review. | Unknown; potentially high. | Low without fixtures. |
| Diagnostic Request Support | New parser family with sensitive source boundary. | New parser and privacy sanitizer. | New diagnostic-request section. | New request fields. | New sensitive-content policy. | Potential schema expansion. | Likely incompatible with current comparison. | High new risk. | New warnings and controls. | New module and cache review. | Unknown. | Low without a format contract. |
| Accessory or Firmware Diagnostics Expansion | Broaden existing family boundaries. | New family or substantial expansion. | New fields and explanations. | New hardware/family semantics. | New privacy-safe visible path. | Potential schema expansion. | Unclear. | High restrictions. | New controls. | Likely module/cache work. | Medium to high. | Low to medium. |
| MetricKit Diagnostic Support | New parser family and report model. | New serialized decoder and version handling. | New diagnostic sections. | New diagnostic fields. | New stack and app-context limits. | Likely schema decisions. | Same-parser limit would exclude many comparisons. | High restrictions. | New controls. | New module and cache review. | Medium to high. | Low until fixtures exist. |
| Evidence-Bounded Panic Guidance | Reuse explanation layer and existing panic parser. | None if rules consume existing sanitized facts. | Small additions to existing explanation section. | Reuse generated explanation search. | Reuse visible explanation copy. | No schema change. | Same-parser behavior unchanged. | No raw expansion. | Reuse existing explanation semantics and caution text. | None if no new module. | Low. | High with fictional rule fixtures, subject to evidence. |
| Confidence-Based Diagnostic Rules | Explanation-layer expansion with a new scoring contract. | Minimal parser impact. | Scores or classifications alter user interpretation. | New score labels. | New interpretive copy. | No schema change, but visible meaning changes. | Comparison could be misconstrued. | No raw impact. | High communication burden. | None if existing assets. | Low code cost, high review cost. | Low because calibration is unproven. |
| Additional Comparison Mode | Comparison subsystem expansion. | No parser change. | New setup/results states. | New comparison field navigation. | New comparison copy. | Comparison output may affect visible exports. | Direct contract change. | Must remain sanitized-only. | New setup and results semantics. | None if existing modules. | Medium for additional report passes. | Medium to high, but compatibility risk is high. |
| Additional Local Export or Sharing Format | Export subsystem expansion. | No parser change. | New action and format feedback. | No direct search change. | New format copy. | Direct export contract change. | Comparison unchanged. | Must remain sanitized-only. | New action accessibility. | None if existing modules. | Low to medium. | High technically, but value is unproven. |
| Sysdiagnose File Discovery or Extraction | New archive and multi-family subsystem. | Many parsers or archive dispatch. | New file workflow and progress states. | New contained-record semantics. | Large privacy-sensitive output surface. | Major new export decisions. | Not compatible with current same-parser limits. | Major new restriction surface. | Complex asynchronous workflow. | New workers/modules and cache/resource decisions. | High to unbounded. | Low for a safe bounded contract. |

## 8. Scoring matrix

Scores are from 0 to 5. Evidence, user value, privacy safety,
determinism, fixture availability, implementation fit, testability, and
bounded scope are direct scores. Maintenance risk and compatibility risk are
reverse-scored: 5 means low risk and 0 means unacceptable risk.

| Candidate | Evidence | User value | Privacy | Determinism | Fixtures | Fit | Testability | Bounded | Maintenance | Compatibility | Total | Short explanation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Bounded CoreAnalytics Investigation | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 46 | Existing parser, capped view, fixtures, and contracts make this the strongest bounded additive option. |
| Evidence-Bounded Panic Guidance | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 3 | 4 | 42 | Strong local fit and source context, but the diagnosis boundary and rule evidence need extra review. |
| Additional Local Export or Sharing Format | 5 | 2 | 4 | 5 | 5 | 4 | 5 | 5 | 4 | 3 | 42 | Easy to test, but no demonstrated user need justifies another export contract. |
| Additional Comparison Mode | 4 | 2 | 4 | 4 | 5 | 3 | 4 | 2 | 3 | 2 | 33 | Existing infrastructure is strong, but the requested extension would pressure frozen comparison limits. |
| MetricKit Diagnostic Support | 3 | 4 | 3 | 3 | 0 | 2 | 1 | 2 | 2 | 2 | 22 | Apple APIs are documented, but no authoritative serialized fixture contract is available locally. |
| App Usage Metrics | 2 | 3 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 20 | Classifier evidence exists, but privacy and serialized-family evidence are insufficient. |
| Wi-Fi Connectivity Insights | 2 | 3 | 1 | 2 | 1 | 2 | 2 | 2 | 2 | 2 | 19 | Runtime API evidence does not establish a safe report parser and network identity is sensitive. |
| Accessory or Firmware Diagnostics Expansion | 2 | 3 | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 2 | 19 | The existing narrow family does not justify a broad hardware-diagnostics expansion. |
| Diagnostic Request Support | 2 | 2 | 2 | 2 | 0 | 2 | 2 | 1 | 2 | 2 | 17 | Apple documents a separate diagnostics session, not a supported file contract. |
| Confidence-Based Diagnostic Rules | 2 | 3 | 1 | 1 | 2 | 2 | 2 | 2 | 1 | 1 | 17 | Opaque confidence would add interpretation without an authoritative calibration basis. |
| Sysdiagnose File Discovery or Extraction | 3 | 4 | 1 | 2 | 0 | 1 | 0 | 0 | 1 | 0 | 12 | Broad archive scope, privacy exposure, browser limits, and fixture absence are hard blockers. |

The numeric total does not override a hard gate. The CoreAnalytics candidate
wins qualitatively because it can be bounded around already accepted local
evidence. Panic Guidance is the fallback only because its existing parser and
official report-context sources provide a plausible narrow path; it must not
become a repair or root-cause feature.

## 9. Hard-gate analysis

| Candidate | Gate result | Reason |
| --- | --- | --- |
| Bounded CoreAnalytics Investigation | Passes provisionally | It can avoid every new source semantic by operating on existing sanitized, capped, visible values. 23A must confirm the final allowlist and interaction boundary. |
| Evidence-Bounded Panic Guidance | Conditional | It can reuse existing sanitized panic facts, but every displayed hint must have a clear source basis and neutral wording. |
| App Usage Metrics | Not ready | Missing serialized family contract plus app and behavioral privacy risk. |
| Wi-Fi Connectivity Insights | Not ready | Missing report schema plus network identity, location, and fingerprint risk. |
| Diagnostic Request Support | Not ready | No serialized local contract and potentially sensitive diagnostic-session data. |
| Accessory or Firmware Diagnostics Expansion | Not ready | Broad family boundary and hardware identity risk are not bounded by current evidence. |
| MetricKit Diagnostic Support | Not ready | No authoritative serialized fixture and version contract in the repository. |
| Confidence-Based Diagnostic Rules | Fails | Requires speculative interpretation or opaque scoring that can be read as diagnosis. |
| Additional Comparison Mode | Not hard-disqualified, but not justified | A new mode would change a deliberately bounded same-parser comparison contract without a proven need. |
| Additional Local Export or Sharing Format | Not hard-disqualified, but not justified | It would add a durable contract and disclosure surface without a demonstrated requirement. |
| Sysdiagnose File Discovery or Extraction | Fails | Unbounded archive extraction, unsafe fixture requirements, broad privacy exposure, and insufficient browser/resource support. |

No candidate that requires a backend, cloud processing, uploads, telemetry,
persistence, framework migration, or weakened sanitized output is eligible.

## 10. Recommended candidate

### Proposed theme

v2.2.0 - CoreAnalytics Investigation Depth

### Proposed Phase 23 title

Phase 23 - Bounded CoreAnalytics Investigation

### Provisional objective

Make supported CoreAnalytics reports easier to inspect by adding a bounded,
deterministic investigation workflow around values the repository already
parses, sanitizes, caps, renders, and searches. The workflow must expose no
raw source records and must not assign undocumented meaning to private event
names or fields.

### User problem

The existing CoreAnalytics surface provides summary data, capped rows, and
facets, but a user investigating a supported report may need a more direct way
to move between those already visible observations. A bounded drill-down can
improve navigation and context without pretending that private event names are
publicly documented diagnoses.

### Evidence and likely architecture

The local repository already contains the parser, the CoreAnalytics view model,
rendering path, exact visible-value search path, fictional fixtures, and
performance workloads. The roadmap already identifies deeper CoreAnalytics
drill-down using parsed and capped data as a future direction.

The likely architecture is an extension of the existing CoreAnalytics
presentation workflow, not a new parser family:

- preserve parseInput and SectionModel;
- preserve the existing CoreAnalytics parser boundary;
- reuse the existing capped rows and allowlisted facets;
- keep any internal view model sanitized and non-raw;
- reuse existing search, copy, visible-content export, accessibility, and
  Inspector Workspace paths;
- keep comparison unchanged;
- keep Raw Local View unchanged;
- add no new PWA asset unless implementation genuinely requires a new module.

23A must decide whether the feature can be implemented entirely in the view
model and renderer. A parser change is justified only if an existing
allowlisted value cannot be carried safely through the current bounded path.

### Likely files

Possible files for a later approved implementation, subject to 23A:

- src/ui/coreAnalyticsView.js
- src/ui/renderCoreAnalyticsOverview.js
- src/main.js or the existing visible-facet navigation module
- src/parsers/parseCoreAnalytics.js only if a narrow parser adjustment is proven
  necessary
- tests/parser.test.js
- existing fictional CoreAnalytics fixtures and large-report workloads only
  if additional independent cases are needed
- browser performance harness files only if a bounded UI workload needs a
  regression assertion

This list is a planning boundary, not an authorization to edit.

### Likely tests

An approved milestone would need focused tests for:

- bounded row and facet selection;
- deterministic ordering and duplicate suppression within the existing visible
  surface;
- malformed, missing, inherited-property, and accessor-backed objects at the
  parser boundary if parsing changes;
- privacy sentinels for identifiers, paths, raw records, and nested payloads;
- exact visible-value search and navigation;
- copy of visible content only;
- unchanged text and JSON export schemas;
- unchanged comparison and Raw Local View behavior;
- accessibility names, focus, and keyboard interaction;
- existing performance and PWA cache checks.

### Proposed six-slice outline

- 23A - Evidence, Architecture, and Corpus Audit: freeze the exact bounded
  interaction, allowlist, privacy policy, and fictional corpus. Stop if the
  feature requires undocumented semantics or raw records.
- 23B - CoreAnalytics Parsing or Normalization Boundary: make only the
  smallest allowlist-preserving adjustment, with focused tests first. Stop if
  a new parser family or semantic interpretation is required.
- 23C - Sanitized Investigation Model: carry only privacy-safe, capped,
  non-raw data through the existing internal model. Stop on identifier or
  export/comparison leakage.
- 23D - Investigation Presentation and Workflow Integration: integrate within
  the existing CoreAnalytics section and Inspector Workspace. Reuse search and
  copy; do not redesign the UI or add diagnosis.
- 23E - Corpus and Regression Hardening: add independently fictional cases for
  malformed, duplicate, hostile-object, cap, privacy, search, and accessibility
  behavior.
- 23F - Final QA and Release Readiness: validate parser boundaries, privacy,
  visible workflows, exports, comparison isolation, Raw Local View,
  accessibility, responsive behavior, performance, PWA behavior, and
  documentation. Do not tag or publish without separate approval.

### Privacy boundary

The feature must never expose raw CoreAnalytics records, arbitrary nested
objects, paths, aliases, account data, device or hardware identifiers, network
identity, or unique values outside the existing sanitized and capped
allowlist. It must not turn event names into diagnoses or reveal values merely
because they are present in a source record.

### Compatibility boundary

The feature must preserve:

- static local-only browser architecture;
- parser-family boundaries;
- parseInput and SectionModel;
- existing search and exact-match behavior;
- visible-content copy;
- text and JSON export schemas;
- sanitized-only comparison and its report-count limits;
- Raw Local View restrictions;
- Inspector Workspace structure;
- accessibility and responsive behavior;
- PWA precache and cache-version rules.

No comparison expansion, export-schema change, raw-record mode, backend,
upload, telemetry, persistence, framework migration, or release operation is
part of this proposal.

### Explicit non-goals

- private CoreAnalytics schema reconstruction;
- full raw JSON rendering;
- uncapped record dumps;
- new CoreAnalytics event families;
- charging, battery, thermal, or power interpretation;
- app behavior profiling;
- Wi-Fi identity or location analysis;
- MetricKit support;
- sysdiagnose extraction;
- diagnosis, repair advice, service recommendations, or AI interpretation;
- comparison expansion;
- export-format expansion;
- Raw Local View expansion;
- backend, uploads, analytics, telemetry, persistence, or cloud processing.

### Principal risks and evidence needed before implementation

The main risks are accidental raw-data exposure, unbounded DOM growth,
misleading labels for private fields, and accidental changes to search or
export behavior. Before 23B, the user must approve a 23A matrix that names
each visible value, its source path within the existing sanitized model, its
cap, its omission rule, and its exact user-facing wording. A safe synthetic
corpus and privacy sentinel set must also be approved. Browser automation
remains a validation limitation because no browser executable or Playwright
dependency is currently available; the existing synthetic harness must remain
part of QA.

## 11. Fallback candidate

### Proposed theme

v2.2.0 - Evidence-Bounded Panic Guidance

### Proposed Phase 23 title

Phase 23 - Deterministic Panic Guidance

### Objective and user value

Add a small set of neutral, deterministic guidance rows to the existing panic
report explanation path. Guidance would point users to observed panic facts and
to the next section to inspect. It would not diagnose hardware or software,
identify a repair, or recommend service.

### Evidence and architecture

The repository already parses panic reports, sanitizes sensitive addresses,
provides fictional panic fixtures, and has a deterministic explanation layer.
Apple Xcode documentation supports crash-report investigation, and Apple XNU
source shows the kernel panic control path. Those sources do not prove a
universal root cause for a panic signature. The architecture must therefore
remain an explanation-layer extension over existing sanitized facts.

### Likely files and tests

Likely files would be the existing diagnostic explanation module, panic parser
tests, fictional panic fixtures, visible explanation tests, privacy sentinels,
search/copy/export tests, and accessibility assertions. No new parser family
would be justified.

### Slice outline

The same conservative six-slice structure could be used:

- 23A evidence, rule, and corpus audit;
- 23B rule normalization over existing facts;
- 23C sanitized guidance model;
- 23D explanation presentation;
- 23E fictional corpus and regression hardening;
- 23F final QA and release readiness.

### Boundaries and blockers

Every hint must be traceable to a source fact, use neutral language, and
include a clear uncertainty boundary. No exact-cause, repair, service,
confidence, or AI language is allowed. The fallback remains only a possible
candidate because the 23A rule matrix has not been written or approved.

## 12. Deferred and rejected candidates

### App Usage Metrics - defer

The repository recognizes this family as unsupported but has no safe parser,
serialized contract, or corpus. Application and behavioral history would also
create identifier and profiling risks. Evidence needed: an authoritative
serialized family contract, a stable privacy-safe value boundary, and
independent fictional fixtures.

### Wi-Fi Connectivity Insights - defer

Apple runtime network APIs do not establish the contents or lifecycle of
CoreAnalytics connectivity records. Network identity, location, and hardware
fingerprinting are substantial risks. Evidence needed: an exact report family,
safe state-only fields, platform behavior, and independent fixtures.

### Diagnostic Request Support - defer

Apple's documented diagnostics mode is a separate user-triggered session, not a
supported local report-file schema for this parser. Evidence needed: a stable
serialized contract, provenance, and a privacy review for all visible fields.

### Accessory or Firmware Diagnostics Expansion - defer

The existing narrow AccessoryCrash boundary is not evidence for a broad
accessory or firmware family. Evidence needed: one bounded family with direct
semantics, safe identifiers policy, and independent fixtures.

### MetricKit Diagnostic Support - defer

MetricKit APIs and a secondary implementation discussion establish that
diagnostic payloads exist and may be represented as JSON, but they do not
provide the repository with an authoritative serialized fixture, version
matrix, or safe privacy allowlist. Evidence needed: those contracts plus
fictional or authoritative fixtures.

### Confidence-Based Diagnostic Rules - reject for this milestone

The proposed confidence value would be an interpretation of evidence rather
than a direct source fact. Without an authoritative calibration standard it
would risk opaque diagnosis and misleading user certainty.

### Additional Comparison Mode - defer

The current comparison model deliberately limits comparisons to two or three
sanitized reports from the same parser type. A new mode would need a concrete
user problem and a compatibility-preserving contract; neither is established
by the current roadmap evidence.

### Additional Local Export or Sharing Format - defer

Text and JSON already cover the current local export contract. A new format
would add durable schema and disclosure maintenance without a demonstrated
v2.2 need. It should be reconsidered only with a precise local-only use case
and a privacy-reviewed schema.

### Sysdiagnose File Discovery or Extraction - reject for this milestone

The external SAF project demonstrates that sysdiagnose analysis is a broad,
multi-parser, resource-intensive workflow. Browser compression APIs do not
provide general ZIP/archive traversal, and browser file selection is not
arbitrary filesystem discovery. The scope, privacy boundary, fixture burden,
and performance risk exceed one release milestone.

## 13. Decision requested from the user

The recommendation is provisional. Please choose one:

- approve the recommended candidate: v2.2.0 - CoreAnalytics Investigation
  Depth, Phase 23 - Bounded CoreAnalytics Investigation;
- choose the fallback: v2.2.0 - Evidence-Bounded Panic Guidance, Phase 23 -
  Deterministic Panic Guidance;
- request another candidate audit;
- pause v2.2.0 planning.

No choice has been made in this document. Until the user explicitly approves a
candidate, Phase 23 remains unassigned, PHASE_23_PLAN.md must not be created,
and implementation must not begin.
