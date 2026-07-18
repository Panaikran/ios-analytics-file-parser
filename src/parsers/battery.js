export const BATTERY_EVENT_FAMILIES = Object.freeze({
  FINAL: 'BatteryConfigValueHistogramFinal_V2',
  SECONDARY: 'BatteryConfigValueHistogram_WithAllSafetyKeys_V2',
  BHUI: 'BHUI_NCC_iOSwatchOS',
});

const SOURCE_PRIORITY = new Map([
  [BATTERY_EVENT_FAMILIES.FINAL, 3],
  [BATTERY_EVENT_FAMILIES.SECONDARY, 2],
  [BATTERY_EVENT_FAMILIES.BHUI, 1],
]);
const SNAPSHOT_FAMILIES = new Set([BATTERY_EVENT_FAMILIES.FINAL, BATTERY_EVENT_FAMILIES.SECONDARY]);
const METADATA_KEYS = ['aggregationPeriod', 'numDaysAggregated', 'sampling'];
const BATTERY_MODEL_KEY = Symbol('normalizedBattery');
const SANITIZED_BATTERY_PROPERTY = 'battery';

const FIELD_DEFINITIONS = [
  { field: 'last_value_CycleCount', normalized: 'cycleCount', unit: 'cycles', confidence: 'high', families: SNAPSHOT_FAMILIES, validate: isCycleCount },
  { field: 'last_value_MaximumFCC', normalized: 'maximumFcc', unit: 'mAh', confidence: 'medium', families: SNAPSHOT_FAMILIES, validate: isPositiveNumber },
  { field: 'last_value_NominalChargeCapacity', normalized: 'nominalChargeCapacity', unit: 'mAh', confidence: 'medium', families: SNAPSHOT_FAMILIES, validate: isPositiveNumber },
  { field: 'last_value_AppleRawMaxCapacity', normalized: 'rawMaximumCapacity', unit: 'mAh', confidence: 'medium', families: SNAPSHOT_FAMILIES, validate: isPositiveNumber },
  { field: 'last_value_MaximumCapacityPercent', normalized: 'maximumCapacityPercent', unit: 'percent', confidence: 'high', families: SNAPSHOT_FAMILIES, validate: isPercentage },
  { field: 'last_value_MaximumQmax', normalized: 'maximumQmax', unit: 'mAh', confidence: 'medium', families: SNAPSHOT_FAMILIES, validate: isPositiveNumber },
  { field: 'last_value_QmaxCell0', normalized: 'qmaxCells', unit: 'mAh', confidence: 'medium', families: SNAPSHOT_FAMILIES, cell: 0, validate: isPositiveNumber },
  { field: 'maximumCapacityPercent', normalized: 'maximumCapacityPercent', unit: 'percent', confidence: 'medium', families: new Set([BATTERY_EVENT_FAMILIES.BHUI]), validate: isPercentage },
];
const NORMALIZED_FIELD_ORDER = [
  'maximumCapacityPercent',
  'cycleCount',
  'maximumFcc',
  'nominalChargeCapacity',
  'rawMaximumCapacity',
  'maximumQmax',
  'qmaxCells',
];

export function extractNormalizedBattery(records) {
  if (!Array.isArray(records)) return null;

  const observations = [];
  const familyRecords = new Map([...SOURCE_PRIORITY.keys()].map((family) => [family, []]));

  records.forEach((record) => {
    const familyProperty = readOwnDataProperty(record, 'name');
    const payloadProperty = readOwnDataProperty(record, 'message');
    const family = familyProperty.kind === 'data' ? familyProperty.value : undefined;
    const payload = payloadProperty.kind === 'data' ? payloadProperty.value : undefined;
    if (!SOURCE_PRIORITY.has(family) || !isRecord(payload)) return;

    const recordInfo = { family, metadata: getMetadata(record) };
    familyRecords.get(family).push(recordInfo);

    for (const definition of FIELD_DEFINITIONS) {
      if (!definition.families.has(family)) continue;
      const property = readOwnDataProperty(payload, definition.field);
      if (property.kind !== 'data') continue;
      const value = property.value;
      if (!definition.validate(value)) continue;
      observations.push({
        normalized: definition.normalized,
        value,
        unit: definition.unit,
        confidence: definition.confidence,
        sourceFamily: family,
        cell: definition.cell,
        metadata: recordInfo.metadata,
      });
    }
  });

  if (!observations.length) return null;

  const normalized = {};
  const conflicts = [];
  for (const field of NORMALIZED_FIELD_ORDER) {
    const candidates = observations.filter((observation) => observation.normalized === field);
    if (!candidates.length) continue;

    const result = resolveCandidates(field, candidates, familyRecords);
    if (result.conflict) conflicts.push(result.conflict);
    if (!result.selected) continue;

    const metric = createMetric(result.selected, result.confidence);
    if (field === 'qmaxCells') {
      normalized.qmaxCells = [metric];
    } else {
      normalized[field] = metric;
    }
  }

  if (conflicts.length) normalized.conflicts = conflicts;
  return Object.keys(normalized).length ? normalized : null;
}

export function attachNormalizedBattery(sections, battery) {
  if (!Array.isArray(sections)) return sections;
  Object.defineProperty(sections, BATTERY_MODEL_KEY, {
    configurable: false,
    enumerable: false,
    value: battery ?? null,
    writable: false,
  });
  return sections;
}

export function getNormalizedBattery(sections) {
  return Array.isArray(sections) ? sections[BATTERY_MODEL_KEY] ?? null : null;
}

export function sanitizeBatteryForReport(normalizedBattery) {
  if (!isRecord(normalizedBattery)) return null;

  const sanitized = {};
  const definitions = [
    ['cycleCount', 'cycles', isCycleCount],
    ['maximumCapacityPercent', 'percent', isPercentage],
    ['maximumFcc', 'mAh', isPositiveNumber],
    ['nominalChargeCapacity', 'mAh', isPositiveNumber],
    ['rawMaximumCapacity', 'mAh', isPositiveNumber],
    ['maximumQmax', 'mAh', isPositiveNumber],
  ];

  for (const [field, unit, validate] of definitions) {
    const property = readOwnDataProperty(normalizedBattery, field);
    if (property.kind !== 'data') continue;
    const metric = sanitizeMetric(property.value, unit, validate);
    if (metric) sanitized[field] = metric;
  }

  const qmaxProperty = readOwnDataProperty(normalizedBattery, 'qmaxCells');
  if (qmaxProperty.kind === 'data') {
    const qmaxCells = sanitizeQmaxCells(qmaxProperty.value);
    if (qmaxCells?.length) sanitized.qmaxCells = qmaxCells;
  }

  return Object.keys(sanitized).length ? sanitized : null;
}

export function attachSanitizedBattery(sections, battery) {
  if (!Array.isArray(sections) || !isRecord(battery) || !Object.keys(battery).length) return sections;
  if (hasOwn(sections, SANITIZED_BATTERY_PROPERTY)) return sections;
  Object.defineProperty(sections, SANITIZED_BATTERY_PROPERTY, {
    configurable: false,
    enumerable: false,
    value: battery,
    writable: false,
  });
  return sections;
}

export function getSanitizedBattery(sections) {
  return Array.isArray(sections) && hasOwn(sections, SANITIZED_BATTERY_PROPERTY)
    ? sections[SANITIZED_BATTERY_PROPERTY]
    : null;
}

function resolveCandidates(field, candidates, familyRecords) {
  const distinctValues = new Set(candidates.map((candidate) => candidate.value));
  const sourceFamilies = [...new Set(candidates.map((candidate) => candidate.sourceFamily))].sort(compareFamilies);
  if (distinctValues.size === 1) {
    return { selected: selectPreferred(candidates) };
  }

  if (canPreferFinal(candidates, familyRecords)) {
    return {
      selected: selectPreferred(candidates.filter((candidate) => candidate.sourceFamily === BATTERY_EVENT_FAMILIES.FINAL)),
      confidence: 'low',
      conflict: { field, resolution: 'preferred-final', sourceFamilies },
    };
  }

  return { conflict: { field, resolution: 'suppressed', sourceFamilies } };
}

function canPreferFinal(candidates, familyRecords) {
  if (!candidates.some((candidate) => candidate.sourceFamily === BATTERY_EVENT_FAMILIES.FINAL)) return false;

  const finalRecords = familyRecords.get(BATTERY_EVENT_FAMILIES.FINAL) ?? [];
  if (finalRecords.length !== 1) return false;

  const finalMetadata = finalRecords[0].metadata;
  const secondaryRecords = familyRecords.get(BATTERY_EVENT_FAMILIES.SECONDARY) ?? [];
  return secondaryRecords.every((record) => metadataMatches(finalMetadata, record.metadata));
}

function selectPreferred(candidates) {
  return [...candidates].sort(
    (left, right) => SOURCE_PRIORITY.get(right.sourceFamily) - SOURCE_PRIORITY.get(left.sourceFamily)
  )[0];
}

function createMetric(candidate, confidence = candidate.confidence) {
  return {
    value: candidate.value,
    unit: candidate.unit,
    source: 'direct',
    confidence,
    sourceFamily: candidate.sourceFamily,
    ...(candidate.cell === undefined ? {} : { cell: candidate.cell }),
  };
}

function sanitizeMetric(metric, unit, validate) {
  if (!isRecord(metric)) return null;
  const value = readOwnDataProperty(metric, 'value');
  const metricUnit = readOwnDataProperty(metric, 'unit');
  if (value.kind !== 'data' || metricUnit.kind !== 'data') return null;
  if (metricUnit.value !== unit || !validate(value.value) || !hasDirectOrigin(metric)) return null;
  return {
    value: value.value,
    unit,
    origin: 'direct',
  };
}

function sanitizeQmaxCells(cells) {
  if (!Array.isArray(cells)) return null;

  const validCells = new Map();
  const conflictingCells = new Set();

  for (const metric of cells) {
    if (!isRecord(metric)) continue;
    const cell = readOwnDataProperty(metric, 'cell');
    if (cell.kind !== 'data' || !isCellIndex(cell.value)) continue;
    if (conflictingCells.has(cell.value)) continue;

    const sanitized = sanitizeMetric(metric, 'mAh', isPositiveNumber);
    if (!sanitized) continue;
    const cellMetric = { cell: cell.value, ...sanitized };
    const existing = validCells.get(cell.value);
    if (!existing) {
      validCells.set(cell.value, cellMetric);
    } else if (existing.value !== cellMetric.value || existing.unit !== cellMetric.unit || existing.origin !== cellMetric.origin) {
      validCells.delete(cell.value);
      conflictingCells.add(cell.value);
    }
  }

  return [...validCells.values()].sort((left, right) => left.cell - right.cell);
}

function hasDirectOrigin(metric) {
  const source = readOwnDataProperty(metric, 'source');
  const origin = readOwnDataProperty(metric, 'origin');
  return (source.kind === 'missing' || (source.kind === 'data' && source.value === 'direct')) &&
    (origin.kind === 'missing' || (origin.kind === 'data' && origin.value === 'direct'));
}

function isCellIndex(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function getMetadata(record) {
  const metadata = [];
  for (const key of METADATA_KEYS) {
    const property = readOwnDataProperty(record, key);
    if (property.kind === 'data') metadata.push([key, property.value]);
  }
  return Object.fromEntries(metadata);
}

function metadataMatches(left, right) {
  return METADATA_KEYS.every((key) => left[key] === right[key]);
}

function compareFamilies(left, right) {
  return SOURCE_PRIORITY.get(right) - SOURCE_PRIORITY.get(left);
}

function isCycleCount(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPercentage(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function readOwnDataProperty(value, key) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) return { kind: 'missing' };
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) return { kind: 'accessor' };
    return { kind: 'data', value: descriptor.value };
  } catch {
    return { kind: 'error' };
  }
}
