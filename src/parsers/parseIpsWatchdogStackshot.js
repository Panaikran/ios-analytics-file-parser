import { createSection } from '../models/sectionModel.js';
import { sanitizeText } from '../privacy/sanitize.js';

export function parseIpsWatchdogStackshot(report, metadata = {}) {
  const process = findTargetProcess(report);
  const mainThread = findMainThread(process);

  return [
    createSection({
      id: 'summary',
      title: 'Summary',
      priority: 'info',
      fields: compactFields([
        ['App', metadata?.app_name || metadata?.name || report.procName || process?.procname],
        ['Bundle ID', metadata?.bundleID || report.bundleInfo?.CFBundleIdentifier],
        ['Device', report.modelCode],
        ['OS Version', formatOsVersion(report.osVersion) || metadata?.os_version],
        ['Incident Date', report.captureTime || metadata?.timestamp],
        ['PID', report.pid],
      ]),
    }),
    createSection({
      id: 'termination',
      title: 'Termination',
      priority: 'critical',
      fields: compactFields([
        ['Namespace', report.termination?.namespace],
        ['Code', report.termination?.code],
        ['Flags', report.termination?.flags],
        ['Details', formatDetails(report.termination?.details)],
      ]),
    }),
    createSection({
      id: 'main-thread-stackshot',
      title: mainThread ? `Main Thread Stackshot - Thread ${mainThread.id}` : 'Main Thread Stackshot',
      priority: 'critical',
      table: framesToRows(mainThread?.userFrames ?? mainThread?.resampledUserFrames ?? [], report.binaryImages),
      raw: mainThread ? '' : 'Main thread stackshot was not available in this report.',
    }),
  ];
}

function findTargetProcess(report) {
  const processes = report.stackshot?.processByPid ?? {};
  return processes[String(report.pid)] ?? Object.values(processes).find((process) => process.procname === report.procName);
}

function findMainThread(process) {
  const threads = Object.values(process?.threadById ?? {});
  return (
    threads.find((thread) => thread.dispatch_queue_label === 'com.apple.main-thread') ??
    threads.find((thread) => thread.snapshotFlags?.includes('kThreadMain')) ??
    threads[0] ??
    null
  );
}

function framesToRows(frames, binaryImages = []) {
  return frames.map(([imageIndex, offset], frame) => {
    const image = binaryImages[imageIndex] ?? [];
    const base = typeof image[1] === 'number' ? image[1] : 0;
    const binary = image[2] || `Image ${imageIndex}`;
    const address = base || typeof offset === 'number' ? `0x${(base + Number(offset ?? 0)).toString(16).padStart(16, '0')}` : '';

    return {
      frame,
      binary: sanitizeText(binary),
      address,
      symbol: sanitizeText(`${binary} + ${offset}`),
    };
  });
}

function formatOsVersion(osVersion) {
  if (!osVersion || typeof osVersion !== 'object') return '';
  return [osVersion.train, osVersion.build ? `(${osVersion.build})` : '', osVersion.releaseType]
    .filter(Boolean)
    .join(' ');
}

function formatDetails(details) {
  return Array.isArray(details) ? details.join(' ') : details;
}

function compactFields(entries) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
