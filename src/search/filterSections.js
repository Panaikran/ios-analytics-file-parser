const DEFAULT_TABLE_COLUMNS = Object.freeze([
  { key: 'frame', label: 'Frame' },
  { key: 'binary', label: 'Binary' },
  { key: 'address', label: 'Address' },
  { key: 'symbol', label: 'Symbol' },
]);

export const SEARCH_MATCH_KINDS = Object.freeze([
  'section-title',
  'field-label',
  'field-value',
  'table-header',
  'table-cell',
  'chart-label',
  'chart-value',
  'text',
]);

export function filterSectionsByQuery(sections, query, { includeMatchRegions = true } = {}) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      active: false,
      query: '',
      totalMatches: 0,
      sections,
      navigationTargets: [],
      matchRegions: [],
    };
  }

  let totalMatches = 0;
  const filteredSections = [];
  const navigationTargets = [];
  const matchRegions = [];

  for (const [sectionIndex, section] of sections.entries()) {
    const result = filterSection(section, normalizedQuery, sectionIndex, includeMatchRegions);
    totalMatches += result.matchCount;
    if (result.matchCount > 0) {
      filteredSections.push(result.section);
      matchRegions.push(...result.matchRegions);
      navigationTargets.push({
        id: section.id,
        title: section.title,
        position: navigationTargets.length,
      });
    }
  }

  return {
    active: true,
    query: normalizedQuery,
    totalMatches,
    sections: filteredSections,
    navigationTargets,
    matchRegions,
  };
}

function filterSection(section, query, sectionIndex, includeMatchRegions) {
  let matchCount = includesQuery(section.title, query) ? 1 : 0;
  matchCount += countFieldMatches(section.fields ?? [], query);
  matchCount += includesQuery(section.raw, query) ? 1 : 0;
  matchCount += countChartMatches(section.chart, query);

  const nextSection = { ...section, forceExpanded: true };

  if (Array.isArray(section.table)) {
    const tableColumns = getVisibleTableColumns(section);
    const matchingRows = [];

    for (const row of section.table) {
      const rowMatches = countRowMatches(row, tableColumns, query);
      if (rowMatches > 0) {
        matchingRows.push(row);
        matchCount += rowMatches;
      }
    }

    nextSection.table = matchingRows;
    nextSection.tableSummary = `${matchingRows.length} of ${section.table.length} rows shown`;
  }

  return {
    section: nextSection,
    matchCount,
    matchRegions: includeMatchRegions ? collectMatchRegions(section, query, sectionIndex) : [],
  };
}

function collectMatchRegions(section, query, sectionIndex) {
  const regions = [];

  addMatchRegion(regions, section, sectionIndex, 'section-title', section.title, query);

  for (const [fieldIndex, field] of (section.fields ?? []).entries()) {
    addMatchRegion(regions, section, sectionIndex, 'field-label', field?.label, query, { fieldIndex });
    addMatchRegion(regions, section, sectionIndex, 'field-value', field?.value, query, { fieldIndex });
  }

  const tableColumns = getVisibleTableColumns(section);
  if (Array.isArray(section.table)) {
    for (const [columnIndex, column] of tableColumns.entries()) {
      if (!isVisibleColumn(column)) continue;
      addMatchRegion(regions, section, sectionIndex, 'table-header', column.label, query, {
        columnIndex,
        columnKey: column.key,
      });
    }

    for (const [rowIndex, row] of section.table.entries()) {
      if (!row || typeof row !== 'object') continue;
      for (const [columnIndex, column] of tableColumns.entries()) {
        if (!isVisibleColumn(column)) continue;
        addMatchRegion(regions, section, sectionIndex, 'table-cell', row[column.key], query, {
          rowIndex,
          columnIndex,
          columnKey: column.key,
        });
      }
    }
  }

  if (section.chart && typeof section.chart === 'object') {
    addMatchRegion(regions, section, sectionIndex, 'chart-label', section.chart.title ?? 'Memory chart', query, {
      chartIndex: 0,
      chartPart: 'title',
    });

    if (Array.isArray(section.chart.items)) {
      for (const [itemIndex, item] of section.chart.items.entries()) {
        addMatchRegion(regions, section, sectionIndex, 'chart-label', item?.label, query, {
          chartIndex: 0,
          itemIndex,
          chartPart: 'item-label',
        });
        addMatchRegion(regions, section, sectionIndex, 'chart-value', item?.value, query, {
          chartIndex: 0,
          itemIndex,
          chartPart: 'item-value',
        });
      }
    }
  }

  addMatchRegion(regions, section, sectionIndex, 'text', section.raw, query, { textBlockIndex: 0 });
  return regions;
}

function addMatchRegion(regions, section, sectionIndex, kind, value, query, details = {}) {
  const occurrences = findOccurrences(value, query);
  if (!occurrences.length) return;

  regions.push({
    sectionIndex,
    sectionId: section.id,
    kind,
    ...details,
    occurrences,
  });
}

function findOccurrences(value, query) {
  const normalizedValue = String(value ?? '').toLowerCase();
  const occurrences = [];
  let start = normalizedValue.indexOf(query);

  while (start >= 0) {
    occurrences.push({ start, end: start + query.length });
    start = normalizedValue.indexOf(query, start + query.length);
  }

  return occurrences;
}

function getVisibleTableColumns(section) {
  if (section.tableColumns === null || section.tableColumns === undefined) return DEFAULT_TABLE_COLUMNS;
  return Array.isArray(section.tableColumns) ? section.tableColumns : DEFAULT_TABLE_COLUMNS;
}

function isVisibleColumn(column) {
  return column !== null && typeof column === 'object' && typeof column.key === 'string' && typeof column.label === 'string';
}

function countFieldMatches(fields, query) {
  return fields.reduce((total, field) => {
    const labelMatch = includesQuery(field.label, query) ? 1 : 0;
    const valueMatch = includesQuery(field.value, query) ? 1 : 0;
    return total + labelMatch + valueMatch;
  }, 0);
}

function countRowMatches(row, tableColumns, query) {
  return tableColumns.reduce((total, column) => total
    + (isVisibleColumn(column) && includesQuery(row[column.key], query) ? 1 : 0), 0);
}

function countChartMatches(chart, query) {
  if (!chart || typeof chart !== 'object') return 0;

  let total = includesQuery(chart.title ?? 'Memory chart', query) ? 1 : 0;
  if (!Array.isArray(chart.items)) return total;

  return chart.items.reduce((count, item) => count
    + (includesQuery(item?.label, query) ? 1 : 0)
    + (includesQuery(item?.value, query) ? 1 : 0), total);
}

function includesQuery(value, query) {
  return String(value ?? '').toLowerCase().includes(query);
}
