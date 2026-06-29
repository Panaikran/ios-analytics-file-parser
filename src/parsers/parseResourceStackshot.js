import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const MAX_PROCESS_ROWS = 100;
const BYTES_PER_MB = 1024 * 1024;
const PATH_DETECTION_PATTERN = /(?:\/private\/var\/|\/var\/mobile\/|\/var\/root\/|file:\/\/\/|\/Users\/|C:\\Users\\|C:\\ProgramData\\)/i;
const PATH_VALUE_PATTERN = /(?:file:\/\/\/[^\s,;]+|\/private\/var\/[^\s,;]+|\/var\/mobile\/[^\s,;]+|\/var\/root\/[^\s,;]+|\/Users\/[^\s,;]+|C:\\Users\\[^\s,;]+|C:\\ProgramData\\[^\s,;]+)/gi;
const UUID_PATTERN = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/gi;
const MAC_ADDRESS_PATTERN = /\b[0-9A-F]{2}(?::[0-9A-F]{2}){5}\b/gi;
const ADDRESS_VALUE_PATTERN = /\b0x[0-9A-F]{8,}\b/gi;
const FRAME_SYMBOL_PATTERN = /\b_[A-Za-z][A-Za-z0-9_]*\b/g;
const SERIAL_VALUE_PATTERN = /\b(?:FICTIONAL-)?SERIAL-[A-Z0-9-]+\b/gi;
const REQUEST_OR_DIAGNOSTIC_ID_PATTERN = /\b(?:REQ|REQUEST|INCIDENT|DEVICE|USER|VOLUME|CRASHKEY)-[A-Z0-9-]+\b/gi;
const SENSITIVE_LABEL_VALUE_PATTERN =
  /\b(ECID|UniqueChipID|ChipID|IMEI|MEID|MAC|BluetoothAddress|WiFiAddress|HardwareAddress|DeviceID|device_id|Serial|serial|uuid|slice_uuid|identifier|token|key|CrashReporterKey|crashReporterKey|volume(?:\s+uuid| identifier)?)\b\s*(?:is|:|=)?\s*([A-Z0-9][A-Z0-9-]{7,}|0x[0-9A-F]{8,}|[0-9A-F]{2}(?::[0-9A-F]{2}){5})/gi;
const SENSITIVE_KEY_PARTS = [
  'uuid',
  'sliceuuid',
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

export function parseResourceStackshot(input, options = {}) {
  const sanitizeText = createSanitizer(options);
  const { metadata, body, bodyText } = normalizeStackshotInput(input);
  const pageSize = numberOrNull(body.memoryStatus?.pageSize ?? body.pageSize);
  const processSource = body.processByPid;
  const processes = normalizeProcesses(processSource, pageSize);
  const trigger = findTriggeredProcess(body, processes);
  const sortedProcesses = sortProcesses(processes, trigger);
  const renderedProcesses = sortedProcesses.slice(0, MAX_PROCESS_ROWS);

  const sections = [
    createSection({
      id: 'resource-stackshot-summary',
      title: 'Stackshot Resource Summary',
      priority: 'warning',
      fields: compactFields([
        toField('Bug Type', firstValue(metadata.bug_type, body.bug_type), sanitizeText, 'bug_type'),
        toField('Timestamp', firstValue(metadata.timestamp, body.timestamp, body.date), sanitizeText, 'timestamp'),
        toField('OS Version', firstValue(metadata.os_version, metadata.osVersion, body.os_version, body.osVersion), sanitizeText, 'os_version'),
        toField('Device', firstValue(metadata.device_model, metadata.product, body.device_model, body.product), sanitizeText, 'device'),
        toField('Incident ID', firstValue(metadata.incident_id, metadata.incident, body.incident_id, body.incident), sanitizeText, 'incident_id'),
        toField('Report Type', 'Stackshot Resource', sanitizeText, 'report_type'),
        toField('Process Count', String(processes.length), sanitizeText, 'process_count'),
        toField('Rendered Process Rows', String(renderedProcesses.length), sanitizeText, 'rendered_process_rows'),
        toField('Primary Reason', body.reason, sanitizeText, 'primary_reason'),
      ]),
    }),
  ];

  const triggerFields = compactFields([
    toField('Exception', body.exception, sanitizeText, 'exception'),
    toField('Reason', body.reason, sanitizeText, 'reason'),
    toField('Triggered Process', firstValue(trigger?.name, body.triggeredProcess, body.targetProcess), sanitizeText, 'triggered_process'),
    toField('Triggered PID', firstValue(trigger?.pid, body.triggeredPid, body.targetPid), sanitizeText, 'triggered_pid'),
    toField('Selection', trigger ? 'Matched trigger process' : '', sanitizeText, 'selection'),
    toField('Notes', firstValue(body.notes, body.note), sanitizeText, 'notes'),
  ]);

  if (triggerFields.length) {
    sections.push(
      createSection({
        id: 'resource-stackshot-trigger-reason',
        title: 'Trigger / Reason',
        priority: 'warning',
        fields: triggerFields,
      })
    );
  }

  if (processSource !== undefined || hasOverviewInformation(body)) {
    sections.push(
      createSection({
        id: 'resource-stackshot-process-overview',
        title: 'Process Overview',
        priority: 'info',
        fields: compactFields([
          toField('Total Processes', String(processes.length), sanitizeText, 'total_processes'),
          toField('Processes With CPU', String(processes.filter((process) => process.cpuSort !== null).length), sanitizeText, 'processes_with_cpu'),
          toField('Processes With Memory', String(processes.filter((process) => process.memorySort !== null).length), sanitizeText, 'processes_with_memory'),
          toField('Processes With Threads', String(processes.filter((process) => process.threadCount > 0).length), sanitizeText, 'processes_with_threads'),
          toField('Processes With Reasons', String(processes.filter((process) => process.reason).length), sanitizeText, 'processes_with_reasons'),
          toField('Page Size', pageSize !== null ? String(pageSize) : '', sanitizeText, 'page_size'),
          toField('Memory Status', summarizeMemoryStatus(body.memoryStatus), sanitizeText, 'memory_status'),
        ]),
      })
    );
  }

  if (renderedProcesses.length) {
    sections.push(
      createSection({
        id: 'resource-stackshot-top-processes',
        title: 'Top Processes',
        priority: 'warning',
        tableColumns: [
          { key: 'process', label: 'Process' },
          { key: 'pid', label: 'PID' },
          { key: 'bundleId', label: 'Bundle ID' },
          { key: 'cpu', label: 'CPU' },
          { key: 'footprintPages', label: 'Footprint / Pages' },
          { key: 'roleState', label: 'Role / State' },
          { key: 'reason', label: 'Reason' },
          { key: 'threads', label: 'Threads' },
          { key: 'frames', label: 'Frames' },
        ],
        table: renderedProcesses.map((process) => ({
          process: sanitizeByKey('process', process.name, sanitizeText),
          pid: safeString(process.pid),
          bundleId: sanitizeByKey('bundle_id', process.bundleId, sanitizeText),
          cpu: sanitizeByKey('cpu', process.cpu, sanitizeText),
          footprintPages: sanitizeByKey('memory', process.memoryDisplay, sanitizeText),
          roleState: sanitizeByKey('role_state', process.roleState, sanitizeText),
          reason: sanitizeByKey('reason', process.reason, sanitizeText),
          threads: String(process.threadCount),
          frames: String(process.frameCount),
        })),
        tableSummary: `${renderedProcesses.length} of ${processes.length} processes shown`,
      })
    );
  }

  sections.push(
    createSection({
      id: 'resource-stackshot-parser-notes',
      title: 'Stackshot Resource Parser Notes',
      priority: 'info',
      fields: compactFields([
        toField('Sources', sourceNote(metadata, bodyText), sanitizeText, 'parser_note_sources'),
        toField('Processes', processSource === undefined ? 'No processByPid data was available' : 'Processes summarized from processByPid', sanitizeText, 'parser_note_processes'),
        toField('Row Cap', `Top Processes table capped at ${MAX_PROCESS_ROWS} rows`, sanitizeText, 'parser_note_row_cap'),
        toField('Privacy', 'Paths, identifiers, frame symbols, and frame addresses are redacted or omitted', sanitizeText, 'parser_note_privacy'),
        toField('Raw Payloads', 'Raw nested stackshot payloads are not rendered', sanitizeText, 'parser_note_raw_payloads'),
        toField('Stack Frames', 'Stack frames are counted only; frame contents are not rendered', sanitizeText, 'parser_note_stack_frames'),
      ]),
    })
  );

  return sections;
}

function normalizeStackshotInput(input) {
  const text = String(input ?? '');
  const firstLineBreak = text.indexOf('\n');
  const firstLine = firstLineBreak >= 0 ? text.slice(0, firstLineBreak).trim() : text.trim();
  const parsedMetadata = parseJsonObject(firstLine);
  const bodyText = parsedMetadata && firstLineBreak >= 0 ? text.slice(firstLineBreak + 1) : text;
  const parsedBody = parseJsonObject(bodyText) ?? (parsedMetadata && firstLineBreak < 0 ? parsedMetadata : null);

  return {
    metadata: parsedMetadata && firstLineBreak >= 0 ? parsedMetadata : {},
    body: parsedBody ?? {},
    bodyText,
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

function normalizeProcesses(processByPid, pageSize) {
  if (!isPlainObject(processByPid)) return [];

  return Object.entries(processByPid).map(([pidKey, process], sourceIndex) => {
    const value = isPlainObject(process) ? process : {};
    const pid = firstValue(value.pid, pidKey);
    const cpu = firstValue(value.cpu, value.cpuPercent, value.cpuTime);
    const footprintMB = numberOrNull(firstValue(value.footprintMB, value.footprint_mb));
    const pages = numberOrNull(firstValue(value.rpages, value.physicalPages, value.pages));
    const derivedMB = footprintMB ?? (pages !== null && pageSize ? (pages * pageSize) / BYTES_PER_MB : null);
    const threadCount = countThreads(value);
    const frameCount = countFrames(value);

    return {
      sourceIndex,
      pid: safeString(pid),
      name: firstValue(value.procname, value.name, value.process, `PID ${pidKey}`),
      bundleId: firstValue(value.bundleID, value.bundleId, value.bundle_id),
      cpu: safeString(cpu),
      cpuSort: numberOrNull(cpu),
      memoryDisplay: formatMemoryDisplay(derivedMB, pages),
      memorySort: derivedMB ?? pages,
      roleState: joinParts([value.role, value.state]),
      reason: firstValue(value.reason, value.killReason),
      threadCount,
      frameCount,
    };
  });
}

function findTriggeredProcess(body, processes) {
  const targetPid = safeString(firstValue(body.targetPid, body.triggeredPid, body.pid));
  if (targetPid) {
    const byPid = processes.find((process) => safeString(process.pid) === targetPid);
    if (byPid) return byPid;
  }

  const targetProcess = safeString(firstValue(body.triggeredProcess, body.targetProcess));
  if (targetProcess) {
    return processes.find((process) => safeString(process.name) === targetProcess) ?? null;
  }

  return null;
}

function sortProcesses(processes, trigger) {
  return processes.slice().sort((left, right) => {
    const leftTriggered = trigger && left.sourceIndex === trigger.sourceIndex ? 1 : 0;
    const rightTriggered = trigger && right.sourceIndex === trigger.sourceIndex ? 1 : 0;
    if (leftTriggered !== rightTriggered) return rightTriggered - leftTriggered;

    if (left.cpuSort !== null || right.cpuSort !== null) {
      return (right.cpuSort ?? -Infinity) - (left.cpuSort ?? -Infinity);
    }

    if (left.memorySort !== null || right.memorySort !== null) {
      return (right.memorySort ?? -Infinity) - (left.memorySort ?? -Infinity);
    }

    return left.sourceIndex - right.sourceIndex;
  });
}

function countThreads(process) {
  if (Array.isArray(process.threads)) return process.threads.length;
  return numberOrNull(firstValue(process.threadCount, process.threadsCount)) ?? 0;
}

function countFrames(process) {
  if (Array.isArray(process.frames)) return process.frames.length;
  if (!Array.isArray(process.threads)) return numberOrNull(process.frameCount) ?? 0;
  return process.threads.reduce((count, thread) => {
    if (!isPlainObject(thread)) return count;
    if (Array.isArray(thread.frames)) return count + thread.frames.length;
    if (Array.isArray(thread.stackFrames)) return count + thread.stackFrames.length;
    return count;
  }, 0);
}

function hasOverviewInformation(body) {
  return Boolean(body.memoryStatus || body.pageSize);
}

function summarizeMemoryStatus(memoryStatus) {
  if (!isPlainObject(memoryStatus)) return '';
  const keys = ['pageSize', 'compressorSize', 'memoryPages', 'availablePages'].filter((key) =>
    Object.prototype.hasOwnProperty.call(memoryStatus, key)
  );
  return keys.length ? `${keys.length} memory status fields summarized` : '';
}

function toField(label, value, sanitizeText, key = label) {
  const sanitized = sanitizeByKey(key, value, sanitizeText);
  return sanitized === '' ? null : { label, value: sanitized };
}

function compactFields(fields) {
  return fields.filter(Boolean);
}

function sanitizeByKey(key, value, sanitizeText) {
  const stringValue = safeString(value);
  if (!stringValue) return '';
  if (isSensitiveKey(key)) return '[identifier redacted]';
  if (PATH_DETECTION_PATTERN.test(stringValue) && stringValue.trim().match(PATH_DETECTION_PATTERN)?.[0] === stringValue.trim()) return '';
  return redactSensitiveValuePatterns(sanitizeText(stringValue));
}

function redactSensitiveValuePatterns(value) {
  return String(value ?? '')
    .replace(PATH_VALUE_PATTERN, '[path redacted]')
    .replace(ADDRESS_VALUE_PATTERN, '[address redacted]')
    .replace(FRAME_SYMBOL_PATTERN, '[symbol redacted]')
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

function sourceNote(metadata, bodyText) {
  const sources = [];
  if (Object.keys(metadata ?? {}).length) sources.push('metadata');
  if (String(bodyText ?? '').trim()) sources.push('body');
  return sources.length ? `Values extracted from ${sources.join(' and ')}` : 'No structured Stackshot resource fields were available';
}

function formatMemoryDisplay(memoryMB, pages) {
  if (memoryMB !== null && memoryMB !== undefined) return `${formatNumber(memoryMB)} MB`;
  if (pages !== null && pages !== undefined) return `${pages} pages`;
  return '';
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function joinParts(parts) {
  return parts.filter((value) => value !== undefined && value !== null && value !== '').join(' / ');
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function safeString(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function normalizeKey(key) {
  return String(key ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
