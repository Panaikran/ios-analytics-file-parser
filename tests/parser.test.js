import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXAMPLE_REPORTS } from '../examples/manifest.js';
import {
  createInitialAppState,
  createParsedStatusMessage,
  startNewReportState,
  withParsedReport,
  withPrivacyMode,
  withStatus,
} from '../src/appState.js';
import { detectFileType } from '../src/parsers/detect.js';
import { parseInput } from '../src/parsers/index.js';
import { filterSectionsByQuery } from '../src/search/filterSections.js';
import { serializeSectionForCopy } from '../src/clipboard/serializeSection.js';
import { getVisibleSectionForCopy } from '../src/clipboard/visibleSection.js';
import {
  findCrashedThreadName,
  getLimitedRows,
  groupRowsByThread,
  isLargeKextTable,
} from '../src/ui/denseTables.js';
import { createSectionNavItems } from '../src/ui/renderSectionNav.js';
import { sanitizeText } from '../src/privacy/sanitize.js';

const ipsText = await readFile(new URL('./fixtures/example.ips', import.meta.url), 'utf8');
const fullIpsText = await readFile(new URL('./fixtures/example-full.ips', import.meta.url), 'utf8');
const metadataIpsText = await readFile(new URL('./fixtures/example-metadata.ips', import.meta.url), 'utf8');
const crashText = await readFile(new URL('./fixtures/example.crash', import.meta.url), 'utf8');
const fullCrashText = await readFile(new URL('./fixtures/example-full.crash', import.meta.url), 'utf8');
const watchdogText = await readFile(new URL('./fixtures/example-watchdog.ips', import.meta.url), 'utf8');
const jetsamText = await readFile(new URL('./fixtures/example-jetsam.ips', import.meta.url), 'utf8');
const realSchemaJetsamText = await readFile(new URL('./fixtures/example-jetsam-real-schema.ips', import.meta.url), 'utf8');
const panicText = await readFile(new URL('./fixtures/example.panic-full', import.meta.url), 'utf8');
const jsonPanicText = await readFile(new URL('./fixtures/example-panic-json.ips', import.meta.url), 'utf8');
const analyticsText = await readFile(new URL('./fixtures/example-analytics.txt', import.meta.url), 'utf8');

assert.deepEqual(
  EXAMPLE_REPORTS.map((example) => example.type),
  ['ips', 'crash', 'ips-watchdog-stackshot', 'jetsam', 'panic', 'analytics'],
  'production examples cover each supported file type once'
);
assert.equal(new Set(EXAMPLE_REPORTS.map((example) => example.id)).size, 6, 'production example IDs are unique');
for (const example of EXAMPLE_REPORTS) {
  assert.match(example.path, /^\.\/examples\//, 'production example files live in examples/');
  assert.doesNotMatch(example.path, /tests\/fixtures/, 'production UI does not load test fixtures');
  assert.match(example.sourceLabel, /^Example: /, 'production examples use explicit source labels');

  const exampleText = await readFile(new URL(`../${example.path.slice(2)}`, import.meta.url), 'utf8');
  assert.equal(detectFileType(exampleText), example.type, `${example.label} production example detects correctly`);
  assert.ok(parseInput(exampleText).length > 0, `${example.label} production example parses into sections`);
}

function sectionById(sections, id) {
  return sections.find((section) => section.id === id);
}

function fieldValue(section, label) {
  return section.fields.find((field) => field.label === label)?.value;
}

assert.equal(detectFileType(ipsText), 'ips', 'detects a standard app crash IPS report');
assert.equal(detectFileType(fullIpsText), 'ips', 'detects a full standard app crash IPS report');
assert.equal(detectFileType(metadataIpsText), 'ips', 'detects a standard IPS report with metadata line');
assert.equal(
  detectFileType(watchdogText),
  'ips-watchdog-stackshot',
  'detects a two-object watchdog stackshot IPS report'
);
assert.equal(detectFileType(crashText), 'crash', 'detects a legacy crash report');
assert.equal(detectFileType(fullCrashText), 'crash', 'detects a full legacy crash report');
assert.equal(detectFileType(jetsamText), 'jetsam', 'detects a JetsamEvent report');
assert.equal(detectFileType(realSchemaJetsamText), 'jetsam', 'detects a real-schema JetsamEvent report');
assert.equal(
  detectFileType(panicText),
  'panic',
  'detects panic-full text'
);
assert.equal(detectFileType(jsonPanicText), 'panic', 'detects JSON-wrapped panic-full IPS');
assert.equal(detectFileType(analyticsText), 'analytics', 'detects generic analytics text');

const ipsSections = parseInput(ipsText);
assert.deepEqual(
  createSectionNavItems(ipsSections),
  ipsSections.map((section) => ({ id: section.id, label: section.title, href: `#${section.id}` })),
  'section nav items use section IDs and titles as jump-link labels'
);
assert.deepEqual(
  parseInput(realSchemaJetsamText),
  parseInput(realSchemaJetsamText, { sanitize: true }),
  'parseInput(text) matches explicit sanitized parsing'
);
assert.equal(
  fieldValue(sectionById(parseInput(realSchemaJetsamText), 'summary'), 'Incident ID'),
  '[identifier redacted]',
  'parseInput sanitizes sensitive identifiers by default'
);
assert.equal(
  fieldValue(sectionById(parseInput(realSchemaJetsamText, { sanitize: false }), 'summary'), 'Incident ID'),
  'C2D7624C-69D5-43C1-BBCF-922926A98333',
  'parseInput can preserve raw values when sanitization is explicitly disabled'
);
assert.equal(
  fieldValue(sectionById(parseInput(jsonPanicText, { sanitize: false }), 'system-info'), 'Incident ID'),
  'ACA545E6-9828-4065-BF5E-3FF1C8125455',
  'panic parsing preserves raw incident IDs only when sanitization is explicitly disabled'
);
assert.deepEqual(
  ipsSections.slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'IPS Phase 1 core sections remain first'
);
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'Bundle ID'), 'com.example.demoapp');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Type'), 'EXC_BAD_ACCESS');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Signal'), 'SIGSEGV');
assert.equal(sectionById(ipsSections, 'crashed-thread').table[0].symbol, 'doThing + 18');

const fullIpsSections = parseInput(fullIpsText);
assert.equal(findCrashedThreadName(fullIpsSections), 'Thread 0', 'dense table UI infers crashed thread from section title');
assert.deepEqual(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: {},
    forceExpanded: false,
  }).map((group) => ({
    thread: group.thread,
    frameCount: group.frameCount,
    expanded: group.expanded,
    stateLabel: group.stateLabel,
  })),
  [
    { thread: 'Thread 0', frameCount: 2, expanded: true, stateLabel: 'expanded' },
    { thread: 'Thread 1', frameCount: 1, expanded: false, stateLabel: 'collapsed' },
  ],
  'all threads are grouped by thread with crashed thread expanded by default'
);
assert.deepEqual(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: { 'Thread 1': true },
    forceExpanded: false,
  }).map((group) => ({ thread: group.thread, expanded: group.expanded })),
  [
    { thread: 'Thread 0', expanded: true },
    { thread: 'Thread 1', expanded: true },
  ],
  'thread group expansion can be controlled by UI state'
);
assert.equal(
  groupRowsByThread(sectionById(fullIpsSections, 'all-threads').table, {
    crashedThread: 'Thread 0',
    expandedThreads: { 'Thread 1': false },
    forceExpanded: true,
  }).every((group) => group.expanded),
  true,
  'search force-expanded sections keep matching thread groups visible'
);

const sixtyProcessRows = Array.from({ length: 60 }, (_, index) => ({ process: `Process ${index}` }));
assert.deepEqual(
  getLimitedRows(sixtyProcessRows, { limit: 50, forceExpanded: false }),
  {
    rows: sixtyProcessRows.slice(0, 50),
    shown: 50,
    total: 60,
    summary: '50 of 60 rows shown',
    allShown: false,
  },
  'Jetsam-style row limits show the first 50 rows initially'
);
assert.equal(
  getLimitedRows(sixtyProcessRows, { limit: 50, forceExpanded: true }).shown,
  60,
  'search force-expanded sections bypass row limits'
);
assert.equal(isLargeKextTable({ id: 'loaded-kexts', table: sixtyProcessRows }), true, 'large kext tables collapse by default');

const uikitSearch = filterSectionsByQuery(fullIpsSections, 'UIKitCore');
assert.equal(uikitSearch.active, true, 'search is active for non-empty queries');
assert.ok(uikitSearch.totalMatches >= 1, 'search reports a visible match count');
assert.equal(sectionById(uikitSearch.sections, 'summary'), undefined, 'search hides sections with zero matches');
assert.equal(
  sectionById(uikitSearch.sections, 'binary-images').forceExpanded,
  true,
  'search marks matching sections to override collapse state'
);
assert.equal(sectionById(uikitSearch.sections, 'binary-images').table.length, 1, 'search shows matching table rows only');
assert.equal(
  sectionById(uikitSearch.sections, 'binary-images').tableSummary,
  `1 of ${sectionById(fullIpsSections, 'binary-images').table.length} rows shown`,
  'search annotates filtered table row counts'
);
assert.ok(fullIpsSections.find((section) => section.id === 'binary-images').table.length > 1, 'search does not mutate parser output');

const noSearchMatches = filterSectionsByQuery(fullIpsSections, 'definitely-not-present');
assert.equal(noSearchMatches.totalMatches, 0, 'search reports zero matches');
assert.deepEqual(noSearchMatches.sections, [], 'search returns no sections when nothing matches');

const inactiveSearch = filterSectionsByQuery(fullIpsSections, '   ');
assert.equal(inactiveSearch.active, false, 'blank search is inactive');
assert.equal(inactiveSearch.sections, fullIpsSections, 'blank search returns original parsed sections');

assert.equal(
  serializeSectionForCopy({
    title: 'Diagnostics',
    fields: [
      { label: 'App', value: 'DemoApp' },
      { label: 'Reason', value: 'EXC_BAD_ACCESS' },
    ],
    tableColumns: [
      { key: 'frame', label: 'Frame' },
      { key: 'symbol', label: 'Symbol' },
    ],
    table: [
      { frame: 0, symbol: 'doThing + 18' },
      { frame: 1, symbol: 'viewDidLoad + 44' },
    ],
    raw: 'Raw panic line',
    chart: {
      title: 'Memory chart',
      items: [
        { label: 'free', value: 12 },
        { label: 'wired', value: 34 },
      ],
    },
  }),
  [
    'Diagnostics',
    '',
    'App: DemoApp',
    'Reason: EXC_BAD_ACCESS',
    '',
    'Frame\tSymbol',
    '0\tdoThing + 18',
    '1\tviewDidLoad + 44',
    '',
    'Raw panic line',
    '',
    'Memory chart',
    'free\t12',
    'wired\t34',
  ].join('\n'),
  'copy serialization includes title, fields, TSV tables, raw text, and chart data'
);
assert.equal(
  serializeSectionForCopy(
    getVisibleSectionForCopy(
      {
        id: 'process-table',
        title: 'Process Table',
        tableColumns: [{ key: 'process', label: 'Process' }],
        table: sixtyProcessRows,
      },
      { denseTableState: { rowLimits: { 'process-table': 50 } } }
    )
  ).split('\n').filter((line) => /^Process \d+$/.test(line)).length,
  50,
  'copy respects Jetsam row limits'
);
assert.deepEqual(
  getVisibleSectionForCopy(
    sectionById(fullIpsSections, 'all-threads'),
    {
      denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': false } },
      allSections: fullIpsSections,
    }
  ).table.map((row) => row.thread),
  ['Thread 0', 'Thread 0'],
  'copy respects collapsed thread groups'
);
assert.deepEqual(
  getVisibleSectionForCopy(
    sectionById(fullIpsSections, 'all-threads'),
    {
      denseTableState: { expandedThreadGroups: { 'all-threads:Thread 1': true } },
      allSections: fullIpsSections,
    }
  ).table.map((row) => row.thread),
  ['Thread 0', 'Thread 0', 'Thread 1'],
  'copy respects expanded thread groups'
);
assert.equal(
  getVisibleSectionForCopy(
    { id: 'loaded-kexts', title: 'Loaded Kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: {} } }
  ).table.length,
  0,
  'copy respects collapsed panic kext tables'
);
assert.equal(
  getVisibleSectionForCopy(
    { id: 'loaded-kexts', title: 'Loaded Kexts', table: sixtyProcessRows },
    { denseTableState: { expandedTables: { 'loaded-kexts': true } } }
  ).table.length,
  60,
  'copy respects expanded panic kext tables'
);

assert.deepEqual(
  fullIpsSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread', 'all-threads', 'binary-images'],
  'full IPS includes all threads and binary images'
);
assert.equal(sectionById(fullIpsSections, 'all-threads').tableColumns[0].key, 'thread');
assert.equal(sectionById(fullIpsSections, 'all-threads').table[2].thread, 'Thread 1');
assert.equal(sectionById(fullIpsSections, 'all-threads').table[2].symbol, 'mach_msg_trap + 8');
assert.equal(sectionById(fullIpsSections, 'binary-images').table[1].name, 'UIKitCore');
assert.equal(sectionById(fullIpsSections, 'binary-images').table[1].uuid, 'BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF');

const metadataIpsSections = parseInput(metadataIpsText);
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'App'), 'MetadataApp');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Bundle ID'), 'com.example.metadata');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Version'), '9.9.9');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Build'), '999');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'OS Version'), 'iPhone OS 27.0 (24A5370h)');
assert.equal(fieldValue(sectionById(metadataIpsSections, 'summary'), 'Incident ID'), 'FAKE-METADATA-INCIDENT');

const crashSections = parseInput(crashText);
assert.deepEqual(
  crashSections.slice(0, 3).map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'legacy crash Phase 1 core sections remain first'
);
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'Version'), '2.1.4 (318)');
assert.equal(fieldValue(sectionById(crashSections, 'exception'), 'Termination Reason'), 'Namespace SIGNAL, Code 11 Segmentation fault: 11');
assert.equal(sectionById(crashSections, 'crashed-thread').table[1].symbol, 'viewDidLoad + 44');

const fullCrashSections = parseInput(fullCrashText);
assert.deepEqual(
  fullCrashSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread', 'all-threads', 'binary-images'],
  'full legacy crash includes all threads and binary images'
);
assert.equal(sectionById(fullCrashSections, 'all-threads').table[2].thread, 'Thread 1');
assert.equal(sectionById(fullCrashSections, 'all-threads').table[2].binary, 'libsystem_kernel.dylib');
assert.equal(sectionById(fullCrashSections, 'binary-images').table[1].name, 'UIKitCore');
assert.equal(sectionById(fullCrashSections, 'binary-images').table[1].arch, 'arm64');

const watchdogSections = parseInput(watchdogText);
assert.deepEqual(
  watchdogSections.map((section) => section.id),
  ['summary', 'termination', 'main-thread-stackshot'],
  'watchdog stackshot Phase 1 output contains summary, termination, and main thread stackshot'
);
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'App'), 'WatchdogApp');
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'Bundle ID'), 'com.example.watchdog');
assert.equal(fieldValue(sectionById(watchdogSections, 'summary'), 'Device'), 'iPhone18,1');
assert.equal(fieldValue(sectionById(watchdogSections, 'termination'), 'Namespace'), 'SPRINGBOARD');
assert.match(
  fieldValue(sectionById(watchdogSections, 'termination'), 'Details'),
  /scene-update watchdog transgression/
);
assert.equal(sectionById(watchdogSections, 'main-thread-stackshot').table[0].symbol, 'WatchdogApp + 128');
assert.equal(sectionById(watchdogSections, 'main-thread-stackshot').table[1].symbol, 'UIKitCore + 456');

const jetsamSections = parseInput(jetsamText);
assert.deepEqual(
  jetsamSections.map((section) => section.id),
  ['summary', 'victim', 'process-table', 'system-memory', 'limits'],
  'JetsamEvent includes summary, victim, process table, system memory, and limits'
);
assert.equal(fieldValue(sectionById(jetsamSections, 'summary'), 'Reason'), 'per-process-limit');
assert.equal(fieldValue(sectionById(jetsamSections, 'victim'), 'Process'), 'MemoryHog');
assert.equal(sectionById(jetsamSections, 'process-table').table[0].process, 'MemoryHog');
assert.equal(sectionById(jetsamSections, 'process-table').table[1].process, 'Maps');
assert.equal(sectionById(jetsamSections, 'system-memory').chart.type, 'memory-bars');
assert.equal(fieldValue(sectionById(jetsamSections, 'limits'), 'Per-process Limit'), '600 MB');

const realSchemaJetsamSections = parseInput(realSchemaJetsamText);
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Timestamp'), '2026-06-23 01:23:24.00 +0700');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'OS Version'), 'iPhone OS 27.0 (24A5370h)');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Device'), 'iPhone18,1');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Incident ID'), '[identifier redacted]');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'summary'), 'Bug Type'), '298');
assert.equal(sectionById(realSchemaJetsamSections, 'victim').title, 'Victim / Likely Culprit');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'victim'), 'Process'), 'lowmemoryd');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'victim'), 'Reason'), 'highwater');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].process, 'LargeApp');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].footprint, '1024 MB');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[0].pages, '65536');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[1].process, 'Messenger');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].process, 'lowmemoryd');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].role, 'daemon, idle');
assert.equal(sectionById(realSchemaJetsamSections, 'process-table').table[2].reason, 'highwater');
assert.equal(fieldValue(sectionById(realSchemaJetsamSections, 'limits'), 'Per-process Limit'), 'Not available');

const panicSections = parseInput(panicText);
assert.deepEqual(
  panicSections.map((section) => section.id),
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info'],
  'panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.match(sectionById(panicSections, 'panic-string').raw, /userspace watchdog timeout/);
assert.equal(sectionById(panicSections, 'kernel-backtrace').table[0].returnAddress, '0xfffffff007123456');
assert.equal(sectionById(panicSections, 'loaded-kexts').table[0].name, 'com.apple.driver.ExampleKext');

const jsonPanicSections = parseInput(jsonPanicText);
assert.deepEqual(
  jsonPanicSections.map((section) => section.id),
  ['panic-string', 'panic-flags', 'kernel-backtrace', 'loaded-kexts', 'system-info'],
  'JSON-wrapped panic-full includes panic string, flags, backtrace, kexts, and system info'
);
assert.match(sectionById(jsonPanicSections, 'panic-string').raw, /LLC Bus error from cpu3/);
assert.equal(fieldValue(sectionById(jsonPanicSections, 'panic-flags'), 'Flags'), '0x802');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'OS / Build'), 'iPhone OS 18.2 (22C152)');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Product'), 'iPhone17,1');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Bug Type'), '210');
assert.equal(fieldValue(sectionById(jsonPanicSections, 'system-info'), 'Incident ID'), '[identifier redacted]');
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].lr, '0xfffffff05046e9cc');
assert.equal(sectionById(jsonPanicSections, 'kernel-backtrace').table[0].fp, '0xffffffef16ceb5f0');
assert.equal(sectionById(jsonPanicSections, 'loaded-kexts').table[0].name, 'com.apple.driver.AppleARMPlatform');
assert.equal(sectionById(jsonPanicSections, 'loaded-kexts').table[1].name, 'com.apple.iokit.IOReportFamily');
assert.ok(
  sectionById(jsonPanicSections, 'loaded-kexts').table.some((row) => row.name === 'com.apple.driver.AppleIDAMInterface'),
  'renders loaded kext block rows'
);

const analyticsSections = parseInput(analyticsText);
assert.deepEqual(
  analyticsSections.map((section) => section.id),
  ['analytics-summary', 'analytics-sections'],
  'generic analytics fallback groups timestamped and delimiter sections'
);
assert.equal(fieldValue(sectionById(analyticsSections, 'analytics-summary'), 'Detected Sections'), '3');
assert.match(sectionById(analyticsSections, 'analytics-sections').table[0].content, /Launch started/);

const sanitized = sanitizeText(
  'Email tester@example.com UDID 99999999-9999-9999-9999-999999999999 phone +1 (415) 555-1212 path C:\\Users\\Alice\\Desktop\\log.ips bundle com.example.demoapp uuid AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
);
assert.match(sanitized, /\[email redacted\]/);
assert.match(sanitized, /\[identifier redacted\]/);
assert.match(sanitized, /\[phone redacted\]/);
assert.match(sanitized, /C:\\Users\\\[user redacted\]\\Desktop\\log\.ips/);
assert.match(sanitized, /com\.example\.demoapp/);
assert.match(sanitized, /AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/);
assert.equal(
  sanitizeText('timestamp 2026-06-21 10:56:49.4455 +0700 code 2343432205'),
  'timestamp 2026-06-21 10:56:49.4455 +0700 code 2343432205',
  'does not redact timestamps or numeric termination codes as phone numbers'
);

const initialState = createInitialAppState();
const parsedState = withParsedReport(initialState, {
  sourceText: 'raw local source',
  sourceLabel: 'fixture.ips',
  detectedType: 'ips',
  sections: ipsSections,
});
assert.equal(initialState.sanitize, true, 'app state defaults to sanitized mode');
assert.equal(withPrivacyMode(initialState, false).sanitize, false, 'app state can switch to raw local parsing');
assert.equal(withPrivacyMode(withPrivacyMode(initialState, false), true).sanitize, true, 'app state can switch back to sanitized parsing');
assert.equal(startNewReportState(withPrivacyMode(parsedState, false)).sanitize, true, 'loading a new report resets raw mode to sanitized');
assert.match(
  createParsedStatusMessage('fixture.ips', 'ips', true),
  /Sanitized view/,
  'status text reflects sanitized mode'
);
assert.match(
  createParsedStatusMessage('fixture.ips', 'ips', false),
  /Raw local view/,
  'status text reflects raw mode'
);
assert.doesNotMatch(
  createParsedStatusMessage('fixture.ips', 'ips', false),
  /Sanitized view/,
  'status text never claims sanitized mode while raw content is rendered'
);
assert.equal(parsedState.sourceText, 'raw local source', 'app state keeps current source text in memory');
assert.equal(parsedState.detectedType, 'ips', 'app state tracks current detected type');
assert.equal(parsedState.sections, ipsSections, 'app state tracks current parsed sections');
assert.deepEqual(
  withStatus(parsedState, { message: 'Paste a report before parsing.', tone: 'error', clearSections: true }),
  {
    ...parsedState,
    sections: [],
    statusMessage: 'Paste a report before parsing.',
    statusTone: 'error',
  },
  'app state can update status and clear rendered sections without changing source text'
);
assert.deepEqual(createInitialAppState(), initialState, 'new initial state wipes current report state');

console.log('Phase 2 parser tests passed');
