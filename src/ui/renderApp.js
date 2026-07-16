import { renderSection } from './renderSection.js';
import { renderCoreAnalyticsOverview } from './renderCoreAnalyticsOverview.js';

export function renderStatus(element, message, tone = 'info') {
  element.textContent = message;
  element.dataset.tone = tone;
}

export function renderSections(element, sections, options = {}) {
  const presentation = options.presentation ?? 'compatibility';
  const documentPresentation = ['report', 'comparison', 'raw'].includes(presentation);
  const reportPresentation = presentation === 'report';
  const overview = renderCoreAnalyticsOverview(options.coreAnalyticsView, {
    searchActive: options.searchActive === true,
    facetOptions: options.coreAnalyticsFacetOptions,
    onSelectFacet: options.onSelectCoreAnalyticsFacet,
    selectedFacetQuery: options.selectedCoreAnalyticsFacetQuery,
    headingLevel: documentPresentation ? 3 : 2,
  });
  const sectionCards = sections.map((section) => renderSection(section, {
    ...options,
    documentPresentation,
    reportPresentation,
    comparisonPresentation: presentation === 'comparison',
    rawPresentation: presentation === 'raw',
  }));
  const reportHeader = documentPresentation
    ? renderReportHeader(options.reportIdentity, {
        presentation,
        onExitMode: options.onExitMode,
      })
    : null;

  element.classList.toggle('report-document', documentPresentation);
  element.classList.toggle('report-document--comparison', presentation === 'comparison');
  element.classList.toggle('report-document--raw', presentation === 'raw');
  if (documentPresentation) {
    element.setAttribute('role', 'region');
    element.setAttribute('aria-labelledby', 'report-document-title');
    element.setAttribute('aria-describedby', 'report-document-description');
  } else {
    element.removeAttribute('role');
    element.removeAttribute('aria-labelledby');
    element.removeAttribute('aria-describedby');
  }
  element.replaceChildren(...[reportHeader, overview, ...sectionCards].filter(Boolean));
}

function renderReportHeader(identity = {}, { presentation = 'report', onExitMode = null } = {}) {
  const header = document.createElement('header');
  header.className = `report-document__header report-document__header--${presentation}`;

  const context = document.createElement('p');
  context.className = 'report-document__context';
  context.textContent = identity.mode || 'Sanitized view';

  const title = document.createElement('h2');
  title.id = 'report-document-title';
  title.textContent = identity.title || 'Parsed report';
  if (presentation !== 'report') title.tabIndex = -1;

  const metadata = document.createElement('p');
  metadata.className = 'report-document__metadata';
  metadata.textContent = identity.type || 'Supported report';

  const description = document.createElement('p');
  description.id = 'report-document-description';
  description.className = 'report-document__description';
  description.textContent = identity.description || '';

  header.append(context, title, metadata);
  if (description.textContent) header.append(description);

  if (presentation === 'comparison') {
    header.append(renderComparisonIdentities(identity));
  }

  if (typeof onExitMode === 'function') {
    const action = document.createElement('button');
    action.className = 'report-document__mode-action';
    action.type = 'button';
    action.textContent = presentation === 'raw' ? 'Return to Sanitized View' : 'Exit comparison';
    action.addEventListener('click', onExitMode);
    header.append(action);
  }

  return header;
}

function renderComparisonIdentities(identity) {
  const list = document.createElement('ul');
  list.className = 'comparison-identities';
  list.setAttribute('aria-label', 'Compared reports');

  const reportCount = Number.isInteger(identity.reportCount) ? identity.reportCount : 0;
  for (let index = 0; index < reportCount; index += 1) {
    const item = document.createElement('li');
    item.className = 'comparison-identity';

    const label = document.createElement('strong');
    label.textContent = `Report ${index + 1}`;

    const detail = document.createElement('span');
    detail.textContent = `${identity.parserType || 'Supported report'} · sanitized`;

    item.append(label, detail);
    list.append(item);
  }

  return list;
}
