import { createSection } from '../models/sectionModel.js';
import { sanitizeText } from '../privacy/sanitize.js';

export function parseIps(report) {
  const images = Array.isArray(report.usedImages) ? report.usedImages : [];
  const triggeredThreadIndex = findTriggeredThreadIndex(report);
  const triggeredThread = report.threads?.[triggeredThreadIndex] ?? report.threads?.[0] ?? {};

  return [
    createSection({
      id: 'summary',
      title: 'Summary',
      priority: 'info',
      fields: compactFields([
        ['App', report.app_name || report.procName || report.processName],
        ['Bundle ID', report.bundleID || report.bundleIdentifier],
        ['Version', report.app_version || report.version],
        ['Build', report.build_version || report.build],
        ['Device', report.device_model || report.modelCode],
        ['OS Version', report.os_version || report.osVersion],
        ['Incident Date', report.timestamp || report.captureTime],
      ]),
    }),
    createSection({
      id: 'exception',
      title: 'Exception',
      priority: 'critical',
      fields: compactFields([
        ['Type', report.exception?.type],
        ['Signal', report.exception?.signal],
        ['Subtype', report.exception?.subtype],
        ['Codes', report.exception?.codes],
        ['Termination Reason', formatTermination(report.termination)],
        ['Triggered Thread', String(triggeredThreadIndex)],
      ]),
    }),
    createSection({
      id: 'crashed-thread',
      title: `Crashed Thread - Thread ${triggeredThreadIndex}`,
      priority: 'critical',
      table: framesToRows(triggeredThread.frames, images),
    }),
  ];
}

function findTriggeredThreadIndex(report) {
  if (Number.isInteger(report.faultingThread)) return report.faultingThread;

  const index = report.threads?.findIndex((thread) => thread.triggered);
  return index >= 0 ? index : 0;
}

function framesToRows(frames = [], images = []) {
  return frames.map((frame, index) => {
    const image = images[frame.imageIndex] ?? {};
    const base = typeof image.base === 'number' ? image.base : 0;
    const offset = typeof frame.imageOffset === 'number' ? frame.imageOffset : 0;
    const address = base || offset ? `0x${(base + offset).toString(16).padStart(16, '0')}` : '';
    const symbol = [frame.symbol, frame.symbolLocation ?? frame.offsetIntoSymbol]
      .filter((part) => part !== undefined && part !== null && part !== '')
      .join(' + ');

    return {
      frame: index,
      binary: sanitizeText(image.name || frame.image || 'Unknown'),
      address,
      symbol: sanitizeText(symbol || '<redacted or unavailable>'),
    };
  });
}

function formatTermination(termination) {
  if (!termination) return '';
  return [termination.namespace, termination.code ? `Code ${termination.code}` : '', termination.indicator]
    .filter(Boolean)
    .join(', ');
}

function compactFields(entries) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
