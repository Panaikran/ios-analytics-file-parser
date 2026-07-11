import {
  createInitialAppState,
  startNewReportState,
  withParsedReport,
  withParseError,
  withPrivacyMode,
  withStatus,
} from './appState.js';
import { EXAMPLE_REPORTS } from '../examples/manifest.js';
import { downloadTextFile } from './clipboard/downloadText.js';
import {
  serializeSectionForCopy,
  serializeSectionsForExport,
  serializeSectionsForJsonExport,
} from './clipboard/serializeSection.js';
import { getVisibleSectionForCopy } from './clipboard/visibleSection.js';
import { createComparisonSections, validateComparison } from './comparison/comparisonModel.js';
import { validateReportFile } from './fileValidation.js';
import { classifyDiagnostic, getUnsupportedDiagnosticMessage } from './parsers/classifyDiagnostic.js';
import { parseInput } from './parsers/index.js';
import { filterSectionsByQuery } from './search/filterSections.js';
import { getSearchMetadata } from './search/searchMetadata.js';
import { getCoreAnalyticsView } from './ui/coreAnalyticsView.js';
import { renderSections, renderStatus } from './ui/renderApp.js';
import { renderSectionNav } from './ui/renderSectionNav.js';

const inputPanel = document.querySelector('#input-panel');
const fileInput = document.querySelector('#file-input');
const pasteInput = document.querySelector('#paste-input');
const parsePasteButton = document.querySelector('#parse-paste');
const clearButton = document.querySelector('#clear-report');
const exampleControls = document.querySelector('#example-controls');
const statusElement = document.querySelector('#status');
const privacyPanel = document.querySelector('#privacy-panel');
const privacyModeLabel = document.querySelector('#privacy-mode-label');
const privacyToggle = document.querySelector('#privacy-toggle');
const privacyWarning = document.querySelector('#privacy-warning');
const comparisonPanel = document.querySelector('#comparison-panel');
const comparisonList = document.querySelector('#comparison-list');
const addToComparisonButton = document.querySelector('#add-to-comparison');
const compareReportsButton = document.querySelector('#compare-reports');
const clearComparisonButton = document.querySelector('#clear-comparison');
const comparisonStatus = document.querySelector('#comparison-status');
const searchPanel = document.querySelector('#search-panel');
const searchInput = document.querySelector('#result-search');
const clearSearchButton = document.querySelector('#clear-search');
const searchCount = document.querySelector('#search-count');
const exportPanel = document.querySelector('#export-panel');
const downloadVisibleExportButton = document.querySelector('#download-visible-export');
const downloadVisibleJsonButton = document.querySelector('#download-visible-json');
const exportStatus = document.querySelector('#export-status');
const sectionNavElement = document.querySelector('#section-nav');
const emptyResults = document.querySelector('#empty-results');
const sectionsElement = document.querySelector('#sections');
const offlineStatus = document.querySelector('#offline-status');

const OFFLINE_READY_MESSAGE = 'Offline app shell ready. Examples can open offline. Reports are still not saved.';
const OFFLINE_SETUP_FAILED_MESSAGE = 'Offline setup unavailable. Online parsing still works.';
const UPDATE_READY_MESSAGE = 'Update ready. Reload when done with the current report.';
const EXAMPLE_UNAVAILABLE_OFFLINE_MESSAGE = 'Example unavailable offline. Reconnect once to refresh offline examples.';

let appState = createInitialAppState();
let comparisonEntries = [];
let comparisonSections = [];
let comparisonMode = false;
let comparisonMessage = 'No reports added.';
let searchQuery = '';
let searchTimer = null;
let denseTableState = createInitialDenseTableState();
let lastOfflineStatusKey = '';
let waitingServiceWorker = null;
let reloadAfterControllerChange = false;

function createInitialDenseTableState() {
  return {
    expandedThreadGroups: {},
    rowLimits: {},
    expandedTables: {},
  };
}

function renderApp() {
  const activeSections = comparisonMode ? comparisonSections : appState.sections;
  const searchResult = filterSectionsByQuery(activeSections, searchQuery);
  const coreAnalyticsView = getCoreAnalyticsView(activeSections);
  const searchMetadata = getSearchMetadata(searchResult, activeSections, { coreAnalyticsView });
  const visibleSections = searchResult.sections;
  const hasParsedSections = activeSections.length > 0;
  const emptySearch = searchResult.active && searchResult.totalMatches === 0;
  const eligibleExportSections = getEligibleExportSections(activeSections, visibleSections);

  inputPanel.hidden = comparisonMode;
  renderStatus(statusElement, statusMessageForSearch(searchMetadata), comparisonMode ? 'info' : appState.statusTone);
  renderPrivacyControls(appState.sections.length > 0);
  renderComparisonControls(appState.sections.length > 0);
  renderSearchControls(searchMetadata, hasParsedSections);
  renderExportControls(
    hasParsedSections,
    serializeSectionsForExport(eligibleExportSections),
    serializeSectionsForJsonExport(eligibleExportSections, { mode: comparisonMode ? 'comparison' : 'single' }),
    eligibleExportSections.length > 0
  );
  renderSectionNav(sectionNavElement, visibleSections);
  renderSections(sectionsElement, visibleSections, {
    onCopySection: copySection,
    denseTableState,
    onToggleThreadGroup: toggleThreadGroup,
    onShowMoreRows: showMoreRows,
    onShowAllRows: showAllRows,
    onToggleDenseTable: toggleDenseTable,
    allSections: activeSections,
    coreAnalyticsView,
    searchActive: searchMetadata.searchActive,
  });
  emptyResults.hidden = !emptySearch;
  clearButton.disabled = !appState.sourceText && !appState.sections.length;
}

function getEligibleExportSections(activeSections, visibleSections) {
  if (!comparisonMode && (!appState.sanitize || (comparisonEntries.length > 0 && !validateComparison(comparisonEntries).valid))) return [];

  return visibleSections.map((section) =>
    getVisibleSectionForCopy(section, {
      denseTableState,
      allSections: activeSections,
    })
  );
}

function renderExportControls(hasParsedSections, exportText, exportJson, hasEligibleSections) {
  exportPanel.hidden = !hasParsedSections;
  downloadVisibleExportButton.disabled = !hasEligibleSections || !exportText;
  downloadVisibleJsonButton.disabled = !hasEligibleSections || !exportJson;

  if (!hasParsedSections) return;
  if (!comparisonMode && !appState.sanitize) {
    exportStatus.textContent = 'Export is unavailable in Raw Local View.';
    return;
  }
  if (!comparisonMode && comparisonEntries.length > 0 && !validateComparison(comparisonEntries).valid) {
    exportStatus.textContent = 'Finish or clear the comparison selection before downloading.';
    return;
  }

  exportStatus.textContent = exportText
    ? comparisonMode
      ? 'Downloads only the currently visible sanitized comparison output.'
      : 'Downloads only the currently visible sanitized output.'
    : 'No visible sanitized output to download.';
}

function renderPrivacyControls(hasParsedSections) {
  privacyPanel.hidden = comparisonMode || !hasParsedSections;
  privacyModeLabel.textContent = appState.sanitize
    ? 'Privacy mode: Sanitized view'
    : 'Privacy mode: Raw local view — not uploaded';
  privacyToggle.textContent = appState.sanitize ? 'Switch to raw local view' : 'Switch to sanitized view';
  privacyToggle.setAttribute('aria-pressed', String(!appState.sanitize));
  privacyWarning.hidden = appState.sanitize;
}

function renderComparisonControls(hasCurrentReport) {
  comparisonPanel.hidden = !hasCurrentReport && comparisonEntries.length === 0;
  comparisonStatus.textContent = comparisonMessage;
  addToComparisonButton.disabled = comparisonMode || !hasCurrentReport || comparisonEntries.length >= 3;

  const validation = validateComparison(comparisonEntries);
  compareReportsButton.disabled = !validation.valid;
  clearComparisonButton.disabled = comparisonEntries.length === 0;

  const items = comparisonEntries.map((entry, index) => {
    const item = document.createElement('div');
    item.className = 'comparison-list__item';
    item.setAttribute('role', 'listitem');

    const label = document.createElement('span');
    label.textContent = `Report ${index + 1} - ${entry.classification.parserType}`;

    const removeButton = document.createElement('button');
    removeButton.className = 'comparison-list__remove';
    removeButton.type = 'button';
    removeButton.textContent = 'Remove report';
    removeButton.setAttribute('aria-label', `Remove Report ${index + 1}`);
    removeButton.addEventListener('click', () => removeComparisonReport(index));

    item.append(label, removeButton);
    return item;
  });

  comparisonList.replaceChildren(...items);
}

function addCurrentReportToComparison() {
  if (comparisonMode || !appState.sourceText || !appState.sections.length || comparisonEntries.length >= 3) return;

  try {
    const classification = classifyDiagnostic(appState.sourceText);
    const sections = parseInput(appState.sourceText, { sanitize: true });
    const entry = {
      classification: {
        parserType: classification.parserType,
        supported: classification.supported,
      },
      sections,
    };
    const nextEntries = [...comparisonEntries, entry];
    const validationEntries = nextEntries.length === 1 ? [entry, entry] : nextEntries;
    const validation = validateComparison(validationEntries);

    if (!validation.valid) {
      comparisonMessage = validation.message;
      renderApp();
      return;
    }

    comparisonEntries = nextEntries;
    comparisonMessage = `Added Report ${comparisonEntries.length}. ${comparisonEntries.length < 2 ? 'Add one more compatible report to compare.' : 'Ready to compare.'}`;
  } catch {
    comparisonMessage = 'Could not add this report to comparison.';
  }

  renderApp();
}

function removeComparisonReport(index) {
  if (index < 0 || index >= comparisonEntries.length) return;

  comparisonEntries = comparisonEntries.filter((_, entryIndex) => entryIndex !== index);
  exitComparisonMode();
  clearSearchState();
  resetDenseTableState();
  comparisonMessage = comparisonEntries.length
    ? `${comparisonEntries.length} report${comparisonEntries.length === 1 ? '' : 's'} selected.`
    : 'No reports added.';
  renderApp();
}

function clearComparison() {
  if (!comparisonEntries.length) return;

  comparisonEntries = [];
  exitComparisonMode();
  clearSearchState();
  resetDenseTableState();
  comparisonMessage = 'Comparison cleared.';
  renderApp();
}

function compareReports() {
  const validation = validateComparison(comparisonEntries);
  if (!validation.valid) {
    comparisonMessage = validation.message;
    renderApp();
    return;
  }

  comparisonSections = createComparisonSections(comparisonEntries);
  comparisonMode = true;
  comparisonMessage = `Comparing ${comparisonEntries.length} ${validation.parserType} reports. Sanitized only.`;
  clearSearchState();
  resetDenseTableState();
  renderApp();
}

function exitComparisonMode() {
  comparisonMode = false;
  comparisonSections = [];
}

function showParsedReport(text, sourceLabel) {
  exitComparisonMode();
  const sourceText = String(text ?? '');
  const classification = classifyDiagnostic(sourceText);
  const detectedType = classification.legacyType;
  const nextReportState = startNewReportState(appState);

  if (detectedType === 'unknown') {
    const unsupportedMessage =
      getUnsupportedDiagnosticMessage(classification) ??
      'Unsupported or unknown report format. Try a .ips, .crash, panic-full, JetsamEvent, or analytics text file.';

    appState = withStatus(
      {
        ...createInitialAppState(),
        sourceText,
        sourceLabel,
        detectedType,
      },
      {
        message: unsupportedMessage,
        tone: 'error',
        clearSections: true,
      }
    );
    renderApp();
    return;
  }

  try {
    const sections = parseInput(sourceText, { sanitize: nextReportState.sanitize });
    appState = withParsedReport(nextReportState, { sourceText, sourceLabel, detectedType, sections });
  } catch {
    appState = withParseError(nextReportState, { sourceText, sourceLabel, detectedType });
  }

  renderApp();
}

function clearReport() {
  appState = createInitialAppState();
  exitComparisonMode();
  denseTableState = createInitialDenseTableState();
  clearSearchState();
  fileInput.value = '';
  pasteInput.value = '';
  inputPanel.classList.remove('input-panel--drag-over');
  renderApp();
}

function reparseCurrentSourceWithPrivacyMode(sanitize) {
  if (!appState.sourceText) return;

  try {
    const sections = parseInput(appState.sourceText, { sanitize });
    appState = withParsedReport(withPrivacyMode(appState, sanitize), {
      sourceText: appState.sourceText,
      sourceLabel: appState.sourceLabel,
      detectedType: appState.detectedType,
      sections,
    });
    resetDenseTableState();
  } catch {
    appState = withParseError(withPrivacyMode(appState, sanitize), {
      sourceText: appState.sourceText,
      sourceLabel: appState.sourceLabel,
      detectedType: appState.detectedType,
    });
  }

  renderApp();
}

function togglePrivacyMode() {
  if (comparisonMode) return;
  reparseCurrentSourceWithPrivacyMode(!appState.sanitize);
}

function resetDenseTableState() {
  denseTableState = createInitialDenseTableState();
}

function clearSearchState() {
  searchQuery = '';
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchInput.value = '';
}

function renderSearchControls(searchMetadata, hasParsedSections) {
  searchPanel.hidden = !hasParsedSections;
  clearSearchButton.hidden = !searchMetadata.searchActive;

  if (!hasParsedSections || !searchMetadata.searchActive) {
    searchCount.textContent = 'Search inactive.';
    return;
  }

  searchCount.textContent = searchStatusText(searchMetadata);
}

function statusMessageForSearch(searchMetadata) {
  if (!searchMetadata.searchActive) return comparisonMode ? comparisonMessage : appState.statusMessage;
  return searchStatusText(searchMetadata);
}

function searchStatusText(searchMetadata) {
  if (searchMetadata.matchCount === 0) return 'No matches in parsed output.';

  if (searchMetadata.cappedCoreAnalytics) {
    return `${searchCountText(searchMetadata.matchCount)} in rendered parsed output. Some source records are not rendered. Search and copy operate on rendered capped rows only.`;
  }

  if (searchMetadata.renderedRowsOnly) {
    return `${searchCountText(searchMetadata.matchCount)} in rendered parsed output. Some source records are not rendered.`;
  }

  return `${searchCountText(searchMetadata.matchCount)} in parsed output.`;
}

function searchCountText(count) {
  if (count === 1) {
    return '1 match';
  }

  return `${count} matches`;
}

function renderExampleControls() {
  const buttons = EXAMPLE_REPORTS.map((example) => {
    const button = document.createElement('button');
    button.className = 'example-button';
    button.type = 'button';
    button.textContent = example.label;
    button.addEventListener('click', () => loadExample(example));
    return button;
  });

  exampleControls.replaceChildren(...buttons);
}

async function loadExample(example) {
  try {
    const response = await fetch(example.path);
    if (!response.ok) throw new Error('Example unavailable');

    const text = await response.text();
    fileInput.value = '';
    pasteInput.value = text;
    clearSearchState();
    resetDenseTableState();
    showParsedReport(text, example.sourceLabel);
  } catch {
    appState = withStatus(createInitialAppState(), {
      message: navigator.onLine === false
        ? EXAMPLE_UNAVAILABLE_OFFLINE_MESSAGE
        : `Could not load ${example.sourceLabel}. Serve the project folder through a local static server to use examples.`,
      tone: 'error',
      clearSections: true,
    });
    renderApp();
  }
}

async function loadFile(file) {
  if (!file) return;

  const validation = validateReportFile(file);
  if (!validation.ok) {
    appState = withStatus(createInitialAppState(), {
      message: validation.message,
      tone: 'error',
      clearSections: true,
    });
    fileInput.value = '';
    pasteInput.value = '';
    clearSearchState();
    resetDenseTableState();
    renderApp();
    return;
  }

  try {
    const text = await file.text();
    pasteInput.value = text;
    clearSearchState();
    resetDenseTableState();
    showParsedReport(text, file.name);
  } catch {
    appState = withStatus(createInitialAppState(), {
      message: 'Could not read this file. Try choosing it again or paste the report text instead.',
      tone: 'error',
      clearSections: true,
    });
    renderApp();
  }
}

function parsePastedText() {
  const text = pasteInput.value;
  if (!text.trim()) {
    appState = withStatus(createInitialAppState(), {
      message: 'Paste a report before parsing.',
      tone: 'error',
      clearSections: true,
    });
    fileInput.value = '';
    renderApp();
    return;
  }

  resetDenseTableState();
  showParsedReport(text, 'pasted text');
}

function handleSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value;
    renderApp();
  }, 180);
}

function clearSearch() {
  clearSearchState();
  renderApp();
  searchInput.focus();
}

async function copySection(section) {
  try {
    await navigator.clipboard.writeText(serializeSectionForCopy(section));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function downloadVisibleExport() {
  const activeSections = comparisonMode ? comparisonSections : appState.sections;
  const visibleSections = filterSectionsByQuery(activeSections, searchQuery).sections;
  const exportText = serializeSectionsForExport(getEligibleExportSections(activeSections, visibleSections));
  if (!exportText) return;

  downloadTextFile(
    exportText,
    comparisonMode ? 'ios-diagnostic-comparison.txt' : 'ios-diagnostic-export.txt'
  );
}

function downloadVisibleJson() {
  const activeSections = comparisonMode ? comparisonSections : appState.sections;
  const visibleSections = filterSectionsByQuery(activeSections, searchQuery).sections;
  const exportSections = getEligibleExportSections(activeSections, visibleSections);
  const exportJson = serializeSectionsForJsonExport(exportSections, { mode: comparisonMode ? 'comparison' : 'single' });
  if (!exportSections.length || !exportJson) return;

  downloadTextFile(
    exportJson,
    comparisonMode ? 'ios-diagnostic-comparison.json' : 'ios-diagnostic-export.json',
    { mimeType: 'application/json;charset=utf-8' }
  );
}

function toggleThreadGroup(sectionId, thread, expanded) {
  denseTableState = {
    ...denseTableState,
    expandedThreadGroups: {
      ...denseTableState.expandedThreadGroups,
      [`${sectionId}:${thread}`]: expanded,
    },
  };
  renderApp();
}

function showMoreRows(sectionId, nextLimit) {
  denseTableState = {
    ...denseTableState,
    rowLimits: {
      ...denseTableState.rowLimits,
      [sectionId]: nextLimit,
    },
  };
  renderApp();
}

function showAllRows(sectionId, totalRows) {
  showMoreRows(sectionId, totalRows);
}

function toggleDenseTable(sectionId, expanded) {
  denseTableState = {
    ...denseTableState,
    expandedTables: {
      ...denseTableState.expandedTables,
      [sectionId]: expanded,
    },
  };
  renderApp();
}

fileInput.addEventListener('change', async (event) => {
  await loadFile(event.target.files?.[0]);
});

parsePasteButton.addEventListener('click', parsePastedText);
searchInput.addEventListener('input', handleSearchInput);
clearSearchButton.addEventListener('click', clearSearch);
downloadVisibleExportButton.addEventListener('click', downloadVisibleExport);
downloadVisibleJsonButton.addEventListener('click', downloadVisibleJson);

inputPanel.addEventListener('dragover', (event) => {
  if (!event.dataTransfer?.types?.includes('Files')) return;
  event.preventDefault();
  inputPanel.classList.add('input-panel--drag-over');
});

inputPanel.addEventListener('dragleave', (event) => {
  if (inputPanel.contains(event.relatedTarget)) return;
  inputPanel.classList.remove('input-panel--drag-over');
});

inputPanel.addEventListener('drop', async (event) => {
  if (!event.dataTransfer?.files?.length) return;
  event.preventDefault();
  inputPanel.classList.remove('input-panel--drag-over');
  await loadFile(event.dataTransfer.files[0]);
});

clearButton.addEventListener('click', clearReport);
privacyToggle.addEventListener('click', togglePrivacyMode);
addToComparisonButton.addEventListener('click', addCurrentReportToComparison);
compareReportsButton.addEventListener('click', compareReports);
clearComparisonButton.addEventListener('click', clearComparison);

function setOfflineStatus(message, tone = 'info', action = null) {
  if (!offlineStatus) return;

  const statusKey = `${tone}:${message}:${action?.label ?? ''}`;
  if (statusKey === lastOfflineStatusKey) return;

  lastOfflineStatusKey = statusKey;
  offlineStatus.replaceChildren();

  if (message) {
    const text = document.createElement('span');
    text.textContent = message;
    offlineStatus.append(text);
  }

  if (action) {
    const button = document.createElement('button');
    button.className = 'offline-status__button';
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    offlineStatus.append(button);
  }

  offlineStatus.dataset.tone = tone;
  offlineStatus.hidden = !message;
}

function showUpdateReady(worker = null) {
  waitingServiceWorker = worker ?? waitingServiceWorker;
  setOfflineStatus(UPDATE_READY_MESSAGE, 'info', {
    label: 'Reload app',
    onClick: reloadForWaitingUpdate,
  });
}

function reloadForWaitingUpdate() {
  reloadAfterControllerChange = true;

  if (waitingServiceWorker) {
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    return;
  }

  window.location.reload();
}

function watchServiceWorkerState(worker) {
  if (!worker) return;

  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      showUpdateReady(worker);
      return;
    }

    if (worker.state === 'activated') {
      setOfflineStatus(OFFLINE_READY_MESSAGE);
      return;
    }

    if (worker.state === 'redundant' && !navigator.serviceWorker.controller) {
      setOfflineStatus(OFFLINE_SETUP_FAILED_MESSAGE, 'warning');
    }
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setOfflineStatus(OFFLINE_SETUP_FAILED_MESSAGE, 'warning');
    return;
  }

  try {
    const workerUrl = new URL('../service-worker.js', import.meta.url);
    const scopeUrl = new URL('../', import.meta.url);
    const registration = await navigator.serviceWorker.register(workerUrl, { scope: scopeUrl });

    if (registration.waiting) {
      showUpdateReady(registration.waiting);
    }

    if (registration.active && !registration.waiting) {
      setOfflineStatus(OFFLINE_READY_MESSAGE);
    }

    watchServiceWorkerState(registration.installing);

    registration.addEventListener('updatefound', () => {
      watchServiceWorkerState(registration.installing);
    });
  } catch {
    setOfflineStatus(OFFLINE_SETUP_FAILED_MESSAGE, 'warning');
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadAfterControllerChange) return;
    window.location.reload();
  });
}

renderExampleControls();
renderApp();
registerServiceWorker();
