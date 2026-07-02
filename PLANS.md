# Project Planning Workflow

This document describes how development work is planned and landed in this
repository. It is a workflow guide, not a roadmap. Use `ROADMAP.md` for
milestone scope and release sequencing.

## Development Principles

- Keep the app static, local-first, and privacy-first.
- Prefer small slices over broad rewrites.
- Preserve parser behavior unless a verified bug requires a fix.
- Keep parser families independent.
- Keep sanitized output as the default and raw local view as opt-in.
- Do not add backend, analytics, cloud storage, report persistence, or release
  actions unless explicitly approved.

## Typical Lifecycle

```text
Planning
  -> Review
  -> Implementation by slice
  -> Validation
  -> Browser QA
  -> Documentation
  -> Commit
  -> Tag / Release
```

Tagging and publishing are separate release actions. They require an explicit
user request.

## Planning

Planning happens before implementation when work affects user-visible behavior,
release scope, parser routing, privacy, PWA behavior, or documentation.

Planning should answer:

- What milestone does this belong to?
- What is in scope?
- What is explicitly out of scope?
- What files are likely to change?
- What behavior must remain unchanged?
- What validation proves the slice is complete?
- What risks or blockers could stop the slice?

Planning should not quietly expand the roadmap. If a useful idea is outside the
active milestone, document it as future work instead of implementing it.

## Review

Before editing, review the narrowest useful set of files:

- `AGENTS.md` for local working rules.
- `ROADMAP.md`, `CHANGELOG.md`, and phase summaries for milestone context.
- `ARCHITECTURE.md` for the current implementation model.
- The specific source files owned by the slice.
- Existing tests that protect the touched behavior.

If documentation and implementation disagree, stop and report the mismatch
instead of guessing.

## Slice-Based Implementation

Each slice should be independently understandable and verifiable.

Good slices usually follow this shape:

1. Add or adjust tests when behavior changes.
2. Make the smallest production change that satisfies the slice.
3. Update service-worker cache metadata when precached assets change.
4. Run focused validation.
5. Report files changed, behavior changed, validation, and remaining risks.

Avoid:

- Broad refactors.
- Parser cleanups unrelated to the slice.
- New parser families outside roadmap scope.
- UI redesign during hardening slices.
- Documentation claims for work that has not landed.

## Testing Philosophy

The primary automated test entrypoint is:

```powershell
npm.cmd test
```

Use focused static checks when files change:

```powershell
node --check <modified-js-file>
node --check tests\parser.test.js
git diff --check
```

When `service-worker.js` changes, also run:

```powershell
node --check service-worker.js
```

Tests should protect real behavior:

- Parser classification and routing.
- `parseInput(text, options) -> SectionModel[]`.
- Sanitized default output.
- Raw local mode boundaries.
- Search and copy behavior.
- Large-report table caps and visibility.
- PWA cache allowlist and no-runtime-cache rules.

Do not weaken assertions just to make a failing test pass. If a test is wrong,
document why before changing it.

## Browser QA

Run browser QA when changes touch UI, CSS, rendering, search, copy, privacy
controls, service-worker behavior, or PWA/offline behavior.

At minimum, verify:

- App load.
- Example load where examples exist.
- File picker.
- Paste flow.
- Section navigation.
- Search.
- Copy.
- Privacy toggle and raw local view.
- Clear Report.
- Explanation sections where applicable.
- Dense tables and table controls.
- Mobile widths relevant to the slice.
- Service-worker registration and offline shell when affected.

Browser QA should report what was actually tested. If Safari or Mobile Safari
cannot be run in the current environment, say so.

## Documentation Updates

Documentation updates usually happen after implementation and QA, not before.

Use these boundaries:

- `README.md`: user-facing capabilities and usage.
- `ROADMAP.md`: planned and completed milestone scope.
- `CHANGELOG.md`: release notes for completed work only.
- `PHASE_*_SUMMARY.md`: milestone summaries and validation evidence.
- `PLANS.md`: development workflow.
- `ARCHITECTURE.md`: implementation architecture.

Do not claim support for unsupported parser families or future features.

## Release Readiness

A release-readiness pass should confirm:

- Automated validation passes.
- Browser QA passes or known limitations are documented.
- Privacy expectations are still true.
- Service-worker and PWA behavior are verified when relevant.
- Documentation matches implemented behavior.
- No release blockers remain.
- Working tree state is understood before any tag or release.

Useful commands:

```powershell
npm.cmd test
git diff --check
git status --short
```

A clean working tree is required before tagging or publishing.

## Commit And Release Workflow

Commits should be slice-sized and describe completed work.

Before committing:

- Review the diff.
- Confirm no unrelated files were edited.
- Confirm validation passed.
- Confirm docs were updated when the slice requires docs.

Do not create tags, GitHub releases, package version changes, or publishing
actions unless the user explicitly asks for that release action.

