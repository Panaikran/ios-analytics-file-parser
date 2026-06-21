import { parseIpsContainer } from './parseIpsContainer.js';

export function detectFileType(input) {
  const text = String(input ?? '').trim();

  if (!text) return 'unknown';

  if (text.startsWith('{') || text.startsWith('[')) {
    const parsed = parseIpsContainer(text);
    if (!parsed) return 'unknown';
    if (isWatchdogStackshotIps(parsed.body)) return 'ips-watchdog-stackshot';
    if (isStandardCrashIps(parsed.body)) return 'ips';
    if (isJetsamEvent(parsed.body)) return 'jetsam';
  }

  if (/\bpanic\s*\(/i.test(text) || /\bPanic\s*\(/.test(text)) {
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
