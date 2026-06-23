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
    article.append(renderTable(section.table, section.tableColumns));
  }

  if (section.chart) {
    article.append(renderChart(section.chart));
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

function renderTable(rows, columns = null) {
  const resolvedColumns =
    columns ??
    [
      { key: 'frame', label: 'Frame' },
      { key: 'binary', label: 'Binary' },
      { key: 'address', label: 'Address' },
      { key: 'symbol', label: 'Symbol' },
    ];
  const table = document.createElement('table');
  table.className = 'frame-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const column of resolvedColumns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column.label;
    headerRow.append(th);
  }
  thead.append(headerRow);

  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const column of resolvedColumns) {
      const td = document.createElement('td');
      td.textContent = row[column.key] ?? '';
      tr.append(td);
    }
    tbody.append(tr);
  }

  table.append(thead, tbody);
  return table;
}

function renderChart(chart) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chart';
  wrapper.dataset.chartType = chart.type;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 180;
  wrapper.append(canvas);

  const caption = document.createElement('p');
  caption.className = 'chart-caption';
  caption.textContent = chart.title ?? 'Memory chart';
  wrapper.append(caption);

  const schedule = globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 0));
  schedule(() => drawMemoryBars(canvas, chart.items ?? []));
  return wrapper;
}

function drawMemoryBars(canvas, items) {
  const context = canvas.getContext('2d');
  if (!context || !items.length) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const barHeight = 18;
  const gap = 12;
  const labelWidth = 120;

  context.font = '13px ui-monospace, SF Mono, Menlo, monospace';
  items.forEach((item, index) => {
    const y = 24 + index * (barHeight + gap);
    const width = Math.round(((canvas.width - labelWidth - 28) * item.value) / maxValue);
    context.fillStyle = '#8e8e93';
    context.fillText(item.label, 12, y + 14);
    context.fillStyle = item.color ?? '#30d158';
    context.fillRect(labelWidth, y, width, barHeight);
    context.fillStyle = '#f2f2f7';
    context.fillText(String(item.value), labelWidth + width + 8, y + 14);
  });
}
