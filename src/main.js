import { parseInput } from './parsers/index.js';
import { renderSections, renderStatus } from './ui/renderApp.js';

const fileInput = document.querySelector('#file-input');
const pasteInput = document.querySelector('#paste-input');
const statusElement = document.querySelector('#status');
const sectionsElement = document.querySelector('#sections');

function showParsedReport(text, sourceLabel) {
  try {
    const sections = parseInput(text);
    renderStatus(statusElement, `Parsed ${sourceLabel}. Sanitized view is enabled by default.`);
    renderSections(sectionsElement, sections);
  } catch (error) {
    renderStatus(statusElement, error.message, 'error');
    renderSections(sectionsElement, []);
  }
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  pasteInput.value = text;
  showParsedReport(text, file.name);
});

pasteInput.addEventListener('input', () => {
  const text = pasteInput.value.trim();
  if (!text) {
    renderStatus(statusElement, 'No report loaded yet.');
    renderSections(sectionsElement, []);
    return;
  }

  showParsedReport(text, 'pasted text');
});
