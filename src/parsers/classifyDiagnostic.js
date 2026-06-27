import { parseIpsContainer } from './parseIpsContainer.js';

const UNKNOWN_CLASSIFICATION = Object.freeze({
  type: 'unknown',
  family: 'unknown',
  subtype: 'unknown',
  supported: false,
  parserType: null,
  legacyType: 'unknown',
  structure: 'unknown',
  bugType: '',
});

export function classifyDiagnostic(input) {
  const text = String(input ?? '').trim();
  if (!text) return { ...UNKNOWN_CLASSIFICATION, structure: 'empty' };

  const parsed = parseContainerOrMetadata(text);

  if (parsed.kind === 'ips-container') {
    return classifyContainer(parsed.body, parsed.metadata, parsed.structure);
  }

  if (isCoreAnalyticsNdjson(text)) {
    const metadata = parseFirstJsonLine(text) ?? {};
    return supported('coreanalytics', 'analytics', 'coreanalytics', 'coreanalytics', parsed.structure, bugTypeOf(metadata));
  }

  if (isPanicText(text)) {
    return supported('panic-full', 'panic', 'full', 'panic', parsed.structure, bugTypeOf(parsed.metadata));
  }

  if (isLegacyCrashText(text)) {
    return supported('crash-legacy', 'crash', 'legacy', 'crash', 'text', bugTypeOf(parsed.metadata));
  }

  if (isCpuResourceText(text, parsed.metadata)) {
    return unsupported('resource-cpu', 'resource', 'cpu', parsed.structure, bugTypeOf(parsed.metadata));
  }

  if (isWifiConnectivityText(text, parsed.metadata)) {
    return unsupported('wifi-connectivity', 'connectivity', 'wifi', parsed.structure, bugTypeOf(parsed.metadata));
  }

  if (!text.startsWith('{') && !text.startsWith('[')) {
    return supported('analytics-generic', 'analytics', 'generic', 'analytics', 'text', bugTypeOf(parsed.metadata));
  }

  return { ...UNKNOWN_CLASSIFICATION, structure: parsed.structure, bugType: bugTypeOf(parsed.metadata) };
}

function classifyContainer(body, metadata, structure) {
  const bugType = bugTypeOf(body, metadata);

  if (isPanicContainer(body)) return supported('panic-full', 'panic', 'full', 'panic', structure, bugType);
  if (isWatchdogStackshot(body)) return supported('watchdog', 'watchdog', 'stackshot', 'ips-watchdog-stackshot', structure, bugType);
  if (isStackshotResource(body, metadata)) return unsupported('resource-stackshot', 'resource', 'stackshot', structure, bugType);
  if (isJetsam(body)) return supported('jetsam', 'resource', 'memory', 'jetsam', structure, bugType);

  if (isAccessoryCrash(body, metadata)) return unsupported('accessory-crash', 'accessory', 'crash', structure, bugType);
  if (isDiagnosticRequest(body, metadata)) return unsupported('diagnostic-request', 'diagnostic-request', 'pipeline', structure, bugType);
  if (isCpuResourceContainer(body, metadata)) return unsupported('resource-cpu', 'resource', 'cpu', structure, bugType);
  if (isDiskWritesResource(body, metadata)) return unsupported('resource-diskwrites', 'resource', 'diskwrites', structure, bugType);
  if (isAppUsageMetrics(body, metadata)) return unsupported('app-usage-metrics', 'metrics', 'app-usage', structure, bugType);
  if (isWifiConnectivity(body, metadata)) return unsupported('wifi-connectivity', 'connectivity', 'wifi', structure, bugType);

  if (isStandardAppCrash(body)) return supported('app-crash', 'crash', 'app', 'ips', structure, bugType);

  return { ...UNKNOWN_CLASSIFICATION, structure, bugType };
}

function supported(type, family, subtype, parserType, structure, bugType) {
  return {
    type,
    family,
    subtype,
    supported: true,
    parserType,
    legacyType: parserType,
    structure,
    bugType: bugType ?? '',
  };
}

function unsupported(type, family, subtype, structure, bugType) {
  return {
    type,
    family,
    subtype,
    supported: false,
    parserType: null,
    legacyType: 'unknown',
    structure,
    bugType: bugType ?? '',
  };
}

function parseContainerOrMetadata(text) {
  const container = parseIpsContainer(text);
  if (container) {
    return {
      kind: 'ips-container',
      metadata: container.metadata,
      body: container.body,
      structure: container.metadata ? 'metadata-json-line+body-json' : 'single-json',
    };
  }

  return {
    kind: 'unparsed',
    metadata: parseFirstJsonLine(text),
    body: null,
    structure: inferStructure(text),
  };
}

function parseFirstJsonLine(text) {
  const firstLine = String(text ?? '').split(/\r?\n/).find((line) => line.trim()) ?? '';
  try {
    const parsed = JSON.parse(firstLine);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function inferStructure(text) {
  if (!String(text ?? '').trim()) return 'empty';
  if (parseFirstJsonLine(text)) return 'metadata-json-line+unparsed-body';
  if (text.trim().startsWith('{')) return 'json-like';
  if (text.trim().startsWith('[')) return 'json-array-like';
  return 'text';
}

function isStandardAppCrash(value) {
  return Boolean(
    isPlainObject(value) &&
      value.bug_type &&
      (Array.isArray(value.threads) || Array.isArray(value.usedImages) || isPlainObject(value.exception))
  );
}

function isWatchdogStackshot(value) {
  return Boolean(isPlainObject(value) && value.termination && value.stackshot?.processByPid);
}

function isJetsam(value) {
  return Boolean(
    isPlainObject(value) &&
      (value.bug_type === '298' || value.rpages || value.processes || value.largestProcess || value.victim) &&
      (value.rpages || value.processes || value.memoryStatus)
  );
}

function isPanicContainer(value) {
  return Boolean(isPlainObject(value) && (value.panicString || isPanicText(value.panicString ?? '')));
}

function isAccessoryCrash(body, metadata) {
  return Boolean(
    hasBugType('305', body, metadata) ||
      (isPlainObject(body) && (Array.isArray(body.crashlogs) || hasAnyKey(body, ['accessory_type', 'accessory_os_version'])))
  );
}

function isCpuResourceContainer(body, metadata) {
  return Boolean(hasBugType('202', body, metadata) || (isPlainObject(body) && hasAnyKey(body, ['cpuLimit', 'cpuUsed', 'cpu_duration'])));
}

function isDiskWritesResource(body, metadata) {
  return Boolean(hasBugType('142', body, metadata) || (isPlainObject(body) && hasAnyKey(body, ['writes', 'diskWrites', 'logicalWrites'])));
}

function isStackshotResource(body, metadata) {
  return Boolean(
    hasBugType('288', body, metadata) ||
      (isPlainObject(body) && body.processByPid && body.memoryStatus) ||
      (isPlainObject(body) && body.processByPid && body.reason && body.exception)
  );
}

function isAppUsageMetrics(body, metadata) {
  return Boolean(
    hasBugType('225', body, metadata) ||
      (Array.isArray(body) && body.some((record) => isPlainObject(record) && hasAnyKey(record, ['eventType', 'topic', 'bundleId'])))
  );
}

function isWifiConnectivity(body, metadata) {
  return Boolean(
    hasBugType('233', body, metadata) ||
      (isPlainObject(body) && hasAnyKey(body, ['WiFiChipset', 'wifiConnectionQuality', 'linkChangeEvents']))
  );
}

function isDiagnosticRequest(body, metadata) {
  return Boolean(
    hasBugType('312', body, metadata) ||
      (isPlainObject(body) && hasAnyKey(body, ['requestType', 'decisionServerDecision', 'recordDictionary', 'logType']))
  );
}

function isCpuResourceText(text, metadata) {
  return Boolean(hasBugType('202', metadata) || (/CPU limit:/i.test(text) && /Action taken:/i.test(text)));
}

function isWifiConnectivityText(text, metadata) {
  return Boolean(hasBugType('233', metadata) || /GEOLogMsgEvent|WiFiConnectionQuality/i.test(text));
}

function isLegacyCrashText(text) {
  return (
    (text.includes('Incident Identifier:') && text.includes('Exception Type:')) ||
    (text.includes('Date/Time:') && text.includes('OS Version:'))
  );
}

function isCoreAnalyticsNdjson(text) {
  const lines = String(text ?? '').split(/\r?\n/).filter((line) => line.trim()).slice(0, 24);
  if (lines.length < 2) return false;

  const parsedLines = [];
  for (const line of lines) {
    try {
      parsedLines.push(JSON.parse(line));
    } catch {
      break;
    }
  }

  if (parsedLines.length < 2) return false;
  const [metadata, ...records] = parsedLines;
  return isCoreAnalyticsMetadata(metadata) && records.some((record) => hasAnyCoreAnalyticsKey(record));
}

function isCoreAnalyticsMetadata(value) {
  return Boolean(
    isPlainObject(value) &&
      (value.bug_type === '211' || (value.timestamp && value.os_version && value.incident_id))
  );
}

function hasAnyCoreAnalyticsKey(value) {
  return Boolean(
    isPlainObject(value) &&
      ['_marker', 'message', 'name', 'sampling', 'aggregationPeriod', 'deviceId', 'uuid', 'sessionId'].some((key) =>
        Object.prototype.hasOwnProperty.call(value, key)
      )
  );
}

function isPanicText(text) {
  return /\bpanic\s*\(/i.test(String(text ?? '')) || /\bPanic\s*\(/.test(String(text ?? ''));
}

function hasBugType(expected, ...sources) {
  return sources.some((source) => isPlainObject(source) && String(source.bug_type ?? '') === expected);
}

function bugTypeOf(...sources) {
  for (const source of sources) {
    if (isPlainObject(source) && source.bug_type !== undefined && source.bug_type !== null) {
      return String(source.bug_type);
    }
  }
  return '';
}

function hasAnyKey(value, keys) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
