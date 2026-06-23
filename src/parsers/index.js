import { detectFileType } from './detect.js';
import { parseAnalytics } from './parseAnalytics.js';
import { parseCrash } from './parseCrash.js';
import { parseIpsContainer } from './parseIpsContainer.js';
import { parseIps } from './parseIps.js';
import { parseIpsWatchdogStackshot } from './parseIpsWatchdogStackshot.js';
import { parseJetsam } from './parseJetsam.js';
import { parsePanic } from './parsePanic.js';

export function parseInput(input) {
  const type = detectFileType(input);

  if (type === 'ips') {
    const parsed = parseIpsContainer(input);
    return parseIps(parsed.body, parsed.metadata);
  }

  if (type === 'ips-watchdog-stackshot') {
    const parsed = parseIpsContainer(input);
    return parseIpsWatchdogStackshot(parsed.body, parsed.metadata);
  }

  if (type === 'crash') {
    return parseCrash(input);
  }

  if (type === 'jetsam') {
    const parsed = parseIpsContainer(input);
    return parseJetsam(parsed.body, parsed.metadata);
  }

  if (type === 'panic') {
    return parsePanic(input);
  }

  if (type === 'analytics') {
    return parseAnalytics(input);
  }

  throw new Error('Unsupported or unrecognized file type.');
}
