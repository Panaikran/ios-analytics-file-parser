const SUMMARY_LABELS = Object.freeze([
  'Bug Type',
  'Timestamp',
  'OS Version',
  'Total Records',
  'Parsed Records',
  'Invalid Records',
]);

const FACET_LABELS = Object.freeze({
  message: 'Top Messages',
  name: 'Top Names',
  aggregationPeriod: 'Aggregation Periods',
  sampling: 'Sampling Values',
});

export function renderCoreAnalyticsOverview(
  view,
  {
    searchActive = false,
    facetOptions = null,
    onSelectFacet = null,
    selectedFacetQuery = '',
    headingLevel = 2,
  } = {}
) {
  if (!view?.isCoreAnalytics) return null;

  const article = document.createElement('article');
  article.className = 'coreanalytics-overview';
  article.setAttribute('aria-labelledby', 'coreanalytics-overview-title');

  const title = document.createElement(`h${headingLevel}`);
  title.id = 'coreanalytics-overview-title';
  title.textContent = 'CoreAnalytics Overview';
  article.append(title);

  if (searchActive) {
    const searchNote = document.createElement('p');
    searchNote.className = 'coreanalytics-overview__note';
    searchNote.textContent = 'Overview hidden while search is active.';
    article.append(searchNote);

    if (!Array.isArray(facetOptions)) return article;
    article.append(renderFacetGroups(view, {
      facetOptions,
      onSelectFacet,
      selectedFacetQuery,
      headingLevel: headingLevel + 1,
    }));
    return article;
  }

  const intro = document.createElement('p');
  intro.className = 'coreanalytics-overview__intro';
  intro.textContent = 'Tables show rendered capped rows only. Full raw JSON bodies are not rendered.';
  article.append(intro);

  const metrics = createMetrics(view);
  if (metrics.length) {
    article.append(renderMetricGrid(metrics));
  }

  article.append(renderTableCounts(view));
  article.append(renderFacetGroups(view, {
    facetOptions,
    onSelectFacet,
    selectedFacetQuery,
    headingLevel: headingLevel + 1,
  }));

  const notes = createNotes(view);
  if (notes.length) {
    article.append(renderNotes(notes, { headingLevel: headingLevel + 1 }));
  }

  return article;
}

function createMetrics(view) {
  const summary = view.fields?.summary?.byLabel ?? {};
  const overview = view.fields?.recordOverview?.byLabel ?? {};
  const metrics = SUMMARY_LABELS.flatMap((label) => metricFromValue(label, summary[label]));

  return [
    ...metrics,
    ...metricFromValue('Event Records', overview['Total event records']),
  ];
}

function metricFromValue(label, value) {
  const text = String(value ?? '').trim();
  return text ? [{ label, value: text }] : [];
}

function renderMetricGrid(metrics) {
  const list = document.createElement('dl');
  list.className = 'coreanalytics-overview__metrics';

  for (const metric of metrics) {
    const item = document.createElement('div');
    item.className = 'coreanalytics-overview__metric';

    const label = document.createElement('dt');
    label.textContent = metric.label;

    const value = document.createElement('dd');
    value.textContent = metric.value;

    item.append(label, value);
    list.append(item);
  }

  return list;
}

function renderTableCounts(view) {
  const fragment = document.createDocumentFragment();
  const list = document.createElement('dl');
  list.className = 'coreanalytics-overview__table-counts';

  list.append(
    renderTableCount('Event Groups', view.tables?.eventTypes),
    renderTableCount('Sample Records', view.tables?.sampleRecords)
  );

  const hasCap = Boolean(view.tables?.eventTypes?.capped || view.tables?.sampleRecords?.capped);
  const note = document.createElement('p');
  note.className = hasCap
    ? 'coreanalytics-overview__warning'
    : 'coreanalytics-overview__note';
  note.textContent = hasCap
    ? 'Capped table. Search and copy operate on rendered rows only.'
    : 'All rendered CoreAnalytics rows are shown for this section.';
  fragment.append(list, note);

  return fragment;
}

function renderTableCount(label, table) {
  const item = document.createElement('div');
  item.className = 'coreanalytics-overview__table-count';

  const heading = document.createElement('dt');
  heading.textContent = label;

  const count = document.createElement('dd');
  const counts = table?.counts;
  count.textContent = counts?.known
    ? `${counts.shown} of ${counts.total} shown`
    : `${table?.rows?.length ?? 0} shown`;

  item.append(heading, count);
  return item;
}

function renderFacetGroups(
  view,
  { facetOptions = null, onSelectFacet = null, selectedFacetQuery = '', headingLevel = 3 } = {}
) {
  const wrapper = document.createElement('section');
  wrapper.className = 'coreanalytics-overview__facets';
  wrapper.setAttribute('aria-label', 'Rendered row facets');

  const note = document.createElement('p');
  note.className = 'coreanalytics-overview__note';
  note.textContent = 'Facets are based on rendered rows only.';
  wrapper.append(note);

  const groups = Array.isArray(facetOptions)
    ? facetOptions.map((group) => ({ key: group.key, label: group.label, values: group.options }))
    : Object.entries(FACET_LABELS).map(([key, label]) => ({ key, label, values: view.facets?.values?.[key] ?? [] }));

  for (const { label, values } of groups) {
    if (!values.length) continue;

    const group = document.createElement('div');
    group.className = 'coreanalytics-overview__facet-group';

    const heading = document.createElement(`h${headingLevel}`);
    heading.textContent = label;

    const chips = document.createElement('div');
    chips.className = 'coreanalytics-overview__chips';

    const renderedValues = Array.isArray(facetOptions) ? values : values.slice(0, 6);
    for (const item of renderedValues) {
      const interactive = Array.isArray(facetOptions) && typeof onSelectFacet === 'function';
      const chip = document.createElement(interactive ? 'button' : 'span');
      chip.className = 'coreanalytics-overview__chip';
      chip.textContent = `${item.value} (${item.count})`;

      if (interactive) {
        chip.type = 'button';
        chip.setAttribute('aria-label', `${label}: ${item.value}, ${item.count} occurrences`);
        chip.setAttribute('aria-pressed', String(item.query === selectedFacetQuery));
        chip.addEventListener('click', () => onSelectFacet(item));
      }

      chips.append(chip);
    }

    group.append(heading, chips);
    wrapper.append(group);
  }

  return wrapper;
}

function createNotes(view) {
  return (view.warnings ?? [])
    .map((warning) => String(warning ?? '').trim())
    .filter(Boolean);
}

function renderNotes(notes, { headingLevel = 3 } = {}) {
  const section = document.createElement('section');
  section.className = 'coreanalytics-overview__notes';
  section.setAttribute('aria-label', 'CoreAnalytics parser notes');

  const heading = document.createElement(`h${headingLevel}`);
  heading.textContent = 'Parser Notes';

  const list = document.createElement('ul');
  for (const note of notes) {
    const item = document.createElement('li');
    item.textContent = note;
    list.append(item);
  }

  section.append(heading, list);
  return section;
}
