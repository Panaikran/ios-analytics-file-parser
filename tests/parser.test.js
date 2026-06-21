import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectFileType } from '../src/parsers/detect.js';
import { parseInput } from '../src/parsers/index.js';
import { sanitizeText } from '../src/privacy/sanitize.js';

const ipsText = await readFile(new URL('./fixtures/example.ips', import.meta.url), 'utf8');
const crashText = await readFile(new URL('./fixtures/example.crash', import.meta.url), 'utf8');
const watchdogText = await readFile(new URL('./fixtures/example-watchdog.ips', import.meta.url), 'utf8');

function sectionById(sections, id) {
  return sections.find((section) => section.id === id);
}

function fieldValue(section, label) {
  return section.fields.find((field) => field.label === label)?.value;
}

assert.equal(detectFileType(ipsText), 'ips', 'detects a standard app crash IPS report');
assert.equal(
  detectFileType(watchdogText),
  'ips-watchdog-stackshot',
  'detects a two-object watchdog stackshot IPS report'
);
assert.equal(detectFileType(crashText), 'crash', 'detects a legacy crash report');
assert.equal(
  detectFileType('panic(cpu 0 caller 0xfffffff): fictional panic text'),
  'panic',
  'detects panic-full text'
);

const ipsSections = parseInput(ipsText);
assert.deepEqual(
  ipsSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'IPS Phase 1 output contains only summary, exception, and crashed thread'
);
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(ipsSections, 'summary'), 'Bundle ID'), 'com.example.demoapp');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Type'), 'EXC_BAD_ACCESS');
assert.equal(fieldValue(sectionById(ipsSections, 'exception'), 'Signal'), 'SIGSEGV');
assert.equal(sectionById(ipsSections, 'crashed-thread').table[0].symbol, 'doThing + 18');

const crashSections = parseInput(crashText);
assert.deepEqual(
  crashSections.map((section) => section.id),
  ['summary', 'exception', 'crashed-thread'],
  'legacy crash Phase 1 output contains only summary, exception, and crashed thread'
);
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'App'), 'DemoApp');
assert.equal(fieldValue(sectionById(crashSections, 'summary'), 'Version'), '2.1.4 (318)');
assert.equal(fieldValue(sectionById(crashSections, 'exception'), 'Termination Reason'), 'Namespace SIGNAL, Code 11 Segmentation fault: 11');
assert.equal(sectionById(crashSections, 'crashed-thread').table[1].symbol, 'viewDidLoad + 44');

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

const panicSections = parseInput('panic(cpu 0 caller 0xfffffff): fictional panic text');
assert.equal(panicSections[0].id, 'panic-placeholder');
assert.match(panicSections[0].raw, /Full panic rendering is planned for Phase 2/);

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

console.log('Phase 1 parser tests passed');
