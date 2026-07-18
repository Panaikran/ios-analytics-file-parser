import { createSection } from '../models/sectionModel.js';

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 });

const BATTERY_METRICS = [
  { key: 'maximumCapacityPercent', label: 'Maximum Capacity', unit: 'percent', validate: isPercentage },
  { key: 'cycleCount', label: 'Cycle Count', unit: 'cycles', validate: isCycleCount },
  { key: 'maximumFcc', label: 'Maximum FCC', unit: 'mAh', validate: isPositiveNumber },
  { key: 'nominalChargeCapacity', label: 'Nominal Charge Capacity', unit: 'mAh', validate: isPositiveNumber },
  { key: 'rawMaximumCapacity', label: 'Raw Maximum Capacity', unit: 'mAh', validate: isPositiveNumber },
  { key: 'maximumQmax', label: 'Maximum Qmax', unit: 'mAh', validate: isPositiveNumber },
];

export function createBatterySection(batteryModel) {
  if (!isRecord(batteryModel)) return null;

  const fields = [];
  for (const definition of BATTERY_METRICS) {
    const property = readOwnDataProperty(batteryModel, definition.key);
    if (property.kind !== 'data') continue;
    const field = createMetricField(property.value, definition);
    if (field) fields.push(field);
  }

  const qmaxProperty = readOwnDataProperty(batteryModel, 'qmaxCells');
  if (qmaxProperty.kind === 'data') fields.push(...createQmaxFields(qmaxProperty.value));
  if (!fields.length) return null;

  return createSection({
    id: 'battery-and-charging',
    title: 'Battery and Charging',
    priority: 'info',
    fields,
  });
}

function createMetricField(metric, definition) {
  if (!isRecord(metric)) return null;
  const value = readOwnDataProperty(metric, 'value');
  const unit = readOwnDataProperty(metric, 'unit');
  const origin = readOwnDataProperty(metric, 'origin');
  if (
    value.kind !== 'data'
    || unit.kind !== 'data'
    || origin.kind !== 'data'
    || unit.value !== definition.unit
    || origin.value !== 'direct'
    || !definition.validate(value.value)
  ) return null;

  return {
    label: definition.label,
    value: formatValue(value.value, definition.unit),
  };
}

function createQmaxFields(cells) {
  if (!Array.isArray(cells)) return [];

  const validCells = new Map();
  const conflictingCells = new Set();
  for (const metric of cells) {
    if (!isRecord(metric)) continue;
    const cell = readOwnDataProperty(metric, 'cell');
    if (cell.kind !== 'data' || !isCellIndex(cell.value)) continue;
    if (conflictingCells.has(cell.value)) continue;

    const field = createMetricField(metric, { unit: 'mAh', validate: isPositiveNumber });
    if (!field) continue;
    const value = readOwnDataProperty(metric, 'value');
    if (value.kind !== 'data') continue;

    const existing = validCells.get(cell.value);
    if (!existing) {
      validCells.set(cell.value, { field, value: value.value });
    } else if (existing.value !== value.value) {
      validCells.delete(cell.value);
      conflictingCells.add(cell.value);
    }
  }

  return [...validCells.entries()]
    .sort(([left], [right]) => left - right)
    .map(([cell, { field }]) => ({
      label: `Cell ${cell} Qmax`,
      value: field.value,
    }));
}

function formatValue(value, unit) {
  const formatted = NUMBER_FORMATTER.format(value === 0 ? 0 : value);
  return unit === 'percent' ? `${formatted}%` : `${formatted} ${unit}`;
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

function isCellIndex(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
