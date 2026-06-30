import { classifyDiagnostic } from './classifyDiagnostic.js';
import {
  EXPLANATION_SECTION_ID,
  createExplanationSection,
  getDiagnosticExplanation,
} from '../explanations/diagnosticExplanations.js';
import { parseAnalytics } from './parseAnalytics.js';
import { parseAccessoryCrash } from './parseAccessoryCrash.js';
import { parseCoreAnalytics } from './parseCoreAnalytics.js';
import { parseCrash } from './parseCrash.js';
import { parseCpuResource } from './parseCpuResource.js';
import { parseDiskWritesResource } from './parseDiskWritesResource.js';
import { parseIpsContainer } from './parseIpsContainer.js';
import { parseIps } from './parseIps.js';
import { parseIpsWatchdogStackshot } from './parseIpsWatchdogStackshot.js';
import { parseJetsam } from './parseJetsam.js';
import { parsePanic } from './parsePanic.js';
import { parseResourceStackshot } from './parseResourceStackshot.js';

export function parseInput(input, { sanitize = true } = {}) {
  const classification = classifyDiagnostic(input);
  const type = classification.parserType;
  const options = { sanitize };

  if (type === 'ips') {
    const parsed = parseIpsContainer(input);
    return withDiagnosticExplanation(parseIps(parsed.body, parsed.metadata, options), classification, options);
  }

  if (type === 'ips-watchdog-stackshot') {
    const parsed = parseIpsContainer(input);
    return withDiagnosticExplanation(parseIpsWatchdogStackshot(parsed.body, parsed.metadata, options), classification, options);
  }

  if (type === 'crash') {
    return withDiagnosticExplanation(parseCrash(input, options), classification, options);
  }

  if (type === 'jetsam') {
    const parsed = parseIpsContainer(input);
    return withDiagnosticExplanation(parseJetsam(parsed.body, parsed.metadata, options), classification, options);
  }

  if (type === 'panic') {
    return withDiagnosticExplanation(parsePanic(input, options), classification, options);
  }

  if (type === 'analytics') {
    return withDiagnosticExplanation(parseAnalytics(input, options), classification, options);
  }

  if (type === 'coreanalytics') {
    return withDiagnosticExplanation(parseCoreAnalytics(input, options), classification, options);
  }

  if (type === 'accessory-crash') {
    const parsed = parseIpsContainer(input);
    return withDiagnosticExplanation(parseAccessoryCrash(parsed.body, parsed.metadata, options), classification, options);
  }

  if (type === 'resource-cpu') {
    return withDiagnosticExplanation(parseCpuResource(input, options), classification, options);
  }

  if (type === 'resource-diskwrites') {
    return withDiagnosticExplanation(parseDiskWritesResource(input, options), classification, options);
  }

  if (type === 'resource-stackshot') {
    return withDiagnosticExplanation(parseResourceStackshot(input, options), classification, options);
  }

  throw new Error('Unsupported or unrecognized file type.');
}

function withDiagnosticExplanation(sections, classification, options) {
  if (!Array.isArray(sections) || sections.some((section) => section?.id === EXPLANATION_SECTION_ID)) return sections;

  const explanationSection = createExplanationSection(getDiagnosticExplanation(sections, classification, options));
  if (!explanationSection) return sections;

  const insertAfter = sections.findIndex(isSummaryLikeSection);
  if (insertAfter === -1) return [...sections, explanationSection];

  return [
    ...sections.slice(0, insertAfter + 1),
    explanationSection,
    ...sections.slice(insertAfter + 1),
  ];
}

function isSummaryLikeSection(section) {
  const id = String(section?.id ?? '').toLowerCase();
  const title = String(section?.title ?? '').toLowerCase();
  return id === 'summary' || id.endsWith('-summary') || title === 'summary' || title.endsWith(' summary');
}
