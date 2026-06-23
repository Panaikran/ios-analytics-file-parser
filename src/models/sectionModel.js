export function createSection({
  id,
  title,
  priority = 'info',
  fields = [],
  raw = '',
  table = null,
  tableColumns = null,
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
    chart,
  };
}
