import { TABLE_VIEW_MODES, getTableView } from './tableView.js';
import { getCopyMetadata } from '../clipboard/copyMetadata.js';
import { getVisibleSectionForCopy } from '../clipboard/visibleSection.js';
import { getExactMatchTargetId, isValidMatchRange } from '../search/exactMatch.js';

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
    matchRegions = [],
    activeExactMatchId = '',
  } = {}
) {
  const sectionMatchRegions = getSectionMatchRegions(section, matchRegions);
  const sourceSection = getSourceSection(sectionMatchRegions, allSections);
  const article = document.createElement('article');
  article.className = `section-card section-card--${section.priority}`;
  article.id = section.id;

  const header = document.createElement('div');
  header.className = 'section-card__header';

  const title = document.createElement('h2');
  title.append(renderMatchText(section.title, findRegion(sectionMatchRegions, 'section-title'), activeExactMatchId));
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
    article.append(renderFields(section.fields, { matchRegions: sectionMatchRegions, activeExactMatchId }));
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
        matchRegions: sectionMatchRegions,
        sourceSection,
        activeExactMatchId,
      })
    );
  }

  if (section.chart) {
    article.append(renderChart(section.chart, { matchRegions: sectionMatchRegions, activeExactMatchId }));
  }

  if (section.raw) {
    const raw = document.createElement('div');
    raw.className = 'raw-note raw-note--wrap';
    raw.append(renderMatchText(section.raw, findRegion(sectionMatchRegions, 'text'), activeExactMatchId));
    article.append(raw);
  }

  return article;
}

function getSectionMatchRegions(section, matchRegions) {
  if (!Array.isArray(matchRegions)) return [];

  return matchRegions.flatMap((region, regionIndex) =>
    region?.sectionId === section.id
      ? [{ ...region, regionIndex }]
      : []
  );
}

function getSourceSection(sectionMatchRegions, allSections) {
  const sectionIndex = sectionMatchRegions[0]?.sectionIndex;
  return Number.isInteger(sectionIndex) ? allSections[sectionIndex] ?? null : null;
}

function findRegion(matchRegions, kind, matches = {}) {
  return matchRegions.find((region) =>
    region.kind === kind && Object.entries(matches).every(([key, value]) => region[key] === value)
  ) ?? null;
}

function renderMatchText(value, region, activeExactMatchId) {
  const text = String(value ?? '');
  if (!region?.occurrences?.length) return document.createTextNode(text);

  let cursor = 0;
  const occurrences = region.occurrences;
  if (!occurrences.every((occurrence) => {
    const valid = isValidMatchRange(occurrence, text.length) && occurrence.start >= cursor;
    if (valid) cursor = occurrence.end;
    return valid;
  })) {
    return document.createTextNode(text);
  }

  const fragment = document.createDocumentFragment();
  cursor = 0;
  occurrences.forEach((occurrence, occurrenceIndex) => {
    if (occurrence.start > cursor) fragment.append(document.createTextNode(text.slice(cursor, occurrence.start)));

    const mark = document.createElement('mark');
    const targetId = getExactMatchTargetId(region, occurrenceIndex);
    mark.className = targetId === activeExactMatchId ? 'exact-match exact-match--active' : 'exact-match';
    mark.dataset.exactMatchId = targetId;
    mark.dataset.exactMatchKind = region.kind;
    if (targetId === activeExactMatchId) mark.setAttribute('aria-current', 'true');
    mark.textContent = text.slice(occurrence.start, occurrence.end);
    fragment.append(mark);
    cursor = occurrence.end;
  });

  if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
  return fragment;
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
  return renderTable(view.rows, section.tableColumns, {
    compact: view.mode === TABLE_VIEW_MODES.compact,
    matchRegions: options.matchRegions,
    sourceSection: options.sourceSection,
    activeExactMatchId: options.activeExactMatchId,
  });
}

function renderThreadGroups(section, view, { onToggleThreadGroup, matchRegions, sourceSection, activeExactMatchId }) {
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
      groupElement.append(renderTable(group.rows, section.tableColumns, {
        matchRegions,
        sourceSection,
        activeExactMatchId,
      }));
    }
    wrapper.append(groupElement);
  }

  return wrapper;
}

function renderLimitedProcessTable(section, view, { onShowMoreRows, onShowAllRows, matchRegions, sourceSection, activeExactMatchId }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'limited-table';

  wrapper.append(renderRowCount(view.summary));
  wrapper.append(renderTable(view.rows, section.tableColumns, {
    matchRegions,
    sourceSection,
    activeExactMatchId,
  }));

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

function renderCollapsibleKextTable(section, view, { onToggleDenseTable, matchRegions, sourceSection, activeExactMatchId }) {
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
    wrapper.append(renderTable(view.rows, section.tableColumns, {
      matchRegions,
      sourceSection,
      activeExactMatchId,
    }));
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

function renderFields(fields, { matchRegions = [], activeExactMatchId = '' } = {}) {
  const dl = document.createElement('dl');
  dl.className = 'field-list';

  for (const [fieldIndex, field] of fields.entries()) {
    const dt = document.createElement('dt');
    dt.append(renderMatchText(field.label, findRegion(matchRegions, 'field-label', { fieldIndex }), activeExactMatchId));
    const dd = document.createElement('dd');
    dd.append(renderMatchText(field.value, findRegion(matchRegions, 'field-value', { fieldIndex }), activeExactMatchId));
    dl.append(dt, dd);
  }

  return dl;
}

function renderTable(rows, columns = null, {
  compact = false,
  matchRegions = [],
  sourceSection = null,
  activeExactMatchId = '',
} = {}) {
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
  for (const [columnIndex, column] of resolvedColumns.entries()) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.append(renderMatchText(
      column.label,
      findRegion(matchRegions, 'table-header', { columnIndex, columnKey: column.key }),
      activeExactMatchId
    ));
    headerRow.append(th);
  }
  thead.append(headerRow);

  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const rowIndex = Array.isArray(sourceSection?.table) ? sourceSection.table.indexOf(row) : -1;
    for (const [columnIndex, column] of resolvedColumns.entries()) {
      const td = document.createElement('td');
      td.append(renderMatchText(
        row[column.key],
        findRegion(matchRegions, 'table-cell', { rowIndex, columnIndex, columnKey: column.key }),
        activeExactMatchId
      ));
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

function renderChart(chart, { matchRegions = [], activeExactMatchId = '' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chart';
  wrapper.dataset.chartType = chart.type;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 180;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', String(chart.title ?? 'Memory chart'));
  wrapper.append(canvas);

  const caption = document.createElement('p');
  caption.className = 'chart-caption';
  caption.append(renderMatchText(
    chart.title ?? 'Memory chart',
    findRegion(matchRegions, 'chart-label', { chartIndex: 0, chartPart: 'title' }),
    activeExactMatchId
  ));
  wrapper.append(caption);

  const schedule = globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 0));
  schedule(() => drawMemoryBars(canvas, chart.items ?? [], { matchRegions, activeExactMatchId }));
  return wrapper;
}

function drawMemoryBars(canvas, items, { matchRegions = [], activeExactMatchId = '' } = {}) {
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
    drawChartText(
      context,
      item.label,
      12,
      y + 14,
      findRegion(matchRegions, 'chart-label', { chartIndex: 0, itemIndex: index, chartPart: 'item-label' }),
      '#8e8e93',
      activeExactMatchId
    );
    context.fillStyle = item.color ?? '#30d158';
    context.fillRect(labelWidth, y, width, barHeight);
    drawChartText(
      context,
      item.value,
      labelWidth + width + 8,
      y + 14,
      findRegion(matchRegions, 'chart-value', { chartIndex: 0, itemIndex: index, chartPart: 'item-value' }),
      '#f2f2f7',
      activeExactMatchId
    );
  });
}

function drawChartText(context, value, x, baseline, region, color, activeExactMatchId) {
  const text = String(value ?? '');
  const occurrences = region?.occurrences ?? [];
  let cursor = 0;
  const validOccurrences = occurrences.every((occurrence) => {
    const valid = isValidMatchRange(occurrence, text.length) && occurrence.start >= cursor;
    if (valid) cursor = occurrence.end;
    return valid;
  });

  if (validOccurrences) {
    occurrences.forEach((occurrence, occurrenceIndex) => {
      const prefixWidth = context.measureText(text.slice(0, occurrence.start)).width;
      const matchWidth = context.measureText(text.slice(occurrence.start, occurrence.end)).width;
      const targetId = getExactMatchTargetId(region, occurrenceIndex);
      const active = targetId === activeExactMatchId;
      context.fillStyle = active ? 'rgba(255, 159, 10, 0.5)' : 'rgba(255, 214, 10, 0.28)';
      context.fillRect(x + prefixWidth - 2, baseline - 15, matchWidth + 4, 18);
      if (active) {
        context.strokeStyle = '#ff9f0a';
        context.lineWidth = 2;
        context.strokeRect(x + prefixWidth - 3, baseline - 16, matchWidth + 6, 20);
      }
    });
  }

  context.fillStyle = color;
  context.fillText(text, x, baseline);
}
