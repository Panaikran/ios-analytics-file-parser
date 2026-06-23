import { findCrashedThreadName, getLimitedRows, groupRowsByThread, isLargeKextTable } from '../ui/denseTables.js';

export function getVisibleSectionForCopy(section, { denseTableState = {}, allSections = [] } = {}) {
  if (!section?.table?.length) return section;

  if (section.id === 'all-threads') {
    return visibleThreadSection(section, { denseTableState, allSections });
  }

  if (section.id === 'process-table') {
    const limit = denseTableState?.rowLimits?.[section.id];
    const result = getLimitedRows(section.table, {
      limit,
      forceExpanded: section.forceExpanded === true,
    });
    return {
      ...section,
      table: result.rows,
      tableSummary: result.summary,
    };
  }

  if (isLargeKextTable(section)) {
    const expanded = section.forceExpanded === true || denseTableState?.expandedTables?.[section.id] === true;
    return {
      ...section,
      table: expanded ? section.table : [],
      tableSummary: `${expanded ? section.table.length : 0} of ${section.table.length} rows shown`,
    };
  }

  return section;
}

function visibleThreadSection(section, { denseTableState, allSections }) {
  const expandedThreads = {};
  for (const [key, expanded] of Object.entries(denseTableState?.expandedThreadGroups ?? {})) {
    if (key.startsWith(`${section.id}:`)) expandedThreads[key.slice(section.id.length + 1)] = expanded;
  }

  const groups = groupRowsByThread(section.table, {
    crashedThread: findCrashedThreadName(allSections),
    expandedThreads,
    forceExpanded: section.forceExpanded === true,
  });

  return {
    ...section,
    table: groups.flatMap((group) => (group.expanded ? group.rows : [])),
  };
}
