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

function isRecord(value) {
  return value !== null && typeof value === 'object';
}
