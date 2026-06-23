import { parseIpsContainer } from './parseIpsContainer.js';

export function detectFileType(input) {
  const text = String(input ?? '').trim();

  if (!text) return 'unknown';

  if (text.startsWith('{') || text.startsWith('[')) {
    const parsed = parseIpsContainer(text);
    if (!parsed) return isCoreAnalyticsNdjson(text) ? 'coreanalytics' : 'unknown';
    if (isWatchdogStackshotIps(parsed.body)) return 'ips-watchdog-stackshot';
    if (isStandardCrashIps(parsed.body)) return 'ips';
    if (isJetsamEvent(parsed.body)) return 'jetsam';
    if (isPanicText(text)) return 'panic';
    return 'unknown';
  }

  if (isPanicText(text)) {
    return 'panic';
  }

  if (text.includes('Incident Identifier:') && text.includes('Exception Type:')) {
    return 'crash';
  }

  if (text.includes('Date/Time:') && text.includes('OS Version:')) {
    return 'crash';
  }

  return 'analytics';
}

function isWatchdogStackshotIps(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value.termination &&
      value.stackshot?.processByPid
  );
}

function isStandardCrashIps(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value.bug_type &&
      (value.exception || value.threads || value.usedImages)
  );
}

function isJetsamEvent(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value.reason || value.bug_type === '298') &&
      (value.rpages || value.processes || value.memoryStatus)
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
  if (!isCoreAnalyticsMetadata(metadata)) return false;

  return records.some((record) => hasAnyCoreAnalyticsKey(record));
}

function isCoreAnalyticsMetadata(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value.bug_type === '211' || (value.timestamp && value.os_version && value.incident_id))
  );
}

function hasAnyCoreAnalyticsKey(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return ['_marker', 'message', 'name', 'sampling', 'aggregationPeriod', 'deviceId', 'uuid', 'sessionId'].some((key) =>
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

function isPanicText(text) {
  return /\bpanic\s*\(/i.test(text) || /\bPanic\s*\(/.test(text);
}
