import { renderSection } from './renderSection.js';

export function renderStatus(element, message, tone = 'info') {
  element.textContent = message;
  element.dataset.tone = tone;
}

export function renderSections(element, sections, options = {}) {
  element.replaceChildren(...sections.map((section) => renderSection(section, options)));
}
