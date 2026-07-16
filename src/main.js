import {
  createComparisonEntry,
  createInitialAppState,
  removeComparisonEntry,
  startNewReportState,
  updateComparisonEntryLocalLabel,
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
import { createExactMatchTargets } from './search/exactMatch.js';
import { getSearchMetadata } from './search/searchMetadata.js';
import { getCoreAnalyticsFacetOptions, getCoreAnalyticsView } from './ui/coreAnalyticsView.js';
import { renderSections, renderStatus } from './ui/renderApp.js';
import { createWorkspaceNavigation } from './ui/workspaceNavigation.js';

const appShell = document.querySelector('.app-shell');
const importIntro = document.querySelector('#import-intro');
const inputPanel = document.querySelector('#input-panel');
const inputTitle = document.querySelector('#input-title');
const filePickerLabel = document.querySelector('#file-picker-label');
const importOptions = document.querySelector('#import-options');
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
const searchNavigationElement = document.querySelector('#search-navigation');
const searchNavigationPreviousButton = document.querySelector('#search-previous');
const searchNavigationNextButton = document.querySelector('#search-next');
const searchNavigationPosition = document.querySelector('#search-position');
const exactMatchNavigationElement = document.querySelector('#exact-match-navigation');
const exactMatchPreviousButton = document.querySelector('#exact-match-previous');
const exactMatchNextButton = document.querySelector('#exact-match-next');
const exactMatchPosition = document.querySelector('#exact-match-position');
const exactMatchStatus = document.querySelector('#exact-match-status');
const searchCount = document.querySelector('#search-count');
const exportPanel = document.querySelector('#export-panel');
const downloadVisibleExportButton = document.querySelector('#download-visible-export');
const downloadVisibleJsonButton = document.querySelector('#download-visible-json');
const exportStatus = document.querySelector('#export-status');
const workspaceShell = document.querySelector('.workspace-shell');
const workspaceHeader = document.querySelector('#workspace-header');
const workspaceHeading = document.querySelector('#workspace-heading');
const sectionNavElement = document.querySelector('#section-nav');
const sectionsTrigger = document.querySelector('#sections-trigger');
const sectionDialog = document.querySelector('#section-dialog');
const sectionDialogClose = document.querySelector('#section-dialog-close');
const mobileSectionNav = document.querySelector('#mobile-section-nav');
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
let searchNavigationTargets = [];
let activeNavigationIndex = -1;
let navigationQuery = '';
let exactMatchTargets = [];
let activeExactMatchIndex = -1;
let exactMatchQuery = '';
let exactMatchNeutral = false;
let denseTableState = createInitialDenseTableState();
let lastOfflineStatusKey = '';
let waitingServiceWorker = null;
let reloadAfterControllerChange = false;
let pendingWorkspaceFocus = false;

const workspaceNavigation = createWorkspaceNavigation({
  desktopNav: sectionNavElement,
  mobileNav: mobileSectionNav,
  dialog: sectionDialog,
  trigger: sectionsTrigger,
  closeButton: sectionDialogClose,
  fallbackFocus: searchInput,
});

function createInitialDenseTableState() {
  return {
    expandedThreadGroups: {},
    rowLimits: {},
    expandedTables: {},
  };
}

function renderApp() {
  const restoreCoreAnalyticsFacetFocus = document.activeElement?.matches('.coreanalytics-overview__chip') === true;
  const activeSections = comparisonMode ? comparisonSections : appState.sections;
  const searchResult = filterSectionsByQuery(activeSections, searchQuery, { includeMatchRegions: appState.sanitize || comparisonMode });
  const coreAnalyticsView = getCoreAnalyticsView(activeSections);
  const coreAnalyticsFacetOptions = !comparisonMode && appState.sanitize
    ? getCoreAnalyticsFacetOptions(coreAnalyticsView)
    : null;
  const searchMetadata = getSearchMetadata(searchResult, activeSections, { coreAnalyticsView });
  const visibleSections = searchResult.sections;
  const hasParsedSections = activeSections.length > 0;
  const emptySearch = searchResult.active && searchResult.totalMatches === 0;
  const eligibleExportSections = getEligibleExportSections(activeSections, visibleSections);
  reconcileSearchNavigationState(searchResult.navigationTargets, searchResult.active && (appState.sanitize || comparisonMode));
  reconcileExactMatchState(searchResult.matchRegions, searchResult.active && (appState.sanitize || comparisonMode));

  appShell.dataset.workspace = hasParsedSections ? 'active' : 'empty';
  importIntro.hidden = hasParsedSections || comparisonMode;
  inputPanel.hidden = comparisonMode;
  inputTitle.textContent = hasParsedSections ? 'Open another report' : 'Open a report';
  filePickerLabel.textContent = hasParsedSections ? 'Open another report' : 'Choose file';
  if (hasParsedSections) importOptions.open = false;
  workspaceShell.hidden = !hasParsedSections && appState.statusTone !== 'error';
  workspaceHeader.hidden = !hasParsedSections;
  renderStatus(statusElement, statusMessageForSearch(searchMetadata), comparisonMode ? 'info' : appState.statusTone);
  const blockingImportError = !hasParsedSections && appState.statusTone === 'error';
  statusElement.setAttribute('role', blockingImportError ? 'alert' : 'status');
  statusElement.setAttribute('aria-live', blockingImportError ? 'assertive' : 'polite');
  renderPrivacyControls(appState.sections.length > 0);
  renderComparisonControls(appState.sections.length > 0);
  renderSearchControls(searchMetadata, hasParsedSections);
  renderExportControls(
    hasParsedSections,
    serializeSectionsForExport(eligibleExportSections),
    serializeSectionsForJsonExport(eligibleExportSections, { mode: comparisonMode ? 'comparison' : 'single' }),
    eligibleExportSections.length > 0
  );
  renderSections(sectionsElement, visibleSections, {
    onCopySection: copySection,
    denseTableState,
    onToggleThreadGroup: toggleThreadGroup,
    onShowMoreRows: showMoreRows,
    onShowAllRows: showAllRows,
    onToggleDenseTable: toggleDenseTable,
    allSections: activeSections,
    coreAnalyticsView,
    coreAnalyticsFacetOptions,
    onSelectCoreAnalyticsFacet: selectCoreAnalyticsFacet,
    selectedCoreAnalyticsFacetQuery: searchQuery,
    searchActive: searchMetadata.searchActive,
    matchRegions: searchResult.matchRegions,
    activeExactMatchId: exactMatchTargets[activeExactMatchIndex]?.id ?? '',
  });
  workspaceNavigation.update(visibleSections);
  if (restoreCoreAnalyticsFacetFocus) {
    document.querySelector('.coreanalytics-overview__chip[aria-pressed="true"]')?.focus();
  }
  emptyResults.hidden = !emptySearch;
  clearButton.disabled = !appState.sourceText && !appState.sections.length;
  clearButton.hidden = clearButton.disabled;

  if (pendingWorkspaceFocus && hasParsedSections) {
    pendingWorkspaceFocus = false;
    queueMicrotask(() => {
      workspaceHeading.focus({ preventScroll: true });
      workspaceHeading.scrollIntoView({ block: 'start' });
    });
  }
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

    const fields = document.createElement('div');
    fields.className = 'comparison-list__fields';

    const displayLabel = document.createElement('span');
    displayLabel.className = 'comparison-list__identity';
    displayLabel.textContent = formatComparisonEntryLabel(entry, index);

    const labelId = `comparison-local-label-${index + 1}`;
    const helpId = `${labelId}-help`;
    const localLabelLabel = document.createElement('label');
    localLabelLabel.className = 'comparison-list__label';
    localLabelLabel.htmlFor = labelId;
    localLabelLabel.textContent = `Local label for Report ${index + 1}`;

    const localLabelInput = document.createElement('input');
    localLabelInput.className = 'comparison-list__input';
    localLabelInput.id = labelId;
    localLabelInput.type = 'text';
    localLabelInput.autocomplete = 'off';
    localLabelInput.placeholder = 'e.g. Before Update';
    localLabelInput.value = entry.localLabel;
    localLabelInput.setAttribute('aria-describedby', helpId);

    const helpText = document.createElement('span');
    helpText.className = 'comparison-list__help';
    helpText.id = helpId;
    helpText.textContent = 'Optional local label - stays on this device and is not included in exports. Maximum 40 Unicode characters.';

    localLabelInput.addEventListener('input', (event) => {
      comparisonEntries = updateComparisonEntryLocalLabel(comparisonEntries, index, event.currentTarget.value);
      displayLabel.textContent = formatComparisonEntryLabel(comparisonEntries[index], index);
    });
    localLabelInput.addEventListener('blur', () => {
      localLabelInput.value = comparisonEntries[index]?.localLabel ?? '';
    });

    fields.append(displayLabel, localLabelLabel, localLabelInput, helpText);

    const removeButton = document.createElement('button');
    removeButton.className = 'comparison-list__remove';
    removeButton.type = 'button';
    removeButton.textContent = 'Remove report';
    removeButton.setAttribute('aria-label', `Remove Report ${index + 1} from comparison`);
    removeButton.addEventListener('click', () => removeComparisonReport(index));

    item.append(fields, removeButton);
    return item;
  });

  comparisonList.replaceChildren(...items);
}

function formatComparisonEntryLabel(entry, index) {
  const reportLabel = `Report ${index + 1}`;
  const parserType = entry?.classification?.parserType ?? 'unknown';
  const localLabel = typeof entry?.localLabel === 'string' ? entry.localLabel : '';
  return localLabel ? `${reportLabel} — ${localLabel} (${parserType})` : `${reportLabel} — ${parserType}`;
}

function comparisonSetupMessage(validation, reportCount) {
  if (reportCount === 0) return 'No reports added.';
  if (validation.code === 'mixed-parser-types') return 'Selected reports must use the same parser type.';
  if (validation.code === 'too-many-reports' || reportCount > 3) return 'Comparison supports up to three reports.';
  if (reportCount === 1 || validation.code === 'too-few-reports') return 'Add one or two more reports of the same type to compare.';
  if (!validation.valid) return validation.message;
  return reportCount === 3
    ? 'Ready to compare. Comparison supports up to three reports.'
    : 'Ready to compare.';
}

function focusComparisonEntry(index) {
  const target = index >= 0 ? document.getElementById(`comparison-local-label-${index + 1}`) : null;
  (target ?? addToComparisonButton).focus();
}

function addCurrentReportToComparison() {
  if (comparisonMode || !appState.sourceText || !appState.sections.length) return;
  if (comparisonEntries.length >= 3) {
    comparisonMessage = 'Comparison supports up to three reports.';
    renderApp();
    return;
  }

  try {
    const classification = classifyDiagnostic(appState.sourceText);
    const sections = parseInput(appState.sourceText, { sanitize: true });
    const entry = createComparisonEntry({
      classification: {
        parserType: classification.parserType,
        supported: classification.supported,
      },
      sections,
    });
    const nextEntries = [...comparisonEntries, entry];
    const validationEntries = nextEntries.length === 1 ? [entry, entry] : nextEntries;
    const validation = validateComparison(validationEntries);

    if (!validation.valid) {
      comparisonMessage = comparisonSetupMessage(validation, nextEntries.length);
      renderApp();
      return;
    }

    comparisonEntries = nextEntries;
    comparisonMessage = comparisonSetupMessage(validation, comparisonEntries.length);
  } catch {
    comparisonMessage = 'Could not add this report to comparison.';
  }

  renderApp();
}

function removeComparisonReport(index) {
  if (index < 0 || index >= comparisonEntries.length) return;

  comparisonEntries = removeComparisonEntry(comparisonEntries, index);
  const focusIndex = comparisonEntries.length ? Math.min(index, comparisonEntries.length - 1) : -1;
  exitComparisonMode();
  clearSearchState();
  resetDenseTableState();
  comparisonMessage = comparisonSetupMessage(validateComparison(comparisonEntries), comparisonEntries.length);
  renderApp();
  focusComparisonEntry(focusIndex);
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
    comparisonMessage = comparisonSetupMessage(validation, comparisonEntries.length);
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
  pendingWorkspaceFocus = false;
  exitComparisonMode();
  clearSearchState();
  comparisonMessage = comparisonSetupMessage(validateComparison(comparisonEntries), comparisonEntries.length);
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
    pendingWorkspaceFocus = sections.length > 0;
  } catch {
    appState = withParseError(nextReportState, { sourceText, sourceLabel, detectedType });
  }

  renderApp();
}

function clearReport() {
  pendingWorkspaceFocus = false;
  appState = createInitialAppState();
  comparisonEntries = [];
  comparisonMessage = 'No reports added.';
  exitComparisonMode();
  denseTableState = createInitialDenseTableState();
  clearSearchState();
  fileInput.value = '';
  pasteInput.value = '';
  inputPanel.classList.remove('input-panel--drag-over');
  renderApp();
  importIntro.scrollIntoView({ block: 'start' });
  fileInput.focus({ preventScroll: true });
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

function resetSearchNavigationState() {
  searchNavigationTargets = [];
  activeNavigationIndex = -1;
  navigationQuery = '';
}

function resetExactMatchState() {
  exactMatchTargets = [];
  activeExactMatchIndex = -1;
  exactMatchQuery = '';
  exactMatchNeutral = false;
}

function clearSearchState() {
  searchQuery = '';
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchInput.value = '';
  resetSearchNavigationState();
  resetExactMatchState();
}

function renderSearchControls(searchMetadata, hasParsedSections) {
  searchPanel.hidden = !hasParsedSections;
  clearSearchButton.hidden = !searchMetadata.searchActive;

  if (!hasParsedSections || !searchMetadata.searchActive) {
    searchCount.textContent = 'Search inactive.';
    updateSearchNavigationControls(false);
    updateExactMatchControls(false);
    return;
  }

  searchCount.textContent = searchStatusText(searchMetadata);
  const showSearchNavigation = searchNavigationTargets.length > 0 && (appState.sanitize || comparisonMode);
  updateSearchNavigationControls(showSearchNavigation);
  updateExactMatchControls(appState.sanitize || comparisonMode);
}

function reconcileExactMatchState(matchRegions, exactMatchEligible) {
  const nextTargets = exactMatchEligible ? createExactMatchTargets(matchRegions) : [];
  const queryChanged = exactMatchQuery !== searchQuery;
  const currentTargetId = exactMatchTargets[activeExactMatchIndex]?.id ?? '';
  if (queryChanged) exactMatchNeutral = false;

  let nextIndex = -1;
  if (nextTargets.length) {
    if (exactMatchNeutral) {
      nextIndex = -1;
    } else if (queryChanged || !currentTargetId) {
      nextIndex = 0;
    } else {
      nextIndex = Math.max(0, nextTargets.findIndex((target) => target.id === currentTargetId));
    }
  }

  exactMatchTargets = nextTargets;
  activeExactMatchIndex = nextIndex;
  exactMatchQuery = searchQuery;
}

function reconcileSearchNavigationState(targets, navigationEligible) {
  const nextTargets = navigationEligible && Array.isArray(targets) ? targets : [];
  const targetListChanged = !sameNavigationTargets(searchNavigationTargets, nextTargets);
  const queryChanged = navigationQuery !== searchQuery;

  if (!nextTargets.length) {
    searchNavigationTargets = [];
    activeNavigationIndex = -1;
    navigationQuery = searchQuery;
    return;
  }

  if (targetListChanged || queryChanged || activeNavigationIndex < 0 || activeNavigationIndex >= nextTargets.length) {
    activeNavigationIndex = 0;
  }

  searchNavigationTargets = nextTargets;
  navigationQuery = searchQuery;
}

function sameNavigationTargets(left, right) {
  if (left.length !== right.length) return false;

  return left.every((target, index) => {
    const nextTarget = right[index];
    return target.id === nextTarget.id && target.title === nextTarget.title && target.position === nextTarget.position;
  });
}

function updateSearchNavigationControls(showSearchNavigation) {
  searchNavigationElement.hidden = !showSearchNavigation;
  if (!showSearchNavigation) {
    searchNavigationPreviousButton.disabled = true;
    searchNavigationNextButton.disabled = true;
    searchNavigationPreviousButton.setAttribute('aria-disabled', 'true');
    searchNavigationNextButton.setAttribute('aria-disabled', 'true');
    searchNavigationPosition.textContent = 'Search navigation inactive.';
    return;
  }

  const previousDisabled = activeNavigationIndex <= 0;
  const nextDisabled = activeNavigationIndex >= searchNavigationTargets.length - 1;
  searchNavigationPreviousButton.disabled = false;
  searchNavigationNextButton.disabled = false;
  searchNavigationPreviousButton.setAttribute('aria-disabled', String(previousDisabled));
  searchNavigationNextButton.setAttribute('aria-disabled', String(nextDisabled));
  searchNavigationPosition.textContent = `Match ${activeNavigationIndex + 1} of ${searchNavigationTargets.length} ${
    searchNavigationTargets.length === 1 ? 'section' : 'sections'
  }`;
}

function updateExactMatchControls(showExactMatchNavigation) {
  exactMatchNavigationElement.hidden = !showExactMatchNavigation;

  if (!showExactMatchNavigation) {
    exactMatchPreviousButton.disabled = true;
    exactMatchNextButton.disabled = true;
    exactMatchPreviousButton.setAttribute('aria-disabled', 'true');
    exactMatchNextButton.setAttribute('aria-disabled', 'true');
    setExactMatchText(exactMatchPosition, 'Exact-match navigation inactive.');
    setExactMatchText(exactMatchStatus, '');
    return;
  }

  const hasMatches = exactMatchTargets.length > 0 && activeExactMatchIndex >= 0;
  const previousDisabled = !hasMatches || activeExactMatchIndex <= 0;
  const nextDisabled = !hasMatches || activeExactMatchIndex >= exactMatchTargets.length - 1;
  exactMatchPreviousButton.disabled = previousDisabled;
  exactMatchNextButton.disabled = nextDisabled;
  exactMatchPreviousButton.setAttribute('aria-disabled', String(previousDisabled));
  exactMatchNextButton.setAttribute('aria-disabled', String(nextDisabled));

  if (!hasMatches) {
    setExactMatchText(exactMatchPosition, 'No exact matches.');
    setExactMatchText(exactMatchStatus, 'No exact matches in visible sanitized content.');
    return;
  }

  const isFirst = activeExactMatchIndex === 0;
  const isLast = activeExactMatchIndex === exactMatchTargets.length - 1;
  const boundaryMessage = isFirst && isLast
    ? ' First and last exact match.'
    : isFirst
      ? ' First exact match.'
      : isLast
      ? ' Last exact match.'
      : '';
  const position = `Match ${activeExactMatchIndex + 1} of ${exactMatchTargets.length}.${boundaryMessage}`;
  setExactMatchText(exactMatchPosition, `${activeExactMatchIndex + 1} of ${exactMatchTargets.length}`);
  setExactMatchText(exactMatchStatus, position);
}

function setExactMatchText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function navigateSearchResult(direction) {
  if (!searchNavigationTargets.length) return;

  const navigationButton = document.activeElement?.id === 'search-previous' || document.activeElement?.id === 'search-next'
    ? document.activeElement
    : null;
  if (navigationButton?.getAttribute('aria-disabled') === 'true') return;

  const nextIndex = activeNavigationIndex + direction;
  if (nextIndex < 0 || nextIndex > searchNavigationTargets.length - 1) return;

  const target = searchNavigationTargets[nextIndex];
  activeNavigationIndex = nextIndex;
  updateSearchNavigationControls(true);

  const nextExactMatchIndex = exactMatchTargets.findIndex((match) => match.sectionId === target.id);
  exactMatchNeutral = nextExactMatchIndex < 0;
  activeExactMatchIndex = nextExactMatchIndex;

  const targetElement = document.getElementById(target.id);
  if (!targetElement) {
    const sectionLabel = searchNavigationTargets.length === 1 ? 'section' : 'sections';
    renderStatus(
      statusElement,
      `Could not show match ${activeNavigationIndex + 1} of ${searchNavigationTargets.length} ${sectionLabel}: section unavailable.`,
      comparisonMode ? 'info' : appState.statusTone
    );
    document.getElementById(navigationButton?.id ?? '')?.focus();
    return;
  }

  renderApp();
  markCurrentSectionNavigation(target.id);
  const nextTargetElement = document.getElementById(target.id);
  nextTargetElement?.scrollIntoView({ block: 'start' });
  renderStatus(
    statusElement,
    `Showing match ${activeNavigationIndex + 1} of ${searchNavigationTargets.length} ${
      searchNavigationTargets.length === 1 ? 'section' : 'sections'
    }: ${target.title}`,
    comparisonMode ? 'info' : appState.statusTone
  );
  document.getElementById(navigationButton?.id ?? '')?.focus();
}

function findExactMatchElement(targetId) {
  if (!targetId) return null;
  return [...document.querySelectorAll('[data-exact-match-id]')]
    .find((element) => element.dataset.exactMatchId === targetId) ?? null;
}

function markCurrentSectionNavigation(sectionId) {
  workspaceNavigation.markCurrent(sectionId);
}

function scrollExactMatchIntoView(target) {
  const targetElement = findExactMatchElement(target.id) ?? document.getElementById(target.sectionId);
  if (!targetElement) return;

  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  targetElement.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: reducedMotion ? 'auto' : 'smooth',
  });
}

function navigateExactMatch(direction) {
  if (!exactMatchTargets.length || activeExactMatchIndex < 0) return;

  const navigationButton = document.activeElement?.id === 'exact-match-previous' || document.activeElement?.id === 'exact-match-next'
    ? document.activeElement
    : null;
  if (navigationButton?.disabled) return;

  const nextIndex = activeExactMatchIndex + direction;
  if (nextIndex < 0 || nextIndex > exactMatchTargets.length - 1) return;

  exactMatchNeutral = false;
  activeExactMatchIndex = nextIndex;
  const activeTarget = exactMatchTargets[activeExactMatchIndex];
  const nextSectionIndex = searchNavigationTargets.findIndex((match) => match.id === activeTarget.sectionId);
  if (nextSectionIndex >= 0) {
    activeNavigationIndex = nextSectionIndex;
    updateSearchNavigationControls(true);
  }
  renderApp();
  markCurrentSectionNavigation(activeTarget.sectionId);
  scrollExactMatchIntoView(activeTarget);
  const activatedButton = document.getElementById(navigationButton?.id ?? '');
  if (activatedButton && !activatedButton.disabled) {
    activatedButton.focus();
    return;
  }

  document.getElementById(direction > 0 ? 'exact-match-previous' : 'exact-match-next')?.focus();
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
    resetSearchNavigationState();
    renderApp();
  }, 180);
}

function selectCoreAnalyticsFacet(option) {
  if (typeof option?.query !== 'string' || !option.query.trim()) return;

  searchInput.value = option.query;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
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
  const visibleSections = filterSectionsByQuery(activeSections, searchQuery, { includeMatchRegions: appState.sanitize || comparisonMode }).sections;
  const exportText = serializeSectionsForExport(getEligibleExportSections(activeSections, visibleSections));
  if (!exportText) return;

  downloadTextFile(
    exportText,
    comparisonMode ? 'ios-diagnostic-comparison.txt' : 'ios-diagnostic-export.txt'
  );
}

function downloadVisibleJson() {
  const activeSections = comparisonMode ? comparisonSections : appState.sections;
  const visibleSections = filterSectionsByQuery(activeSections, searchQuery, { includeMatchRegions: appState.sanitize || comparisonMode }).sections;
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
searchNavigationPreviousButton.addEventListener('click', () => navigateSearchResult(-1));
searchNavigationNextButton.addEventListener('click', () => navigateSearchResult(1));
exactMatchPreviousButton.addEventListener('click', () => navigateExactMatch(-1));
exactMatchNextButton.addEventListener('click', () => navigateExactMatch(1));
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
