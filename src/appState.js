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
