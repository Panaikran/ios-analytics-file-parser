const DEFAULT_TABLE_COLUMNS = [
  { key: 'frame', label: 'Frame' },
  { key: 'binary', label: 'Binary' },
  { key: 'address', label: 'Address' },
  { key: 'symbol', label: 'Symbol' },
];

export function serializeSectionForCopy(section) {
  const blocks = [[section.title]];

  if (section.fields?.length) {
    blocks.push(section.fields.map((field) => `${field.label}: ${field.value}`));
  }

  if (section.tableSummary) {
    blocks.push([section.tableSummary]);
  }

  if (section.table?.length) {
    blocks.push(serializeTable(section));
  }

  if (section.raw) {
    blocks.push([String(section.raw)]);
  }

  if (section.chart) {
    blocks.push(serializeChart(section.chart));
  }

  return blocks
    .filter((block) => block.length)
    .map((block) => block.join('\n'))
    .join('\n\n');
}

export function serializeSectionsForExport(sections) {
  if (!Array.isArray(sections)) return '';

  return sections
    .filter(isExportableSection)
    .map((section) => serializeSectionForCopy(normalizeSection(section)))
    .filter(Boolean)
    .join('\n\n---\n\n');
}

export function serializeSectionsForJsonExport(sections, options = {}) {
  if (!Array.isArray(sections)) return '';

  const mode = options.mode === 'comparison' ? 'comparison' : 'single';
  const payload = {
    format: 'ios-analytics-visible-export',
    version: 1,
    mode,
    sections: sections.map(normalizeJsonSection).filter(Boolean),
  };

  return JSON.stringify(payload, null, 2);
}

function serializeTable(section) {
  const columns = section.tableColumns ?? DEFAULT_TABLE_COLUMNS;
  const rows = [columns.map((column) => column.label).join('\t')];

  for (const row of section.table) {
    rows.push(columns.map((column) => stringifyCell(row[column.key])).join('\t'));
  }

  return rows;
}

function serializeChart(chart) {
  const rows = [chart.title ?? 'Chart data'];

  for (const item of chart.items ?? []) {
    rows.push(`${stringifyCell(item.label)}\t${stringifyCell(item.value)}`);
  }

  return rows;
}

function stringifyCell(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ');
}

function isExportableSection(section) {
  return section && typeof section === 'object' && typeof section.title === 'string';
}

function normalizeSection(section) {
  return {
    ...section,
    fields: Array.isArray(section.fields) ? section.fields.filter(isRecord) : [],
    table: Array.isArray(section.table) ? section.table.filter(isRecord) : [],
    tableColumns: Array.isArray(section.tableColumns) ? section.tableColumns.filter(isRecord) : section.tableColumns,
    raw: null,
    chart: isRecord(section.chart) && Array.isArray(section.chart.items)
      ? { ...section.chart, items: section.chart.items.filter(isRecord) }
      : null,
  };
}

function normalizeJsonSection(section) {
  if (!isRecord(section) || !hasOwn(section, 'title') || typeof section.title !== 'string') return null;

  const normalized = {
    title: section.title,
    fields: hasOwn(section, 'fields') && Array.isArray(section.fields) ? section.fields.map(normalizeJsonField).filter(Boolean) : [],
    tableSummary: hasOwn(section, 'tableSummary') && typeof section.tableSummary === 'string' ? section.tableSummary : '',
    tableColumns: [],
    table: [],
    chart: null,
  };

  if (hasOwn(section, 'id') && isSafeJsonKey(section.id)) normalized.id = section.id;

  const columns = hasOwn(section, 'tableColumns') && Array.isArray(section.tableColumns) ? section.tableColumns : DEFAULT_TABLE_COLUMNS;
  normalized.tableColumns = columns
    .filter((column) => isRecord(column) && hasOwn(column, 'key') && hasOwn(column, 'label') && isSafeJsonKey(column.key) && typeof column.label === 'string')
    .map((column) => ({ key: column.key, label: column.label }));

  if (hasOwn(section, 'table') && Array.isArray(section.table)) {
    normalized.table = section.table
      .filter(isRecord)
      .map((row) => normalizeJsonRow(row, normalized.tableColumns))
      .filter((row) => Object.keys(row).length);
  }

  if (hasOwn(section, 'chart') && isRecord(section.chart) && hasOwn(section.chart, 'items') && Array.isArray(section.chart.items)) {
    const items = section.chart.items
      .filter(isRecord)
      .map(normalizeJsonChartItem)
      .filter(Boolean);
    normalized.chart = {
      ...(hasOwn(section.chart, 'title') && typeof section.chart.title === 'string' ? { title: section.chart.title } : {}),
      items,
    };
  }

  return normalized;
}

function normalizeJsonField(field) {
  if (!isRecord(field) || !hasOwn(field, 'label') || !hasOwn(field, 'value') || typeof field.label !== 'string' || !isJsonScalar(field.value)) return null;
  return { label: field.label, value: field.value };
}

function normalizeJsonRow(row, columns) {
  const normalized = {};

  for (const column of columns) {
    if (hasOwn(row, column.key) && isJsonScalar(row[column.key])) normalized[column.key] = row[column.key];
  }

  return normalized;
}

function normalizeJsonChartItem(item) {
  if (!hasOwn(item, 'label') || !hasOwn(item, 'value') || !isJsonScalar(item.label) || !isJsonScalar(item.value)) return null;
  return { label: item.label, value: item.value };
}

function isJsonScalar(value) {
  return typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value));
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isSafeJsonKey(value) {
  return typeof value === 'string' && !['__proto__', 'constructor', 'prototype'].includes(value);
}

function isRecord(value) {
  return value !== null && typeof value === 'object';
}
