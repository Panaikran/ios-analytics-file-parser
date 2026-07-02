import { TABLE_VIEW_MODES, getTableView } from './tableView.js';
import { getCopyMetadata } from '../clipboard/copyMetadata.js';
import { getVisibleSectionForCopy } from '../clipboard/visibleSection.js';

export function renderSection(
  section,
  {
    onCopySection = null,
    denseTableState = null,
    onToggleThreadGroup = null,
    onShowMoreRows = null,
    onShowAllRows = null,
    onToggleDenseTable = null,
    allSections = [],
  } = {}
) {
  const article = document.createElement('article');
  article.className = `section-card section-card--${section.priority}`;
  article.id = section.id;

  const header = document.createElement('div');
  header.className = 'section-card__header';

  const title = document.createElement('h2');
  title.textContent = section.title;
  header.append(title);

  if (onCopySection) {
    const copyMetadata = getCopyMetadata(section, { denseTableState, allSections });
    header.append(
      renderCopyControl(
        getVisibleSectionForCopy(section, {
          denseTableState,
          allSections,
        }),
        onCopySection,
        copyMetadata
      )
    );
  }

  article.append(header);

  if (section.fields?.length) {
    article.append(renderFields(section.fields));
  }

  if (section.tableSummary) {
    const summary = document.createElement('p');
    summary.className = 'table-summary';
    summary.textContent = section.tableSummary;
    article.append(summary);
  }

  if (section.table?.length) {
    article.append(
      renderSectionTable(section, {
        denseTableState,
        onToggleThreadGroup,
        onShowMoreRows,
        onShowAllRows,
        onToggleDenseTable,
        allSections,
      })
    );
  }

  if (section.chart) {
    article.append(renderChart(section.chart));
  }

  if (section.raw) {
    const raw = document.createElement('div');
    raw.className = 'raw-note raw-note--wrap';
    raw.textContent = section.raw;
    article.append(raw);
  }

  return article;
}

function renderSectionTable(section, options) {
  const view = getTableView(section, {
    denseTableState: options.denseTableState,
    allSections: options.allSections,
    forceExpanded: section.forceExpanded === true,
  });

  if (view.mode === TABLE_VIEW_MODES.grouped) return renderThreadGroups(section, view, options);
  if (view.mode === TABLE_VIEW_MODES.limited) return renderLimitedProcessTable(section, view, options);
  if (view.mode === TABLE_VIEW_MODES.collapsed) return renderCollapsibleKextTable(section, view, options);
  return renderTable(view.rows, section.tableColumns, { compact: view.mode === TABLE_VIEW_MODES.compact });
}

function renderThreadGroups(section, view, { onToggleThreadGroup }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'thread-groups';

  for (const group of view.groups) {
    const groupElement = document.createElement('section');
    groupElement.className = 'thread-group';

    const button = document.createElement('button');
    button.className = 'thread-group__toggle';
    button.type = 'button';
    button.setAttribute('aria-expanded', String(group.expanded));
    button.setAttribute('aria-label', `Toggle ${group.thread} thread group, ${group.frameCount} frames, currently ${group.expanded ? 'expanded' : 'collapsed'}`);
    button.textContent = `${group.thread} - ${group.frameCount} frames - ${group.stateLabel}`;
    button.addEventListener('click', () => {
      onToggleThreadGroup?.(section.id, group.thread, !group.expanded);
    });

    groupElement.append(button);
    if (group.expanded) {
      groupElement.append(renderTable(group.rows, section.tableColumns));
    }
    wrapper.append(groupElement);
  }

  return wrapper;
}

function renderLimitedProcessTable(section, view, { onShowMoreRows, onShowAllRows }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'limited-table';

  wrapper.append(renderRowCount(view.summary));
  wrapper.append(renderTable(view.rows, section.tableColumns));

  if (view.canShowMore) {
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.append(
      renderTableButton('Show more', () => onShowMoreRows?.(section.id, view.nextLimit), `Show more rows in ${section.title}`),
      renderTableButton('Show all', () => onShowAllRows?.(section.id, view.totalRows), `Show all rows in ${section.title}`)
    );
    wrapper.append(controls);
  }

  return wrapper;
}

function renderCollapsibleKextTable(section, view, { onToggleDenseTable }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'collapsible-table';

  const button = document.createElement('button');
  button.className = 'table-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', String(view.expanded));
  button.setAttribute('aria-label', `Toggle loaded kexts table, ${view.totalRows} rows, currently ${view.expanded ? 'expanded' : 'collapsed'}`);
  button.textContent = `Loaded kexts - ${view.totalRows} rows - ${view.expanded ? 'expanded' : 'collapsed'}`;
  button.addEventListener('click', () => onToggleDenseTable?.(section.id, !view.expanded));
  wrapper.append(button, renderRowCount(view.summary));

  if (view.expanded) {
    wrapper.append(renderTable(view.rows, section.tableColumns));
  }

  return wrapper;
}

function renderRowCount(text) {
  const summary = document.createElement('p');
  summary.className = 'table-summary';
  summary.textContent = text;
  return summary;
}

function renderTableButton(label, onClick, ariaLabel = label) {
  const button = document.createElement('button');
  button.className = 'table-control-button';
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', onClick);
  return button;
}

function renderCopyControl(section, onCopySection, copyMetadata) {
  const wrapper = document.createElement('div');
  wrapper.className = 'section-copy';

  const button = document.createElement('button');
  button.className = 'section-copy__button';
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', `Copy ${section.title} section`);

  const feedback = document.createElement('span');
  feedback.className = 'section-copy__feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  button.addEventListener('click', async () => {
    const result = await onCopySection(section);
    feedback.textContent = result.ok ? copyFeedbackText(copyMetadata) : 'Copy failed. Select and copy manually.';
  });

  wrapper.append(button, feedback);
  return wrapper;
}

function copyFeedbackText(copyMetadata) {
  if (copyMetadata?.cappedCoreAnalytics) {
    return 'Copied visible rows only. Search and copy operate on rendered capped rows only.';
  }

  if (copyMetadata?.limitedRows || copyMetadata?.collapsedRows || copyMetadata?.allRowsVisible === false) {
    return 'Copied visible rows only.';
  }

  return 'Copied visible section content.';
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

function renderTable(rows, columns = null, { compact = false } = {}) {
  const resolvedColumns =
    columns ??
    [
      { key: 'frame', label: 'Frame' },
      { key: 'binary', label: 'Binary' },
      { key: 'address', label: 'Address' },
      { key: 'symbol', label: 'Symbol' },
    ];
  const table = document.createElement('table');
  table.className = compact ? 'frame-table frame-table--compact' : 'frame-table';

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

  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.append(table);
  return wrapper;
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
