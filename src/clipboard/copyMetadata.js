import { parseVisibleTotal } from '../search/searchMetadata.js';
import { TABLE_VIEW_MODES, getTableView } from '../ui/tableView.js';

const CORE_ANALYTICS_TABLE_IDS = new Set([
  'coreanalytics-event-types',
  'coreanalytics-sample-records',
]);

export function getCopyMetadata(
  section,
  {
    tableView = null,
    denseTableState = {},
    allSections = [],
  } = {}
) {
  const view = tableView ?? getTableView(section, {
    denseTableState,
    allSections,
    forceExpanded: section?.forceExpanded === true,
  });
  const visibleRows = safeCount(view?.shownRows);
  const totalRows = safeCount(view?.totalRows);
  const allRowsVisible = totalRows === 0 || visibleRows >= totalRows;
  const cappedCoreAnalytics = isCappedCoreAnalyticsSection(section);
  const limitedRows = view?.mode === TABLE_VIEW_MODES.limited && !allRowsVisible;
  const collapsedRows = hasCollapsedRows(view, allRowsVisible);

  return {
    visibleRows,
    totalRows,
    allRowsVisible,
    limitedRows,
    collapsedRows,
    renderedRowsOnly: cappedCoreAnalytics,
    cappedCoreAnalytics,
    knownSourceRecordTotal: sourceRecordTotal(section),
    note: createCopyNote({
      cappedCoreAnalytics,
      limitedRows,
      collapsedRows,
      visibleRows,
    }),
  };
}

function hasCollapsedRows(view, allRowsVisible) {
  if (allRowsVisible) return false;
  if (view?.mode === TABLE_VIEW_MODES.collapsed) return true;
  return view?.mode === TABLE_VIEW_MODES.grouped;
}

function isCappedCoreAnalyticsSection(section) {
  if (!CORE_ANALYTICS_TABLE_IDS.has(section?.id)) return false;
  const counts = parseVisibleTotal(section?.tableSummary);
  return counts.known && counts.shown < counts.total;
}

function sourceRecordTotal(section) {
  const counts = parseVisibleTotal(section?.tableSummary);
  return counts.known && counts.shown < counts.total ? counts.total : 0;
}

function createCopyNote({ cappedCoreAnalytics, limitedRows, collapsedRows, visibleRows }) {
  if (cappedCoreAnalytics) return 'Copy includes rendered capped CoreAnalytics rows only.';
  if (collapsedRows && visibleRows === 0) return 'Copy omits collapsed rows.';
  if (collapsedRows) return 'Copy includes expanded thread groups only.';
  if (limitedRows) return 'Copy includes visible rows only.';
  return 'Copy includes all visible section content.';
}

function safeCount(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
