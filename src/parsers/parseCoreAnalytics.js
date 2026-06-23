import { createSection } from '../models/sectionModel.js';
import { createSanitizer } from '../privacy/sanitize.js';

const DISPLAY_ROW_LIMIT = 100;
const SENSITIVE_KEYS = new Set(['incident_id', 'deviceId', 'uuid', 'configUuid', 'sessionId']);

export function parseCoreAnalytics(text, options = {}) {
  const sanitizeText = createSanitizer(options);
  const parsed = parseLines(text);
  const metadata = parsed.records[0]?.value ?? {};
  const config = findConfigurationRecord(parsed.records.map((record) => record.value));
  const eventRecords = parsed.records
    .map((record) => ({ ...record.value, rowNumber: record.rowNumber }))
    .filter(isEventRecord);
  const groupedEvents = groupEventRecords(eventRecords);

  return [
    createSection({
      id: 'coreanalytics-summary',
      title: 'CoreAnalytics Summary',
      priority: 'info',
      fields: compactFields(
        [
          ['Bug Type', metadata.bug_type],
          ['Timestamp', metadata.timestamp],
          ['OS Version', metadata.os_version],
          ['Roots Installed', metadata.roots_installed],
          ['Incident ID', formatSensitiveValue('incident_id', metadata.incident_id, options, sanitizeText)],
          ['Total Records', parsed.totalRecords],
          ['Parsed Records', parsed.records.length],
          ['Invalid Records', parsed.invalidLines.length],
        ],
        sanitizeText
      ),
    }),
    createSection({
      id: 'coreanalytics-configuration',
      title: 'CoreAnalytics Configuration',
      priority: 'info',
      fields: compactFields(
        [
          ['Marker', config?._marker],
          ['Config DB Version', config?.configDbVersion],
          ['Config UUID', formatSensitiveValue('configUuid', config?.configUuid, options, sanitizeText)],
          ['Session ID', formatSensitiveValue('sessionId', config?.sessionId, options, sanitizeText)],
          ['Rollover Reason', config?.rolloverReason],
          ['State DB Type', config?.stateDbType],
          ['State DB Version', config?.stateDbVersion],
        ],
        sanitizeText
      ),
    }),
    createSection({
      id: 'coreanalytics-record-overview',
      title: 'CoreAnalytics Record Overview',
      priority: 'info',
      fields: compactFields(
        [
          ['Total event records', eventRecords.length],
          ['Unique message count', new Set(eventRecords.map((record) => record.message).filter(Boolean)).size],
          ['Unique name count', new Set(eventRecords.map((record) => record.name).filter(Boolean)).size],
          ['Aggregation periods observed', joinUnique(eventRecords.map((record) => record.aggregationPeriod))],
          ['Sampling values observed', joinUnique(eventRecords.map((record) => record.sampling))],
        ],
        sanitizeText
      ),
    }),
    createSection({
      id: 'coreanalytics-event-types',
      title: 'CoreAnalytics Event Types',
      priority: 'info',
      tableColumns: [
        { key: 'message', label: 'Message' },
        { key: 'name', label: 'Name' },
        { key: 'count', label: 'Count' },
        { key: 'aggregationPeriod', label: 'Aggregation Period' },
        { key: 'sampling', label: 'Sampling' },
      ],
      table: groupedEvents.slice(0, DISPLAY_ROW_LIMIT).map((event) => sanitizeRow(event, sanitizeText)),
      tableSummary: `${Math.min(groupedEvents.length, DISPLAY_ROW_LIMIT)} of ${groupedEvents.length} event groups shown`,
    }),
    createSection({
      id: 'coreanalytics-sample-records',
      title: 'CoreAnalytics Sample Records',
      priority: 'info',
      tableColumns: [
        { key: 'rowNumber', label: 'Row' },
        { key: 'message', label: 'Message' },
        { key: 'name', label: 'Name' },
        { key: 'aggregationPeriod', label: 'Aggregation Period' },
        { key: 'numDaysAggregated', label: 'Days Aggregated' },
        { key: 'sampling', label: 'Sampling' },
      ],
      table: eventRecords.slice(0, DISPLAY_ROW_LIMIT).map((record) =>
        sanitizeRow(
          {
            rowNumber: record.rowNumber,
            message: record.message,
            name: record.name,
            aggregationPeriod: record.aggregationPeriod,
            numDaysAggregated: record.numDaysAggregated,
            sampling: record.sampling,
          },
          sanitizeText
        )
      ),
      tableSummary: `${Math.min(eventRecords.length, DISPLAY_ROW_LIMIT)} of ${eventRecords.length} event records shown`,
    }),
    createSection({
      id: 'coreanalytics-parser-notes',
      title: 'CoreAnalytics Parser Notes',
      priority: parsed.invalidLines.length ? 'warning' : 'info',
      fields: compactFields(
        [
          ['Invalid Lines', `${parsed.invalidLines.length} invalid line${parsed.invalidLines.length === 1 ? '' : 's'} ignored`],
          ['Row Caps', `Rendered event-group and sample tables are capped at ${DISPLAY_ROW_LIMIT} rows`],
          ['Privacy', 'Identifier-heavy raw fields are omitted/redacted in sanitized mode'],
        ],
        sanitizeText
      ),
    }),
  ];
}

function parseLines(text) {
  const lines = String(text ?? '').split(/\r?\n/).filter((line) => line.trim());
  const records = [];
  const invalidLines = [];

  lines.forEach((line, index) => {
    try {
      records.push({ rowNumber: index + 1, value: JSON.parse(line) });
    } catch {
      invalidLines.push(index + 1);
    }
  });

  return {
    totalRecords: lines.length,
    records,
    invalidLines,
  };
}

function findConfigurationRecord(records) {
  return records.find((record) => record && typeof record === 'object' && (record.configUuid || record.sessionId || record.configDbVersion)) ?? {};
}

function isEventRecord(record) {
  return Boolean(
    record &&
      typeof record === 'object' &&
      (record.message || record.name) &&
      (record.aggregationPeriod || record.sampling || record.numDaysAggregated !== undefined)
  );
}

function groupEventRecords(records) {
  const groups = new Map();

  for (const record of records) {
    const key = [record.message ?? '', record.name ?? '', record.aggregationPeriod ?? '', record.sampling ?? ''].join('\u001f');
    const existing =
      groups.get(key) ??
      {
        message: record.message ?? '',
        name: record.name ?? '',
        count: 0,
        aggregationPeriod: record.aggregationPeriod ?? '',
        sampling: record.sampling ?? '',
      };
    existing.count += 1;
    groups.set(key, existing);
  }

  return [...groups.values()]
    .sort((left, right) => right.count - left.count || String(left.message).localeCompare(String(right.message)))
    .map((group) => ({ ...group, count: String(group.count) }));
}

function formatSensitiveValue(key, value, options, sanitizeText) {
  if (value === undefined || value === null || value === '') return '';
  if (options.sanitize === false) return String(value);
  if (SENSITIVE_KEYS.has(key)) return '[identifier redacted]';
  return sanitizeText(value);
}

function compactFields(entries, sanitizeText) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value: sanitizeText(String(value)) }));
}

function joinUnique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== '').map(String))].join(', ');
}

function sanitizeRow(row, sanitizeText) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeText(String(value ?? ''))]));
}
