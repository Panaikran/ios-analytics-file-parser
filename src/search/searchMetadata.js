const CORE_ANALYTICS_TABLE_IDS = new Set([
  'coreanalytics-event-types',
  'coreanalytics-sample-records',
]);

export function getSearchMetadata(searchResult = {}, sections = [], { coreAnalyticsView = null } = {}) {
  const searchActive = searchResult?.active === true;
  const safeSections = Array.isArray(sections) ? sections : [];
  const tableStats = summarizeTables(safeSections, coreAnalyticsView);
  const cappedCoreAnalytics = tableStats.cappedCoreAnalytics;
  const hasCappedTables = tableStats.hasCappedTables;

  return {
    searchActive,
    query: searchActive ? String(searchResult?.query ?? '') : '',
    matchCount: searchActive ? safeCount(searchResult?.totalMatches) : 0,
    searchedSectionCount: searchActive ? safeSections.length : 0,
    searchedTableRowCount: searchActive ? tableStats.renderedTableRows : 0,
    renderedRowsOnly: searchActive && hasCappedTables,
    cappedCoreAnalytics,
    hasCappedTables,
    knownSourceRecordTotal: tableStats.knownSourceRecordTotal,
    scopeNote: createSearchScopeNote({ searchActive, cappedCoreAnalytics, hasCappedTables }),
  };
}

function summarizeTables(sections, coreAnalyticsView) {
  let renderedTableRows = 0;
  let knownSourceRecordTotal = 0;
  let hasCappedTables = false;
  let cappedCoreAnalytics = Boolean(
    coreAnalyticsView?.isCoreAnalytics &&
      (coreAnalyticsView?.tables?.eventTypes?.capped || coreAnalyticsView?.tables?.sampleRecords?.capped)
  );

  for (const section of sections) {
    if (Array.isArray(section?.table)) {
      renderedTableRows += section.table.length;
    }

    const counts = parseVisibleTotal(section?.tableSummary);
    if (!counts.known || counts.shown >= counts.total) continue;

    hasCappedTables = true;
    knownSourceRecordTotal += counts.total;
    if (CORE_ANALYTICS_TABLE_IDS.has(section?.id)) cappedCoreAnalytics = true;
  }

  if (cappedCoreAnalytics) hasCappedTables = true;

  return {
    renderedTableRows,
    knownSourceRecordTotal,
    hasCappedTables,
    cappedCoreAnalytics,
  };
}

function createSearchScopeNote({ searchActive, cappedCoreAnalytics, hasCappedTables }) {
  if (!searchActive) return '';
  if (cappedCoreAnalytics) return 'Search covers rendered capped CoreAnalytics rows only.';
  if (hasCappedTables) return 'Search covers rendered capped parsed rows only.';
  return 'Search covers parsed output.';
}

export function parseVisibleTotal(summary) {
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

function safeCount(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
