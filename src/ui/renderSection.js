export function renderSection(section) {
  const article = document.createElement('article');
  article.className = `section-card section-card--${section.priority}`;
  article.id = section.id;

  const title = document.createElement('h2');
  title.textContent = section.title;
  article.append(title);

  if (section.fields?.length) {
    article.append(renderFields(section.fields));
  }

  if (section.table?.length) {
    article.append(renderTable(section.table));
  }

  if (section.raw) {
    const raw = document.createElement('p');
    raw.className = 'raw-note';
    raw.textContent = section.raw;
    article.append(raw);
  }

  return article;
}

function renderFields(fields) {
  const dl = document.createElement('dl');
  dl.className = 'field-list';

  for (const field of fields) {
    const dt = document.createElement('dt');
    dt.textContent = field.label;
    const dd = document.createElement('dd');
    dd.textContent = field.value;
    dl.append(dt, dd);
  }

  return dl;
}

function renderTable(rows) {
  const table = document.createElement('table');
  table.className = 'frame-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['Frame', 'Binary', 'Address', 'Symbol']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headerRow.append(th);
  }
  thead.append(headerRow);

  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const key of ['frame', 'binary', 'address', 'symbol']) {
      const td = document.createElement('td');
      td.textContent = row[key];
      tr.append(td);
    }
    tbody.append(tr);
  }

  table.append(thead, tbody);
  return table;
}
