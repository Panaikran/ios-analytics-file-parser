export const MAX_SAFE_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const FILE_ERROR_UNSUPPORTED = 'This file does not look like a supported text diagnostic report.';
export const FILE_ERROR_TOO_LARGE = 'This file is too large to open safely in mobile Safari.';

const SAFE_EXTENSIONS = [
  '.ips.ca.synced',
  '.panic-full',
  '.ips',
  '.crash',
  '.log',
  '.txt',
  '.plist',
  '.synced',
];

const TEXT_MIME_TYPES = new Set([
  'application/json',
  'application/plist',
  'application/x-plist',
  'application/xml',
  'text/json',
  'text/plain',
  'text/xml',
]);

const BLOCKED_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
]);

function normalizeMimeType(type) {
  return String(type ?? '').split(';')[0].trim().toLowerCase();
}

function supportedExtensionForName(name) {
  const lowerName = String(name ?? '').toLowerCase();
  return SAFE_EXTENSIONS.find((extension) => lowerName.endsWith(extension)) ?? '';
}

function unsupportedResult() {
  return {
    ok: false,
    reason: 'unsupported',
    message: FILE_ERROR_UNSUPPORTED,
  };
}

export function validateReportFile(file, { maxBytes = MAX_SAFE_FILE_SIZE_BYTES } = {}) {
  if (!file) return unsupportedResult();

  const size = typeof file.size === 'number' ? file.size : 0;
  if (size > maxBytes) {
    return {
      ok: false,
      reason: 'too-large',
      message: FILE_ERROR_TOO_LARGE,
    };
  }

  const extension = supportedExtensionForName(file.name);
  if (extension) {
    return {
      ok: true,
      reason: 'supported-extension',
      extension,
    };
  }

  const mimeType = normalizeMimeType(file.type);
  if (!mimeType) return unsupportedResult();

  if (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    BLOCKED_MIME_TYPES.has(mimeType) ||
    mimeType === 'application/octet-stream'
  ) {
    return unsupportedResult();
  }

  if (mimeType.startsWith('text/') || TEXT_MIME_TYPES.has(mimeType)) {
    return {
      ok: true,
      reason: 'text-mime',
      extension: '',
    };
  }

  return unsupportedResult();
}
