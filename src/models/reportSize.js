export const REPORT_SIZE_LEVELS = Object.freeze({
  empty: 'empty',
  small: 'small',
  medium: 'medium',
  large: 'large',
});

export const REPORT_SIZE_THRESHOLDS = Object.freeze({
  tableRows: Object.freeze({ medium: 100, large: 500 }),
  fields: Object.freeze({ medium: 25, large: 100 }),
  rawCharacters: Object.freeze({ medium: 10_000, large: 100_000 }),
  chartItems: Object.freeze({ medium: 100, large: 500 }),
  sections: Object.freeze({ medium: 12, large: 30 }),
});

const METRIC_LABELS = Object.freeze({
  tableRows: 'table rows',
  fields: 'fields',
  rawCharacters: 'raw characters',
  chartItems: 'chart items',
  sections: 'sections',
});

export function getSectionSizeMetrics(section) {
  return {
    tableRows: Array.isArray(section?.table) ? section.table.length : 0,
    fields: Array.isArray(section?.fields) ? section.fields.length : 0,
    rawCharacters: typeof section?.raw === 'string' ? section.raw.length : 0,
    chartItems: Array.isArray(section?.chart?.items) ? section.chart.items.length : 0,
  };
}

export function summarizeSectionSize(section, thresholds = REPORT_SIZE_THRESHOLDS) {
  const metrics = getSectionSizeMetrics(section);
  const level = classifyMetrics(metrics, thresholds);

  return {
    id: typeof section?.id === 'string' ? section.id : '',
    title: typeof section?.title === 'string' ? section.title : '',
    level,
    isLarge: level === REPORT_SIZE_LEVELS.large,
    metrics,
    reasons: createReasons(metrics, thresholds),
  };
}

export function isLargeSection(section, thresholds = REPORT_SIZE_THRESHOLDS) {
  return summarizeSectionSize(section, thresholds).isLarge;
}

export function getReportSizeMetrics(sections) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const totals = {
    sections: safeSections.length,
    tableRows: 0,
    fields: 0,
    rawCharacters: 0,
    chartItems: 0,
  };

  for (const section of safeSections) {
    const metrics = getSectionSizeMetrics(section);
    totals.tableRows += metrics.tableRows;
    totals.fields += metrics.fields;
    totals.rawCharacters += metrics.rawCharacters;
    totals.chartItems += metrics.chartItems;
  }

  return totals;
}

export function summarizeReportSize(sections, thresholds = REPORT_SIZE_THRESHOLDS) {
  const safeSections = Array.isArray(sections) ? sections : [];
  const metrics = getReportSizeMetrics(safeSections);
  const sectionSummaries = safeSections.map((section) => summarizeSectionSize(section, thresholds));
  const sectionLargeCount = sectionSummaries.filter((summary) => summary.level === REPORT_SIZE_LEVELS.large).length;
  const sectionMediumCount = sectionSummaries.filter((summary) => summary.level === REPORT_SIZE_LEVELS.medium).length;
  const level = classifyMetrics(metrics, thresholds);

  return {
    level,
    isLarge: level === REPORT_SIZE_LEVELS.large || sectionLargeCount > 0,
    metrics,
    sectionLargeCount,
    sectionMediumCount,
    sectionSummaries,
    reasons: createReasons(metrics, thresholds),
  };
}

export function isLargeReport(sections, thresholds = REPORT_SIZE_THRESHOLDS) {
  return summarizeReportSize(sections, thresholds).isLarge;
}

function classifyMetrics(metrics, thresholds) {
  const entries = Object.entries(metrics ?? {});
  if (entries.every(([, value]) => !isPositiveCount(value))) return REPORT_SIZE_LEVELS.empty;

  if (entries.some(([key, value]) => meetsThreshold(value, thresholds?.[key]?.large))) {
    return REPORT_SIZE_LEVELS.large;
  }

  if (entries.some(([key, value]) => meetsThreshold(value, thresholds?.[key]?.medium))) {
    return REPORT_SIZE_LEVELS.medium;
  }

  return REPORT_SIZE_LEVELS.small;
}

function createReasons(metrics, thresholds) {
  return Object.entries(metrics ?? {})
    .filter(([key, value]) => meetsThreshold(value, thresholds?.[key]?.medium))
    .map(([key, value]) => {
      const threshold = thresholds[key];
      const level = meetsThreshold(value, threshold.large) ? REPORT_SIZE_LEVELS.large : REPORT_SIZE_LEVELS.medium;
      return {
        metric: key,
        label: METRIC_LABELS[key] ?? key,
        value,
        level,
        threshold: threshold[level],
      };
    });
}

function meetsThreshold(value, threshold) {
  return isPositiveCount(value) && Number.isFinite(threshold) && value >= threshold;
}

function isPositiveCount(value) {
  return Number.isFinite(value) && value > 0;
}
