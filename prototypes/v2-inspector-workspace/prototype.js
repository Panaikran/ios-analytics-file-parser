const app = document.querySelector('#prototype-app');
const scenarioSelect = document.querySelector('#scenario-select');
const themeSelect = document.querySelector('#theme-select');
const reduceMotion = document.querySelector('#reduce-motion');
const reduceTransparency = document.querySelector('#reduce-transparency');
const increaseContrast = document.querySelector('#increase-contrast');
const forceColors = document.querySelector('#force-colors');
const sectionDialog = document.querySelector('#section-dialog');
const mobileSectionNav = document.querySelector('#mobile-section-nav');
const closeSectionDialogButton = document.querySelector('#close-section-dialog');
const actionPopover = document.querySelector('#action-popover');

const HIDDEN_HELPER_VALUE = 'ORCHID-LOCK-7391';

const reportData = Object.freeze({
  title: 'Sample App Crash',
  type: 'App Crash .ips',
  mode: 'Sanitized View',
  internalHelper: HIDDEN_HELPER_VALUE,
  sections: [
    {
      id: 'overview',
      title: 'Report overview',
      summary: 'A compact identity and environment summary for the sanitized demonstration report.',
      fields: [
        ['Report type', 'App Crash .ips'],
        ['Process', 'ExampleNotes'],
        ['Operating system', 'iOS 18.5 (22F76)'],
        ['Capture time', '2026-07-14 16:42:08 +0700'],
        ['View', 'Sanitized — identifiers removed'],
      ],
    },
    {
      id: 'exception',
      title: 'Exception and termination',
      summary: 'The report records a memory access exception. This prototype does not infer an exact root cause.',
      fields: [
        ['Exception type', 'EXC_BAD_ACCESS (SIGSEGV)'],
        ['Exception subtype', 'KERN_INVALID_ADDRESS at 0x0000000000000010'],
        ['Termination reason', 'Namespace SIGNAL, Code 11 Segmentation fault'],
        ['Triggered thread', 'Thread 6'],
      ],
    },
    {
      id: 'threads',
      title: 'Triggered thread',
      summary: 'Visible stack frames are synthetic and sanitized for prototype review.',
      table: {
        caption: 'Triggered thread stack frames',
        columns: ['Frame', 'Binary', 'Address', 'Symbol'],
        rows: [
          ['0', 'ExampleNotes', '0x0000000100021A44', 'CacheStore.readEntry(_:) + 84'],
          ['1', 'ExampleNotes', '0x0000000100021790', 'CacheStore.loadRecent() + 208'],
          ['2', 'ExampleNotes', '0x000000010001D9F8', 'NotesViewModel.refresh() + 156'],
          ['3', 'SwiftUI', '0x0000000190A67D18', 'closure #1 in ViewBodyAccessor.updateBody(of:changed:)'],
          ['4', 'AttributeGraph', '0x00000001A2D48B88', 'AG::Graph::UpdateStack::update()'],
        ],
        internalHelper: HIDDEN_HELPER_VALUE,
      },
    },
    {
      id: 'memory',
      title: 'Memory context',
      summary: 'Memory values remain readable without dashboard-style statistic cards.',
      fields: [
        ['Physical footprint', '184.7 MB'],
        ['Peak footprint', '212.3 MB'],
        ['Memory pressure', 'Normal'],
        ['Largest region', 'MALLOC_LARGE — 64.0 MB'],
      ],
    },
    {
      id: 'images',
      title: 'Binary images',
      summary: 'A dense, contained table demonstrates technical typography and horizontal overflow.',
      table: {
        caption: 'Visible binary images',
        columns: ['Image', 'Architecture', 'Load address', 'Version'],
        rows: [
          ['ExampleNotes', 'arm64', '0x0000000100000000', '2.4.1 (310)'],
          ['SwiftUI', 'arm64e', '0x00000001908C0000', '6.5'],
          ['Foundation', 'arm64e', '0x000000018A400000', '6.5'],
          ['libswiftCore.dylib', 'arm64e', '0x000000018C200000', '6.0.3'],
        ],
      },
    },
  ],
});

const comparisonData = Object.freeze({
  title: 'App Crash comparison',
  type: 'Sanitized comparison',
  mode: 'Comparison',
  sections: [
    {
      id: 'comparison-overview',
      title: 'Comparison overview',
      summary: 'Only generated, sanitized comparison values are searchable and exportable.',
      fields: [
        ['Parser type', 'App Crash .ips'],
        ['Reports compared', 'Report 1 and Report 2'],
        ['Privacy scope', 'Sanitized output only'],
      ],
    },
    {
      id: 'comparison-differences',
      title: 'Visible differences',
      summary: 'Setup-only report labels and original report text are not included.',
      table: {
        caption: 'Sanitized comparison values',
        columns: ['Field', 'Report 1', 'Report 2', 'Result'],
        rows: [
          ['Operating system', 'iOS 18.4', 'iOS 18.5', 'Changed'],
          ['Exception type', 'EXC_BAD_ACCESS', 'EXC_BAD_ACCESS', 'Same'],
          ['Triggered thread', 'Thread 3', 'Thread 6', 'Changed'],
          ['Peak memory', '176.2 MB', '212.3 MB', 'Increased'],
        ],
      },
    },
    {
      id: 'comparison-shared',
      title: 'Shared crash context',
      summary: 'Both reports show the same visible exception family and application binary.',
      fields: [
        ['Application binary', 'ExampleNotes'],
        ['Exception family', 'Memory access'],
        ['Sanitization', 'Identifiers removed from both reports'],
      ],
    },
  ],
});

const rawData = Object.freeze({
  title: reportData.title,
  type: reportData.type,
  mode: 'Raw Local View',
  sections: [Object.freeze({ id: 'raw', title: 'Raw local text' })],
});

const state = {
  scenario: 'import',
  query: '',
  currentSectionMatch: 0,
  currentExactMatch: 0,
  sectionDialogTrigger: null,
  actionTrigger: null,
};

function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'className') node.className = value;
    else if (name === 'text') node.textContent = value;
    else if (name === 'hidden') node.hidden = Boolean(value);
    else if (name === 'disabled') node.disabled = Boolean(value);
    else if (name.startsWith('data-')) node.setAttribute(name, String(value));
    else node.setAttribute(name, String(value));
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child instanceof Node) node.append(child);
    else if (child !== undefined && child !== null) node.append(document.createTextNode(String(child)));
  }

  return node;
}

function button(label, className = 'button button--secondary', attributes = {}) {
  return element('button', { type: 'button', className, text: label, ...attributes });
}

function createAppBar({ report = null, raw = false, comparison = false } = {}) {
  const bar = element('header', { className: 'app-bar', 'aria-label': 'Application header' });
  const identity = element('div', { className: 'app-identity' }, [
    element('strong', { text: 'iOS Analytics File Parser' }),
    element('span', { text: 'Local inspection workspace' }),
  ]);
  bar.append(identity);

  if (report) {
    bar.append(element('div', { className: 'report-identity' }, [
      element('strong', { text: report.title }),
      element('span', { text: comparison ? 'Comparison · sanitized only' : `${report.type} · ${raw ? 'Raw Local View' : 'Sanitized View'}` }),
    ]));
  }

  const actions = element('div', { className: 'app-bar__actions' });
  const openButton = button(report ? 'Open another report' : 'Import report', 'button button--secondary');
  openButton.addEventListener('click', () => changeScenario('import', true));
  actions.append(openButton);
  bar.append(actions);
  return bar;
}

function createImportState({ showMessages = false } = {}) {
  const main = element('section', { className: 'import-state', 'aria-labelledby': 'import-title' });
  const intro = element('div', { className: 'import-state__intro' }, [
    element('p', { className: 'eyebrow', text: 'Private by design' }),
    element('h1', { id: 'import-title', text: 'Inspect iOS diagnostic reports with clarity.', tabindex: '-1' }),
    element('p', {
      className: 'import-state__purpose',
      text: 'Turn supported iPhone and iPad analytics files into structured, readable sections in this browser session.',
    }),
    element('p', {
      className: 'privacy-assurance',
      text: 'Reports stay on this device. Nothing is uploaded, tracked, or saved.',
    }),
  ]);
  main.append(intro);

  if (showMessages) {
    main.append(
      createStateMessage('warning', 'Unsupported file', 'This diagnostic family is recognized but is not supported. Choose a supported .ips, .crash, or analytics text report.', 'Choose another sample'),
      createStateMessage('error', 'The report could not be parsed', 'The sample ended before its JSON object was complete. Your input is preserved; correct the text or start again.', 'Return to import'),
    );
  }

  const surface = element('section', { className: 'import-surface', 'aria-labelledby': 'sample-import-title' }, [
    element('h2', { id: 'sample-import-title', text: 'Open a report' }),
    element('p', { text: 'For this isolated prototype, the primary action loads sanitized synthetic data instead of opening a file.' }),
  ]);
  const actions = element('div', { className: 'import-actions' });
  const load = button('Load synthetic sample', 'button button--primary');
  load.addEventListener('click', () => changeScenario('report', true));
  const example = button('Try comparison sample');
  example.addEventListener('click', () => changeScenario('comparison', true));
  actions.append(load, example);
  surface.append(actions);

  const details = element('details', { className: 'format-guidance' }, [
    element('summary', { text: 'Supported-format guidance' }),
    element('p', { text: 'The production app supports selected .ips, .crash, .ips.ca.synced, and analytics text families. This prototype processes no parser input.' }),
  ]);
  surface.append(details);
  main.append(surface);
  return main;
}

function createStateMessage(tone, title, message, actionLabel) {
  const wrapper = element('section', {
    className: `state-message state-message--${tone}`,
    role: tone === 'error' ? 'alert' : 'status',
    'aria-labelledby': `${tone}-state-title`,
  }, [
    element('h2', { id: `${tone}-state-title`, text: title }),
    element('p', { text: message }),
  ]);
  const action = button(actionLabel);
  action.addEventListener('click', () => changeScenario('import', true));
  wrapper.append(element('div', { className: 'action-row' }, [action]));
  return wrapper;
}

function createWorkspace(data, { raw = false, comparison = false, initialQuery = '' } = {}) {
  const shell = element('div', { className: 'workspace-shell' });
  const rail = createSectionRail(data.sections);
  const main = element('div', { className: 'workspace-main' });
  const toolbar = createToolbar({ raw, comparison });
  main.append(toolbar);

  if (raw) main.append(createRawBanner());
  else if (comparison) main.append(createComparisonBanner());

  const noResult = element('section', { className: 'empty-search', id: 'empty-search', hidden: true, 'aria-labelledby': 'empty-search-title' }, [
    element('h2', { id: 'empty-search-title', text: 'No visible matches' }),
    element('p', { text: 'Try a different term or clear the search to restore the full report.' }),
  ]);
  const noResultClear = button('Clear search', 'button button--secondary');
  noResultClear.addEventListener('click', clearSearch);
  noResult.append(noResultClear);
  main.append(noResult);

  const documentView = raw ? createRawDocument() : createReportDocument(data, { comparison });
  main.append(documentView);
  shell.append(rail, main);

  queueMicrotask(() => {
    bindWorkspaceInteractions(data.sections);
    const input = document.querySelector('#workspace-search');
    if (input && !raw) {
      input.value = initialQuery;
      applySearch(initialQuery);
    }
  });
  return shell;
}

function createSectionRail(sections) {
  const rail = element('aside', { className: 'section-rail', 'aria-labelledby': 'section-rail-title' }, [
    element('h2', { id: 'section-rail-title', text: 'Sections' }),
  ]);
  rail.append(createSectionNav(sections, 'desktop-section-nav'));
  return rail;
}

function createSectionNav(sections, id) {
  const nav = element('nav', { id, 'aria-label': 'Report sections' });
  sections.forEach((section, index) => {
    const link = button(section.title, 'section-link', {
      'data-section-target': section.id,
      'aria-current': index === 0 ? 'true' : 'false',
    });
    nav.append(link);
  });
  return nav;
}

function createToolbar({ raw, comparison }) {
  const toolbar = element('section', { className: 'workspace-toolbar', 'aria-label': 'Report tools' });
  const primary = element('div', { className: 'toolbar-primary' });

  const sectionsButton = button('Sections', 'button button--secondary sections-trigger', {
    id: 'sections-trigger',
    'aria-haspopup': 'dialog',
  });
  primary.append(sectionsButton);

  const searchLabel = element('label', { className: 'search-field' }, [
    element('span', { text: comparison ? 'Search comparison content' : 'Search visible report content' }),
  ]);
  const searchInput = element('input', {
    id: 'workspace-search',
    type: 'search',
    autocomplete: 'off',
    placeholder: raw ? 'Unavailable in Raw Local View' : 'Search visible fields and tables',
    'aria-describedby': raw ? 'raw-action-explanation' : 'search-status',
    disabled: raw,
  });
  searchLabel.append(searchInput);
  primary.append(searchLabel);

  const clear = button('Clear search', 'button button--plain', { id: 'clear-search', hidden: true });
  primary.append(clear);

  const desktopActions = element('div', { className: 'desktop-actions toolbar-group', 'aria-label': 'Report actions' });
  if (comparison) {
    desktopActions.append(actionButton('Export comparison', 'export', false), actionButton('Exit comparison', 'exit-comparison', false));
  } else if (raw) {
    desktopActions.append(
      actionButton('Copy section', 'copy', true, 'raw-action-explanation'),
      actionButton('Export', 'export', true, 'raw-action-explanation'),
      actionButton('Return to Sanitized View', 'return-sanitized', false),
    );
  } else {
    desktopActions.append(actionButton('Copy section', 'copy', false), actionButton('Export', 'export', false), actionButton('Compare', 'compare', false));
  }
  primary.append(desktopActions);
  toolbar.append(primary);

  const secondary = element('div', { className: 'toolbar-secondary' });
  if (raw) {
    secondary.append(element('p', {
      id: 'raw-action-explanation',
      className: 'search-status',
      text: 'Structured search, copy, export, and comparison are unavailable in Raw Local View.',
    }));
  } else {
    secondary.append(element('p', {
      id: 'search-status',
      className: 'search-status',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      text: 'Search inactive. Search covers visible synthetic content only.',
    }));
  }

  const actionsTrigger = button('Actions', 'button button--secondary mobile-actions-trigger', {
    id: 'actions-trigger',
    'aria-controls': 'action-popover',
    'aria-expanded': 'false',
  });
  secondary.append(actionsTrigger);
  toolbar.append(secondary);

  const movement = element('div', { className: 'search-movement', id: 'search-movement', hidden: true });
  movement.append(
    createMovementGroup('Matching sections', 'section'),
    createMovementGroup('Exact matches', 'exact'),
  );
  toolbar.append(movement);
  return toolbar;
}

function actionButton(label, action, disabled = false, describedBy = null) {
  return button(label, 'button button--secondary', {
    'data-action': action,
    disabled,
    'aria-describedby': describedBy,
  });
}

function createMovementGroup(label, kind) {
  return element('div', { className: 'movement-group', role: 'group', 'aria-labelledby': `${kind}-movement-label` }, [
    element('span', { className: 'movement-group__label', id: `${kind}-movement-label`, text: label }),
    button('Previous', 'button button--secondary', { id: `${kind}-previous`, 'aria-disabled': 'true' }),
    element('span', { className: 'movement-position', id: `${kind}-position`, text: '0 of 0' }),
    button('Next', 'button button--secondary', { id: `${kind}-next`, 'aria-disabled': 'true' }),
  ]);
}

function createRawBanner() {
  const banner = element('section', { className: 'mode-banner mode-banner--raw', 'aria-labelledby': 'raw-banner-title' }, [
    element('h2', { id: 'raw-banner-title', text: 'Raw Local View — not uploaded' }),
    element('p', { text: 'This explicit local mode may include identifiers in a real report. The prototype below remains entirely synthetic.' }),
  ]);
  const returnButton = actionButton('Return to Sanitized View', 'return-sanitized', false);
  banner.append(element('div', { className: 'action-row' }, [returnButton]));
  return banner;
}

function createComparisonBanner() {
  const banner = element('section', { className: 'mode-banner', 'aria-labelledby': 'comparison-mode-title' }, [
    element('h2', { id: 'comparison-mode-title', text: 'Multi-Report Comparison' }),
    element('p', { text: 'Generated comparison content is sanitized only. Original tables, raw text, and setup-only labels are excluded.' }),
  ]);
  const identities = element('div', { className: 'comparison-identities', 'aria-label': 'Compared reports' }, [
    element('div', { className: 'comparison-identity' }, [
      element('strong', { text: 'Report 1' }),
      element('span', { text: 'App Crash .ips · sanitized' }),
    ]),
    element('div', { className: 'comparison-identity' }, [
      element('strong', { text: 'Report 2' }),
      element('span', { text: 'App Crash .ips · sanitized' }),
    ]),
  ]);
  banner.append(identities);
  return banner;
}

function createReportDocument(data, { comparison = false } = {}) {
  const documentView = element('article', { className: 'report-document', 'aria-labelledby': 'document-title' });
  documentView.append(element('header', { className: 'document-header' }, [
    element('h1', { id: 'document-title', text: data.title, tabindex: '-1' }),
    element('p', { text: comparison ? 'App Crash .ips · two reports · sanitized comparison' : 'App Crash .ips · sanitized demonstration data' }),
  ]));

  data.sections.forEach((section) => documentView.append(createReportSection(section)));
  return documentView;
}

function createReportSection(section) {
  const wrapper = element('section', {
    className: 'report-section',
    id: `section-${section.id}`,
    'data-section-id': section.id,
    'aria-labelledby': `section-title-${section.id}`,
  });
  const heading = element('div', { className: 'report-section__heading' }, [
    element('h2', { id: `section-title-${section.id}`, text: section.title, 'data-searchable': 'true', tabindex: '-1' }),
    actionButton('Copy', 'copy', false),
  ]);
  wrapper.append(heading);

  if (section.summary) wrapper.append(element('p', { className: 'section-summary', text: section.summary, 'data-searchable': 'true' }));

  if (section.fields) {
    const list = element('dl', { className: 'field-list' });
    section.fields.forEach(([label, value]) => {
      list.append(element('div', { className: 'field-row' }, [
        element('dt', { text: label, 'data-searchable': 'true' }),
        element('dd', { text: value, 'data-searchable': 'true', className: isTechnical(value) ? 'technical' : '' }),
      ]));
    });
    wrapper.append(list);
  }

  if (section.table) wrapper.append(createTable(section.table));
  return wrapper;
}

function createTable(tableData) {
  const region = element('div', { className: 'table-region', role: 'region', tabindex: '0', 'aria-label': `${tableData.caption}; scroll horizontally for more columns` });
  const table = element('table');
  table.append(element('caption', { text: tableData.caption, 'data-searchable': 'true' }));
  const headerRow = element('tr');
  tableData.columns.forEach((column) => headerRow.append(element('th', { scope: 'col', text: column, 'data-searchable': 'true' })));
  table.append(element('thead', {}, [headerRow]));
  const body = element('tbody');
  tableData.rows.forEach((row) => {
    const tr = element('tr', { 'data-search-row': 'true' });
    row.forEach((value) => tr.append(element('td', { text: value, 'data-searchable': 'true', className: isTechnical(value) ? 'technical' : '' })));
    body.append(tr);
  });
  table.append(body);
  region.append(table);
  return region;
}

function createRawDocument() {
  const documentView = element('article', { className: 'report-document', 'aria-labelledby': 'document-title' });
  documentView.append(element('header', { className: 'document-header' }, [
    element('h1', { id: 'document-title', text: 'Synthetic raw report preview', tabindex: '-1' }),
    element('p', { text: 'Local-only mode · structured actions unavailable' }),
  ]));
  const section = element('section', { className: 'report-section', id: 'section-raw', 'aria-labelledby': 'section-title-raw' }, [
    element('div', { className: 'report-section__heading' }, [
      element('h2', { id: 'section-title-raw', text: 'Raw local text', tabindex: '-1' }),
    ]),
    element('p', { className: 'section-summary', text: 'Synthetic text demonstrates mode treatment without using real report data.' }),
    element('pre', { className: 'technical', text: '{\n  "bug_type": "309",\n  "process": "ExampleNotes",\n  "exception": "EXC_BAD_ACCESS",\n  "note": "synthetic prototype content only"\n}' }),
  ]);
  documentView.append(section);
  return documentView;
}

function isTechnical(value) {
  return /0x[0-9a-f]+|\barm64|\bEXC_|\bKERN_|\bSIG/i.test(String(value));
}

function bindWorkspaceInteractions(sections) {
  const sectionsTrigger = document.querySelector('#sections-trigger');
  sectionsTrigger?.addEventListener('click', () => openSectionDialog(sectionsTrigger, sections));

  document.querySelector('#clear-search')?.addEventListener('click', clearSearch);
  document.querySelector('#workspace-search')?.addEventListener('input', (event) => applySearch(event.currentTarget.value));
  document.querySelector('#section-previous')?.addEventListener('click', () => moveSectionMatch(-1));
  document.querySelector('#section-next')?.addEventListener('click', () => moveSectionMatch(1));
  document.querySelector('#exact-previous')?.addEventListener('click', () => moveExactMatch(-1));
  document.querySelector('#exact-next')?.addEventListener('click', () => moveExactMatch(1));

  document.querySelectorAll('[data-section-target]').forEach((control) => control.addEventListener('click', () => navigateToSection(control.dataset.sectionTarget, control)));
  document.querySelectorAll('[data-action]').forEach((control) => control.addEventListener('click', () => runAction(control.dataset.action, control)));

  const actionsTrigger = document.querySelector('#actions-trigger');
  actionsTrigger?.addEventListener('click', () => toggleActionPopover(actionsTrigger));
}

function openSectionDialog(trigger, sections) {
  state.sectionDialogTrigger = trigger;
  mobileSectionNav.replaceChildren(...Array.from(createSectionNav(sections, 'mobile-section-list').children));
  mobileSectionNav.querySelectorAll('[data-section-target]').forEach((control) => {
    control.addEventListener('click', () => navigateToSection(control.dataset.sectionTarget, control));
  });
  sectionDialog.showModal();
  mobileSectionNav.querySelector('[aria-current="true"]')?.focus();
}

function navigateToSection(sectionId, sourceControl) {
  const target = document.querySelector(`#section-${CSS.escape(sectionId)}`);
  if (!target) return;
  setCurrentSection(sectionId);
  if (sectionDialog.open) sectionDialog.close();
  target.querySelector('h2')?.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  if (sourceControl.closest('#mobile-section-nav')) state.sectionDialogTrigger = null;
}

function setCurrentSection(sectionId) {
  document.querySelectorAll('[data-section-target]').forEach((control) => {
    control.setAttribute('aria-current', control.dataset.sectionTarget === sectionId ? 'true' : 'false');
  });
}

function toggleActionPopover(trigger) {
  if (!actionPopover.hidden) {
    closeActionPopover(true);
    return;
  }
  state.actionTrigger = trigger;
  const raw = state.scenario === 'raw';
  const comparison = state.scenario === 'comparison';
  const actions = comparison
    ? [actionButton('Export comparison', 'export'), actionButton('Exit comparison', 'exit-comparison')]
    : raw
      ? [actionButton('Copy section', 'copy', true, 'raw-action-explanation'), actionButton('Export', 'export', true, 'raw-action-explanation')]
      : [actionButton('Copy section', 'copy'), actionButton('Export report', 'export'), actionButton('Compare reports', 'compare')];
  actionPopover.replaceChildren(...actions);
  if (raw) actionPopover.append(element('p', { className: 'disabled-explanation', text: 'Structured actions stay unavailable in Raw Local View.' }));
  actionPopover.querySelectorAll('[data-action]').forEach((control) => control.addEventListener('click', () => runAction(control.dataset.action, control)));
  actionPopover.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  actionPopover.querySelector('button:not(:disabled)')?.focus();
}

function closeActionPopover(returnFocus = false) {
  actionPopover.hidden = true;
  state.actionTrigger?.setAttribute('aria-expanded', 'false');
  if (returnFocus) state.actionTrigger?.focus();
}

function runAction(action, control) {
  if (control.disabled) return;
  if (action === 'compare') changeScenario('comparison', true);
  else if (action === 'exit-comparison' || action === 'return-sanitized') changeScenario('report', true);
  else announceAction(action === 'copy' ? 'Visible synthetic section copied in the prototype.' : 'Synthetic sanitized export prepared in the prototype.');
  closeActionPopover(false);
}

function announceAction(message) {
  const status = document.querySelector('#search-status');
  if (status) status.textContent = message;
}

function applySearch(rawQuery) {
  const query = String(rawQuery ?? '').trim();
  state.query = query;
  state.currentSectionMatch = 0;
  state.currentExactMatch = 0;
  clearHighlights();

  const status = document.querySelector('#search-status');
  const movement = document.querySelector('#search-movement');
  const clear = document.querySelector('#clear-search');
  const empty = document.querySelector('#empty-search');
  const sections = Array.from(document.querySelectorAll('.report-section[data-section-id]'));
  const rows = Array.from(document.querySelectorAll('[data-search-row]'));

  sections.forEach((section) => { section.hidden = false; });
  rows.forEach((row) => { row.hidden = false; });

  if (!query) {
    if (status) status.textContent = 'Search inactive. Search covers visible synthetic content only.';
    if (movement) movement.hidden = true;
    if (clear) clear.hidden = true;
    if (empty) empty.hidden = true;
    updateMovementControls([], []);
    return;
  }

  document.querySelectorAll('[data-searchable="true"]').forEach((node) => highlightText(node, query));
  const marks = Array.from(document.querySelectorAll('mark[data-search-match="true"]'));
  const matchingSections = sections.filter((section) => section.querySelector('mark[data-search-match="true"]'));
  sections.forEach((section) => { section.hidden = !matchingSections.includes(section); });
  rows.forEach((row) => { row.hidden = !row.querySelector('mark[data-search-match="true"]'); });

  if (status) {
    status.textContent = marks.length
      ? `${marks.length} visible ${marks.length === 1 ? 'match' : 'matches'} in ${matchingSections.length} ${matchingSections.length === 1 ? 'section' : 'sections'}. Search covers synthetic sanitized content.`
      : 'No visible matches. Search covers synthetic sanitized content.';
  }
  if (movement) movement.hidden = marks.length === 0;
  if (clear) clear.hidden = false;
  if (empty) empty.hidden = marks.length > 0;

  updateMovementControls(matchingSections, marks);
  if (marks[0]) marks[0].dataset.current = 'true';
}

function highlightText(node, query) {
  const source = node.textContent ?? '';
  const normalized = source.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  let cursor = 0;
  let matchStart = normalized.indexOf(normalizedQuery);
  if (matchStart < 0) return;

  const fragment = document.createDocumentFragment();
  while (matchStart >= 0) {
    if (matchStart > cursor) fragment.append(document.createTextNode(source.slice(cursor, matchStart)));
    fragment.append(element('mark', {
      text: source.slice(matchStart, matchStart + query.length),
      'data-search-match': 'true',
      tabindex: '-1',
    }));
    cursor = matchStart + query.length;
    matchStart = normalized.indexOf(normalizedQuery, cursor);
  }
  if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));
  node.replaceChildren(fragment);
}

function clearHighlights() {
  document.querySelectorAll('mark[data-search-match="true"]').forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent ?? '')));
}

function updateMovementControls(sections, marks) {
  updateMovementGroup('section', state.currentSectionMatch, sections.length);
  updateMovementGroup('exact', state.currentExactMatch, marks.length);
}

function updateMovementGroup(kind, index, count) {
  const previous = document.querySelector(`#${kind}-previous`);
  const next = document.querySelector(`#${kind}-next`);
  const position = document.querySelector(`#${kind}-position`);
  if (!previous || !next || !position) return;
  const previousUnavailable = count === 0 || index <= 0;
  const nextUnavailable = count === 0 || index >= count - 1;
  previous.setAttribute('aria-disabled', String(previousUnavailable));
  next.setAttribute('aria-disabled', String(nextUnavailable));
  position.textContent = count ? `${index + 1} of ${count}` : '0 of 0';
}

function moveSectionMatch(delta) {
  const sections = Array.from(document.querySelectorAll('.report-section[data-section-id]:not([hidden])'));
  const nextIndex = state.currentSectionMatch + delta;
  if (nextIndex < 0 || nextIndex >= sections.length) return;
  state.currentSectionMatch = nextIndex;
  const target = sections[nextIndex];
  setCurrentSection(target.dataset.sectionId);
  target.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  updateMovementGroup('section', state.currentSectionMatch, sections.length);
}

function moveExactMatch(delta) {
  const marks = Array.from(document.querySelectorAll('mark[data-search-match="true"]'));
  const nextIndex = state.currentExactMatch + delta;
  if (nextIndex < 0 || nextIndex >= marks.length) return;
  marks[state.currentExactMatch]?.removeAttribute('data-current');
  state.currentExactMatch = nextIndex;
  const target = marks[nextIndex];
  target.dataset.current = 'true';
  target.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  updateMovementGroup('exact', state.currentExactMatch, marks.length);
}

function clearSearch() {
  const input = document.querySelector('#workspace-search');
  if (!input) return;
  input.value = '';
  applySearch('');
  input.focus();
}

function prefersReducedMotion() {
  return reduceMotion.checked || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function renderScenario({ focusMain = false } = {}) {
  closeActionPopover(false);
  if (sectionDialog.open) sectionDialog.close();
  app.replaceChildren(createAppBar({
    report: ['report', 'search', 'noresult', 'raw'].includes(state.scenario) ? reportData : state.scenario === 'comparison' ? comparisonData : null,
    raw: state.scenario === 'raw',
    comparison: state.scenario === 'comparison',
  }));

  if (state.scenario === 'import') app.append(createImportState());
  else if (state.scenario === 'error') app.append(createImportState({ showMessages: true }));
  else if (state.scenario === 'comparison') app.append(createWorkspace(comparisonData, { comparison: true }));
  else if (state.scenario === 'raw') app.append(createWorkspace(rawData, { raw: true }));
  else {
    const initialQuery = state.scenario === 'search' ? 'memory' : state.scenario === 'noresult' ? 'not-present' : '';
    app.append(createWorkspace(reportData, { initialQuery }));
  }

  document.title = `${scenarioSelect.selectedOptions[0]?.textContent ?? 'Prototype'} — Inspector Workspace Prototype`;
  if (focusMain) queueMicrotask(() => document.querySelector('#document-title, #import-title')?.focus?.());
}

function changeScenario(scenario, focusMain = false) {
  if (!scenarioSelect.querySelector(`option[value="${CSS.escape(scenario)}"]`)) return;
  state.scenario = scenario;
  scenarioSelect.value = scenario;
  updateUrl();
  renderScenario({ focusMain });
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('scenario', state.scenario);
  url.searchParams.set('theme', themeSelect.value);
  history.replaceState(null, '', url);
}

function initializeReviewControls() {
  const params = new URLSearchParams(location.search);
  const requestedScenario = params.get('scenario');
  state.scenario = scenarioSelect.querySelector(`option[value="${CSS.escape(requestedScenario ?? '')}"]`) ? requestedScenario : 'import';
  scenarioSelect.value = state.scenario;
  themeSelect.value = document.documentElement.dataset.theme;

  scenarioSelect.addEventListener('change', () => {
    changeScenario(scenarioSelect.value);
    scenarioSelect.focus();
  });
  themeSelect.addEventListener('change', () => {
    document.documentElement.dataset.theme = themeSelect.value;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeSelect.value === 'dark' ? '#000000' : '#f5f5f7');
    updateUrl();
    themeSelect.focus();
  });

  const simulations = [
    [reduceMotion, 'reducedMotion'],
    [reduceTransparency, 'reducedTransparency'],
    [increaseContrast, 'increasedContrast'],
    [forceColors, 'forcedColors'],
  ];
  simulations.forEach(([control, datasetKey]) => control.addEventListener('change', () => {
    document.documentElement.dataset[datasetKey] = String(control.checked);
  }));
}

closeSectionDialogButton.addEventListener('click', () => sectionDialog.close());
sectionDialog.addEventListener('close', () => {
  if (state.sectionDialogTrigger) state.sectionDialogTrigger.focus();
});

document.addEventListener('pointerdown', (event) => {
  if (!actionPopover.hidden && !actionPopover.contains(event.target) && event.target !== state.actionTrigger) closeActionPopover(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !actionPopover.hidden) {
    event.preventDefault();
    closeActionPopover(true);
  }
});

initializeReviewControls();
renderScenario();

window.__prototypeAudit = Object.freeze({
  getResults() {
    const hiddenSearchCount = countVisibleMatches(HIDDEN_HELPER_VALUE);
    const exposed = document.documentElement.textContent.includes(HIDDEN_HELPER_VALUE)
      || Array.from(document.querySelectorAll('*')).some((node) => Array.from(node.attributes).some((attribute) => attribute.value.includes(HIDDEN_HELPER_VALUE)));
    return Object.freeze({
      hiddenSearchCount,
      hiddenValueExposed: exposed,
      externalResourceCount: document.querySelectorAll('link[href^="http"], script[src^="http"], img[src^="http"]').length,
      productionImportCount: document.querySelectorAll('script[src*="/src/"], link[href*="styles/main.css"]').length,
      scenario: state.scenario,
      theme: document.documentElement.dataset.theme,
    });
  },
});

function countVisibleMatches(query) {
  const normalized = String(query).toLocaleLowerCase();
  return Array.from(document.querySelectorAll('[data-searchable="true"]')).reduce((count, node) => {
    const text = (node.textContent ?? '').toLocaleLowerCase();
    let cursor = text.indexOf(normalized);
    let matches = count;
    while (cursor >= 0) {
      matches += 1;
      cursor = text.indexOf(normalized, cursor + normalized.length);
    }
    return matches;
  }, 0);
}
