const COMPARISON_LOCAL_LABEL_MAX_LENGTH = 40;
const NON_WHITESPACE_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;

export function normalizeComparisonLocalLabel(value) {
  if (typeof value !== 'string') return '';

  const normalized = value
    .replace(/[\t\r\n]+/gu, ' ')
    .replace(NON_WHITESPACE_CONTROL_CHARACTERS, '')
    .replace(/\s+/gu, ' ')
    .trim();

  return Array.from(normalized).slice(0, COMPARISON_LOCAL_LABEL_MAX_LENGTH).join('');
}

export function createComparisonEntry({ classification, sections }) {
  return {
    classification,
    sections,
    localLabel: '',
  };
}

export function updateComparisonEntryLocalLabel(entries, index, value) {
  if (!Array.isArray(entries) || !Number.isInteger(index) || index < 0 || index >= entries.length) return entries;

  return entries.map((entry, entryIndex) =>
    entryIndex === index
      ? { ...entry, localLabel: normalizeComparisonLocalLabel(value) }
      : entry
  );
}

export function removeComparisonEntry(entries, index) {
  if (!Array.isArray(entries) || !Number.isInteger(index) || index < 0 || index >= entries.length) return entries;
  return entries.filter((_, entryIndex) => entryIndex !== index);
}

export function createInitialAppState() {
  return {
    sourceText: '',
    sourceLabel: '',
    detectedType: '',
    sanitize: true,
    sections: [],
    statusMessage: 'No report loaded yet.',
    statusTone: 'info',
  };
}

export function createParsedStatusMessage(sourceLabel, detectedType, sanitize = true) {
  const privacyMessage = sanitize ? 'Sanitized view is active.' : 'Raw local view - not uploaded.';
  return `Parsed ${sourceLabel} as ${detectedType}. ${privacyMessage}`;
}

export function startNewReportState(state) {
  return {
    ...state,
    sanitize: true,
  };
}

export function withParsedReport(state, { sourceText, sourceLabel, detectedType, sections }) {
  return {
    ...state,
    sourceText,
    sourceLabel,
    detectedType,
    sections,
    statusMessage: createParsedStatusMessage(sourceLabel, detectedType, state.sanitize),
    statusTone: 'info',
  };
}

export function withParseError(state, { sourceText, sourceLabel, detectedType }) {
  return {
    ...state,
    sourceText,
    sourceLabel,
    detectedType,
    sections: [],
    statusMessage: 'Could not parse this report. The file type may be unsupported or malformed.',
    statusTone: 'error',
  };
}

export function withStatus(state, { message, tone = 'info', clearSections = false }) {
  return {
    ...state,
    sections: clearSections ? [] : state.sections,
    statusMessage: message,
    statusTone: tone,
  };
}

export function withPrivacyMode(state, sanitize) {
  return {
    ...state,
    sanitize,
  };
}
