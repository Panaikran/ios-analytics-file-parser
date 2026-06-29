import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const PATH_DETECTION_PATTERN = /(?:\/private\/var\/|\/var\/mobile\/|\/var\/root\/|file:\/\/\/|\/Users\/|C:\\Users\\|C:\\ProgramData\\)/i;
const PATH_VALUE_PATTERN = /(?:file:\/\/\/[^\s,;]+|\/private\/var\/[^\s,;]+|\/var\/mobile\/[^\s,;]+|\/var\/root\/[^\s,;]+|\/Users\/[^\s,;]+|C:\\Users\\[^\s,;]+|C:\\ProgramData\\[^\s,;]+)/gi;
const UUID_PATTERN = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/gi;
const MAC_ADDRESS_PATTERN = /\b[0-9A-F]{2}(?::[0-9A-F]{2}){5}\b/gi;
const ADDRESS_VALUE_PATTERN = /\b0x[0-9A-F]{8,}\b/gi;
const SERIAL_VALUE_PATTERN = /\b(?:FICTIONAL-)?SERIAL-[A-Z0-9-]+\b/gi;
const REQUEST_OR_DIAGNOSTIC_ID_PATTERN = /\b(?:REQ|REQUEST|INCIDENT|DEVICE|USER|VOLUME)-[A-Z0-9-]+\b/gi;
const SENSITIVE_LABEL_VALUE_PATTERN =
  /\b(ECID|UniqueChipID|ChipID|IMEI|MEID|MAC|BluetoothAddress|WiFiAddress|HardwareAddress|DeviceID|device_id|Serial|serial|uuid|identifier|token|key|volume(?:\s+uuid| identifier)?)\b\s*(?:is|:|=)?\s*([A-Z0-9][A-Z0-9-]{7,}|0x[0-9A-F]{8,}|[0-9A-F]{2}(?::[0-9A-F]{2}){5})/gi;
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
  'volume',
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
const PATH_FIELD_KEY_PARTS = ['path', 'command', 'executable'];

export function parseDiskWritesResource(input, options = {}) {
  const sanitizeText = createSanitizer(options);
  const { metadata, bodyText, fields, pathEntryCount } = normalizeDiskWritesInput(input);

  const processInfo = parseProcessLine(valueByField(fields, 'process'));
  const reason = firstValue(valueByField(fields, 'reason'), valueByField(fields, 'primary reason'));
  const actionTaken = firstValue(valueByField(fields, 'action taken'), valueByField(fields, 'action'));

  const sections = [
    createSection({
      id: 'resource-diskwrites-summary',
      title: 'Disk Writes Resource Summary',
      priority: 'warning',
      fields: compactFields([
        toField('Bug Type', firstValue(metadata.bug_type, valueByField(fields, 'bug type')), sanitizeText, options, 'bug_type'),
        toField('Timestamp', firstValue(metadata.timestamp, valueByField(fields, 'date/time'), valueByField(fields, 'date')), sanitizeText, options, 'timestamp'),
        toField('OS Version', firstValue(metadata.os_version, metadata.osVersion, valueByField(fields, 'os version')), sanitizeText, options, 'os_version'),
        toField('Device', firstValue(metadata.device_model, metadata.product, valueByField(fields, 'device'), valueByField(fields, 'model')), sanitizeText, options, 'device'),
        toField('Incident ID', firstValue(metadata.incident_id, metadata.incident, valueByField(fields, 'incident id')), sanitizeText, options, 'incident_id'),
        toField('Report Type', 'Disk Writes Resource', sanitizeText, options, 'report_type'),
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
        id: 'resource-diskwrites-process-info',
        title: 'Process / Command Info',
        priority: 'info',
        fields: processFields,
      })
    );
  }

  const usageFields = compactFields([
    toField('Logical Writes', valueByField(fields, 'logical writes'), sanitizeText, options, 'logical_writes'),
    toField('Physical Writes', valueByField(fields, 'physical writes'), sanitizeText, options, 'physical_writes'),
    toField('Bytes Written', valueByField(fields, 'bytes written'), sanitizeText, options, 'bytes_written'),
    toField('Write Count', valueByField(fields, 'write count'), sanitizeText, options, 'write_count'),
    toField('Duration', valueByField(fields, 'duration'), sanitizeText, options, 'duration'),
    toField('Write Rate', valueByField(fields, 'write rate'), sanitizeText, options, 'write_rate'),
    toField('Path Entry Count', pathEntryCount ? String(pathEntryCount) : '', sanitizeText, options, 'entry_count'),
  ]);

  if (usageFields.length) {
    sections.push(
      createSection({
        id: 'resource-diskwrites-usage',
        title: 'Disk Write Usage',
        priority: 'warning',
        fields: usageFields,
      })
    );
  }

  const limitFields = compactFields([
    toField('Logical Write Limit', valueByField(fields, 'logical write limit'), sanitizeText, options, 'logical_write_limit'),
    toField('Physical Write Limit', valueByField(fields, 'physical write limit'), sanitizeText, options, 'physical_write_limit'),
    toField('Window', valueByField(fields, 'window'), sanitizeText, options, 'window'),
    toField('Threshold', valueByField(fields, 'threshold'), sanitizeText, options, 'threshold'),
    toField('Action Taken', actionTaken, sanitizeText, options, 'action_taken'),
    toField('Limit Status', firstValue(valueByField(fields, 'limit status'), valueByField(fields, 'status')), sanitizeText, options, 'limit_status'),
  ]);

  if (limitFields.length) {
    sections.push(
      createSection({
        id: 'resource-diskwrites-limits',
        title: 'Limits / Thresholds',
        priority: 'warning',
        fields: limitFields,
      })
    );
  }

  sections.push(
    createSection({
      id: 'resource-diskwrites-parser-notes',
      title: 'Disk Writes Resource Parser Notes',
      priority: 'info',
      fields: compactFields([
        toField('Sources', sourceNote(metadata, bodyText), sanitizeText, options, 'parser_note_sources'),
        toField('Privacy', 'Paths and identifier-heavy fields are redacted or omitted in sanitized mode', sanitizeText, options, 'parser_note_privacy'),
        toField('Raw Body', 'Raw Disk Writes resource body data is not rendered', sanitizeText, options, 'parser_note_raw_body'),
        toField('Path Data', pathEntryCount ? `${pathEntryCount} path-like entries summarized by count only` : 'No path-heavy entries were rendered', sanitizeText, options, 'parser_note_entry_data'),
      ]),
    })
  );

  return sections;
}

function normalizeDiskWritesInput(input) {
  const text = String(input ?? '');
  const firstLineBreak = text.indexOf('\n');
  const firstLine = firstLineBreak >= 0 ? text.slice(0, firstLineBreak).trim() : text.trim();
  const parsedMetadata = parseJsonObject(firstLine);
  const bodyText = parsedMetadata && firstLineBreak >= 0 ? text.slice(firstLineBreak + 1) : text;
  const parsedBody = parseJsonObject(bodyText) ?? (parsedMetadata && firstLineBreak < 0 ? parsedMetadata : null);
  const metadata = parsedMetadata && firstLineBreak >= 0 ? parsedMetadata : {};
  const fields = parsedBody ? fieldsFromJsonBody(parsedBody) : parseKeyValueFields(bodyText);

  return {
    metadata,
    bodyText,
    fields,
    pathEntryCount: parsedBody ? countPathEntries(parsedBody) : countPathEntries([...fields.values()]),
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

function fieldsFromJsonBody(body) {
  const fields = new Map();
  const diskWrites = isPlainObject(body.diskWrites) ? body.diskWrites : {};
  const limits = isPlainObject(body.limits) ? body.limits : {};

  addJsonField(fields, 'bug type', body.bug_type);
  addJsonField(fields, 'date/time', firstValue(body.timestamp, body.date));
  addJsonField(fields, 'os version', firstValue(body.os_version, body.osVersion));
  addJsonField(fields, 'device', firstValue(body.device_model, body.product));
  addJsonField(fields, 'incident id', firstValue(body.incident_id, body.incident));
  addJsonField(fields, 'process', firstValue(body.process, body.procname, body.processName));
  addJsonField(fields, 'pid', body.pid);
  addJsonField(fields, 'bundle id', firstValue(body.bundleID, body.bundleId, body.bundle_id));
  addJsonField(fields, 'command', body.command);
  addJsonField(fields, 'executable', body.executable);
  addJsonField(fields, 'path', body.path);
  addJsonField(fields, 'action taken', firstValue(body.actionTaken, body.action_taken, limits.actionTaken, limits.action_taken));
  addJsonField(fields, 'reason', firstValue(body.reason, body.primaryReason, body.primary_reason));
  addJsonField(fields, 'logical writes', firstValue(body.logicalWrites, body.logical_writes, diskWrites.logicalWrites, diskWrites.logical_writes));
  addJsonField(fields, 'physical writes', firstValue(body.physicalWrites, body.physical_writes, diskWrites.physicalWrites, diskWrites.physical_writes));
  addJsonField(fields, 'bytes written', firstValue(body.bytesWritten, body.bytes_written, diskWrites.bytesWritten, diskWrites.bytes_written));
  addJsonField(fields, 'write count', firstValue(body.writeCount, body.write_count, diskWrites.writeCount, diskWrites.write_count));
  addJsonField(fields, 'duration', firstValue(body.duration, body.diskWriteDuration, body.disk_write_duration, diskWrites.duration, diskWrites.diskWriteDuration));
  addJsonField(fields, 'write rate', firstValue(body.writeRate, body.write_rate, diskWrites.writeRate, diskWrites.write_rate));
  addJsonField(fields, 'logical write limit', firstValue(body.writeLimit, body.logicalWriteLimit, body.logical_write_limit, limits.writeLimit, limits.logicalWriteLimit));
  addJsonField(fields, 'physical write limit', firstValue(body.physicalWriteLimit, body.physical_write_limit, limits.physicalWriteLimit));
  addJsonField(fields, 'window', firstValue(body.window, limits.window));
  addJsonField(fields, 'threshold', firstValue(body.threshold, limits.threshold));
  addJsonField(fields, 'limit status', firstValue(body.limitStatus, body.limit_status, body.status, limits.status));

  return fields;
}

function addJsonField(fields, label, value) {
  const stringValue = safeString(value);
  if (stringValue) fields.set(normalizeLabel(label), stringValue);
}

function countPathEntries(value) {
  if (typeof value === 'string') return PATH_DETECTION_PATTERN.test(value) ? 1 : 0;
  if (Array.isArray(value)) return value.reduce((count, entry) => count + countPathEntries(entry), 0);
  if (isPlainObject(value)) {
    return Object.values(value).reduce((count, entry) => count + countPathEntries(entry), 0);
  }
  return 0;
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

  if (isSensitiveKey(key)) return '[identifier redacted]';
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

function isPathKey(key) {
  const normalized = normalizeKey(key);
  return PATH_FIELD_KEY_PARTS.some((part) => normalized.includes(part));
}

function sourceNote(metadata, bodyText) {
  const sources = [];
  if (Object.keys(metadata ?? {}).length) sources.push('metadata');
  if (String(bodyText ?? '').trim()) sources.push('body');
  return sources.length ? `Values extracted from ${sources.join(' and ')}` : 'No structured Disk Writes resource fields were available';
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
