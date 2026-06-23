import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';
import { parseIpsContainer } from './parseIpsContainer.js';

export function parsePanic(input, options = {}) {
  const sanitizeText = createSanitizer(options);
  const context = normalizePanicInput(input);
  const lines = context.panicText.split(/\r?\n/);
  const panicLine = lines.find((line) => /^panic\(/i.test(line)) ?? lines.find(Boolean) ?? '';

  return [
    createSection({
      id: 'panic-string',
      title: 'Panic String',
      priority: 'critical',
      raw: sanitizeText(panicLine || context.panicText),
    }),
    createSection({
      id: 'panic-flags',
      title: 'Panic Flags',
      priority: 'warning',
      fields: compactFields([['Flags', context.body?.panicFlags ?? findColonValue(lines, 'Panic flags')]], sanitizeText),
    }),
    createSection({
      id: 'kernel-backtrace',
      title: 'Kernel Backtrace',
      priority: 'critical',
      tableColumns: [
        { key: 'frame', label: 'Frame' },
        { key: 'address', label: 'Frame Address' },
        { key: 'returnAddress', label: 'Return Address' },
        { key: 'lr', label: 'LR' },
        { key: 'fp', label: 'FP' },
        { key: 'rawLine', label: 'Raw' },
      ],
      table: parseBacktrace(lines, sanitizeText),
    }),
    createSection({
      id: 'loaded-kexts',
      title: 'Loaded Kexts',
      priority: 'info',
      tableColumns: [
        { key: 'name', label: 'Name' },
        { key: 'version', label: 'Version' },
        { key: 'range', label: 'Range' },
        { key: 'kind', label: 'Kind' },
      ],
      table: parseKexts(lines, sanitizeText),
    }),
    createSection({
      id: 'system-info',
      title: 'System Info',
      priority: 'info',
      fields: compactFields([
        ['OS / Build', context.metadata?.os_version ?? context.body?.build ?? findColonValue(lines, 'OS version')],
        ['Product', context.body?.product ?? context.metadata?.product ?? findColonValue(lines, 'Hardware model')],
        ['Kernel Version', context.body?.kernel ?? findColonValue(lines, 'Kernel version')],
        ['Date', context.metadata?.timestamp ?? context.body?.date],
        ['Bug Type', context.metadata?.bug_type ?? context.body?.bug_type],
        ['Incident ID', context.metadata?.incident_id ?? context.body?.incident],
      ], sanitizeText),
    }),
  ];
}

function normalizePanicInput(input) {
  const parsed = parseIpsContainer(input);
  if (parsed?.body?.panicString) {
    return {
      metadata: parsed.metadata ?? {},
      body: parsed.body,
      panicText: parsed.body.panicString,
    };
  }

  return {
    metadata: {},
    body: null,
    panicText: String(input ?? ''),
  };
}

function findColonValue(lines, label) {
  const line = lines.find((candidate) => candidate.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return line?.slice(line.indexOf(':') + 1).trim() ?? '';
}

function parseBacktrace(lines, sanitizeText) {
  const rows = [];
  let inTraditionalBacktrace = false;

  for (const line of lines) {
    if (line.startsWith('Backtrace')) {
      inTraditionalBacktrace = true;
      continue;
    }

    const lrFpMatch = line.match(/\blr:\s*(0x[0-9a-fA-F]+)\s+fp:\s*(0x[0-9a-fA-F]+)/);
    if (lrFpMatch) {
      rows.push({
        frame: rows.length,
        address: '',
        returnAddress: '',
        lr: lrFpMatch[1],
        fp: lrFpMatch[2],
        rawLine: sanitizeText(line.trim()),
      });
      continue;
    }

    if (inTraditionalBacktrace) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (rows.length) inTraditionalBacktrace = false;
        continue;
      }

      const addressMatch = trimmed.match(/^(0x[0-9a-fA-F]+)\s+:\s+(0x[0-9a-fA-F]+)/);
      if (addressMatch) {
        rows.push({
          frame: rows.length,
          address: addressMatch[1],
          returnAddress: addressMatch[2],
          lr: '',
          fp: '',
          rawLine: sanitizeText(trimmed),
        });
      }
    }
  }

  return rows;
}

function parseKexts(lines, sanitizeText) {
  const rows = [];
  let inLoadedKexts = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^loaded kexts:/i.test(trimmed)) {
      inLoadedKexts = true;
      continue;
    }

    if (inLoadedKexts && !trimmed) break;

    const backtraceMatch = trimmed.match(/^(?:dependency:\s*)?(com\.[^(]+)\(([^)]+)\)\[[^\]]+\]@(0x[0-9a-fA-F]+->0x[0-9a-fA-F]+)/);
    if (backtraceMatch) {
      rows.push({
        name: sanitizeText(backtraceMatch[1]),
        version: sanitizeText(backtraceMatch[2]),
        range: backtraceMatch[3],
        kind: trimmed.startsWith('dependency:') ? 'dependency' : 'backtrace',
      });
      continue;
    }

    if (inLoadedKexts) {
      const loadedMatch = trimmed.match(/^(com\.\S+)\s+(.+)$/);
      if (loadedMatch) {
        rows.push({
          name: sanitizeText(loadedMatch[1]),
          version: sanitizeText(loadedMatch[2]),
          range: '',
          kind: 'loaded',
        });
      }
    }
  }

  return rows;
}

function compactFields(entries, sanitizeText) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
