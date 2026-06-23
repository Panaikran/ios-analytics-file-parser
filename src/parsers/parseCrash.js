import { createSection } from '../models/sectionModel.js';
import { sanitizeText } from '../privacy/sanitize.js';

export function parseCrash(text) {
  const lines = text.split(/\r?\n/);
  const header = mapColonLines(lines);
  const triggeredThread = Number.parseInt(header['Triggered by Thread'] ?? '0', 10) || 0;

  const sections = [
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

  const allThreadRows = parseAllThreadFrames(lines);
  if (allThreadRows.length) {
    sections.push(
      createSection({
        id: 'all-threads',
        title: 'All Threads',
        priority: 'info',
        tableColumns: [
          { key: 'thread', label: 'Thread' },
          { key: 'frame', label: 'Frame' },
          { key: 'binary', label: 'Binary' },
          { key: 'address', label: 'Address' },
          { key: 'symbol', label: 'Symbol' },
        ],
        table: allThreadRows,
      })
    );
  }

  const binaryRows = parseBinaryImages(lines);
  if (binaryRows.length) {
    sections.push(
      createSection({
        id: 'binary-images',
        title: 'Binary Images',
        priority: 'info',
        tableColumns: [
          { key: 'name', label: 'Name' },
          { key: 'uuid', label: 'UUID' },
          { key: 'arch', label: 'Arch' },
          { key: 'loadAddress', label: 'Load Address' },
        ],
        table: binaryRows,
      })
    );
  }

  return sections;
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

    const row = parseFrameLine(line);
    if (row) rows.push(row);
  }

  return rows;
}

function parseAllThreadFrames(lines) {
  const rows = [];
  let currentThread = null;

  for (const line of lines) {
    const threadHeader = line.match(/^Thread\s+(\d+)(?:\s+Crashed)?:/);
    if (threadHeader) {
      currentThread = `Thread ${threadHeader[1]}`;
      continue;
    }

    if (!line.trim()) {
      currentThread = null;
      continue;
    }

    if (line.startsWith('Binary Images:')) {
      currentThread = null;
      continue;
    }

    if (currentThread) {
      const row = parseFrameLine(line);
      if (row) rows.push({ thread: currentThread, ...row });
    }
  }

  return rows;
}

function parseBinaryImages(lines) {
  const start = lines.findIndex((line) => line.trim() === 'Binary Images:');
  if (start < 0) return [];

  const rows = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) break;

    const match = line.match(/^(0x[0-9a-fA-F]+)\s+-\s+(0x[0-9a-fA-F]+)\s+(.+?)\s+(arm64e?|x86_64)\s+<([^>]+)>\s+(.+)$/);
    if (match) {
      rows.push({
        name: sanitizeText(match[3].trim()),
        uuid: match[5].trim(),
        arch: sanitizeText(match[4].trim()),
        loadAddress: match[1],
      });
    }
  }

  return rows;
}

function parseFrameLine(line) {
  const match = line.match(/^\s*(\d+)\s+(.+?)\s+(0x[0-9a-fA-F]+)\s+(.+)$/);
  if (!match) return null;

  return {
    frame: Number(match[1]),
    binary: sanitizeText(match[2].trim()),
    address: match[3],
    symbol: sanitizeText(match[4].trim()),
  };
}

function compactFields(entries) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
