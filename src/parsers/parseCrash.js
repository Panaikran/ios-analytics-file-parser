import { createSection } from '../models/sectionModel.js';
import { sanitizeText } from '../privacy/sanitize.js';

export function parseCrash(text) {
  const lines = text.split(/\r?\n/);
  const header = mapColonLines(lines);
  const triggeredThread = Number.parseInt(header['Triggered by Thread'] ?? '0', 10) || 0;

  return [
    createSection({
      id: 'summary',
      title: 'Summary',
      priority: 'info',
      fields: compactFields([
        ['App', parseProcessName(header.Process)],
        ['Bundle ID', header.Identifier],
        ['Version', header.Version],
        ['Device', header['Hardware Model']],
        ['OS Version', header['OS Version']],
        ['Incident Date', header['Date/Time']],
      ]),
    }),
    createSection({
      id: 'exception',
      title: 'Exception',
      priority: 'critical',
      fields: compactFields([
        ['Type', stripSignal(header['Exception Type'])],
        ['Signal', parseSignal(header['Exception Type'])],
        ['Subtype', header['Exception Subtype']],
        ['Codes', header['Exception Codes']],
        ['Termination Reason', header['Termination Reason']],
        ['Triggered Thread', String(triggeredThread)],
      ]),
    }),
    createSection({
      id: 'crashed-thread',
      title: `Crashed Thread - Thread ${triggeredThread}`,
      priority: 'critical',
      table: parseThreadFrames(lines, triggeredThread),
    }),
  ];
}

function mapColonLines(lines) {
  const values = {};
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      values[match[1].trim()] = match[2].trim();
    }
  }
  return values;
}

function parseProcessName(processValue = '') {
  return processValue.replace(/\s*\[\d+\]\s*$/, '').trim();
}

function stripSignal(value = '') {
  return value.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function parseSignal(value = '') {
  return value.match(/\(([^)]+)\)/)?.[1] ?? '';
}

function parseThreadFrames(lines, threadNumber) {
  const headerPattern = new RegExp(`^Thread\\s+${threadNumber}\\s+Crashed:`);
  const start = lines.findIndex((line) => headerPattern.test(line));
  if (start < 0) return [];

  const rows = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) break;
    if (/^Thread\s+\d+/.test(line) || /^Binary Images:/.test(line)) break;

    const match = line.match(/^\s*(\d+)\s+(.+?)\s+(0x[0-9a-fA-F]+)\s+(.+)$/);
    if (match) {
      rows.push({
        frame: Number(match[1]),
        binary: sanitizeText(match[2].trim()),
        address: match[3],
        symbol: sanitizeText(match[4].trim()),
      });
    }
  }

  return rows;
}

function compactFields(entries) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
