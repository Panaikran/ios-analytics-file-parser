import { summarizeReportSize } from '../models/reportSize.js';

export const CORE_ANALYTICS_SECTION_IDS = Object.freeze({
  summary: 'coreanalytics-summary',
  configuration: 'coreanalytics-configuration',
  recordOverview: 'coreanalytics-record-overview',
  eventTypes: 'coreanalytics-event-types',
  sampleRecords: 'coreanalytics-sample-records',
  parserNotes: 'coreanalytics-parser-notes',
});

const FACET_KEYS = Object.freeze(['message', 'name', 'aggregationPeriod', 'sampling']);
const FACET_LABELS = Object.freeze({
  message: 'Top Messages',
  name: 'Top Names',
  aggregationPeriod: 'Aggregation Periods',
  sampling: 'Sampling Values',
});
const FACET_SOURCE = 'rendered/capped rows only';

export function getCoreAnalyticsView(sections, options = {}) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const sectionMap = createSectionMap(safeSections);
  const resolvedSections = Object.fromEntries(
    Object.entries(CORE_ANALYTICS_SECTION_IDS).map(([key, id]) => [key, sectionMap.get(id) ?? null])
  );
  const isCoreAnalytics = Object.values(resolvedSections).every(Boolean);

  if (!isCoreAnalytics) {
    return createEmptyView(safeSections, resolvedSections, options);
  }

  const eventTypes = createTableModel(resolvedSections.eventTypes);
  const sampleRecords = createTableModel(resolvedSections.sampleRecords);
  const parserNotes = createFieldsModel(resolvedSections.parserNotes);

  return {
    isCoreAnalytics: true,
    sections: resolvedSections,
    fields: {
      summary: createFieldsModel(resolvedSections.summary),
      configuration: createFieldsModel(resolvedSections.configuration),
      recordOverview: createFieldsModel(resolvedSections.recordOverview),
      parserNotes,
    },
    tables: {
      eventTypes,
      sampleRecords,
    },
    facets: createFacets([eventTypes, sampleRecords]),
    warnings: parserNotes.items.map((field) => field.value).filter(Boolean),
    size: options.includeSize === false ? null : summarizeReportSize(safeSections),
  };
}

export function getCoreAnalyticsFacetOptions(view) {
  if (!isRecord(view) || view.isCoreAnalytics !== true || !isRecord(view.facets) || !isRecord(view.facets.values)) {
    return [];
  }

  return FACET_KEYS.map((key) => {
    const values = hasOwn(view.facets.values, key) && Array.isArray(view.facets.values[key])
      ? view.facets.values[key]
      : [];
    const seen = new Set();
    const options = [];

    for (const item of values) {
      if (!isRecord(item) || !hasOwn(item, 'value') || !hasOwn(item, 'count')) continue;

      const value = normalizeFacetValue(item.value);
      if (!value || seen.has(value) || !Number.isFinite(item.count) || item.count < 1) continue;

      seen.add(value);
      options.push({ value, query: value, count: item.count });
    }

    return {
      key,
      label: FACET_LABELS[key],
      options,
    };
  });
}

function createEmptyView(sections, resolvedSections, options) {
  return {
    isCoreAnalytics: false,
    sections: resolvedSections,
    fields: {
      summary: createFieldsModel(null),
      configuration: createFieldsModel(null),
      recordOverview: createFieldsModel(null),
      parserNotes: createFieldsModel(null),
    },
    tables: {
      eventTypes: createTableModel(null),
      sampleRecords: createTableModel(null),
    },
    facets: createFacets([]),
    warnings: [],
    size: options.includeSize === false ? null : summarizeReportSize(sections),
  };
}

function createSectionMap(sections) {
  const map = new Map();

  for (const section of sections) {
    if (typeof section?.id === 'string' && !map.has(section.id)) {
      map.set(section.id, section);
    }
  }

  return map;
}

function createFieldsModel(section) {
  const items = Array.isArray(section?.fields)
    ? section.fields
        .filter((field) => typeof field?.label === 'string')
        .map((field) => ({
          label: field.label,
          value: String(field.value ?? ''),
        }))
    : [];

  return {
    items,
    byLabel: Object.fromEntries(items.map((field) => [field.label, field.value])),
  };
}

function createTableModel(section) {
  const rows = Array.isArray(section?.table) ? section.table : [];
  const columns = Array.isArray(section?.tableColumns) ? section.tableColumns : [];
  const tableSummary = typeof section?.tableSummary === 'string' ? section.tableSummary : '';
  const counts = parseTableSummary(tableSummary);
  const capped = counts.known ? counts.shown < counts.total : false;

  return {
    rows,
    columns,
    tableSummary,
    counts,
    capped,
    facetsBasedOn: FACET_SOURCE,
  };
}

export function parseTableSummary(summary) {
  const match = String(summary ?? '').match(/\b(\d+)\s+of\s+(\d+)\b/i);

  if (!match) {
    return {
      known: false,
      shown: null,
      total: null,
    };
  }

  return {
    known: true,
    shown: Number(match[1]),
    total: Number(match[2]),
  };
}

function createFacets(tableModels) {
  const values = Object.fromEntries(FACET_KEYS.map((key) => [key, []]));
  const countsByKey = Object.fromEntries(FACET_KEYS.map((key) => [key, new Map()]));

  for (const table of tableModels) {
    for (const row of table.rows ?? []) {
      for (const key of FACET_KEYS) {
        const value = isRecord(row) && hasOwn(row, key) ? normalizeFacetValue(row[key]) : '';
        if (!value) continue;
        countsByKey[key].set(value, (countsByKey[key].get(value) ?? 0) + 1);
      }
    }
  }

  for (const key of FACET_KEYS) {
    values[key] = [...countsByKey[key].entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
  }

  return {
    source: FACET_SOURCE,
    keys: [...FACET_KEYS],
    values,
  };
}

function normalizeFacetValue(value) {
  if (
    !['string', 'boolean'].includes(typeof value) &&
    !(typeof value === 'number' && Number.isFinite(value))
  ) {
    return '';
  }

  const text = String(value ?? '').trim();
  return text && !['__proto__', 'constructor', 'prototype'].includes(text) ? text : '';
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
