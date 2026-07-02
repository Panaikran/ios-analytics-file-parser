# AGENTS.md

# iOS Analytics File Parser

Read this file before making changes.

## Core Principles

- Think before coding.
- Prefer the simplest solution that satisfies the task.
- Make narrow, surgical changes.
- Do not refactor unrelated code.
- Preserve the existing architecture unless explicitly requested.
- Keep parser families independent.
- Finish the current roadmap milestone before expanding scope.

## Project Philosophy

Always preserve:

- Local-first
- Privacy-first
- Static browser application
- No backend
- No uploads
- No analytics
- No cloud storage
- No report persistence

## Parser Rules

- One parser per diagnostic family.
- Do not merge parsers into a mega-parser.
- Freeze completed parsers unless fixing a verified bug.
- Do not add new parser families unless the roadmap explicitly requires them.

## Verification

Run relevant validation before reporting completion:

```powershell
npm.cmd test
node --check <modified-js-file>
git diff --check
```

If `service-worker.js` changes:

```powershell
node --check service-worker.js
```

## Browser QA

When UI, CSS, rendering, or the service worker changes, verify:

- parsing
- search
- copy
- section navigation
- mobile layout
- privacy mode
- Clear Report
- offline shell (if affected)

## Common Gotchas

- Update the service-worker precache when new production modules are added.
- Bump the cache version when precached assets change.
- Do not claim planned features are implemented.
- Keep explanation wording cautious; never claim an exact root cause.
- Preserve the existing `SectionModel[]` contract unless explicitly redesigning it.

## Task-Specific Documentation

Read these before working:

- `ROADMAP.md` — milestone planning and scope.
- `README.md` — supported features and user documentation.
- `CHANGELOG.md` — release history.
- `PHASE_*_SUMMARY.md` — milestone summaries.
- `PLANS.md` (if present) — planning workflow.
- `ARCHITECTURE.md` (if present) — architecture details.

If documentation and implementation disagree, report the mismatch instead of guessing.
