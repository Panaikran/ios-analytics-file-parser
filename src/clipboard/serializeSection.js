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
