import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { classifyDiagnostic } from '../src/parsers/classifyDiagnostic.js';
import { createComparisonSections } from '../src/comparison/comparisonModel.js';
import { serializeSectionsForExport, serializeSectionsForJsonExport } from '../src/clipboard/serializeSection.js';
import { parseInput } from '../src/parsers/index.js';
import { filterSectionsByQuery } from '../src/search/filterSections.js';
import { getVisibleSectionForCopy } from '../src/clipboard/visibleSection.js';
import {
  createLargeCoreAnalyticsFixture,
  createLargeStackshotFixture,
} from './fixtures/largeReportWorkloads.js';

const WARMUP_ITERATIONS = 3;
const MEASURED_ITERATIONS = 25;
const REPEATED_CYCLES = 20;

const EXISTING_FIXTURES = [
  ['example-full.ips', 'report'],
  ['example-full.crash', 'report'],
  ['example-coreanalytics-large.ips.ca.synced', 'CoreAnalytics'],
  ['example-jetsam-real-schema.ips', 'Jetsam'],
  ['example-panic-json.ips', 'Panic'],
  ['example-watchdog.ips', 'Watchdog'],
  ['example-analytics.txt', 'Analytics'],
].map(([name, query]) => ({
  name,
  query,
  text: fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
}));

const STRESS_FIXTURES = [
  { name: 'generated-coreanalytics-5000', query: 'SyntheticMetricGroup-000', text: createLargeCoreAnalyticsFixture() },
  { name: 'generated-stackshot-5000', query: 'SyntheticStackProcess', text: createLargeStackshotFixture() },
];

const BUDGETS = {
  existing: {
    parseMs: 20,
    searchMs: 10,
    compareMs: 20,
    textExportMs: 20,
    jsonExportMs: 20,
  },
  stress: {
    parseMs: 250,
    searchMs: 100,
    compareMs: 100,
    textExportMs: 150,
    jsonExportMs: 150,
  },
};

function measure(operation, iterations = MEASURED_ITERATIONS) {
  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) operation();

  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }

  samples.sort((left, right) => left - right);
  return {
    minMs: samples[0],
    medianMs: samples[Math.floor(samples.length / 2)],
    p95Ms: samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)],
    maxMs: samples.at(-1),
  };
}

function benchmarkWorkload({ name, query, text }, tier) {
  const classification = classifyDiagnostic(text);
  let sections;
  const parse = measure(() => {
    sections = parseInput(text);
  });

  const visibleSections = sections.map((section) => getVisibleSectionForCopy(section, { allSections: sections }));
  const comparisonEntry = {
    classification: {
      parserType: classification.parserType,
      supported: classification.supported,
    },
    sections,
  };
  const entries2 = [comparisonEntry, comparisonEntry];
  const entries3 = [comparisonEntry, comparisonEntry, comparisonEntry];
  const compare2 = measure(() => createComparisonSections(entries2));
  const compare3 = measure(() => createComparisonSections(entries3));
  const search = measure(() => filterSectionsByQuery(sections, query));
  const textExport = measure(() => serializeSectionsForExport(visibleSections));
  const jsonExport = measure(() => serializeSectionsForJsonExport(visibleSections));
  const comparisonSections = createComparisonSections(entries3);
  const comparisonJsonExport = measure(() => serializeSectionsForJsonExport(comparisonSections, { mode: 'comparison' }));
  const repeatedCycles = measure(() => runRepeatedWorkflow(text, query), REPEATED_CYCLES);
  const clearResetSimulation = measure(() => {
    let activeSections = sections;
    let activeComparison = comparisonSections;
    activeSections = [];
    activeComparison = [];
    assert.deepEqual([activeSections.length, activeComparison.length], [0, 0]);
  });

  return {
    name,
    tier,
    parserType: classification.parserType,
    inputBytes: Buffer.byteLength(text),
    parse,
    search,
    compare2,
    compare3,
    textExport,
    jsonExport,
    comparisonJsonExport,
    repeatedCycles,
    clearResetSimulation,
    output: summarizeOutput(sections),
    budgetStatus: compareBudgets({ parse, search, compare: compare3, textExport, jsonExport }, BUDGETS[tier]),
  };
}

function runRepeatedWorkflow(text, query) {
  const parsed = parseInput(text);
  const searched = filterSectionsByQuery(parsed, query).sections;
  const visible = searched.map((section) => getVisibleSectionForCopy(section, { allSections: parsed }));
  serializeSectionsForExport(visible);
  serializeSectionsForJsonExport(visible);

  const classification = classifyDiagnostic(text);
  const entry = {
    classification: { parserType: classification.parserType, supported: classification.supported },
    sections: parsed,
  };
  const comparison = createComparisonSections([entry, entry, entry]);
  serializeSectionsForJsonExport(comparison, { mode: 'comparison' });

  let activeSections = parsed;
  let activeComparison = comparison;
  activeSections = [];
  activeComparison = [];
  return activeSections.length + activeComparison.length;
}

function summarizeOutput(sections) {
  return {
    sections: sections.length,
    fields: sections.reduce((total, section) => total + (section.fields?.length ?? 0), 0),
    tableRows: sections.reduce((total, section) => total + (section.table?.length ?? 0), 0),
    tableSummaries: sections.map((section) => section.tableSummary).filter(Boolean),
  };
}

function compareBudgets(measurements, budget) {
  return Object.fromEntries(
    Object.entries({
      parseMs: measurements.parse.p95Ms,
      searchMs: measurements.search.p95Ms,
      compareMs: measurements.compare.p95Ms,
      textExportMs: measurements.textExport.p95Ms,
      jsonExportMs: measurements.jsonExport.p95Ms,
    }).map(([key, value]) => [key, { valueMs: value, budgetMs: budget[key], withinBudget: value <= budget[key] }])
  );
}

const results = [
  ...EXISTING_FIXTURES.map((fixture) => benchmarkWorkload(fixture, 'existing')),
  ...STRESS_FIXTURES.map((fixture) => benchmarkWorkload(fixture, 'stress')),
];

console.log(JSON.stringify({
  environment: {
    node: process.version,
    platform: process.platform,
    timingApi: 'node:perf_hooks performance.now',
    warmupIterations: WARMUP_ITERATIONS,
    measuredIterations: MEASURED_ITERATIONS,
    repeatedCycles: REPEATED_CYCLES,
  },
  budgets: BUDGETS,
  browserMetrics: 'Not measured: this repository has no browser benchmark harness or Playwright dependency.',
  results,
}, null, 2));
