export const JETSAM_INITIAL_ROW_LIMIT = 50;
export const JETSAM_ROW_INCREMENT = 50;
export const KEXT_COLLAPSE_THRESHOLD = 20;

export function findCrashedThreadName(sections) {
  const crashedThread = sections.find((section) => section.id === 'crashed-thread');
  return crashedThread?.title.match(/\bThread\s+\d+\b/)?.[0] ?? '';
}

export function groupRowsByThread(rows, { crashedThread = '', expandedThreads = {}, forceExpanded = false } = {}) {
  const groups = [];
  const groupsByThread = new Map();

  for (const row of rows ?? []) {
    const thread = row.thread || 'Thread';
    if (!groupsByThread.has(thread)) {
      const group = { thread, rows: [] };
      groupsByThread.set(thread, group);
      groups.push(group);
    }
    groupsByThread.get(thread).rows.push(row);
  }

  return groups.map((group) => {
    const expanded = forceExpanded || (expandedThreads[group.thread] ?? group.thread === crashedThread);
    return {
      ...group,
      expanded,
      frameCount: group.rows.length,
      stateLabel: expanded ? 'expanded' : 'collapsed',
    };
  });
}

export function getLimitedRows(rows, { limit = JETSAM_INITIAL_ROW_LIMIT, forceExpanded = false } = {}) {
  const allRows = rows ?? [];
  const visibleRows = forceExpanded ? allRows : allRows.slice(0, limit);

  return {
    rows: visibleRows,
    shown: visibleRows.length,
    total: allRows.length,
    summary: `${visibleRows.length} of ${allRows.length} rows shown`,
    allShown: visibleRows.length >= allRows.length,
  };
}

export function isLargeKextTable(section, threshold = KEXT_COLLAPSE_THRESHOLD) {
  return section.id === 'loaded-kexts' && Array.isArray(section.table) && section.table.length > threshold;
}
