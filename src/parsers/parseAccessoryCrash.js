import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const SENSITIVE_KEY_PARTS = [
  'uuid',
  'identifier',
  'serial',
  'request',
  'key',
  'token',
  'deviceid',
  'incident',
  'crashreporter',
  'accessoryid',
  'accessoryidentifier',
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
const RAW_ALLOWED_KEY_PARTS = ['incident', 'request'];
const PATH_DETECTION_PATTERN = /(?:\/private\/var\/|\/var\/mobile\/|\/var\/root\/|file:\/\/\/|\/Users\/|C:\\Users\\|C:\\ProgramData\\)/i;
const PATH_VALUE_PATTERN = /(?:file:\/\/\/[^\s,;]+|\/private\/var\/[^\s,;]+|\/var\/mobile\/[^\s,;]+|\/var\/root\/[^\s,;]+|\/Users\/[^\s,;]+|C:\\Users\\[^\s,;]+|C:\\ProgramData\\[^\s,;]+)/gi;
const SERIAL_ASSIGNMENT_PATTERN = /\b(serial(?:\s*(?:number|no))?\s*[=:]\s*)([^,\s;]+)/gi;
const SERIAL_VALUE_PATTERN = /\b(?:FICTIONAL-)?SERIAL-[A-Z0-9-]+\b/i;
const UUID_PATTERN = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/i;
const MAC_ADDRESS_PATTERN = /\b[0-9A-F]{2}(?::[0-9A-F]{2}){5}\b/gi;
const ADDRESS_VALUE_PATTERN = /\b0x[0-9A-F]{8,}\b/gi;
const REQUEST_OR_CRASHLOG_ID_PATTERN = /\b(?:REQ|CRASHLOG|ACCESSORY-ID|DEVICE-ID)-[A-Z0-9-]+\b/gi;
const SENSITIVE_LABEL_VALUE_PATTERN =
  /\b(AccessoryIdentifier|accessory_id|DeviceID|device_id|ECID|UniqueChipID|ChipID|IMEI|MEID|MAC|BluetoothAddress|WiFiAddress|HardwareAddress|CrashReporterKey|crashReporterKey|RequestID|requestID|uuid|identifier|token|key)\b\s*(?:is|:|=)?\s*([A-Z0-9][A-Z0-9-]{7,}|0x[0-9A-F]{8,}|[0-9A-F]{2}(?::[0-9A-F]{2}){5})/gi;

export function parseAccessoryCrash(report, metadata = {}, options = {}) {
  const sanitizeText = createSanitizer(options);
  const body = isPlainObject(report) ? report : {};
  const meta = isPlainObject(metadata) ? metadata : {};
  const crashlogs = Array.isArray(body.crashlogs) ? body.crashlogs : [];
  const crashlogsMalformed = body.crashlogs !== undefined && !Array.isArray(body.crashlogs);
  const sections = [];

  sections.push(
    createSection({
      id: 'accessory-crash-summary',
      title: 'Accessory Crash Summary',
      priority: 'warning',
      fields: compactFields([
        toField('Bug Type', firstValue(meta.bug_type, body.bug_type), sanitizeText, options, 'bug_type'),
        toField('Timestamp', firstValue(meta.timestamp, body.timestamp, body.date), sanitizeText, options, 'timestamp'),
        toField('OS Version', firstValue(meta.os_version, body.os_version, body.build, formatOsVersion(body.osVersion)), sanitizeText, options, 'os_version'),
        toField('Device', firstValue(meta.device_model, meta.product, body.device_model, body.product, body.modelCode), sanitizeText, options, 'device'),
        toField('Incident ID', firstValue(meta.incident_id, meta.incident, body.incident_id, body.incident), sanitizeText, options, 'incident_id'),
        toField('Crash Log Count', Array.isArray(body.crashlogs) ? crashlogs.length : 'Not available', sanitizeText, options, 'crashlog_count'),
        toField('Primary Reason', primaryReason(body, crashlogs), sanitizeText, options, 'primary_reason'),
      ]),
    })
  );

  const accessoryFields = compactFields([
    toField('Accessory Type', firstValue(body.accessory_type, body.accessoryType), sanitizeText, options, 'accessory_type'),
    toField('Accessory OS Train', firstValue(body.accessory_os_train, body.accessoryOsTrain), sanitizeText, options, 'accessory_os_train'),
    toField('Accessory OS Version', firstValue(body.accessory_os_version, body.accessoryOsVersion), sanitizeText, options, 'accessory_os_version'),
    toField('Accessory PID', firstValue(body.accessory_pid, body.accessoryPid), sanitizeText, options, 'accessory_pid'),
    toField(
      'Accessory Machine Config',
      firstValue(body.accessory_machine_config, body.accessoryMachineConfig),
      sanitizeText,
      options,
      'accessory_machine_config'
    ),
  ]);

  if (accessoryFields.length) {
    sections.push(
      createSection({
        id: 'accessory-information',
        title: 'Accessory Information',
        priority: 'info',
        fields: accessoryFields,
      })
    );
  }

  const applicationFields = normalizeApplicationInfo(firstValue(body['application-info'], body.applicationInfo), sanitizeText, options);
  if (applicationFields.length) {
    sections.push(
      createSection({
        id: 'accessory-application-information',
        title: 'Application Information',
        priority: 'info',
        fields: applicationFields,
      })
    );
  }

  if (crashlogs.length) {
    sections.push(
      createSection({
        id: 'accessory-crashlog-overview',
        title: 'Crash Log Overview',
        priority: 'info',
        tableColumns: [
          { key: 'index', label: 'Index' },
          { key: 'process', label: 'Process' },
          { key: 'type', label: 'Type' },
          { key: 'reason', label: 'Reason' },
          { key: 'timestamp', label: 'Timestamp' },
          { key: 'frames', label: 'Frames' },
        ],
        table: normalizeCrashlogs(crashlogs, sanitizeText, options),
        tableSummary: `${crashlogs.length} crashlog${crashlogs.length === 1 ? '' : 's'} summarized`,
      })
    );
  }

  const faultFields = extractFaultNotes(body, sanitizeText, options);
  if (faultFields.length) {
    sections.push(
      createSection({
        id: 'accessory-panic-fault-notes',
        title: 'Panic / Fault Notes',
        priority: 'warning',
        fields: faultFields,
      })
    );
  }

  sections.push(
    createSection({
      id: 'accessory-crash-parser-notes',
      title: 'Accessory Crash Parser Notes',
      priority: crashlogsMalformed ? 'warning' : 'info',
      fields: compactFields([
        toField(
          'Crashlogs',
          crashlogsMalformed ? 'Crashlogs unavailable or malformed' : `${crashlogs.length} summarized`,
          sanitizeText,
          options,
          'parser_note_crashlogs'
        ),
        toField('Privacy', 'Identifier-heavy fields are redacted or omitted in sanitized mode', sanitizeText, options, 'parser_note_privacy'),
        toField('Raw Payloads', 'Nested crashlogs are summarized; raw payload bodies are not rendered', sanitizeText, options, 'parser_note_raw_payloads'),
      ]),
    })
  );

  return sections;
}

function normalizeApplicationInfo(info, sanitizeText, options) {
  if (!isPlainObject(info)) return [];

  return compactFields([
    toField('Process', valueByKeys(info, ['process', 'processName', 'name']), sanitizeText, options, 'process'),
    toField('Bundle ID', valueByKeys(info, ['bundleID', 'bundleId', 'bundle_id']), sanitizeText, options, 'bundle_id'),
    toField('Version', valueByKeys(info, ['version', 'appVersion']), sanitizeText, options, 'version'),
    toField('Build', valueByKeys(info, ['build', 'buildVersion']), sanitizeText, options, 'build'),
    toField('Request ID', valueByKeys(info, ['requestID', 'requestId', 'request_id']), sanitizeText, options, 'requestID'),
  ]);
}

function normalizeCrashlogs(crashlogs, sanitizeText, options) {
  return crashlogs.map((crashlog, index) => {
    const log = isPlainObject(crashlog) ? crashlog : {};
    return {
      index: String(index + 1),
      process: sanitizeByKey('process', firstValue(log.process, log.processName, log.name), sanitizeText, options),
      type: sanitizeByKey('type', firstValue(log.type, log.crashType, log.kind), sanitizeText, options),
      reason: sanitizeByKey('reason', firstValue(log.reason, log.summary, log.exception), sanitizeText, options),
      timestamp: sanitizeByKey('timestamp', firstValue(log.timestamp, log.date), sanitizeText, options),
      frames: String(frameCount(log)),
    };
  });
}

function extractFaultNotes(body, sanitizeText, options) {
  return compactFields([
    toField('Fault Reason', firstValue(body.faultReason, body.reason), sanitizeText, options, 'faultReason'),
    toField('Panic String', firstValue(body.panicString, body.panic), sanitizeText, options, 'panicString'),
    toField('Fault Text', firstValue(body.faultText, body.fault), sanitizeText, options, 'faultText'),
  ]);
}

function toField(label, value, sanitizeText, options, key = label) {
  const sanitized = sanitizeByKey(key, value, sanitizeText, options);
  return sanitized === '' ? null : { label, value: sanitized };
}

function compactFields(fields) {
  return fields.filter(Boolean);
}

function primaryReason(body, crashlogs) {
  return firstValue(
    body.faultReason,
    body.reason,
    crashlogs.find((log) => isPlainObject(log) && firstValue(log.reason, log.summary, log.exception))?.reason,
    crashlogs.find((log) => isPlainObject(log) && firstValue(log.summary, log.exception))?.summary
  );
}

function sanitizeByKey(key, value, sanitizeText, options) {
  const stringValue = safeString(value);
  if (!stringValue) return '';

  if (PATH_DETECTION_PATTERN.test(stringValue) && stringValue.trim().match(PATH_DETECTION_PATTERN)?.[0] === stringValue.trim()) {
    return options.sanitize === false ? '' : '[path redacted]';
  }

  if (options.sanitize !== false) {
    if (isSensitiveKey(key)) {
      return '[identifier redacted]';
    }
    return redactSensitiveValuePatterns(sanitizeText(stringValue), { redactPaths: true, redactAddresses: true });
  }

  if (isSensitiveKey(key) && !isRawAllowedKey(key)) {
    return '[identifier redacted]';
  }

  if (isRawAllowedKey(key)) {
    return redactRawAllowedScalar(stringValue);
  }

  return redactSensitiveValuePatterns(stringValue, { redactPaths: true });
}

function redactRawAllowedScalar(value) {
  return String(value ?? '')
    .replace(PATH_VALUE_PATTERN, '[path redacted]')
    .replace(SENSITIVE_LABEL_VALUE_PATTERN, '$1 [identifier redacted]')
    .replace(SERIAL_ASSIGNMENT_PATTERN, '$1[identifier redacted]')
    .replace(MAC_ADDRESS_PATTERN, '[identifier redacted]')
    .replace(SERIAL_VALUE_PATTERN, '[identifier redacted]');
}

function redactSensitiveValuePatterns(value, { redactPaths, redactAddresses = false }) {
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
    .replace(SERIAL_ASSIGNMENT_PATTERN, '$1[identifier redacted]')
    .replace(UUID_PATTERN, '[identifier redacted]')
    .replace(MAC_ADDRESS_PATTERN, '[identifier redacted]')
    .replace(REQUEST_OR_CRASHLOG_ID_PATTERN, '[identifier redacted]')
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

function normalizeKey(key) {
  return String(key ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function frameCount(crashlog) {
  if (Array.isArray(crashlog.frames)) return crashlog.frames.length;
  if (Array.isArray(crashlog.stackFrames)) return crashlog.stackFrames.length;
  if (Array.isArray(crashlog.backtrace)) return crashlog.backtrace.length;
  return '';
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function valueByKeys(object, keys) {
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null && object[key] !== '') return object[key];
  }

  const entries = Object.entries(object);
  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    const match = entries.find(([entryKey, entryValue]) => normalizeKey(entryKey) === normalizedKey && entryValue !== undefined && entryValue !== null && entryValue !== '');
    if (match) return match[1];
  }

  return undefined;
}

function safeString(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function formatOsVersion(osVersion) {
  if (!osVersion) return '';
  if (typeof osVersion === 'string') return osVersion;
  if (!isPlainObject(osVersion)) return String(osVersion);
  return [osVersion.train, osVersion.build ? `(${osVersion.build})` : '', osVersion.releaseType].filter(Boolean).join(' ');
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
