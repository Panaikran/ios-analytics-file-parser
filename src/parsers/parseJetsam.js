import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const BYTES_PER_MB = 1024 * 1024;

export function parseJetsam(report, metadata = {}, options = {}) {
  const sanitizeText = createSanitizer(options);
  metadata ??= {};
  const pageSize = numberOrNull(report.memoryStatus?.pageSize ?? report.systemMemory?.pageSize ?? report.pageSize);
  const processes = normalizeProcesses(report.processes ?? report.processList ?? [], pageSize);
  const sortedProcesses = sortProcessesByMemory(processes);
  const culprit = selectCulprit(report, processes, sortedProcesses, pageSize);
  const memoryPages = report.memoryStatus?.memoryPages ?? report.systemMemory?.memoryPages ?? report.memoryPages ?? {};
  const limitValue = firstPresent(report.memoryLimitMB, report.limits?.perProcessMB, report.limits?.perProcessLimitMB);

  return [
    createSection({
      id: 'summary',
      title: 'Summary',
      priority: 'warning',
      fields: compactFields([
        ['Reason', report.reason ?? culprit.process?.reason],
        ['Bug Type', metadata.bug_type ?? report.bug_type],
        ['Device', metadata.device_model ?? metadata.product ?? report.device_model ?? report.modelCode ?? report.product],
        ['OS Version', metadata.os_version ?? report.os_version ?? report.build ?? formatOsVersion(report.osVersion)],
        ['Timestamp', metadata.timestamp ?? report.timestamp ?? report.date ?? report.captureTime],
        ['Incident ID', metadata.incident_id ?? metadata.incident ?? report.incident_id ?? report.incident],
      ], sanitizeText),
    }),
    createSection({
      id: 'victim',
      title: culprit.inferred ? 'Victim / Likely Culprit' : 'Victim',
      priority: 'critical',
      fields: compactFields([
        ['Process', culprit.process?.name],
        ['PID', culprit.process?.pid],
        ['Footprint', formatOptionalMB(culprit.process?.memoryMB)],
        ['Pages', culprit.process?.pages],
        ['Reason', culprit.process?.reason],
        ['Selection', culprit.reason],
      ], sanitizeText),
    }),
    createSection({
      id: 'process-table',
      title: 'Process Table',
      priority: 'info',
      tableColumns: [
        { key: 'process', label: 'Process' },
        { key: 'pid', label: 'PID' },
        { key: 'rss', label: 'RSS' },
        { key: 'footprint', label: 'Footprint' },
        { key: 'pages', label: 'Pages' },
        { key: 'priority', label: 'Priority' },
        { key: 'role', label: 'Role / State' },
        { key: 'reason', label: 'Reason' },
      ],
      table: sortedProcesses.map((process) => ({
        process: sanitizeText(process.name),
        pid: stringify(process.pid),
        rss: formatOptionalMB(process.rssMB),
        footprint: formatOptionalMB(process.memoryMB),
        pages: process.pages !== null ? String(process.pages) : '',
        priority: stringify(process.priority),
        role: sanitizeText(process.role ?? ''),
        reason: sanitizeText(process.reason ?? ''),
      })),
    }),
    createSection({
      id: 'system-memory',
      title: 'System Memory',
      priority: 'info',
      fields: compactFields([
        ['Page Size', pageSize],
        ['Free Pages', memoryPages.free],
        ['Active Pages', memoryPages.active],
        ['Inactive Pages', memoryPages.inactive],
        ['Wired Pages', memoryPages.wired],
        ['Speculative Pages', memoryPages.speculative],
      ], sanitizeText),
      chart: {
        type: 'memory-bars',
        title: 'System memory pages',
        items: Object.entries(memoryPages).map(([label, value]) => ({
          label,
          value: Number(value),
          color: label === 'free' ? '#30d158' : '#ffd60a',
        })),
      },
    }),
    createSection({
      id: 'limits',
      title: 'Limits',
      priority: 'warning',
      fields: compactFields([
        ['Per-process Limit', limitValue === undefined ? 'Not available' : formatOptionalMB(limitValue)],
        ['Per-process Reason', culprit.process?.reason ?? report.reason],
        ['Resident Pages', report.rpages],
      ], sanitizeText),
    }),
  ];
}

function normalizeProcesses(processes, pageSize) {
  const list = Array.isArray(processes) ? processes : Object.values(processes);

  return list.map((process, sourceIndex) => {
    const pages = bestPageCount(process);
    const pageMB = pages !== null && pageSize ? pagesToMB(pages, pageSize) : null;
    const explicitFootprintMB = numberOrNull(process.footprintMB ?? process.footprint);
    const rssMB = numberOrNull(process.rssMB ?? process.rss);
    const residentMB = bytesToMB(numberOrNull(process.residentMemoryBytes));
    const memoryMB = firstPresent(pageMB, explicitFootprintMB, rssMB, residentMB);

    return {
      sourceIndex,
      raw: process,
      name: process.name ?? process.procname ?? process.process ?? 'Unknown',
      pid: process.pid,
      rssMB,
      explicitFootprintMB,
      residentMB,
      memoryMB,
      pages,
      priority: process.priority,
      role: process.role ?? statesToRole(process.states),
      reason: process.reason ?? process.jetsam_reason ?? process.jetsamReason,
      killDelta: process.killDelta,
      lifetimeMax: process.lifetimeMax,
    };
  });
}

function sortProcessesByMemory(processes) {
  return processes.slice().sort((left, right) => {
    const leftHasMemory = left.memoryMB !== null && left.memoryMB !== undefined;
    const rightHasMemory = right.memoryMB !== null && right.memoryMB !== undefined;

    if (leftHasMemory && rightHasMemory && right.memoryMB !== left.memoryMB) {
      return right.memoryMB - left.memoryMB;
    }

    if (leftHasMemory !== rightHasMemory) return leftHasMemory ? -1 : 1;
    return left.sourceIndex - right.sourceIndex;
  });
}

function selectCulprit(report, processes, sortedProcesses, pageSize) {
  if (report.victim) {
    return {
      process: normalizeProcesses([report.victim], pageSize)[0],
      inferred: false,
      reason: 'Explicit victim',
    };
  }

  const reasonAndKillDelta = processes.find((process) => process.reason && process.killDelta !== undefined);
  if (reasonAndKillDelta) {
    return { process: reasonAndKillDelta, inferred: true, reason: 'Inferred from process reason and killDelta' };
  }

  const reasonOnly = processes.find((process) => process.reason);
  if (reasonOnly) {
    return { process: reasonOnly, inferred: true, reason: 'Inferred from process reason' };
  }

  const largestProcess = findLargestProcess(report.largestProcess, processes);
  if (largestProcess) {
    return { process: largestProcess, inferred: true, reason: 'Inferred from largestProcess' };
  }

  return {
    process: sortedProcesses[0] ?? null,
    inferred: true,
    reason: sortedProcesses[0] ? 'Inferred from highest memory process' : 'Not available',
  };
}

function findLargestProcess(largestProcess, processes) {
  if (!largestProcess) return null;
  const target = String(largestProcess);
  return (
    processes.find((process) => process.name === target) ??
    processes.find((process) => process.name.startsWith(target) || target.startsWith(process.name))
  );
}

function bestPageCount(process) {
  const rpages = numberOrNull(process.rpages);
  if (rpages !== null) return rpages;

  const physicalPages = sumNumbers(process.physicalPages);
  return physicalPages > 0 ? physicalPages : null;
}

function sumNumbers(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.reduce((total, item) => total + sumNumbers(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + sumNumbers(item), 0);
  }
  return 0;
}

function statesToRole(states) {
  return Array.isArray(states) ? states.join(', ') : states;
}

function pagesToMB(pages, pageSize) {
  return (pages * pageSize) / BYTES_PER_MB;
}

function bytesToMB(bytes) {
  return bytes === null ? null : bytes / BYTES_PER_MB;
}

function formatOptionalMB(value) {
  const number = numberOrNull(value);
  return number === null ? '' : `${Math.round(number)} MB`;
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringify(value) {
  return value === undefined || value === null ? '' : String(value);
}

function formatOsVersion(osVersion) {
  if (!osVersion) return '';
  if (typeof osVersion === 'string') return osVersion;
  if (typeof osVersion !== 'object') return String(osVersion);
  return [osVersion.train, osVersion.build ? `(${osVersion.build})` : '', osVersion.releaseType].filter(Boolean).join(' ');
}

function compactFields(entries, sanitizeText) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
