export function createSection({
  id,
  title,
  priority = 'info',
  fields = [],
  raw = '',
  table = null,
  tableColumns = null,
  tableSummary = '',
  chart = null,
}) {
  return {
    id,
    title,
    priority,
    fields,
    raw,
    table,
    tableColumns,
    tableSummary,
    chart,
  };
}
