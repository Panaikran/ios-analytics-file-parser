import {
  JETSAM_INITIAL_ROW_LIMIT,
  JETSAM_ROW_INCREMENT,
  findCrashedThreadName,
  getLimitedRows,
  groupRowsByThread,
  isLargeKextTable,
} from './denseTables.js';

export const TABLE_VIEW_MODES = Object.freeze({
  plain: 'plain',
  compact: 'compact',
  limited: 'limited',
  collapsed: 'collapsed',
  grouped: 'grouped',
});

export function getTableView(section, { denseTableState = {}, allSections = [], forceExpanded = section?.forceExpanded === true } = {}) {
  const rows = Array.isArray(section?.table) ? section.table : [];
  const base = createBaseView(section, rows);

  if (!rows.length) return base;

  if (section.id === 'all-threads') {
    return createThreadGroupView(section, rows, { denseTableState, allSections, forceExpanded });
  }

  if (section.id === 'process-table') {
    return createLimitedView(section, rows, { denseTableState, forceExpanded });
  }

  if (isLargeKextTable(section)) {
    return createCollapsedView(section, rows, { denseTableState, forceExpanded });
  }

  if (section.id === 'binary-images') {
    return { ...base, mode: TABLE_VIEW_MODES.compact, compact: true };
  }

  return base;
}

function createBaseView(section, rows) {
  return {
    mode: TABLE_VIEW_MODES.plain,
    rows,
    totalRows: rows.length,
    shownRows: rows.length,
    summary: `${rows.length} of ${rows.length} rows shown`,
    allShown: true,
    compact: false,
    expanded: true,
    collapsed: false,
    groups: [],
    tableColumns: section?.tableColumns ?? null,
  };
}

function createThreadGroupView(section, rows, { denseTableState, allSections, forceExpanded }) {
  const expandedThreads = {};
  for (const [key, expanded] of Object.entries(denseTableState?.expandedThreadGroups ?? {})) {
    if (key.startsWith(`${section.id}:`)) expandedThreads[key.slice(section.id.length + 1)] = expanded;
  }

  const groups = groupRowsByThread(rows, {
    crashedThread: findCrashedThreadName(allSections),
    expandedThreads,
    forceExpanded,
  });
  const visibleRows = groups.flatMap((group) => (group.expanded ? group.rows : []));

  return {
    ...createBaseView(section, visibleRows),
    mode: TABLE_VIEW_MODES.grouped,
    totalRows: rows.length,
    shownRows: visibleRows.length,
    summary: `${visibleRows.length} of ${rows.length} rows shown`,
    allShown: visibleRows.length >= rows.length,
    expanded: groups.every((group) => group.expanded),
    collapsed: visibleRows.length === 0,
    groups,
  };
}

function createLimitedView(section, rows, { denseTableState, forceExpanded }) {
  const limit = denseTableState?.rowLimits?.[section.id] ?? JETSAM_INITIAL_ROW_LIMIT;
  const result = getLimitedRows(rows, { limit, forceExpanded });
  const canShowMore = !result.allShown && !forceExpanded;

  return {
    ...createBaseView(section, result.rows),
    mode: TABLE_VIEW_MODES.limited,
    totalRows: result.total,
    shownRows: result.shown,
    summary: result.summary,
    allShown: result.allShown,
    limit,
    nextLimit: Math.min(result.total, limit + JETSAM_ROW_INCREMENT),
    canShowMore,
    canShowAll: canShowMore,
  };
}

function createCollapsedView(section, rows, { denseTableState, forceExpanded }) {
  const expanded = forceExpanded || denseTableState?.expandedTables?.[section.id] === true;
  const visibleRows = expanded ? rows : [];

  return {
    ...createBaseView(section, visibleRows),
    mode: TABLE_VIEW_MODES.collapsed,
    totalRows: rows.length,
    shownRows: visibleRows.length,
    summary: `${visibleRows.length} of ${rows.length} rows shown`,
    allShown: expanded,
    expanded,
    collapsed: !expanded,
    canToggle: true,
  };
}
