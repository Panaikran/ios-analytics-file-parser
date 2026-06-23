import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

export function parseIps(report, metadata = {}, options = {}) {
  const sanitizeText = createSanitizer(options);
  const images = Array.isArray(report.usedImages) ? report.usedImages : [];
  const triggeredThreadIndex = findTriggeredThreadIndex(report);
  const triggeredThread = report.threads?.[triggeredThreadIndex] ?? report.threads?.[0] ?? {};
  const normalizedMetadata = normalizeMetadata(report, metadata);

  const sections = [
    createSection({
      id: 'summary',
      title: 'Summary',
      priority: 'info',
      fields: compactFields([
        ['App', normalizedMetadata.appName],
        ['Bundle ID', normalizedMetadata.bundleId],
        ['Version', normalizedMetadata.appVersion],
        ['Build', normalizedMetadata.buildNumber],
        ['Device', normalizedMetadata.device],
        ['OS Version', normalizedMetadata.osVersion],
        ['Incident Date', normalizedMetadata.incidentDate],
        ['Incident ID', normalizedMetadata.incidentId],
      ], sanitizeText),
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
      ], sanitizeText),
    }),
    createSection({
      id: 'crashed-thread',
      title: `Crashed Thread - Thread ${triggeredThreadIndex}`,
      priority: 'critical',
      table: framesToRows(triggeredThread.frames, images, sanitizeText),
    }),
  ];

  if (Array.isArray(report.threads) && report.threads.length) {
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
        table: allThreadsToRows(report.threads, images, sanitizeText),
      })
    );
  }

  if (images.length) {
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
        table: imagesToRows(images, sanitizeText),
      })
    );
  }

  return sections;
}

function normalizeMetadata(report, metadata = {}) {
  metadata ??= {};
  const bundleInfo = report.bundleInfo ?? {};

  return {
    appName: firstValue(metadata.app_name, metadata.name, bundleInfo.CFBundleName, report.app_name, report.procName, report.processName),
    bundleId: firstValue(
      metadata.bundleID,
      metadata.bundleIdentifier,
      bundleInfo.CFBundleIdentifier,
      report.bundleID,
      report.bundleIdentifier
    ),
    appVersion: firstValue(
      metadata.app_version,
      metadata.version,
      bundleInfo.CFBundleShortVersionString,
      report.app_version,
      report.appVersion,
      report.version
    ),
    buildNumber: firstValue(
      metadata.build_version,
      metadata.build,
      bundleInfo.CFBundleVersion,
      report.build_version,
      report.build
    ),
    osVersion: firstValue(metadata.os_version, formatOsVersion(metadata.osVersion), formatOsVersion(report.osVersion), report.os_version),
    incidentId: firstValue(metadata.incident_id, metadata.incident, report.incident_id, report.incident),
    incidentDate: firstValue(metadata.timestamp, report.timestamp, report.captureTime),
    device: firstValue(metadata.device_model, metadata.modelCode, report.device_model, report.modelCode),
  };
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function formatOsVersion(osVersion) {
  if (!osVersion) return '';
  if (typeof osVersion === 'string') return osVersion;
  if (typeof osVersion !== 'object') return String(osVersion);

  return [osVersion.train, osVersion.build ? `(${osVersion.build})` : '', osVersion.releaseType]
    .filter(Boolean)
    .join(' ');
}

function findTriggeredThreadIndex(report) {
  if (Number.isInteger(report.faultingThread)) return report.faultingThread;

  const index = report.threads?.findIndex((thread) => thread.triggered);
  return index >= 0 ? index : 0;
}

function framesToRows(frames = [], images = [], sanitizeText) {
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

function allThreadsToRows(threads, images, sanitizeText) {
  return threads.flatMap((thread, threadIndex) =>
    framesToRows(thread.frames, images, sanitizeText).map((row) => ({
      thread: `Thread ${threadIndex}`,
      ...row,
    }))
  );
}

function imagesToRows(images, sanitizeText) {
  return images.map((image) => ({
    name: sanitizeText(image.name || 'Unknown'),
    uuid: image.uuid || '',
    arch: sanitizeText(image.arch || ''),
    loadAddress: typeof image.base === 'number' ? `0x${image.base.toString(16).padStart(16, '0')}` : '',
  }));
}

function formatTermination(termination) {
  if (!termination) return '';
  return [termination.namespace, termination.code ? `Code ${termination.code}` : '', termination.indicator]
    .filter(Boolean)
    .join(', ');
}

function compactFields(entries, sanitizeText) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}
