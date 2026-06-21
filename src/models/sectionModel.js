export function createSection({ id, title, priority = 'info', fields = [], raw = '', table = null }) {
  return {
    id,
    title,
    priority,
    fields,
    raw,
    table,
  };
}
