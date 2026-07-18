const FINAL_FAMILY = 'BatteryConfigValueHistogramFinal_V2';
const SECONDARY_FAMILY = 'BatteryConfigValueHistogram_WithAllSafetyKeys_V2';
const BHUI_FAMILY = 'BHUI_NCC_iOSwatchOS';

export const BATTERY_CORPUS_FAMILIES = Object.freeze({
  FINAL: FINAL_FAMILY,
  SECONDARY: SECONDARY_FAMILY,
  BHUI: BHUI_FAMILY,
});

const direct = (value, unit, extra = {}) => ({ value, unit, source: 'direct', ...extra });

const snapshot = (overrides = {}) => ({
  last_value_CycleCount: 12,
  last_value_MaximumFCC: 3000,
  last_value_NominalChargeCapacity: 2900,
  last_value_AppleRawMaxCapacity: 2950,
  last_value_MaximumCapacityPercent: 97,
  last_value_MaximumQmax: 3100,
  last_value_QmaxCell0: 3100,
  ...overrides,
});

const record = (name, message, metadata = {}) => ({
  name,
  message,
  aggregationPeriod: metadata.aggregationPeriod ?? 'Daily',
  numDaysAggregated: metadata.numDaysAggregated ?? 1,
  sampling: metadata.sampling ?? 100,
});

const expectedSnapshot = (values = {}) => ({
  maximumCapacityPercent: direct(values.maximumCapacityPercent ?? 97, 'percent', { confidence: 'high', sourceFamily: FINAL_FAMILY }),
  cycleCount: direct(values.cycleCount ?? 12, 'cycles', { confidence: 'high', sourceFamily: FINAL_FAMILY }),
  maximumFcc: direct(values.maximumFcc ?? 3000, 'mAh', { confidence: 'medium', sourceFamily: FINAL_FAMILY }),
  nominalChargeCapacity: direct(values.nominalChargeCapacity ?? 2900, 'mAh', { confidence: 'medium', sourceFamily: FINAL_FAMILY }),
  rawMaximumCapacity: direct(values.rawMaximumCapacity ?? 2950, 'mAh', { confidence: 'medium', sourceFamily: FINAL_FAMILY }),
  maximumQmax: direct(values.maximumQmax ?? 3100, 'mAh', { confidence: 'medium', sourceFamily: FINAL_FAMILY }),
  qmaxCells: [direct(values.qmaxCell0 ?? 3100, 'mAh', { confidence: 'medium', sourceFamily: FINAL_FAMILY, cell: 0 })],
});

const expectedSnapshotFromFamily = (family, values = {}) => {
  const expected = expectedSnapshot(values);
  return Object.fromEntries(
    Object.entries(expected).map(([key, value]) => [
      key,
      key === 'qmaxCells'
        ? value.map((cell) => ({ ...cell, sourceFamily: family }))
        : { ...value, sourceFamily: family },
    ])
  );
};

const expectedSanitizedSnapshot = (values = {}) => ({
  cycleCount: { value: values.cycleCount ?? 12, unit: 'cycles', origin: 'direct' },
  maximumCapacityPercent: { value: values.maximumCapacityPercent ?? 97, unit: 'percent', origin: 'direct' },
  maximumFcc: { value: values.maximumFcc ?? 3000, unit: 'mAh', origin: 'direct' },
  nominalChargeCapacity: { value: values.nominalChargeCapacity ?? 2900, unit: 'mAh', origin: 'direct' },
  rawMaximumCapacity: { value: values.rawMaximumCapacity ?? 2950, unit: 'mAh', origin: 'direct' },
  maximumQmax: { value: values.maximumQmax ?? 3100, unit: 'mAh', origin: 'direct' },
  qmaxCells: [{ cell: 0, value: values.qmaxCell0 ?? 3100, unit: 'mAh', origin: 'direct' }],
});

const rows = (...values) => values;
const noRows = rows();

const parserCase = (id, rationale, records, expected, omissions, resolution, privacyNote) => ({
  id,
  kind: 'records',
  rationale,
  input: records,
  expectedNormalized: expected.normalized,
  expectedSanitized: expected.sanitized,
  expectedVisibleRows: expected.visibleRows,
  expectedOmissions: omissions,
  expectedResolution: resolution,
  expectedSection: expected.visibleRows.length > 0,
  privacyNote,
});

const modelCase = (id, rationale, input, sanitized, visibleRows, omissions, resolution, privacyNote) => ({
  id,
  kind: 'normalized-model',
  rationale,
  input,
  expectedNormalized: input,
  expectedSanitized: sanitized,
  expectedVisibleRows: visibleRows,
  expectedOmissions: omissions,
  expectedResolution: resolution,
  expectedSection: visibleRows.length > 0,
  privacyNote,
});

const fullRows = rows(
  { label: 'Maximum Capacity', value: '97%' },
  { label: 'Cycle Count', value: '12 cycles' },
  { label: 'Maximum FCC', value: '3,000 mAh' },
  { label: 'Nominal Charge Capacity', value: '2,900 mAh' },
  { label: 'Raw Maximum Capacity', value: '2,950 mAh' },
  { label: 'Maximum Qmax', value: '3,100 mAh' },
  { label: 'Cell 0 Qmax', value: '3,100 mAh' },
);

export const BATTERY_RECORD_CASES = Object.freeze([
  parserCase(
    'full-final-snapshot',
    'baseline supported snapshot with every approved direct field',
    [record(FINAL_FAMILY, snapshot())],
    { normalized: expectedSnapshot(), sanitized: expectedSanitizedSnapshot(), visibleRows: fullRows },
    ['charging', 'RealCapacity', 'source metadata'],
    'single final snapshot is selected',
    'Synthetic values contain no report identifiers or raw record text.',
  ),
  parserCase(
    'alternate-secondary-snapshot',
    'secondary approved snapshot remains usable without the final family',
    [record(SECONDARY_FAMILY, snapshot({ last_value_MaximumCapacityPercent: 88 }))],
    {
      normalized: expectedSnapshotFromFamily(SECONDARY_FAMILY, { maximumCapacityPercent: 88 }),
      sanitized: expectedSanitizedSnapshot({ maximumCapacityPercent: 88 }),
      visibleRows: rows(
        { label: 'Maximum Capacity', value: '88%' },
        ...fullRows.slice(1),
      ),
    },
    ['charging', 'RealCapacity'],
    'secondary snapshot is the only recognized source',
    'Synthetic alternate-family record uses only approved scalar fields.',
  ),
  parserCase(
    'bhui-only',
    'supporting family contributes only its explicitly approved percentage',
    [record(BHUI_FAMILY, { maximumCapacityPercent: 88 })],
    {
      normalized: { maximumCapacityPercent: direct(88, 'percent', { confidence: 'medium', sourceFamily: BHUI_FAMILY }) },
      sanitized: { maximumCapacityPercent: { value: 88, unit: 'percent', origin: 'direct' } },
      visibleRows: rows({ label: 'Maximum Capacity', value: '88%' }),
    },
    ['cycleCount', 'capacities', 'qmaxCells', 'charging'],
    'BHUI percentage is accepted without inventing snapshot fields',
    'WatchOS-like family evidence is represented only by a synthetic percent.',
  ),
  parserCase(
    'watchos-like-partial',
    'watchOS-like naming remains partial and does not broaden field support',
    [record(BHUI_FAMILY, { maximumCapacityPercent: 0, last_value_CycleCount: 99 })],
    {
      normalized: { maximumCapacityPercent: direct(0, 'percent', { confidence: 'medium', sourceFamily: BHUI_FAMILY }) },
      sanitized: { maximumCapacityPercent: { value: 0, unit: 'percent', origin: 'direct' } },
      visibleRows: rows({ label: 'Maximum Capacity', value: '0%' }),
    },
    ['cycleCount', 'charging', 'unrecognized nested fields'],
    'only the exact BHUI field is accepted',
    'No OS or device identifier is present.',
  ),
  parserCase(
    'wireless-related-excluded',
    'charging-shaped records remain outside the battery contract',
    [record('AdapterDetails', { bucketed_Watts: 39, isWireless: true })],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['charging', 'adapter wattage', 'wireless state'],
    'unsupported charging family produces no battery model',
    'Charging fields are included only as rejected synthetic inputs.',
  ),
  parserCase(
    'final-family-only',
    'the final family is independently recognized',
    [record(FINAL_FAMILY, { last_value_CycleCount: 12 })],
    { normalized: { cycleCount: expectedSnapshot().cycleCount }, sanitized: { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' } }, visibleRows: rows({ label: 'Cycle Count', value: '12 cycles' }) },
    ['all fields except cycleCount'],
    'single approved field is retained',
    'No source metadata survives sanitization.',
  ),
  parserCase(
    'secondary-family-only',
    'the secondary family is independently recognized',
    [record(SECONDARY_FAMILY, { last_value_MaximumFCC: 3000 })],
    { normalized: { maximumFcc: { ...expectedSnapshot().maximumFcc, sourceFamily: SECONDARY_FAMILY } }, sanitized: { maximumFcc: { value: 3000, unit: 'mAh', origin: 'direct' } }, visibleRows: rows({ label: 'Maximum FCC', value: '3,000 mAh' }) },
    ['all fields except maximumFcc'],
    'single approved field is retained',
    'Synthetic capacity value has no identifying context.',
  ),
  parserCase(
    'bhui-family-only',
    'the BHUI family is independently recognized',
    [record(BHUI_FAMILY, { maximumCapacityPercent: 100 })],
    { normalized: { maximumCapacityPercent: direct(100, 'percent', { confidence: 'medium', sourceFamily: BHUI_FAMILY }) }, sanitized: { maximumCapacityPercent: { value: 100, unit: 'percent', origin: 'direct' } }, visibleRows: rows({ label: 'Maximum Capacity', value: '100%' }) },
    ['snapshot fields', 'charging'],
    'single BHUI direct percentage is retained',
    'Only a synthetic scalar is present.',
  ),
  parserCase(
    'no-recognized-family',
    'unrelated event families must not activate battery support',
    [record('PowerModesDailyEngagement', { maximumCapacityPercent: 100 })],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['all battery fields', 'PowerModesDailyEngagement'],
    'unsupported family is ignored',
    'The rejected family is synthetic and contains no real mode data.',
  ),
  parserCase(
    'recognized-family-no-approved-fields',
    'recognized family with only unknown fields must fail closed',
    [record(FINAL_FAMILY, { RealCapacity: 3000, eventFamily: 'synthetic', nested: { value: 1 } })],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['RealCapacity', 'unknown nested fields'],
    'no approved field survives',
    'RealCapacity-like input is an explicitly rejected synthetic case.',
  ),
  parserCase(
    'maximum-capacity-only',
    'a direct percentage can stand alone',
    [record(FINAL_FAMILY, { last_value_MaximumCapacityPercent: 100 })],
    { normalized: { maximumCapacityPercent: expectedSnapshot({ maximumCapacityPercent: 100 }).maximumCapacityPercent }, sanitized: { maximumCapacityPercent: { value: 100, unit: 'percent', origin: 'direct' } }, visibleRows: rows({ label: 'Maximum Capacity', value: '100%' }) },
    ['cycleCount', 'capacities', 'qmaxCells'],
    'partial safe model is presented',
    'No health interpretation is added.',
  ),
  parserCase(
    'cycle-count-only',
    'cycle count is valid without capacities',
    [record(FINAL_FAMILY, { last_value_CycleCount: 0 })],
    { normalized: { cycleCount: expectedSnapshot({ cycleCount: 0 }).cycleCount }, sanitized: { cycleCount: { value: 0, unit: 'cycles', origin: 'direct' } }, visibleRows: rows({ label: 'Cycle Count', value: '0 cycles' }) },
    ['maximumCapacityPercent', 'capacities', 'qmaxCells'],
    'zero remains a valid direct count',
    'Zero is a synthetic boundary value, not a diagnosis.',
  ),
  parserCase(
    'technical-capacities-only',
    'capacity observations remain independent direct rows',
    [record(FINAL_FAMILY, { last_value_MaximumFCC: 3000, last_value_NominalChargeCapacity: 2900, last_value_AppleRawMaxCapacity: 2950 })],
    {
      normalized: { maximumFcc: expectedSnapshot().maximumFcc, nominalChargeCapacity: expectedSnapshot().nominalChargeCapacity, rawMaximumCapacity: expectedSnapshot().rawMaximumCapacity },
      sanitized: { maximumFcc: { value: 3000, unit: 'mAh', origin: 'direct' }, nominalChargeCapacity: { value: 2900, unit: 'mAh', origin: 'direct' }, rawMaximumCapacity: { value: 2950, unit: 'mAh', origin: 'direct' } },
      visibleRows: rows(...fullRows.slice(2, 5)),
    },
    ['maximumCapacityPercent', 'cycleCount', 'maximumQmax', 'qmaxCells'],
    'no percentage is calculated from capacities',
    'Raw Maximum Capacity is the only permitted label.',
  ),
  parserCase(
    'maximum-qmax-only',
    'maximum Qmax is retained as a direct technical value',
    [record(FINAL_FAMILY, { last_value_MaximumQmax: 3100 })],
    { normalized: { maximumQmax: expectedSnapshot().maximumQmax }, sanitized: { maximumQmax: { value: 3100, unit: 'mAh', origin: 'direct' } }, visibleRows: rows({ label: 'Maximum Qmax', value: '3,100 mAh' }) },
    ['qmaxCells', 'all other fields'],
    'maximum Qmax does not invent cell rows',
    'No undocumented Qmax relationship is stated.',
  ),
  parserCase(
    'qmax-cell-zero-only',
    'cell zero is retained without a maximum Qmax field',
    [record(FINAL_FAMILY, { last_value_QmaxCell0: 3100 })],
    { normalized: { qmaxCells: expectedSnapshot().qmaxCells }, sanitized: { qmaxCells: expectedSanitizedSnapshot().qmaxCells }, visibleRows: rows({ label: 'Cell 0 Qmax', value: '3,100 mAh' }) },
    ['maximumQmax', 'all other fields'],
    'cell zero is not promoted to a total',
    'Cell index is synthetic and explicit.',
  ),
  parserCase(
    'sparse-qmax-source-shape',
    'the parser recognizes only its frozen Qmax Cell 0 field',
    [record(FINAL_FAMILY, { last_value_QmaxCell1: 3200 })],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['last_value_QmaxCell1', 'qmaxCells'],
    'unapproved Qmax aliases are ignored',
    'No new field alias is introduced from a plausible name.',
  ),
  parserCase(
    'real-capacity-like-input',
    'RealCapacity-like names are not accepted as aliases',
    [record(FINAL_FAMILY, { realCapacity: 3000, Real_Capacity: 3000, last_value_RealCapacity: 3000 })],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['realCapacity', 'Real_Capacity', 'last_value_RealCapacity'],
    'exact approved field names are required',
    'Rejected aliases contain only synthetic numeric values.',
  ),
  parserCase(
    'raw-maximum-capacity-input',
    'AppleRawMaxCapacity retains the approved research label',
    [record(FINAL_FAMILY, { last_value_AppleRawMaxCapacity: 2950 })],
    { normalized: { rawMaximumCapacity: expectedSnapshot().rawMaximumCapacity }, sanitized: { rawMaximumCapacity: { value: 2950, unit: 'mAh', origin: 'direct' } }, visibleRows: rows({ label: 'Raw Maximum Capacity', value: '2,950 mAh' }) },
    ['RealCapacity', 'derived health'],
    'direct raw capacity is retained without reinterpretation',
    'No user/device metadata is included.',
  ),
  parserCase(
    'unsupported-family-mimic',
    'an unsupported family cannot mimic approved payload fields',
    [record('BatteryConfigValueHistogramFinal', snapshot())],
    { normalized: null, sanitized: null, visibleRows: noRows },
    ['all fields from wrong-case family'],
    'exact family matching rejects aliases',
    'Wrong-case family name is a synthetic negative.',
  ),
  parserCase(
    'duplicate-whole-record',
    'identical whole observations remain one normalized model',
    [record(FINAL_FAMILY, snapshot()), record(FINAL_FAMILY, snapshot())],
    { normalized: expectedSnapshot(), sanitized: expectedSanitizedSnapshot(), visibleRows: fullRows },
    ['duplicate rows', 'aggregation'],
    'identical duplicate observations are deduplicated',
    'No record order or raw record is retained in output.',
  ),
  parserCase(
    'partial-complementary-duplicates',
    'approved families fill missing non-conflicting fields only',
    [record(FINAL_FAMILY, { last_value_CycleCount: 12 }), record(SECONDARY_FAMILY, { last_value_MaximumFCC: 3000 })],
    {
      normalized: { cycleCount: expectedSnapshot().cycleCount, maximumFcc: { ...expectedSnapshot().maximumFcc, sourceFamily: SECONDARY_FAMILY } },
      sanitized: { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' }, maximumFcc: { value: 3000, unit: 'mAh', origin: 'direct' } },
      visibleRows: rows({ label: 'Cycle Count', value: '12 cycles' }, { label: 'Maximum FCC', value: '3,000 mAh' }),
    },
    ['all other fields'],
    'safe complementary fill is retained without aggregation',
    'Only approved scalar values survive.',
  ),
  parserCase(
    'final-snapshot-precedence',
    'a compatible final snapshot keeps deterministic precedence',
    [record(SECONDARY_FAMILY, { last_value_CycleCount: 11 }), record(FINAL_FAMILY, { last_value_CycleCount: 12 })],
    { normalized: { cycleCount: { ...expectedSnapshot().cycleCount, confidence: 'low' }, conflicts: [{ field: 'cycleCount', resolution: 'preferred-final', sourceFamilies: [FINAL_FAMILY, SECONDARY_FAMILY] }] }, sanitized: { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' } }, visibleRows: rows({ label: 'Cycle Count', value: '12 cycles' }) },
    ['conflict metadata'],
    'compatible single final snapshot wins independent of input order',
    'Conflict provenance is not rendered or exported.',
  ),
  parserCase(
    'conflicting-duplicate-suppression',
    'same-family conflicting snapshots suppress only the affected field',
    [record(SECONDARY_FAMILY, { last_value_CycleCount: 11 }), record(SECONDARY_FAMILY, { last_value_CycleCount: 12 })],
    { normalized: { conflicts: [{ field: 'cycleCount', resolution: 'suppressed', sourceFamilies: [SECONDARY_FAMILY] }] }, sanitized: null, visibleRows: noRows },
    ['cycleCount', 'conflict metadata'],
    'unresolved conflict is suppressed',
    'No conflict values or source metadata reach the model.',
  ),
]);

const hostileGetterMetric = () => {
  const metric = {};
  Object.defineProperties(metric, {
    value: { enumerable: true, get() { throw new Error('synthetic getter must not run'); } },
    unit: { enumerable: true, value: 'cycles' },
    source: { enumerable: true, value: 'direct' },
  });
  return metric;
};

const inheritedMetric = Object.assign(Object.create({ value: 12, unit: 'cycles', source: 'direct' }), {});
const hostileModel = { cycleCount: direct(12, 'cycles') };
Object.defineProperty(hostileModel, 'sourceFamily', { enumerable: true, value: 'synthetic-family' });
Object.defineProperty(hostileModel, 'rawRecord', { enumerable: true, value: { private: true } });
Object.defineProperty(hostileModel, 'RealCapacity', { enumerable: true, value: 3000 });
Object.defineProperty(hostileModel, 'constructor', { enumerable: true, value: 'synthetic-constructor' });
Object.defineProperty(hostileModel, 'prototype', { enumerable: true, value: 'synthetic-prototype' });
Object.defineProperty(hostileModel, 'conflicts', { enumerable: true, value: [{ field: 'cycleCount', values: [11, 12] }] });
Object.defineProperty(hostileModel, 'conflictValues', { enumerable: true, value: [11, 12] });
Object.defineProperty(hostileModel, 'eventFamily', { enumerable: true, value: FINAL_FAMILY });
Object.defineProperty(hostileModel, 'charging', { enumerable: true, value: { adapterPowerCategories: [39], isWireless: true } });
Object.defineProperty(hostileModel, 'htmlMetadata', { enumerable: true, value: '<img src=x onerror=synthetic>' });
Object.defineProperty(hostileModel, '__proto__', { enumerable: true, value: { polluted: true } });

export const BATTERY_MODEL_CASES = Object.freeze([
  modelCase('empty-model', 'empty normalized input produces no model or section', {}, null, noRows, ['all metrics'], 'empty input is omitted', 'No placeholder fields are created.'),
  modelCase('all-invalid-model', 'all malformed metrics produce no model or section', { cycleCount: direct(-1, 'cycles'), maximumCapacityPercent: direct(101, 'percent'), maximumFcc: direct('3000', 'mAh'), maximumQmax: direct(Number.NaN, 'mAh') }, null, noRows, ['all metrics'], 'all invalid values are suppressed', 'No malformed value is retained.'),
  modelCase('maximum-capacity-zero', 'direct zero percent is allowed', { maximumCapacityPercent: direct(0, 'percent') }, { maximumCapacityPercent: { value: 0, unit: 'percent', origin: 'direct' } }, rows({ label: 'Maximum Capacity', value: '0%' }), [], 'zero percent is retained', 'Zero is not converted into a diagnosis.'),
  modelCase('maximum-capacity-above-range', 'out-of-range percent is omitted', { maximumCapacityPercent: direct(101, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'invalid percentage is suppressed', 'No clamping or fallback is used.'),
  modelCase('maximum-capacity-below-range', 'negative percent is omitted', { maximumCapacityPercent: direct(-1, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'invalid percentage is suppressed', 'No diagnosis is inferred.'),
  modelCase('maximum-capacity-string', 'numeric string is not coerced', { maximumCapacityPercent: direct('100', 'percent') }, null, noRows, ['maximumCapacityPercent'], 'string scalar is suppressed', 'Synthetic string is not treated as a numeric observation.'),
  modelCase('maximum-capacity-float', 'finite float is accepted by the frozen percentage contract', { maximumCapacityPercent: direct(99.5, 'percent') }, { maximumCapacityPercent: { value: 99.5, unit: 'percent', origin: 'direct' } }, rows({ label: 'Maximum Capacity', value: '99.5%' }), [], 'finite in-range percent is retained', 'No rounding or health inference is added.'),
  modelCase('maximum-capacity-nan', 'NaN percent is omitted', { maximumCapacityPercent: direct(Number.NaN, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'non-finite percentage is suppressed', 'No fallback is calculated.'),
  modelCase('maximum-capacity-infinity', 'infinite percent is omitted', { maximumCapacityPercent: direct(Number.POSITIVE_INFINITY, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'non-finite percentage is suppressed', 'No fallback is calculated.'),
  modelCase('maximum-capacity-null', 'null percent is omitted', { maximumCapacityPercent: direct(null, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'null scalar is suppressed', 'No placeholder is inserted.'),
  modelCase('maximum-capacity-object', 'object percent is omitted', { maximumCapacityPercent: direct({ value: 100 }, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'object scalar is suppressed', 'Nested data is not promoted.'),
  modelCase('maximum-capacity-boolean', 'boolean percent is omitted', { maximumCapacityPercent: direct(true, 'percent') }, null, noRows, ['maximumCapacityPercent'], 'boolean scalar is suppressed', 'Boolean is not coerced.'),
  modelCase('cycle-zero', 'zero cycle count is retained', { cycleCount: direct(0, 'cycles') }, { cycleCount: { value: 0, unit: 'cycles', origin: 'direct' } }, rows({ label: 'Cycle Count', value: '0 cycles' }), [], 'zero is valid', 'No replacement inference is added.'),
  modelCase('cycle-positive', 'positive integer cycle count is retained', { cycleCount: direct(12, 'cycles') }, { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' } }, rows({ label: 'Cycle Count', value: '12 cycles' }), [], 'valid count is retained', 'No threshold judgment is added.'),
  modelCase('cycle-negative', 'negative cycle count is omitted', { cycleCount: direct(-1, 'cycles') }, null, noRows, ['cycleCount'], 'invalid count is suppressed', 'No diagnosis is inferred.'),
  modelCase('cycle-float', 'fractional cycle count is omitted', { cycleCount: direct(1.5, 'cycles') }, null, noRows, ['cycleCount'], 'non-integer count is suppressed', 'No rounding is performed.'),
  modelCase('cycle-string', 'numeric string cycle count is not coerced', { cycleCount: direct('12', 'cycles') }, null, noRows, ['cycleCount'], 'string scalar is suppressed', 'No implicit conversion is used.'),
  modelCase('cycle-null', 'null cycle count is omitted', { cycleCount: direct(null, 'cycles') }, null, noRows, ['cycleCount'], 'null scalar is suppressed', 'No placeholder is inserted.'),
  modelCase('cycle-object', 'object cycle count is omitted', { cycleCount: direct({ value: 12 }, 'cycles') }, null, noRows, ['cycleCount'], 'object scalar is suppressed', 'Nested data is not promoted.'),
  modelCase('cycle-boolean', 'boolean cycle count is omitted', { cycleCount: direct(false, 'cycles') }, null, noRows, ['cycleCount'], 'boolean scalar is suppressed', 'Boolean is not coerced.'),
  modelCase('cycle-nan', 'NaN cycle count is omitted', { cycleCount: direct(Number.NaN, 'cycles') }, null, noRows, ['cycleCount'], 'non-finite count is suppressed', 'No fallback is calculated.'),
  modelCase('cycle-infinity', 'infinite cycle count is omitted', { cycleCount: direct(Infinity, 'cycles') }, null, noRows, ['cycleCount'], 'non-finite count is suppressed', 'No fallback is calculated.'),
  modelCase('capacity-positive', 'positive capacity values remain direct observations', { maximumFcc: direct(3000, 'mAh'), nominalChargeCapacity: direct(2900, 'mAh'), rawMaximumCapacity: direct(2950, 'mAh') }, { maximumFcc: { value: 3000, unit: 'mAh', origin: 'direct' }, nominalChargeCapacity: { value: 2900, unit: 'mAh', origin: 'direct' }, rawMaximumCapacity: { value: 2950, unit: 'mAh', origin: 'direct' } }, rows({ label: 'Maximum FCC', value: '3,000 mAh' }, { label: 'Nominal Charge Capacity', value: '2,900 mAh' }, { label: 'Raw Maximum Capacity', value: '2,950 mAh' }), [], 'capacities remain independent', 'No derived percentage is calculated.'),
  modelCase('capacity-zero', 'zero capacity is omitted', { maximumFcc: direct(0, 'mAh') }, null, noRows, ['maximumFcc'], 'non-positive capacity is suppressed', 'No zero placeholder is displayed.'),
  modelCase('capacity-negative', 'negative capacity is omitted', { maximumFcc: direct(-1, 'mAh') }, null, noRows, ['maximumFcc'], 'non-positive capacity is suppressed', 'No diagnosis is inferred.'),
  modelCase('capacity-string', 'numeric string capacity is not coerced', { maximumFcc: direct('3000', 'mAh') }, null, noRows, ['maximumFcc'], 'string scalar is suppressed', 'No implicit conversion is used.'),
  modelCase('capacity-null', 'null capacity is omitted', { maximumFcc: direct(null, 'mAh') }, null, noRows, ['maximumFcc'], 'null scalar is suppressed', 'No placeholder is inserted.'),
  modelCase('capacity-array', 'array capacity is omitted', { maximumFcc: direct([3000], 'mAh') }, null, noRows, ['maximumFcc'], 'array scalar is suppressed', 'Nested arrays are not promoted.'),
  modelCase('capacity-boolean', 'boolean capacity is omitted', { maximumFcc: direct(false, 'mAh') }, null, noRows, ['maximumFcc'], 'boolean scalar is suppressed', 'Boolean is not coerced.'),
  modelCase('capacity-nan', 'NaN capacity is omitted', { maximumFcc: direct(Number.NaN, 'mAh') }, null, noRows, ['maximumFcc'], 'non-finite capacity is suppressed', 'No fallback is calculated.'),
  modelCase('capacity-infinity', 'infinite capacity is omitted', { maximumFcc: direct(Infinity, 'mAh') }, null, noRows, ['maximumFcc'], 'non-finite capacity is suppressed', 'No fallback is calculated.'),
  modelCase('wrong-unit', 'wrong units are rejected', { maximumFcc: direct(3000, 'cycles') }, null, noRows, ['maximumFcc'], 'unit mismatch is suppressed', 'No conversion is attempted.'),
  modelCase('wrong-case-unit', 'wrong-case units are rejected', { maximumFcc: direct(3000, 'MAH') }, null, noRows, ['maximumFcc'], 'unit mismatch is suppressed', 'Unit spelling is not normalized by guesswork.'),
  modelCase('missing-unit', 'missing units are rejected', { maximumFcc: { value: 3000, source: 'direct' } }, null, noRows, ['maximumFcc'], 'missing unit is suppressed', 'Unit is not inferred at this boundary.'),
  modelCase('wrong-origin', 'derived origin is rejected', { maximumFcc: direct(3000, 'mAh', { source: 'derived' }) }, null, noRows, ['maximumFcc'], 'non-direct origin is suppressed', 'No derived ratio is accepted.'),
  modelCase('invalid-origin', 'unknown origin is rejected', { maximumFcc: direct(3000, 'mAh', { origin: 'supporting' }) }, null, noRows, ['maximumFcc'], 'unknown origin is suppressed', 'Supporting context is not a direct metric.'),
  modelCase('missing-origin', 'missing origin is accepted only under the frozen sanitizer compatibility rule', { maximumFcc: { value: 3000, unit: 'mAh' } }, { maximumFcc: { value: 3000, unit: 'mAh', origin: 'direct' } }, rows({ label: 'Maximum FCC', value: '3,000 mAh' }), [], 'direct origin is normalized at the boundary', 'No source family is inferred or exposed.'),
  modelCase('qmax-out-of-order', 'Qmax cells are sorted numerically', { qmaxCells: [direct(3200, 'mAh', { cell: 3 }), direct(3000, 'mAh', { cell: 0 }), direct(3100, 'mAh', { cell: 1 })] }, { qmaxCells: [{ cell: 0, value: 3000, unit: 'mAh', origin: 'direct' }, { cell: 1, value: 3100, unit: 'mAh', origin: 'direct' }, { cell: 3, value: 3200, unit: 'mAh', origin: 'direct' }] }, rows({ label: 'Cell 0 Qmax', value: '3,000 mAh' }, { label: 'Cell 1 Qmax', value: '3,100 mAh' }, { label: 'Cell 3 Qmax', value: '3,200 mAh' }), [], 'ascending cell order is deterministic', 'Missing cell 2 is not inferred.'),
  modelCase('qmax-sparse', 'sparse Qmax indexes remain sparse', { qmaxCells: [direct(3200, 'mAh', { cell: 3 }), direct(3000, 'mAh', { cell: 0 })] }, { qmaxCells: [{ cell: 0, value: 3000, unit: 'mAh', origin: 'direct' }, { cell: 3, value: 3200, unit: 'mAh', origin: 'direct' }] }, rows({ label: 'Cell 0 Qmax', value: '3,000 mAh' }, { label: 'Cell 3 Qmax', value: '3,200 mAh' }), [], 'sparse indexes are preserved', 'No missing cell is invented.'),
  modelCase('qmax-identical-duplicate', 'identical Qmax indexes are deduplicated', { qmaxCells: [direct(3000, 'mAh', { cell: 0 }), direct(3000, 'mAh', { cell: 0 })] }, { qmaxCells: [{ cell: 0, value: 3000, unit: 'mAh', origin: 'direct' }] }, rows({ label: 'Cell 0 Qmax', value: '3,000 mAh' }), [], 'identical duplicate is retained once', 'Duplicate source metadata is discarded.'),
  modelCase('qmax-conflicting-duplicate', 'conflicting Qmax indexes are suppressed', { qmaxCells: [direct(3000, 'mAh', { cell: 0 }), direct(3100, 'mAh', { cell: 0 })] }, null, noRows, ['cell 0 Qmax'], 'conflicting cell is withheld', 'Neither conflict value is exposed.'),
  modelCase('qmax-invalid-index', 'invalid Qmax indexes are omitted', { qmaxCells: [direct(3000, 'mAh', { cell: -1 }), direct(3100, 'mAh', { cell: 1.5 })] }, null, noRows, ['qmaxCells'], 'invalid indexes are suppressed', 'No cell index is inferred.'),
  modelCase('own-property-metric', 'own data properties are accepted', { cycleCount: direct(12, 'cycles') }, { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' } }, rows({ label: 'Cycle Count', value: '12 cycles' }), [], 'own metric is retained', 'Only approved own fields survive.'),
  modelCase('inherited-metric', 'prototype-inherited metric properties are rejected', { cycleCount: inheritedMetric }, null, noRows, ['cycleCount'], 'inherited fields are suppressed', 'Prototype data cannot enter the sanitized model.'),
  modelCase('getter-metric', 'throwing getters must not crash sanitization', { cycleCount: hostileGetterMetric() }, null, noRows, ['cycleCount'], 'accessor metric is suppressed', 'Getter code is not executed.'),
  modelCase('metadata-stripping', 'source and conflict metadata are removed', hostileModel, { cycleCount: { value: 12, unit: 'cycles', origin: 'direct' } }, rows({ label: 'Cycle Count', value: '12 cycles' }), ['sourceFamily', 'rawRecord', 'RealCapacity', 'constructor', 'prototype', 'conflicts', 'conflictValues', 'eventFamily', 'charging', 'htmlMetadata', '__proto__'], 'allowlist keeps only approved metric data', 'All metadata values are synthetic and rejected.'),
  modelCase('very-large-finite', 'large finite numeric input remains bounded and direct', { maximumFcc: direct(Number.MAX_SAFE_INTEGER, 'mAh') }, { maximumFcc: { value: Number.MAX_SAFE_INTEGER, unit: 'mAh', origin: 'direct' } }, rows({ label: 'Maximum FCC', value: '9,007,199,254,740,991 mAh' }), [], 'finite value is retained without conversion', 'Large value is synthetic and not interpreted.'),
  modelCase('negative-zero-cycle', 'negative zero remains the valid zero boundary', { cycleCount: direct(-0, 'cycles') }, { cycleCount: { value: -0, unit: 'cycles', origin: 'direct' } }, rows({ label: 'Cycle Count', value: '0 cycles' }), [], 'negative zero is preserved numerically', 'Formatting does not turn zero into a judgment.'),
]);

export const BATTERY_CORPUS_CASES = Object.freeze([...BATTERY_RECORD_CASES, ...BATTERY_MODEL_CASES]);
