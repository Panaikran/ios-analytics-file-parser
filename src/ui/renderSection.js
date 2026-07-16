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
    documentPresentation = false,
    reportPresentation = false,
    comparisonPresentation = false,
    rawPresentation = false,
  } = {}
) {
  const sectionMatchRegions = getSectionMatchRegions(section, matchRegions);
  const sourceSection = getSourceSection(sectionMatchRegions, allSections);
  const article = document.createElement('article');
  article.className = `section-card section-card--${section.priority}`;
  article.id = section.id;

  const header = document.createElement('div');
  header.className = 'section-card__header';

  const headingGroup = document.createElement('div');
  headingGroup.className = 'section-card__heading-group';

  const title = document.createElement(documentPresentation ? 'h3' : 'h2');
  title.id = `${section.id}-title`;
  title.dataset.sectionHeading = 'true';
  title.append(renderMatchText(section.title, findRegion(sectionMatchRegions, 'section-title'), activeExactMatchId));
  headingGroup.append(title);

  if (reportPresentation && (section.priority === 'warning' || section.priority === 'critical')) {
    const priority = document.createElement('span');
    priority.className = `section-priority section-priority--${section.priority}`;
    priority.textContent = `${section.priority === 'critical' ? 'Critical' : 'Warning'} section`;
    headingGroup.append(priority);
  }

  header.append(headingGroup);

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
        sectionHeadingId: title.id,
        comparisonPresentation,
      })
    );
  }

  if (section.chart) {
    article.append(renderChart(section.chart, { matchRegions: sectionMatchRegions, activeExactMatchId }));
  }

  if (section.raw) {
    const raw = document.createElement(rawPresentation ? 'pre' : 'div');
    raw.className = rawPresentation
      ? 'raw-note raw-note--wrap raw-local-view__content'
      : 'raw-note raw-note--wrap';
    if (rawPresentation) {
      raw.tabIndex = 0;
      raw.setAttribute('role', 'region');
      raw.setAttribute('aria-labelledby', title.id);
    }
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
    labelledBy: options.sectionHeadingId,
    tableKey: `${section.id}-table`,
    comparisonPresentation: options.comparisonPresentation,
    rowHeaderKey: options.comparisonPresentation && section.tableColumns?.some((column) => column.key === 'field')
      ? 'field'
      : null,
  });
}

function renderThreadGroups(
  section,
  view,
  { onToggleThreadGroup, matchRegions, sourceSection, activeExactMatchId }
) {
  const wrapper = document.createElement('div');
  wrapper.className = 'thread-groups';

  for (const [groupIndex, group] of view.groups.entries()) {
    const groupElement = document.createElement('section');
    groupElement.className = 'thread-group';

    const button = document.createElement('button');
    button.className = 'thread-group__toggle';
    button.id = `${section.id}-thread-${groupIndex + 1}-toggle`;
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
        labelledBy: button.id,
        tableKey: `${section.id}-thread-${groupIndex + 1}-table`,
      }));
    }
    wrapper.append(groupElement);
  }

  return wrapper;
}

function renderLimitedProcessTable(
  section,
  view,
  { onShowMoreRows, onShowAllRows, matchRegions, sourceSection, activeExactMatchId, sectionHeadingId }
) {
  const wrapper = document.createElement('div');
  wrapper.className = 'limited-table';

  wrapper.append(renderRowCount(view.summary));
  wrapper.append(renderTable(view.rows, section.tableColumns, {
    matchRegions,
    sourceSection,
    activeExactMatchId,
    labelledBy: sectionHeadingId,
    tableKey: `${section.id}-table`,
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

function renderCollapsibleKextTable(
  section,
  view,
  { onToggleDenseTable, matchRegions, sourceSection, activeExactMatchId, sectionHeadingId }
) {
  const wrapper = document.createElement('div');
  wrapper.className = 'collapsible-table';

  const button = document.createElement('button');
  button.className = 'table-toggle';
  button.id = `${section.id}-table-toggle`;
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
      labelledBy: [sectionHeadingId, button.id].filter(Boolean).join(' '),
      tableKey: `${section.id}-table`,
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
    const row = document.createElement('div');
    row.className = 'field-row';
    const dt = document.createElement('dt');
    dt.append(renderMatchText(field.label, findRegion(matchRegions, 'field-label', { fieldIndex }), activeExactMatchId));
    const dd = document.createElement('dd');
    if (isTechnicalValue(field.value)) dd.classList.add('technical-value');
    dd.append(renderMatchText(field.value, findRegion(matchRegions, 'field-value', { fieldIndex }), activeExactMatchId));
    row.append(dt, dd);
    dl.append(row);
  }

  return dl;
}

function isTechnicalValue(value) {
  return /(?:0x[\da-f]+|\b(?:arm64e?|x86_64|EXC_[A-Z_]+|KERN_[A-Z_]+|SIG[A-Z]+)\b|\.dylib\b)/iu.test(String(value ?? ''));
}

function renderTable(rows, columns = null, {
  compact = false,
  matchRegions = [],
  sourceSection = null,
  activeExactMatchId = '',
  labelledBy = '',
  tableKey = 'report-table',
  comparisonPresentation = false,
  rowHeaderKey = null,
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
  table.className = [
    'frame-table',
    compact ? 'frame-table--compact' : '',
    comparisonPresentation ? 'frame-table--comparison' : '',
  ].filter(Boolean).join(' ');
  if (labelledBy) table.setAttribute('aria-labelledby', labelledBy);

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
      const rowHeader = rowHeaderKey ? column.key === rowHeaderKey : columnIndex === 0;
      const cell = rowHeader ? document.createElement('th') : document.createElement('td');
      if (rowHeader) cell.scope = 'row';
      cell.append(renderMatchText(
        row[column.key],
        findRegion(matchRegions, 'table-cell', { rowIndex, columnIndex, columnKey: column.key }),
        activeExactMatchId
      ));
      tr.append(cell);
    }
    tbody.append(tr);
  }

  table.append(thead, tbody);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.setAttribute('role', 'region');
  wrapper.tabIndex = 0;
  if (labelledBy) wrapper.setAttribute('aria-labelledby', labelledBy);

  const hint = document.createElement('p');
  hint.className = 'table-scroll__hint';
  hint.id = `${tableKey}-scroll-hint`;
  hint.textContent = 'Scroll horizontally to view all columns.';
  wrapper.setAttribute('aria-describedby', hint.id);
  table.setAttribute('aria-describedby', hint.id);

  wrapper.append(hint, table);
  return wrapper;
}

function renderChart(chart, { matchRegions = [], activeExactMatchId = '' } = {}) {
  const wrapper = document.createElement('figure');
  wrapper.className = 'chart';
  wrapper.dataset.chartType = chart.type;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = Math.max(180, 36 + (chart.items?.length ?? 0) * 30);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${String(chart.title ?? 'Memory chart')}. Values are listed below.`);

  const caption = document.createElement('figcaption');
  caption.className = 'chart-caption';
  caption.append(renderMatchText(
    chart.title ?? 'Memory chart',
    findRegion(matchRegions, 'chart-label', { chartIndex: 0, chartPart: 'title' }),
    activeExactMatchId
  ));

  const data = document.createElement('dl');
  data.className = 'chart-data';
  for (const [itemIndex, item] of (chart.items ?? []).entries()) {
    const row = document.createElement('div');
    row.className = 'chart-data__row';
    const label = document.createElement('dt');
    label.append(renderMatchText(
      item.label,
      findRegion(matchRegions, 'chart-label', { chartIndex: 0, itemIndex, chartPart: 'item-label' }),
      activeExactMatchId
    ));
    const value = document.createElement('dd');
    value.append(renderMatchText(
      item.value,
      findRegion(matchRegions, 'chart-value', { chartIndex: 0, itemIndex, chartPart: 'item-value' }),
      activeExactMatchId
    ));
    row.append(label, value);
    data.append(row);
  }

  wrapper.append(caption, canvas, data);

  const schedule = globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 0));
  schedule(() => drawMemoryBars(canvas, chart.items ?? [], { matchRegions, activeExactMatchId }));
  return wrapper;
}

function drawMemoryBars(canvas, items, { matchRegions = [], activeExactMatchId = '' } = {}) {
  const context = canvas.getContext('2d');
  if (!context || !items.length) return;

  const styles = getComputedStyle(canvas);
  const palette = {
    accent: styles.getPropertyValue('--color-accent').trim() || '#0066cc',
    primary: styles.getPropertyValue('--color-text-primary').trim() || '#1d1d1f',
    secondary: styles.getPropertyValue('--color-text-secondary').trim() || '#515154',
    highlight: styles.getPropertyValue('--color-search-highlight').trim() || '#fff0a8',
    highlightActive: styles.getPropertyValue('--color-search-highlight-active').trim() || '#ffd56a',
  };
  context.clearRect(0, 0, canvas.width, canvas.height);
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const barHeight = 18;
  const gap = 12;
  const labelWidth = 120;
  const valueInset = 12;

  context.font = '13px ui-monospace, SF Mono, Menlo, monospace';
  items.forEach((item, index) => {
    const y = 24 + index * (barHeight + gap);
    const valueText = String(item.value ?? '');
    const valueWidth = Math.ceil(context.measureText(valueText).width);
    const availableBarWidth = Math.max(1, canvas.width - labelWidth - valueWidth - valueInset * 2);
    const width = Math.round((availableBarWidth * item.value) / maxValue);
    context.fillStyle = palette.secondary;
    drawChartText(
      context,
      item.label,
      12,
      y + 14,
      findRegion(matchRegions, 'chart-label', { chartIndex: 0, itemIndex: index, chartPart: 'item-label' }),
      palette.secondary,
      activeExactMatchId,
      palette
    );
    context.fillStyle = palette.accent;
    context.fillRect(labelWidth, y, width, barHeight);
    drawChartText(
      context,
      valueText,
      Math.min(labelWidth + width + 8, canvas.width - valueWidth - valueInset),
      y + 14,
      findRegion(matchRegions, 'chart-value', { chartIndex: 0, itemIndex: index, chartPart: 'item-value' }),
      palette.primary,
      activeExactMatchId,
      palette
    );
  });
}

function drawChartText(context, value, x, baseline, region, color, activeExactMatchId, palette) {
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
      context.fillStyle = active ? palette.highlightActive : palette.highlight;
      context.fillRect(x + prefixWidth - 2, baseline - 15, matchWidth + 4, 18);
      if (active) {
        context.strokeStyle = palette.accent;
        context.lineWidth = 2;
        context.strokeRect(x + prefixWidth - 3, baseline - 16, matchWidth + 6, 20);
      }
    });
  }

  context.fillStyle = color;
  context.fillText(text, x, baseline);
}
