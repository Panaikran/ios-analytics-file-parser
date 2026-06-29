import { classifyDiagnostic } from './classifyDiagnostic.js';
import { parseAnalytics } from './parseAnalytics.js';
import { parseAccessoryCrash } from './parseAccessoryCrash.js';
import { parseCoreAnalytics } from './parseCoreAnalytics.js';
import { parseCrash } from './parseCrash.js';
import { parseCpuResource } from './parseCpuResource.js';
import { parseDiskWritesResource } from './parseDiskWritesResource.js';
import { parseIpsContainer } from './parseIpsContainer.js';
import { parseIps } from './parseIps.js';
import { parseIpsWatchdogStackshot } from './parseIpsWatchdogStackshot.js';
import { parseJetsam } from './parseJetsam.js';
import { parsePanic } from './parsePanic.js';
import { parseResourceStackshot } from './parseResourceStackshot.js';

export function parseInput(input, { sanitize = true } = {}) {
  const classification = classifyDiagnostic(input);
  const type = classification.parserType;
  const options = { sanitize };

  if (type === 'ips') {
    const parsed = parseIpsContainer(input);
    return parseIps(parsed.body, parsed.metadata, options);
  }

  if (type === 'ips-watchdog-stackshot') {
    const parsed = parseIpsContainer(input);
    return parseIpsWatchdogStackshot(parsed.body, parsed.metadata, options);
  }

  if (type === 'crash') {
    return parseCrash(input, options);
  }

  if (type === 'jetsam') {
    const parsed = parseIpsContainer(input);
    return parseJetsam(parsed.body, parsed.metadata, options);
  }

  if (type === 'panic') {
    return parsePanic(input, options);
  }

  if (type === 'analytics') {
    return parseAnalytics(input, options);
  }

  if (type === 'coreanalytics') {
    return parseCoreAnalytics(input, options);
  }

  if (type === 'accessory-crash') {
    const parsed = parseIpsContainer(input);
    return parseAccessoryCrash(parsed.body, parsed.metadata, options);
  }

  if (type === 'resource-cpu') {
    return parseCpuResource(input, options);
  }

  if (type === 'resource-diskwrites') {
    return parseDiskWritesResource(input, options);
  }

  if (type === 'resource-stackshot') {
    return parseResourceStackshot(input, options);
  }

  throw new Error('Unsupported or unrecognized file type.');
}
