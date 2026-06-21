import { detectFileType } from './detect.js';
import { parseCrash } from './parseCrash.js';
import { parseIpsContainer } from './parseIpsContainer.js';
import { parseIps } from './parseIps.js';
import { parseIpsWatchdogStackshot } from './parseIpsWatchdogStackshot.js';
import { parsePanicStub } from './parsePanicStub.js';

export function parseInput(input) {
  const type = detectFileType(input);

  if (type === 'ips') {
    return parseIps(parseIpsContainer(input).body);
  }

  if (type === 'ips-watchdog-stackshot') {
    const parsed = parseIpsContainer(input);
    return parseIpsWatchdogStackshot(parsed.body, parsed.metadata);
  }

  if (type === 'crash') {
    return parseCrash(input);
  }

  if (type === 'panic') {
    return parsePanicStub();
  }

  throw new Error('Unsupported or unrecognized Phase 1 file type.');
}
