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
    if (!hasOwn(batteryModel, definition.key)) continue;
    const field = createMetricField(batteryModel[definition.key], definition);
    if (field) fields.push(field);
  }

  if (hasOwn(batteryModel, 'qmaxCells')) fields.push(...createQmaxFields(batteryModel.qmaxCells));
  if (!fields.length) return null;

  return createSection({
    id: 'battery-and-charging',
    title: 'Battery and Charging',
    priority: 'info',
    fields,
  });
}

function createMetricField(metric, definition) {
  if (
    !isRecord(metric)
    || !hasOwn(metric, 'unit')
    || !hasOwn(metric, 'origin')
    || metric.unit !== definition.unit
    || metric.origin !== 'direct'
  ) return null;
  if (!hasOwn(metric, 'value') || !definition.validate(metric.value)) return null;

  return {
    label: definition.label,
    value: formatValue(metric.value, definition.unit),
  };
}

function createQmaxFields(cells) {
  if (!Array.isArray(cells)) return [];

  const validCells = new Map();
  const conflictingCells = new Set();
  for (const metric of cells) {
    if (!isRecord(metric) || !hasOwn(metric, 'cell') || !isCellIndex(metric.cell)) continue;
    if (conflictingCells.has(metric.cell)) continue;

    const field = createMetricField(metric, { unit: 'mAh', validate: isPositiveNumber });
    if (!field) continue;

    const existing = validCells.get(metric.cell);
    if (!existing) {
      validCells.set(metric.cell, { field, value: metric.value });
    } else if (existing.value !== metric.value) {
      validCells.delete(metric.cell);
      conflictingCells.add(metric.cell);
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

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
