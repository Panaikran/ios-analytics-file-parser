export const EXPLANATION_SECTION_ID = 'diagnostic-explanation';

const EXPLANATIONS = Object.freeze({
  'exc-breakpoint': {
    title: 'Runtime trap or breakpoint',
    summary:
      'This usually means the app intentionally stopped after hitting a runtime trap, assertion, or debugger breakpoint.',
    check: 'Check the triggered thread backtrace to identify the code path that stopped.',
  },
  'exc-bad-access': {
    title: 'Invalid memory access',
    summary: 'This often means the app tried to use memory that was no longer valid or not allowed.',
    check: 'Check the crashed thread and nearby memory access pattern.',
  },
  'exc-crash': {
    title: 'Abort or crash signal',
    summary: 'This commonly means the app aborted itself or a runtime/library requested termination.',
    check: 'Check exception details and the crashed thread for the failing assertion or abort path.',
  },
  'exc-resource': {
    title: 'Resource limit report',
    summary: 'This may indicate iOS reported the app for exceeding a resource limit.',
    check: 'Check CPU, memory, wakeup, or disk-write fields for the specific limit.',
  },
  'exc-guard': {
    title: 'System guard violation',
    summary: 'This usually means the app violated a system guard rule such as file descriptor, vnode, or resource protection.',
    check: 'Check the subtype, codes, and triggered thread details.',
  },
  watchdog: {
    title: 'Watchdog termination',
    summary:
      'This usually means iOS terminated the app after it did not respond in time during launch, suspend, resume, or scene lifecycle work.',
    check: 'Check the main thread stackshot and termination details.',
  },
  jetsam: {
    title: 'Memory pressure termination',
    summary: 'This commonly means iOS reclaimed memory by terminating one or more processes under memory pressure.',
    check: 'Check the victim or likely culprit section and the process table.',
  },
  panic: {
    title: 'System panic report',
    summary: 'This usually means the OS or kernel reported a low-level panic.',
    check: 'Check the panic string, flags, and kernel backtrace summary.',
  },
  'accessory-crash': {
    title: 'Accessory crash or fault',
    summary: 'This may indicate a paired accessory or accessory-side process reported a crash or fault.',
    check: 'Check accessory information, application information, crashlog overview, and panic/fault notes.',
  },
  'resource-cpu': {
    title: 'CPU resource limit',
    summary: 'This may indicate the process used too much CPU for too long.',
    check: 'Check CPU used, CPU limit, duration, and action taken.',
  },
  'resource-diskwrites': {
    title: 'Disk write resource limit',
    summary: 'This may indicate the process wrote more data than the allowed disk-write budget.',
    check: 'Check logical/physical write metrics, limits, and action taken.',
  },
  'resource-stackshot': {
    title: 'Resource stackshot summary',
    summary: 'This usually means the report captured a resource-triggered snapshot of processes.',
    check: 'Check trigger/reason and top-process summaries. Full stacks are not rendered.',
  },
});

export function getDiagnosticExplanation(sections, classification, options = {}) {
  void options;

  if (!Array.isArray(sections) || !classification || classification.supported !== true) return null;

  const ruleId = selectRuleId(sections, classification);
  if (!ruleId) return null;

  const explanation = EXPLANATIONS[ruleId];
  if (!explanation) return null;

  return {
    ruleId,
    title: explanation.title,
    summary: explanation.summary,
    check: explanation.check,
  };
}

export function createExplanationSection(explanation) {
  if (!explanation) return null;

  return {
    id: EXPLANATION_SECTION_ID,
    title: 'What This Usually Means',
    priority: 'info',
    fields: [
      { label: 'Category', value: explanation.title },
      { label: 'What This Usually Means', value: explanation.summary },
      { label: 'What To Check', value: explanation.check },
      { label: 'Caution', value: 'This is general guidance from parsed fields; confirm with the report details.' },
    ],
    raw: '',
    table: null,
    tableColumns: null,
    tableSummary: '',
    chart: null,
  };
}

function selectRuleId(sections, classification) {
  switch (classification.type) {
    case 'app-crash':
    case 'crash-legacy':
      return selectCrashRuleId(sections);
    case 'watchdog':
      return hasAnySection(sections, ['termination', 'main-thread-stackshot']) ? 'watchdog' : null;
    case 'jetsam':
      return hasAnySection(sections, ['victim', 'process-table']) ? 'jetsam' : null;
    case 'panic-full':
      return hasAnySection(sections, ['panic-string', 'kernel-backtrace']) ? 'panic' : null;
    case 'accessory-crash':
      return hasAnySection(sections, ['accessory-crash-summary']) ? 'accessory-crash' : null;
    case 'resource-cpu':
      return hasAnySection(sections, ['resource-cpu-summary']) ? 'resource-cpu' : null;
    case 'resource-diskwrites':
      return hasAnySection(sections, ['resource-diskwrites-summary']) ? 'resource-diskwrites' : null;
    case 'resource-stackshot':
      return hasAnySection(sections, ['resource-stackshot-summary']) ? 'resource-stackshot' : null;
    default:
      return null;
  }
}

function selectCrashRuleId(sections) {
  const exception = findSection(sections, 'exception');
  const text = sectionText(exception);

  if (/\b(EXC_BREAKPOINT|SIGTRAP)\b/i.test(text)) return 'exc-breakpoint';
  if (/\bEXC_BAD_ACCESS\b/i.test(text)) return 'exc-bad-access';
  if (/\b(EXC_CRASH|SIGABRT)\b/i.test(text)) return 'exc-crash';
  if (/\bEXC_RESOURCE\b/i.test(text)) return 'exc-resource';
  if (/\bEXC_GUARD\b/i.test(text)) return 'exc-guard';

  return null;
}

function findSection(sections, id) {
  return sections.find((section) => section?.id === id) ?? null;
}

function hasAnySection(sections, ids) {
  return ids.some((id) => findSection(sections, id));
}

function sectionText(section) {
  if (!section) return '';

  const parts = [section.title, section.raw];

  if (Array.isArray(section.fields)) {
    for (const field of section.fields) {
      parts.push(field?.label, field?.value);
    }
  }

  return parts.map((part) => String(part ?? '')).join(' ');
}
