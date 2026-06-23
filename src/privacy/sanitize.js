const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g;
const WINDOWS_USER_PATH_PATTERN = /C:\\Users\\([^\\\s]+)(?=\\)/gi;
const UNIX_USER_PATH_PATTERN = /\/Users\/([^/\s]+)(?=\/)/g;
const LABELED_SENSITIVE_ID_PATTERN =
  /\b(UDID|serial(?:\s+number)?|deviceIdentifierForVendor|deviceIdentifierForAdvertising|IDFA|IDFV)\b\s*[:=]?\s*[A-Z0-9-]{8,}/gi;
const UUID_PATTERN = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/gi;

export function sanitizeText(value) {
  return String(value ?? '')
    .replace(EMAIL_PATTERN, '[email redacted]')
    .replace(WINDOWS_USER_PATH_PATTERN, 'C:\\Users\\[user redacted]')
    .replace(UNIX_USER_PATH_PATTERN, '/Users/[user redacted]')
    .replace(LABELED_SENSITIVE_ID_PATTERN, (match, label) => `${label} [identifier redacted]`)
    .replace(UUID_PATTERN, (match, offset, fullText) => {
      const prefix = fullText.slice(Math.max(0, offset - 24), offset).toLowerCase();
      if (/\b(uuid|slice_uuid|binary)\s*[:=]?\s*$/.test(prefix)) return match;
      return '[identifier redacted]';
    })
    .replace(PHONE_PATTERN, '[phone redacted]');
}

export function createSanitizer({ sanitize = true } = {}) {
  return sanitize === false ? (value) => String(value ?? '') : sanitizeText;
}
