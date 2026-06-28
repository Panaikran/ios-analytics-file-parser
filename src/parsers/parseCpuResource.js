import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const PATH_DETECTION_PATTERN = /(?:\/private\/var\/|\/var\/mobile\/|\/var\/root\/|file:\/\/\/|\/Users\/|C:\\Users\\|C:\\ProgramData\\)/i;
const PATH_VALUE_PATTERN = /(?:file:\/\/\/[^\s,;]+|\/private\/var\/[^\s,;]+|\/var\/mobile\/[^\s,;]+|\/var\/root\/[^\s,;]+|\/Users\/[^\s,;]+|C:\\Users\\[^\s,;]+|C:\\ProgramData\\[^\s,;]+)/gi;
const UUID_PATTERN = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/gi;
const MAC_ADDRESS_PATTERN = /\b[0-9A-F]{2}(?::[0-9A-F]{2}){5}\b/gi;
const ADDRESS_VALUE_PATTERN = /\b0x[0-9A-F]{8,}\b/gi;
const SERIAL_VALUE_PATTERN = /\b(?:FICTIONAL-)?SERIAL-[A-Z0-9-]+\b/gi;
const REQUEST_OR_DIAGNOSTIC_ID_PATTERN = /\b(?:REQ|REQUEST|INCIDENT|DEVICE|USER)-[A-Z0-9-]+\b/gi;
const SENSITIVE_LABEL_VALUE_PATTERN =
  /\b(ECID|UniqueChipID|ChipID|IMEI|MEID|MAC|BluetoothAddress|WiFiAddress|HardwareAddress|DeviceID|device_id|Serial|serial|uuid|identifier|token|key)\b\s*(?:is|:|=)?\s*([A-Z0-9][A-Z0-9-]{7,}|0x[0-9A-F]{8,}|[0-9A-F]{2}(?::[0-9A-F]{2}){5})/gi;
const SENSITIVE_KEY_PARTS = [
  'uuid',
  'identifier',
  'serial',
  'request',
  'key',
  'token',
  'deviceid',
  'incident',
  'userid',
  'ecid',
  'uniquechipid',
  'chipid',
  'imei',
  'meid',
  'mac',
  'bluetoothaddress',
  'wifiaddress',
  'hardwareaddress',
];
const RAW_ALLOWED_KEY_PARTS = ['incident'];
const PATH_FIELD_KEY_PARTS = ['path', 'command', 'executable'];

export function parseCpuResource(input, options = {}) {
  const sanitizeText = createSanitizer(options);
  const { metadata, bodyText, fields } = normalizeCpuInput(input);

  const processInfo = parseProcessLine(valueByField(fields, 'process'));
  const reason = firstValue(valueByField(fields, 'reason'), valueByField(fields, 'primary reason'));
  const actionTaken = valueByField(fields, 'action taken');
  const cpuLimit = valueByField(fields, 'cpu limit');

  const sections = [
    createSection({
      id: 'resource-cpu-summary',
      title: 'CPU Resource Summary',
      priority: 'warning',
      fields: compactFields([
        toField('Bug Type', firstValue(metadata.bug_type, valueByField(fields, 'bug type')), sanitizeText, options, 'bug_type'),
        toField('Timestamp', firstValue(metadata.timestamp, valueByField(fields, 'date/time'), valueByField(fields, 'date')), sanitizeText, options, 'timestamp'),
        toField('OS Version', firstValue(metadata.os_version, metadata.osVersion, valueByField(fields, 'os version')), sanitizeText, options, 'os_version'),
        toField('Device', firstValue(metadata.device_model, metadata.product, valueByField(fields, 'device'), valueByField(fields, 'model')), sanitizeText, options, 'device'),
        toField('Incident ID', firstValue(metadata.incident_id, metadata.incident, valueByField(fields, 'incident id')), sanitizeText, options, 'incident_id'),
        toField('Report Type', 'CPU Resource', sanitizeText, options, 'report_type'),
        toField('Primary Reason', reason, sanitizeText, options, 'primary_reason'),
        toField('Action Taken', actionTaken, sanitizeText, options, 'action_taken'),
      ]),
    }),
  ];

  const processFields = compactFields([
    toField('Process', firstValue(processInfo.name, valueByField(fields, 'process name')), sanitizeText, options, 'process'),
    toField('PID', firstValue(processInfo.pid, valueByField(fields, 'pid')), sanitizeText, options, 'pid'),
    toField('Bundle ID', valueByField(fields, 'bundle id'), sanitizeText, options, 'bundle_id'),
    toField('Command', valueByField(fields, 'command'), sanitizeText, options, 'command'),
    toField('Executable', valueByField(fields, 'executable'), sanitizeText, options, 'executable'),
    toField('Path', valueByField(fields, 'path'), sanitizeText, options, 'path'),
  ]);

  if (processFields.length) {
    sections.push(
      createSection({
        id: 'resource-cpu-process-info',
        title: 'Process / Command Info',
        priority: 'info',
        fields: processFields,
      })
    );
  }

  const usageFields = compactFields([
    toField('CPU Used', valueByField(fields, 'cpu used'), sanitizeText, options, 'cpu_used'),
    toField('CPU Limit', cpuLimit, sanitizeText, options, 'cpu_limit'),
    toField('CPU Duration', firstValue(valueByField(fields, 'cpu duration'), valueByField(fields, 'duration')), sanitizeText, options, 'cpu_duration'),
    toField('CPU Time', valueByField(fields, 'cpu time'), sanitizeText, options, 'cpu_time'),
    toField('Wakeups', valueByField(fields, 'wakeups'), sanitizeText, options, 'wakeups'),
    toField('Thread Count', firstValue(valueByField(fields, 'thread count'), valueByField(fields, 'threads')), sanitizeText, options, 'thread_count'),
  ]);

  if (usageFields.length) {
    sections.push(
      createSection({
        id: 'resource-cpu-usage',
        title: 'CPU Usage',
        priority: 'warning',
        fields: usageFields,
      })
    );
  }

  const limitFields = compactFields([
    toField('CPU Limit', cpuLimit, sanitizeText, options, 'cpu_limit'),
    toField('Window', valueByField(fields, 'window'), sanitizeText, options, 'window'),
    toField('Threshold', valueByField(fields, 'threshold'), sanitizeText, options, 'threshold'),
    toField('Action Taken', actionTaken, sanitizeText, options, 'action_taken'),
    toField('Limit Status', firstValue(valueByField(fields, 'limit status'), valueByField(fields, 'status')), sanitizeText, options, 'limit_status'),
  ]);

  if (limitFields.length) {
    sections.push(
      createSection({
        id: 'resource-cpu-limits',
        title: 'Limits / Thresholds',
        priority: 'warning',
        fields: limitFields,
      })
    );
  }

  sections.push(
    createSection({
      id: 'resource-cpu-parser-notes',
      title: 'CPU Resource Parser Notes',
      priority: 'info',
      fields: compactFields([
        toField('Sources', sourceNote(metadata, bodyText), sanitizeText, options, 'parser_note_sources'),
        toField('Privacy', 'Paths and identifier-heavy fields are redacted or omitted in sanitized mode', sanitizeText, options, 'parser_note_privacy'),
        toField('Raw Body', 'Raw CPU resource body text is not rendered', sanitizeText, options, 'parser_note_raw_body'),
      ]),
    })
  );

  return sections;
}

function normalizeCpuInput(input) {
  const text = String(input ?? '');
  const firstLineBreak = text.indexOf('\n');
  const firstLine = firstLineBreak >= 0 ? text.slice(0, firstLineBreak).trim() : text.trim();
  const parsedMetadata = parseJsonObject(firstLine);
  const bodyText = parsedMetadata && firstLineBreak >= 0 ? text.slice(firstLineBreak + 1) : text;

  return {
    metadata: parsedMetadata ?? {},
    bodyText,
    fields: parseKeyValueFields(bodyText),
  };
}

function parseJsonObject(text) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseKeyValueFields(text) {
  const fields = new Map();
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const match = line.match(/^\s*([^:]+):\s*(.*?)\s*$/);
    if (!match) continue;
    const key = normalizeLabel(match[1]);
    if (!key || fields.has(key)) continue;
    fields.set(key, match[2]);
  }
  return fields;
}

function parseProcessLine(value) {
  const process = safeString(value);
  const match = process.match(/^\s*(.+?)\s*\[(\d+)\]\s*$/);
  if (match) {
    return { name: match[1], pid: match[2] };
  }

  return { name: process, pid: '' };
}

function valueByField(fields, label) {
  return fields.get(normalizeLabel(label));
}

function toField(label, value, sanitizeText, options, key = label) {
  const sanitized = sanitizeByKey(key, value, sanitizeText, options);
  return sanitized === '' ? null : { label, value: sanitized };
}

function compactFields(fields) {
  return fields.filter(Boolean);
}

function sanitizeByKey(key, value, sanitizeText, options) {
  const stringValue = safeString(value);
  if (!stringValue) return '';

  if (isPathKey(key)) {
    return options.sanitize === false ? '' : '[path redacted]';
  }

  if (PATH_DETECTION_PATTERN.test(stringValue) && stringValue.trim().match(PATH_DETECTION_PATTERN)?.[0] === stringValue.trim()) {
    return options.sanitize === false ? '' : '[path redacted]';
  }

  if (options.sanitize !== false) {
    if (isSensitiveKey(key)) return '[identifier redacted]';
    return redactSensitiveValuePatterns(sanitizeText(stringValue), { redactPaths: true, redactAddresses: true });
  }

  if (isSensitiveKey(key) && !isRawAllowedKey(key)) return '[identifier redacted]';
  return redactSensitiveValuePatterns(stringValue, { redactPaths: true, redactAddresses: true });
}

function redactSensitiveValuePatterns(value, { redactPaths, redactAddresses }) {
  let nextValue = String(value ?? '');
  if (!nextValue) return '';

  if (redactPaths) {
    nextValue = nextValue.replace(PATH_VALUE_PATTERN, '[path redacted]');
  }

  if (redactAddresses) {
    nextValue = nextValue.replace(ADDRESS_VALUE_PATTERN, '[address redacted]');
  }

  return nextValue
    .replace(SENSITIVE_LABEL_VALUE_PATTERN, '$1 [identifier redacted]')
    .replace(UUID_PATTERN, '[identifier redacted]')
    .replace(MAC_ADDRESS_PATTERN, '[identifier redacted]')
    .replace(REQUEST_OR_DIAGNOSTIC_ID_PATTERN, '[identifier redacted]')
    .replace(SERIAL_VALUE_PATTERN, '[identifier redacted]');
}

function isSensitiveKey(key) {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function isRawAllowedKey(key) {
  const normalized = normalizeKey(key);
  return RAW_ALLOWED_KEY_PARTS.some((part) => normalized.includes(part));
}

function isPathKey(key) {
  const normalized = normalizeKey(key);
  return PATH_FIELD_KEY_PARTS.some((part) => normalized.includes(part));
}

function sourceNote(metadata, bodyText) {
  const sources = [];
  if (Object.keys(metadata ?? {}).length) sources.push('metadata');
  if (String(bodyText ?? '').trim()) sources.push('text');
  return sources.length ? `Values extracted from ${sources.join(' and ')}` : 'No structured CPU resource fields were available';
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function safeString(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function normalizeLabel(label) {
  return String(label ?? '').trim().toLowerCase();
}

function normalizeKey(key) {
  return String(key ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
