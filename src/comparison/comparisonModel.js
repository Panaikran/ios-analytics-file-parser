import { createSection } from '../models/sectionModel.js';

const MIN_REPORTS = 2;
const MAX_REPORTS = 3;
const NOT_PRESENT = 'Not present';

const SUPPORTED_PARSER_TYPES = new Set([
  'accessory-crash',
  'analytics',
  'coreanalytics',
  'crash',
  'ips',
  'ips-watchdog-stackshot',
  'jetsam',
  'panic',
  'resource-cpu',
  'resource-diskwrites',
  'resource-stackshot',
]);

const ALLOWED_FIELDS = new Set([
  'Action Taken',
  'Bug Type',
  'Bundle ID',
  'Device',
  'Exception Type',
  'Limit Status',
  'OS Version',
  'Panic String',
  'Primary Reason',
  'Process',
  'Reason',
  'Report Type',
  'Signal',
  'Termination Reason',
  'Timestamp',
]);

const RECURRING_FIELDS = new Set([
  'Action Taken',
  'Exception Type',
  'Limit Status',
  'Panic String',
  'Primary Reason',
  'Reason',
  'Signal',
  'Termination Reason',
]);

const SUMMARY_FIELDS = Object.freeze({
  primarySummary: ['Primary Reason', 'Reason', 'Exception Type', 'Report Type', 'Panic String'],
  timestamp: ['Timestamp'],
  device: ['Device'],
  osVersion: ['OS Version'],
  bugType: ['Bug Type'],
});

export function validateComparison(entries) {
  if (!Array.isArray(entries)) {
    return validationFailure('malformed-entries', 'Comparison entries must be an array.', 0);
  }

  if (entries.length < MIN_REPORTS) {
    return validationFailure('too-few-reports', 'Comparison requires 2 or 3 reports.', entries.length);
  }

  if (entries.length > MAX_REPORTS) {
    return validationFailure('too-many-reports', 'Comparison requires 2 or 3 reports.', entries.length);
  }

  let parserType = null;

  for (const [index, entry] of entries.entries()) {
    const reportIndex = index + 1;

    if (!isObject(entry) || !isObject(entry.classification)) {
      return validationFailure('malformed-entry', `Report ${reportIndex} is malformed.`, entries.length, reportIndex);
    }

    const currentParserType = safeString(entry.classification.parserType);
    if (!currentParserType) {
      return validationFailure('missing-parser-type', `Report ${reportIndex} has no parser type.`, entries.length, reportIndex);
    }

    if (entry.classification.supported !== true || !SUPPORTED_PARSER_TYPES.has(currentParserType)) {
      return validationFailure('unsupported-report', `Report ${reportIndex} is not supported.`, entries.length, reportIndex);
    }

    if (!isValidSections(entry.sections)) {
      return validationFailure('invalid-sections', `Report ${reportIndex} has invalid sections.`, entries.length, reportIndex);
    }

    if (parserType === null) parserType = currentParserType;
    if (currentParserType !== parserType) {
      return validationFailure('mixed-parser-types', 'Reports must use the same parser type.', entries.length, reportIndex);
    }
  }

  return {
    valid: true,
    code: 'ok',
    message: 'Reports are compatible for comparison.',
    reportCount: entries.length,
    parserType,
    reportIndex: null,
  };
}

export function createComparisonSections(entries) {
  const validation = validateComparison(entries);
  if (!validation.valid) throw new Error(validation.message);

  const reports = entries.map((entry, index) => ({
    label: `Report ${index + 1}`,
    fields: extractFields(entry.sections),
  }));
  const fieldKeys = collectFieldKeys(reports);
  const { commonRows, differenceRows } = compareFields(reports, fieldKeys);
  const recurringRows = collectRecurringIndicators(reports, fieldKeys);

  return [
    createOverviewSection(validation),
    createSummarySection(reports),
    createCommonFieldsSection(commonRows),
    createDifferencesSection(differenceRows, reports.length),
    createRecurringIndicatorsSection(recurringRows),
    createNotesSection(),
  ];
}

function validationFailure(code, message, reportCount, reportIndex = null) {
  return {
    valid: false,
    code,
    message,
    reportCount,
    parserType: null,
    reportIndex,
  };
}

function isValidSections(sections) {
  return Array.isArray(sections) && sections.length > 0 && sections.every((section) =>
    isObject(section) &&
    safeString(section.id) &&
    safeString(section.title) &&
    (section.fields === undefined || (
      Array.isArray(section.fields) && section.fields.every((field) => isObject(field) && safeString(field.label))
    ))
  );
}

function extractFields(sections) {
  const fields = new Map();

  for (const section of sections) {
    for (const field of section.fields ?? []) {
      const label = safeString(field.label);
      const value = safeScalar(field.value);
      if (!ALLOWED_FIELDS.has(label) || value === null) continue;

      const key = `${section.id}\u0000${label}`;
      if (!fields.has(key)) {
        fields.set(key, {
          section: safeString(section.title),
          field: label,
          value,
        });
      }
    }
  }

  return fields;
}

function collectFieldKeys(reports) {
  const keys = [];
  const seen = new Set();

  for (const report of reports) {
    for (const key of report.fields.keys()) {
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }

  return keys;
}

function compareFields(reports, fieldKeys) {
  const commonRows = [];
  const differenceRows = [];

  for (const key of fieldKeys) {
    const firstField = reports.find((report) => report.fields.has(key)).fields.get(key);
    const values = reports.map((report) => report.fields.get(key)?.value ?? null);
    const presentValues = values.filter((value) => value !== null);
    const allPresent = presentValues.length === reports.length;
    const allEqual = allPresent && presentValues.every((value) => normalize(value) === normalize(presentValues[0]));

    if (allEqual) {
      commonRows.push({
        section: firstField.section,
        field: firstField.field,
        value: presentValues[0],
      });
      continue;
    }

    const row = {
      section: firstField.section,
      field: firstField.field,
    };
    values.forEach((value, index) => {
      row[`report${index + 1}`] = value ?? NOT_PRESENT;
    });
    row.status = allPresent ? 'Changed' : 'Missing';
    differenceRows.push(row);
  }

  return { commonRows, differenceRows };
}

function collectRecurringIndicators(reports, fieldKeys) {
  const rows = [];

  for (const key of fieldKeys) {
    const firstField = reports.find((report) => report.fields.has(key)).fields.get(key);
    if (!RECURRING_FIELDS.has(firstField.field)) continue;

    const groups = new Map();
    reports.forEach((report, index) => {
      const field = report.fields.get(key);
      if (!field) return;

      const normalized = normalize(field.value);
      const group = groups.get(normalized) ?? { value: field.value, reports: [] };
      group.reports.push(`Report ${index + 1}`);
      groups.set(normalized, group);
    });

    for (const group of groups.values()) {
      if (group.reports.length < 2) continue;
      rows.push({
        indicator: firstField.field,
        value: group.value,
        reports: group.reports.join(', '),
      });
    }
  }

  return rows;
}

function createOverviewSection(validation) {
  return createSection({
    id: 'comparison-overview',
    title: 'Comparison Overview',
    fields: [
      { label: 'Report Count', value: String(validation.reportCount) },
      { label: 'Parser Type', value: validation.parserType },
      { label: 'Comparison Mode', value: 'Sanitized only' },
      { label: 'Ordering', value: 'Insertion order' },
    ],
  });
}

function createSummarySection(reports) {
  const rows = reports.map((report) => ({
    report: report.label,
    primarySummary: findFieldValue(report.fields, SUMMARY_FIELDS.primarySummary),
    timestamp: findFieldValue(report.fields, SUMMARY_FIELDS.timestamp),
    device: findFieldValue(report.fields, SUMMARY_FIELDS.device),
    osVersion: findFieldValue(report.fields, SUMMARY_FIELDS.osVersion),
    bugType: findFieldValue(report.fields, SUMMARY_FIELDS.bugType),
  }));

  return createSection({
    id: 'comparison-report-summaries',
    title: 'Report Summaries',
    table: rows,
    tableColumns: [
      { key: 'report', label: 'Report' },
      { key: 'primarySummary', label: 'Primary Summary' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'device', label: 'Device' },
      { key: 'osVersion', label: 'OS Version' },
      { key: 'bugType', label: 'Bug Type' },
    ],
    tableSummary: `${rows.length} reports shown`,
  });
}

function createCommonFieldsSection(rows) {
  return createSection({
    id: 'comparison-common-fields',
    title: 'Common Fields',
    table: rows,
    tableColumns: [
      { key: 'section', label: 'Section' },
      { key: 'field', label: 'Field' },
      { key: 'value', label: 'Common Value' },
    ],
    tableSummary: `${rows.length} common fields`,
  });
}

function createDifferencesSection(rows, reportCount) {
  const reportColumns = Array.from({ length: reportCount }, (_, index) => ({
    key: `report${index + 1}`,
    label: `Report ${index + 1}`,
  }));

  return createSection({
    id: 'comparison-differences',
    title: 'Differences',
    priority: rows.length ? 'warning' : 'info',
    table: rows,
    tableColumns: [
      { key: 'section', label: 'Section' },
      { key: 'field', label: 'Field' },
      ...reportColumns,
      { key: 'status', label: 'Status' },
    ],
    tableSummary: `${rows.length} differing fields`,
  });
}

function createRecurringIndicatorsSection(rows) {
  return createSection({
    id: 'comparison-recurring-indicators',
    title: 'Recurring Indicators',
    table: rows,
    tableColumns: [
      { key: 'indicator', label: 'Indicator' },
      { key: 'value', label: 'Value' },
      { key: 'reports', label: 'Reports' },
    ],
    tableSummary: `${rows.length} recurring indicators`,
  });
}

function createNotesSection() {
  return createSection({
    id: 'comparison-notes',
    title: 'Comparison Notes',
    fields: [
      { label: 'Privacy', value: 'Comparison uses sanitized parsed sections only.' },
      { label: 'Ordering', value: 'Reports remain in insertion order.' },
      { label: 'Matching', value: 'Recurring indicators use exact normalized equality.' },
      { label: 'Diagnosis', value: 'Comparison does not infer a root cause.' },
    ],
  });
}

function findFieldValue(fields, labels) {
  for (const label of labels) {
    for (const field of fields.values()) {
      if (field.field === label) return field.value;
    }
  }
  return NOT_PRESENT;
}

function safeScalar(value) {
  if (!['string', 'number', 'boolean'].includes(typeof value)) return null;
  const text = String(value).trim().replace(/\s+/g, ' ');
  return text || null;
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(value) {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
