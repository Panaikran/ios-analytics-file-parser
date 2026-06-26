import { renderSection } from './renderSection.js';
import { renderCoreAnalyticsOverview } from './renderCoreAnalyticsOverview.js';

export function renderStatus(element, message, tone = 'info') {
  element.textContent = message;
  element.dataset.tone = tone;
}

export function renderSections(element, sections, options = {}) {
  const overview = renderCoreAnalyticsOverview(options.coreAnalyticsView, {
    searchActive: options.searchActive === true,
  });
  const sectionCards = sections.map((section) => renderSection(section, options));
  element.replaceChildren(...[overview, ...sectionCards].filter(Boolean));
}
