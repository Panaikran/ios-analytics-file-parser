import { TABLE_VIEW_MODES, getTableView } from '../ui/tableView.js';

export function getVisibleSectionForCopy(section, { denseTableState = {}, allSections = [] } = {}) {
  if (!section?.table?.length) return section;

  const view = getTableView(section, {
    denseTableState,
    allSections,
    forceExpanded: section.forceExpanded === true,
  });

  if (view.mode === TABLE_VIEW_MODES.plain || view.mode === TABLE_VIEW_MODES.compact) return section;

  return {
    ...section,
    table: view.rows,
    ...(view.mode === TABLE_VIEW_MODES.limited || view.mode === TABLE_VIEW_MODES.collapsed
      ? { tableSummary: view.summary }
      : {}),
  };
}
