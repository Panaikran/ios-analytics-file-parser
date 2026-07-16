import { renderSection } from './renderSection.js';
import { renderCoreAnalyticsOverview } from './renderCoreAnalyticsOverview.js';

export function renderStatus(element, message, tone = 'info') {
  element.textContent = message;
  element.dataset.tone = tone;
}

export function renderSections(element, sections, options = {}) {
  const reportPresentation = options.presentation === 'report';
  const overview = renderCoreAnalyticsOverview(options.coreAnalyticsView, {
    searchActive: options.searchActive === true,
    facetOptions: options.coreAnalyticsFacetOptions,
    onSelectFacet: options.onSelectCoreAnalyticsFacet,
    selectedFacetQuery: options.selectedCoreAnalyticsFacetQuery,
    headingLevel: reportPresentation ? 3 : 2,
  });
  const sectionCards = sections.map((section) => renderSection(section, {
    ...options,
    reportPresentation,
  }));
  const reportHeader = reportPresentation ? renderReportHeader(options.reportIdentity) : null;

  element.classList.toggle('report-document', reportPresentation);
  if (reportPresentation) {
    element.setAttribute('role', 'region');
    element.setAttribute('aria-labelledby', 'report-document-title');
  } else {
    element.removeAttribute('role');
    element.removeAttribute('aria-labelledby');
  }
  element.replaceChildren(...[reportHeader, overview, ...sectionCards].filter(Boolean));
}

function renderReportHeader(identity = {}) {
  const header = document.createElement('header');
  header.className = 'report-document__header';

  const context = document.createElement('p');
  context.className = 'report-document__context';
  context.textContent = identity.mode || 'Sanitized view';

  const title = document.createElement('h2');
  title.id = 'report-document-title';
  title.textContent = identity.title || 'Parsed report';

  const metadata = document.createElement('p');
  metadata.className = 'report-document__metadata';
  metadata.textContent = identity.type || 'Supported report';

  const description = document.createElement('p');
  description.className = 'report-document__description';
  description.textContent = identity.description || '';

  header.append(context, title, metadata);
  if (description.textContent) header.append(description);
  return header;
}
