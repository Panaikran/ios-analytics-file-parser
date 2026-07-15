# v2.0 Inspector Workspace Prototype

## Purpose

This isolated Slice 20A prototype makes the approved v2.0 Inspector Workspace
reviewable before any production implementation begins. It demonstrates the
calm import state, parsed-report workspace, search and exact-match navigation,
comparison, Raw Local View, responsive layouts, themes, restrained control
materials, and accessibility preference fallbacks.

This is not production code. It is not imported by the application, linked
from the production entry point, or included in the service-worker cache.

## Isolation and data

- All report and comparison content is synthetic and sanitized.
- No parser, report file, pasted report, or real report data is processed.
- No application data request, upload, analytics, telemetry, persistence, or
  external resource request is made.
- The only loaded resources are the three local prototype files.
- No package, dependency, build step, or production module is used.

## Files

- `index.html` — semantic prototype shell and review controls.
- `styles.css` — approved tokens, responsive layouts, materials, and fallbacks.
- `prototype.js` — synthetic scenarios and dependency-free interactions.
- `README.md` — review and operating notes.

## Open the prototype

Directly open `index.html`, or use the bundled/system Python runtime only as a
local static server (Python is not a project dependency):

```powershell
python -m http.server 4173 --directory prototypes/v2-inspector-workspace
```

Then open `http://localhost:4173/`.

## Scenarios

- `?scenario=import` — calm import state.
- `?scenario=report` — parsed-report Inspector Workspace.
- `?scenario=search` — active visible search with non-wrapping navigation.
- `?scenario=noresult` — recoverable no-result state.
- `?scenario=comparison` — sanitized-only Multi-Report Comparison.
- `?scenario=raw` — distinct Raw Local View with structured actions disabled.
- `?scenario=error` — unsupported-file warning and recoverable parse error.

Add `&theme=light` or `&theme=dark`. The clearly separated **Prototype review
controls** also switch scenarios and simulate reduced motion, reduced
transparency, increased contrast, and forced colors.

## Review checklist

- [ ] Import hierarchy is calm, compact, and utility-first.
- [ ] Desktop uses a section rail plus opaque report canvas.
- [ ] Mobile uses a modal Sections control rather than stacked desktop nav.
- [ ] Search labels, counts, highlights, boundaries, focus, and Clear Search are coherent.
- [ ] Comparison remains sanitized-only and has an obvious exit.
- [ ] Raw Local View is distinct without looking destructive or alarming.
- [ ] Light and dark themes preserve hierarchy and contrast.
- [ ] Glass is limited to navigation, toolbar, menu, and transient chrome.
- [ ] Typography, density, geometry, spacing, and motion feel restrained.
- [ ] Keyboard, focus, 200% zoom, touch targets, tables, and preference modes remain usable.

## Known prototype limitations

- Import, copy, and export actions demonstrate state feedback only; they do not
  access files, the clipboard, or create downloads.
- Synthetic content covers representative density, not every released parser family.
- Theme and accessibility simulation controls are prototype-only and are not an
  approval of production settings UI.
- The forced-colors checkbox is an approximation; the native
  `forced-colors: active` media query is also implemented for real browser testing.
- Native screen-reader and physical-device results require separate manual lanes.

Slice 20A remains awaiting visual approval. Slice 20B is not started.
