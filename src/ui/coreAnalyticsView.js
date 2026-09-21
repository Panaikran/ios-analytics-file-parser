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
const INVESTIGATION_RENDERED_SCOPE = 'Search covers rendered capped CoreAnalytics rows only.';
const CORE_ANALYTICS_ROW_LIMIT = 100;
// The optional sanitized Battery section shares the existing global search result.
const CORE_ANALYTICS_SEARCH_SECTION_LIMIT = Object.keys(CORE_ANALYTICS_SECTION_IDS).length + 1;
const CORE_ANALYTICS_FACET_VALUE_LIMIT = CORE_ANALYTICS_ROW_LIMIT * 2;
const EMPTY_INVESTIGATION_MODEL = Object.freeze({
  mode: 'idle',
  selectedFacet: null,
  renderedScope: '',
  matchingTableCounts: Object.freeze([]),
  statusText: '',
  resetLabel: '',
});

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
  const facets = readOwnDataProperty(view, 'facets');
  const values = readOwnDataProperty(facets, 'values');
  if (readOwnDataProperty(view, 'isCoreAnalytics') !== true || !isPlainRecord(values)) {
    return [];
  }

  return FACET_KEYS.map((key) => {
    const facetValues = readOwnDataProperty(values, key);
    const valueCount = getSafeArrayLength(facetValues, CORE_ANALYTICS_FACET_VALUE_LIMIT) ?? 0;
    const seen = new Set();
    const options = [];

    for (let index = 0; index < valueCount; index += 1) {
      const item = getSafeArrayItem(facetValues, index);
      const value = readOwnDataProperty(item, 'value');
      const count = readOwnDataProperty(item, 'count');

      const normalizedValue = normalizeFacetValue(value);
      if (!normalizedValue || seen.has(normalizedValue) || !Number.isFinite(count) || count < 1) continue;

      seen.add(normalizedValue);
      options.push({ value: normalizedValue, query: normalizedValue, count });
    }

    return {
      key,
      label: FACET_LABELS[key],
      options,
    };
  });
}

export function getCoreAnalyticsInvestigation(view, searchResult, state) {
  try {
    const safeState = readInvestigationState(state);
    if (!safeState || safeState.mode === 'idle' || readOwnDataProperty(view, 'isCoreAnalytics') !== true) {
      return EMPTY_INVESTIGATION_MODEL;
    }

    const selectedFacet = getCoreAnalyticsFacetOptions(view)
      .find(({ key }) => key === safeState.selectedFacetKey)?.options
      .find(({ query }) => query === safeState.selectedFacetQuery);
    if (!selectedFacet) return EMPTY_INVESTIGATION_MODEL;

    const searchSnapshot = readInvestigationSearch(searchResult, safeState.selectedFacetQuery);
    const tableSnapshot = readInvestigationTables(view);
    if (!searchSnapshot || !tableSnapshot) return EMPTY_INVESTIGATION_MODEL;

    const mode = searchSnapshot.totalMatches === 0 ? 'empty' : 'active';
    const selectedFacetModel = Object.freeze({
      key: safeState.selectedFacetKey,
      label: FACET_LABELS[safeState.selectedFacetKey],
      query: safeState.selectedFacetQuery,
    });
    const tableCounts = tableSnapshot.map(({ tableId, total, capped }) => ({
      tableId,
      shown: searchSnapshot.shownByTable.get(tableId) ?? 0,
      total,
      capped,
    }));
    if (tableCounts.some(({ shown, total }) => shown > total)) return EMPTY_INVESTIGATION_MODEL;

    const matchingTableCounts = Object.freeze(tableCounts.map((tableCount) => Object.freeze(tableCount)));
    const label = selectedFacetModel.label.toLowerCase();

    return Object.freeze({
      mode,
      selectedFacet: selectedFacetModel,
      renderedScope: INVESTIGATION_RENDERED_SCOPE,
      matchingTableCounts,
      statusText: mode === 'empty'
        ? `No visible matches for ${label}: ${selectedFacetModel.query}.`
        : `Showing visible matches for ${label}: ${selectedFacetModel.query}.`,
      resetLabel: 'Clear Search',
    });
  } catch {
    return EMPTY_INVESTIGATION_MODEL;
  }
}

export function createCoreAnalyticsInvestigationState() {
  return createInvestigationState('idle', null, '');
}

export function activateCoreAnalyticsFacet(facetKey, option) {
  if (!FACET_KEYS.includes(facetKey)) return null;

  const query = getSafeFacetOptionQuery(option);
  return query ? createInvestigationState('active', facetKey, query) : null;
}

export function syncCoreAnalyticsInvestigationQuery(state, query) {
  const safeState = readInvestigationState(state);
  if (!safeState || (safeState.mode !== 'active' && safeState.mode !== 'empty')) {
    return createCoreAnalyticsInvestigationState();
  }

  if (typeof query !== 'string' || query !== safeState.selectedFacetQuery) {
    return createCoreAnalyticsInvestigationState();
  }

  return createInvestigationState(safeState.mode, safeState.selectedFacetKey, safeState.selectedFacetQuery);
}

export function reconcileCoreAnalyticsInvestigationState(state, query, visibleMatchCount) {
  const synchronized = syncCoreAnalyticsInvestigationQuery(state, query);
  if (synchronized.mode === 'idle' || !Number.isInteger(visibleMatchCount) || visibleMatchCount < 0) {
    return synchronized;
  }

  return createInvestigationState(
    visibleMatchCount === 0 ? 'empty' : 'active',
    synchronized.selectedFacetKey,
    synchronized.selectedFacetQuery
  );
}

function createInvestigationState(mode, selectedFacetKey, selectedFacetQuery) {
  return Object.freeze({ mode, selectedFacetKey, selectedFacetQuery });
}

function getSafeFacetOptionQuery(option) {
  const values = readSafeDataProperties(option, ['value', 'query', 'count']);
  if (!values) return '';

  const { value, query, count } = values;
  if (
    typeof value !== 'string' ||
    typeof query !== 'string' ||
    value !== query ||
    !query.trim() ||
    query !== query.trim() ||
    ['__proto__', 'constructor', 'prototype'].includes(query) ||
    typeof count !== 'number' ||
    !Number.isFinite(count) ||
    count < 1
  ) {
    return '';
  }

  return query;
}

function readInvestigationState(state) {
  const values = readSafeDataProperties(state, ['mode', 'selectedFacetKey', 'selectedFacetQuery']);
  if (!values) return null;

  const { mode, selectedFacetKey, selectedFacetQuery } = values;
  if (
    !['idle', 'active', 'empty'].includes(mode) ||
    (selectedFacetKey !== null && !FACET_KEYS.includes(selectedFacetKey)) ||
    typeof selectedFacetQuery !== 'string'
  ) {
    return null;
  }

  if (mode === 'idle') {
    return selectedFacetKey === null && selectedFacetQuery === '' ? values : null;
  }

  return selectedFacetKey !== null && Boolean(selectedFacetQuery.trim()) && selectedFacetQuery === selectedFacetQuery.trim()
    ? values
    : null;
}

function readSafeDataProperties(value, expectedKeys) {
  if (!isRecord(value)) return null;

  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;

    const ownKeys = Reflect.ownKeys(value);
    if (
      ownKeys.length !== expectedKeys.length ||
      ownKeys.some((key) => typeof key !== 'string' || !expectedKeys.includes(key))
    ) {
      return null;
    }

    const values = {};
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return null;
      values[key] = descriptor.value;
    }

    return values;
  } catch {
    return null;
  }
}

function readOwnDataProperty(value, key) {
  try {
    if (!isPlainRecord(value)) return undefined;

    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && hasOwn(descriptor, 'value') ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

function isPlainRecord(value) {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function getSafeArrayLength(value, maxLength) {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;

    const descriptor = Object.getOwnPropertyDescriptor(value, 'length');
    const length = descriptor?.value;
    return Number.isSafeInteger(length) && length >= 0 && length <= maxLength ? length : null;
  } catch {
    return null;
  }
}

function getSafeArrayItem(value, index) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    return descriptor && hasOwn(descriptor, 'value') ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

function readInvestigationSearch(searchResult, selectedFacetQuery) {
  if (
    readOwnDataProperty(searchResult, 'active') !== true ||
    readOwnDataProperty(searchResult, 'query') !== selectedFacetQuery.toLowerCase()
  ) {
    return null;
  }

  const totalMatches = readOwnDataProperty(searchResult, 'totalMatches');
  const sections = readOwnDataProperty(searchResult, 'sections');
  const sectionCount = getSafeArrayLength(sections, CORE_ANALYTICS_SEARCH_SECTION_LIMIT);
  if (!Number.isSafeInteger(totalMatches) || totalMatches < 0 || sectionCount === null) return null;
  if ((totalMatches === 0) !== (sectionCount === 0)) return null;

  const shownByTable = new Map();
  for (let index = 0; index < sectionCount; index += 1) {
    const section = getSafeArrayItem(sections, index);
    const sectionId = readOwnDataProperty(section, 'id');
    if (typeof sectionId !== 'string') return null;

    if (sectionId !== CORE_ANALYTICS_SECTION_IDS.eventTypes && sectionId !== CORE_ANALYTICS_SECTION_IDS.sampleRecords) {
      continue;
    }
    if (shownByTable.has(sectionId)) return null;

    const rowCount = getSafeArrayLength(readOwnDataProperty(section, 'table'), CORE_ANALYTICS_ROW_LIMIT);
    if (rowCount === null) return null;
    shownByTable.set(sectionId, rowCount);
  }

  return { totalMatches, shownByTable };
}

function readInvestigationTables(view) {
  const tables = readOwnDataProperty(view, 'tables');
  const tableModels = [
    [CORE_ANALYTICS_SECTION_IDS.eventTypes, 'eventTypes'],
    [CORE_ANALYTICS_SECTION_IDS.sampleRecords, 'sampleRecords'],
  ];
  const snapshot = [];

  for (const [tableId, key] of tableModels) {
    const table = readOwnDataProperty(tables, key);
    const total = getSafeArrayLength(readOwnDataProperty(table, 'rows'), CORE_ANALYTICS_ROW_LIMIT);
    const capped = readOwnDataProperty(table, 'capped');
    if (total === null || typeof capped !== 'boolean') return null;
    snapshot.push({ tableId, total, capped });
  }

  return snapshot;
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
