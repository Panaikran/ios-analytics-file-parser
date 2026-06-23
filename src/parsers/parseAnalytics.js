import { createSection } from '../models/sectionModel.js';
import { sanitizeText } from '../privacy/sanitize.js';

export function parseAnalytics(text) {
  const groups = splitGroups(text);

  return [
    createSection({
      id: 'analytics-summary',
      title: 'Analytics Summary',
      priority: 'info',
      fields: [
        { label: 'Detected Sections', value: String(groups.length) },
        { label: 'Line Count', value: String(text.split(/\r?\n/).filter(Boolean).length) },
      ],
    }),
    createSection({
      id: 'analytics-sections',
      title: 'Analytics Sections',
      priority: 'info',
      tableColumns: [
        { key: 'section', label: 'Section' },
        { key: 'heading', label: 'Heading' },
        { key: 'content', label: 'Content' },
      ],
      table: groups.map((group, index) => ({
        section: String(index + 1),
        heading: sanitizeText(group[0] ?? `Section ${index + 1}`),
        content: sanitizeText(group.join('\n')),
      })),
    }),
  ];
}

function splitGroups(text) {
  const delimiterGroups = text
    .split(/\r?\n---+\r?\n/)
    .map((group) => group.split(/\r?\n/).filter(Boolean))
    .filter((group) => group.length);

  if (delimiterGroups.length > 1) return delimiterGroups;

  return text
    .split(/\r?\n(?=\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)
    .map((group) => group.split(/\r?\n/).filter(Boolean))
    .filter((group) => group.length);
}
