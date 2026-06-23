import {
  createInitialAppState,
  startNewReportState,
  withParsedReport,
  withParseError,
  withPrivacyMode,
  withStatus,
} from './appState.js';
import { EXAMPLE_REPORTS } from '../examples/manifest.js';
import { serializeSectionForCopy } from './clipboard/serializeSection.js';
import { detectFileType } from './parsers/detect.js';
import { parseInput } from './parsers/index.js';
import { filterSectionsByQuery } from './search/filterSections.js';
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
const searchPanel = document.querySelector('#search-panel');
const searchInput = document.querySelector('#result-search');
const clearSearchButton = document.querySelector('#clear-search');
const searchCount = document.querySelector('#search-count');
const sectionNavElement = document.querySelector('#section-nav');
const emptyResults = document.querySelector('#empty-results');
const sectionsElement = document.querySelector('#sections');

let appState = createInitialAppState();
let searchQuery = '';
let searchTimer = null;
let denseTableState = createInitialDenseTableState();

function createInitialDenseTableState() {
  return {
    expandedThreadGroups: {},
    rowLimits: {},
    expandedTables: {},
  };
}

function renderApp() {
  const searchResult = filterSectionsByQuery(appState.sections, searchQuery);
  const visibleSections = searchResult.sections;
  const hasParsedSections = appState.sections.length > 0;
  const emptySearch = searchResult.active && searchResult.totalMatches === 0;

  renderStatus(statusElement, statusMessageForSearch(searchResult), appState.statusTone);
  renderPrivacyControls(hasParsedSections);
  renderSearchControls(searchResult, hasParsedSections);
  renderSectionNav(sectionNavElement, visibleSections);
  renderSections(sectionsElement, visibleSections, {
    onCopySection: copySection,
    denseTableState,
    onToggleThreadGroup: toggleThreadGroup,
    onShowMoreRows: showMoreRows,
    onShowAllRows: showAllRows,
    onToggleDenseTable: toggleDenseTable,
    allSections: appState.sections,
  });
  emptyResults.hidden = !emptySearch;
  clearButton.disabled = !appState.sourceText && !appState.sections.length;
}

function renderPrivacyControls(hasParsedSections) {
  privacyPanel.hidden = !hasParsedSections;
  privacyModeLabel.textContent = appState.sanitize
    ? 'Privacy mode: Sanitized view'
    : 'Privacy mode: Raw local view — not uploaded';
  privacyToggle.textContent = appState.sanitize ? 'Switch to raw local view' : 'Switch to sanitized view';
  privacyToggle.setAttribute('aria-pressed', String(!appState.sanitize));
  privacyWarning.hidden = appState.sanitize;
}

function showParsedReport(text, sourceLabel) {
  const sourceText = String(text ?? '');
  const detectedType = detectFileType(sourceText);
  const nextReportState = startNewReportState(appState);

  if (detectedType === 'unknown') {
    appState = withStatus(
      {
        ...createInitialAppState(),
        sourceText,
        sourceLabel,
        detectedType,
      },
      {
        message: 'Unsupported or unknown report format. Try a .ips, .crash, panic-full, JetsamEvent, or analytics text file.',
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

function renderSearchControls(searchResult, hasParsedSections) {
  searchPanel.hidden = !hasParsedSections;
  clearSearchButton.hidden = !searchResult.active;

  if (!hasParsedSections) {
    searchCount.textContent = 'Search inactive.';
    return;
  }

  if (!searchResult.active) {
    searchCount.textContent = `${appState.sections.length} sections available.`;
    return;
  }

  searchCount.textContent =
    searchResult.totalMatches === 1
      ? '1 match in parsed output.'
      : `${searchResult.totalMatches} matches in parsed output.`;
}

function statusMessageForSearch(searchResult) {
  if (!searchResult.active) return appState.statusMessage;
  if (searchResult.totalMatches === 0) return 'No matches in parsed output.';
  return `${searchCountText(searchResult.totalMatches)} for "${searchResult.query}".`;
}

function searchCountText(count) {
  return count === 1 ? '1 match' : `${count} matches`;
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
      message: `Could not load ${example.sourceLabel}. Serve the project folder through a local static server to use examples.`,
      tone: 'error',
      clearSections: true,
    });
    renderApp();
  }
}

async function loadFile(file) {
  if (!file) return;

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

renderExampleControls();
renderApp();
