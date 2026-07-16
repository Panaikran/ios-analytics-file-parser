# v2.0 Interface Design Specification

Status: `Implemented, released, and frozen`

Milestone: `v2.0.0 — Apple-Inspired Inspector Workspace`

Implementation status: completed in Phase 20 and released as `v2.0.0` on
2026-07-16. This document remains the frozen design and implementation-boundary
authority for the released workspace.

## 1. Decision Summary

The recommended direction is **Approach B — Inspector workspace** with a
progressive initial state. The application keeps a simple import experience
before parsing, then becomes a focused inspection workspace with persistent
report identity, contextual tools, section navigation, and an opaque content
canvas.

This scope justifies `v2.0.0` because it changes the information architecture,
navigation structure, visual and component systems, responsive layout strategy,
interaction hierarchy, accessibility architecture, and design-token
architecture. A color, type, spacing, or CSS-only refresh would not justify a
major version and should remain a `v1.x` proposal instead.

All parser, privacy, search, comparison, export, schema, PWA, and performance
contracts released through v1.9.0 remain frozen.

## 2. Evidence Reviewed

Repository evidence:

- `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `PLANS.md`, `ARCHITECTURE.md`,
  `AGENTS.md`, and `PHASE_19_SUMMARY.md`.
- `index.html`, `styles/main.css`, `src/main.js`, `src/ui/`, `src/search/`,
  `src/clipboard/`, `src/comparison/`, `tests/parser.test.js`,
  `tests/browserPerformanceHarness.html`, and `service-worker.js`.
- The project-specific `apple.com-DESIGN.md` attachment.
- Visual inspection of the empty state and a parsed App Crash report at a wide
  desktop viewport. Dense, search, comparison, Raw Local View, no-result,
  narrow, and wide state behavior was also traced through the existing
  renderers, fixtures, tests, and browser harness. The first reused localhost
  origin exposed a stale service-worker cache, so visual conclusions do not use
  that origin as proof of current example-catalog completeness.

Authoritative design sources:

- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple: Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
- [WWDC25: Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [WWDC25: Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Apple Human Interface Guidelines: Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [MDN: `prefers-reduced-transparency`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-transparency)

The Apple sources describe native system rendering. This web plan borrows
layering, hierarchy, restraint, and feedback principles; it does not claim to
reproduce Apple's private lensing, adaptive lighting, refraction, vibrancy, or
system material renderer.

## 3. Current Interface Findings

### Strengths to preserve

- Native semantic controls, persistent labels, a skip link, visible focus, live
  status, 44px touch targets, and reduced-motion handling are already present.
- Search, section navigation, exact-match navigation, copy, export, comparison,
  Raw Local View, and dense-table controls share the visible sanitized model.
- Tables use semantic headers, dense content is horizontally contained, and
  mobile page-level overflow is guarded.
- Privacy and offline status are explicit and the application stays local-only.

### Problems the redesign must solve

- The empty-state title reads like a marketing hero and consumes excessive
  vertical space for a working utility.
- After parsing, the full import form remains visually dominant above the
  report instead of yielding to inspection work.
- Status, privacy, comparison, search, export, and section navigation appear as
  peer-level full-width bordered panels. Their hierarchy and frequency differ,
  but their visual treatment does not.
- Section navigation is a long wrap or horizontal strip instead of a stable
  desktop navigation region and an intentional mobile navigation pattern.
- The dark-only palette and repeated card borders create a generic developer
  dashboard feeling rather than a calm inspection surface.
- Report sections, controls, status messages, and overview metrics all reuse the
  same 8px-card grammar. Dense content becomes a stack of containers rather
  than a continuous report.
- Mobile stacks most desktop controls vertically; it contains overflow but does
  not sufficiently prioritize search, section movement, mode, and actions.
- Search has two navigation groups plus count/status text, producing a large
  control block that separates the user from the matching content.
- Copy and export are clear but distributed: section copy is local while export
  is a separate full-width panel. A common action hierarchy is missing.
- The current service-worker version discipline is a migration risk: any v2
  production asset change must update the allowlist and cache version in the
  same slice, followed by an update-path test on a previously controlled origin.

## 4. Attached Design Audit

The attachment is the visual-direction authority. Its restraint, neutral
palette, blue accent, system typography, mostly flat surfaces, 4px base rhythm,
44px targets, and limited glass are retained. Corrections below normalize it
for a dense inspection utility and accessible web delivery.

| Original rule | Issue | Recommended replacement | Reason | Disposition |
| --- | --- | --- | --- | --- |
| Variable-width buttons use `border-radius: 50%` | Produces elliptical distortion and inconsistent corners | `10px` for standard buttons; `999px` only for true circular controls or a deliberately compact segmented control | Geometry stays stable across labels and scaling | Required |
| `Text Inverse` is `#000000` | Black is not inverse text on dark/colored surfaces | Light theme inverse `#FFFFFF`; dark theme inverse `#000000`, selected by semantic surface | Names describe usage, not a fixed color | Required |
| `Border Implicit: rgba(0,0,0,.56)` | Far too strong for an implicit divider | Light divider `rgba(0,0,0,.14)`; dark divider `rgba(255,255,255,.16)`; strong divider token only when needed | Reduces visual noise while keeping non-text contrast testable | Required |
| `Heading Secondary` is 34/50 while large/primary headings are 28 and 24 | Role names and scale are internally inverted | Use role-based `workspace-title`, `section-title`, `subsection-title`, `body`, `label`, `caption` tokens | Predictable semantic hierarchy | Required |
| Code uses SF Pro Text | Technical data is not monospaced | `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace` | Alignment and scanability for addresses, identifiers, and raw text | Required |
| Mobile both “increases padding” and reduces margins by 50% | Conflicting density direction | Use explicit breakpoint gutters and component-density rules | Removes interpretation during implementation | Required |
| Fixed pixel type sizes | Can resist user scaling and create brittle layout | Use `rem` and bounded `clamp()` for the initial-state title only | Supports zoom and text resizing | Required |
| Cards and all large containers are sharp while controls are broadly rounded | Overly binary geometry; conflicts with floating-control hierarchy | Continuous content canvas with dividers; `6–10px` inner data groups; `14–20px` floating chrome/popovers | Shape communicates layer and function | Required |
| Hero card has `min-height: 580px` and 48px padding | Marketing-page metric wastes inspection space | No minimum hero height; initial import region uses `24–40px` responsive padding | Utility-first density | Required |
| All sections use 40–56px separation and 24–32px internal padding | Too loose for dense diagnostic work | Comfortable initial state; compact workspace rhythm of `12–24px` | Preserves premium spacing without reducing throughput | Required |
| Desktop defaults to a generic three-column grid | Not tied to this workflow | Two-region inspector: section rail plus content, with one toolbar layer | Maps to navigation and inspection tasks | Required |
| Dark mode is described only through two dark neutrals | No complete semantic theme or interaction states | Full light and dark token maps in this document | Prevents inferred colors and inaccessible states | Required |
| `Overlay Soft` is described as muted text | Overlay and text are different semantics | Separate `scrim`, `text-secondary`, and `text-tertiary` tokens | Avoids accidental translucent text | Required |
| `#0071E3` is used for every interactive element | One accent is good, but all states/actions should not appear primary | Blue remains the sole accent; neutral buttons handle secondary actions and semantic colors handle status | Preserves restraint and hierarchy | Required |
| SF Pro is treated as a guaranteed web font | It is available on Apple systems but not universally licensed or installed for web delivery | Use the platform system stack; do not download or bundle SF Pro | Native feel without a new asset/dependency | Required |
| Clear glass is implied by broad frosted surfaces | Clear material requires media-rich content and strong foregrounds | Use regular restrained material only; no clear variant in v2.0 | Diagnostic content is not a media-rich backdrop | Required |
| Hover and focus share color changes | Hover is not a keyboard focus treatment | Dedicated focus ring plus independent hover/pressed states | WCAG-aligned input modality support | Required |
| 44px height is imposed on ordinary inline links | Inline text links are not touch-button boxes | 44px targets for standalone controls; inline links retain text flow with adequate surrounding line height | Avoids broken prose while preserving target sizing where needed | Optional |

### Traceability summary

- **Retained:** neutral-dominant atmosphere, one blue accent, system font stack,
  4px rhythm, flat content, minimum touch targets, restrained shadows, regular
  translucent navigation/control surfaces, and generous initial-state spacing.
- **Revised:** color naming, theme completeness, type roles, technical font,
  button geometry, border opacity, responsive density, workspace grid, focus,
  and material fallbacks.
- **Deferred:** a custom icon set and branded illustration. Both require a
  separate approved asset decision; text labels and existing controls suffice.
- **Rejected:** marketing hero metrics, default three-column layouts, clear
  glass, glass content cards, universal pill buttons, downloaded SF Pro fonts,
  and broad 40–56px workspace spacing.

## 5. Design Principles

1. **Content first.** Parsed report content is the largest, quietest layer.
2. **Local trust is visible.** Privacy mode and local-only processing remain
   understandable without dominating every screen.
3. **Tools stay near their effect.** Search and exact-match controls sit above
   the report; section navigation sits beside or immediately above it; section
   copy stays within each section.
4. **Progressive workspace.** Import controls lead before parsing and recede
   after parsing without becoming inaccessible.
5. **Restraint over decoration.** One accent, limited material, limited shadow,
   and no ornamental motion.
6. **Density follows task.** Desktop supports scanning and precision; mobile
   prioritizes the next useful action instead of stacking every desktop tool.
7. **Accessibility is a system property.** Semantics, contrast, focus, status,
   scaling, preference modes, and testing are defined with the visual system.
8. **Behavior remains frozen.** Visual architecture must reuse existing state,
   visible-data, privacy, copy, export, and parser contracts.

## 6. Visual Atmosphere and Layer Model

The atmosphere is calm, precise, neutral, and technically capable. Premium
quality comes from alignment, typography, hierarchy, and responsive feedback.

### Content layer

- Opaque canvas and report surfaces.
- Report sections form a continuous document separated by whitespace and
  dividers, not nested glass cards.
- Tables, charts, fields, raw notes, comparison content, and CoreAnalytics
  overview remain opaque.
- Critical and warning states use a semantic marker, label, and restrained
  surface tint; color is never the only signal.

### Control layer

- Regular-material chrome is permitted for the app bar, workspace toolbar,
  section-navigation overlay on smaller screens, menus, and transient popovers.
- At most one persistent glass plane per viewport edge. Do not stack glass on
  glass.
- Controls inside glass use fills/state layers rather than their own glass.
- Clear glass is not used in v2.0.

## 7. Color Tokens

Tokens are semantic. Implementation must measure every foreground/background
pair and interaction state; normal text targets at least 4.5:1, large text and
non-text UI boundaries at least 3:1 where WCAG permits.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | `#F5F5F7` | `#000000` | Page background |
| `--content` | `#FFFFFF` | `#1C1C1E` | Report/content canvas |
| `--content-subtle` | `#F5F5F7` | `#2C2C2E` | Inputs and grouped data |
| `--chrome` | `rgba(248,248,250,.82)` | `rgba(28,28,30,.82)` | Regular web material |
| `--chrome-solid` | `#F8F8FA` | `#1C1C1E` | Transparency fallback |
| `--text-primary` | `#1D1D1F` | `#F5F5F7` | Primary text |
| `--text-secondary` | `#515154` | `#C7C7CC` | Supporting text |
| `--text-tertiary` | `#6E6E73` | `#AEAEB2` | Noncritical metadata |
| `--text-inverse` | `#FFFFFF` | `#000000` | Text on selected accent surfaces |
| `--accent` | `#0066CC` | `#64A8FF` | Links, focus, selected state |
| `--accent-hover` | `#005BB8` | `#83B9FF` | Hover |
| `--accent-pressed` | `#004F9E` | `#9AC6FF` | Pressed |
| `--divider` | `rgba(0,0,0,.14)` | `rgba(255,255,255,.16)` | Standard divider |
| `--divider-strong` | `rgba(0,0,0,.24)` | `rgba(255,255,255,.28)` | Focused separation |
| `--critical` | `#B42318` | `#FF6961` | Error/critical plus text/icon |
| `--warning` | `#7A4D00` | `#FFD60A` | Warning plus text/icon |
| `--success` | `#147D32` | `#30D158` | Success plus text/icon |
| `--scrim` | `rgba(0,0,0,.42)` | `rgba(0,0,0,.62)` | Modal isolation |

Dark mode is a complete semantic mapping, not color inversion. Both themes
must preserve hierarchy, focus, disabled, hover, selected, warning, and error
states independently. The default follows `prefers-color-scheme`; a future
explicit theme selector is outside v2.0 unless separately approved.

## 8. Typography Tokens

Font families:

- UI and prose: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`.
- Technical data: `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace`.

| Token | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| `--type-initial-title` | `clamp(2rem, 5vw, 3rem) / 1.08` | 650 | Empty-state identity only |
| `--type-workspace-title` | `1.5rem / 1.2` | 650 | Current report/workspace |
| `--type-section-title` | `1.125rem / 1.3` | 650 | Report section headings |
| `--type-subsection` | `1rem / 1.4` | 600 | Groups and table controls |
| `--type-body` | `1rem / 1.5` | 400 | Default copy and values |
| `--type-compact` | `.875rem / 1.45` | 400 | Dense controls and summaries |
| `--type-label` | `.8125rem / 1.35` | 600 | Persistent labels |
| `--type-technical` | `.875rem / 1.5` | 400 | Addresses, identifiers, raw text |

Use `font-variant-numeric: tabular-nums` for counts, positions, addresses, and
metrics. Large headings may use slight negative tracking; body and technical
text keep normal tracking. Layout spacing uses `rem` where it must grow with
text. No body or control text is smaller than `.8125rem`; high-density data may
use `.875rem`, never tiny 10–11px text.

## 9. Spacing, Grid, Width, and Density

Spacing scale: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48px` expressed through
custom properties. `56px` is reserved for the empty-state outer rhythm, not
workspace components.

Layout:

- Initial state: centered content, maximum readable measure `44rem`; import
  surface maximum `52rem`.
- Workspace at 1024px and wider: full available width with `24–32px` gutters,
  a `15–17rem` section rail, and `minmax(0, 1fr)` report content.
- Report prose measure is limited to about 75 characters; tables and technical
  blocks may use the full content width.
- At 1440px and wider, increase outer gutters and keep the same two-region
  structure. Do not add a decorative third column.

Density:

- Comfortable: empty state, warnings, onboarding, and mode explanations.
- Standard: report fields and controls.
- Compact: tables, search positions, metadata, and desktop section navigation.
- Density changes padding and gap, never text below the defined minimum or
  target sizes below accessibility requirements.

## 10. Geometry, Borders, and Depth

Radius scale:

- `0`: continuous report surfaces and tables.
- `6px`: inline highlight and compact data grouping.
- `10px`: buttons, inputs, and ordinary controls.
- `14px`: toolbar groups and small popovers.
- `20px`: navigation sheet or large popover.
- `999px`: true circular icon controls or a deliberately compact segmented
  selection only; never ordinary labels or variable-width buttons by default.

Dividers are preferred over card borders for report structure. Use one divider
token per boundary, not borders on every nested element.

Depth scale:

- Content: none.
- Sticky chrome: `0 8px 24px rgba(0,0,0,.12)` only when content scrolls beneath.
- Popover/sheet: `0 16px 40px rgba(0,0,0,.18)` with scrim only for a modal task.
- No arbitrary shadows, glow, colored shadows, or shadow on every control.

## 11. Liquid Glass Rules and Web Fallbacks

Apple positions Liquid Glass as a distinct functional layer for navigation and
controls that defers to content. Apple also advises sparing use, no glass on
glass, regular material for general contexts, and clear material only over
media-rich content with sufficient dimming and bold foregrounds.

The web approximation may use a restrained combination such as translucent
background, `backdrop-filter: blur(20px) saturate(140%)`, border, and one shadow
on eligible chrome. It cannot reproduce Apple's lensing, adaptive foreground
polarity, refraction, environment sampling, or system motion.

Fallback order:

1. Default: regular restrained material on eligible control chrome only.
2. `@supports not (backdrop-filter: blur(1px))`: use `--chrome-solid`, no blur,
   and a divider.
3. `prefers-reduced-transparency: reduce`: use solid chrome and no blur. Because
   this media feature has limited browser availability, the design must remain
   legible when the signal is absent and offer no transparency-dependent text.
4. `prefers-contrast: more` or forced colors: use near-solid surfaces, explicit
   borders, system colors where required, and no shadow-dependent separation.
5. Print: remove glass, sticky positioning, shadows, and transient controls.

Glass is prohibited on report sections, tables, charts, comparison content,
Raw Local View, inputs containing report text, and status/error content.

## 12. Component Rules

### Buttons and inputs

- One primary action per state. Initial state: `Choose file`. Parsed state:
  search is the primary tool, not a promotional button.
- Secondary actions use neutral fills or borders. Destructive reset stays
  clearly labeled and separated.
- Press feedback begins on `:active` within 100ms through color/opacity and at
  most a subtle `scale(.98)` that does not move surrounding layout.
- Inputs keep persistent labels, native semantics, 44px minimum target height,
  16px minimum font size on mobile, and explicit focus rings.
- File input stays native. Paste remains a labeled textarea. Placeholder text
  is supplementary only.

### Search and exact-match controls

- Search occupies the central workspace toolbar after parsing.
- Search count and scope note sit directly below or within the search region,
  with one concise polite announcement per query settlement.
- Section-match and exact-match movement remain separate semantic groups, but
  share one visual control cluster with unambiguous labels and positions.
- Non-wrapping boundaries, focus retention, visible-only scope, highlight
  semantics, and the 180ms existing query settlement remain behaviorally
  unchanged unless separately approved.
- No hidden data enters a label, count, tooltip, announcement, or accessible
  description.

### Navigation

- Desktop section navigation is a sticky rail with a list of text links and a
  clear current-section indicator beyond color.
- Tablet/mobile use a labeled `Sections` control that opens a modal navigation
  sheet. The sheet has a heading, close control, Escape support, focus trap,
  focus return, and native dialog semantics where supported.
- The application does not add a hamburger menu for primary inspection tools.
  Search remains visible; less frequent actions move to a labeled Actions menu.

### Report sections, fields, and tables

- Sections form one opaque report document. A divider and heading establish
  boundaries; section copy remains aligned with its heading.
- Field lists retain `dl/dt/dd` semantics. At narrow widths values stack below
  labels; at wide widths a compact two-column definition layout remains.
- Tables retain `table`, `thead`, `th scope="col"`, and `tbody`. Each table gains
  an accessible caption or equivalent labelled association without changing
  serialized data.
- Wide tables scroll inside a labeled region with a visible overflow cue.
  Horizontal scrolling never moves the whole page. Sticky columns are allowed
  only when they do not break semantics, zoom, or keyboard reading order.
- Dense-table expansion controls keep `aria-expanded`, stable labels, and
  current behavior.

### Charts

- Charts remain opaque and data-first, with no gradient, glow, or glass.
- Canvas retains an accessible name and gains a nearby text/table summary that
  exposes the same visible data when the existing model supports it.
- Color is supplemented with labels and values. Reduced motion renders final
  state immediately.

### CoreAnalytics overview

- Replace dashboard-like statistic tiles with a compact definition summary and
  grouped facet controls.
- Facets remain native buttons using the existing search path and rendered/
  capped data only.
- The overview must not become a generic KPI dashboard.

### Comparison

- Comparison receives a persistent mode header with generic report identities,
  parser type, sanitized-only explanation, search, export, and an explicit exit.
- Setup appears as a bounded task before comparison starts; completed
  comparison content uses the same report canvas as a single report.
- Local aliases remain setup-only, in memory, and excluded from search/output.

### Raw Local View

- Raw mode uses a persistent high-contrast mode banner in the content layer,
  not glass, with the text `Raw Local View — not uploaded`.
- Structured exports remain visibly unavailable. Search and comparison
  restrictions remain unchanged.
- The return to Sanitized View is always visible in the workspace toolbar and
  never hidden only in an overflow menu.

### Empty, error, warning, copy, export, menus

- Empty state explains supported input, local privacy, examples, and the primary
  import action without a 580px hero.
- No-result state stays adjacent to search and offers `Clear search`; it does
  not replace the entire workspace.
- Errors state what happened and the recovery action, use `role="alert"` only
  for newly presented blocking errors, and preserve the input when safe.
- Copy feedback stays local to the section and uses a polite status region.
- Export actions live in a labeled Actions menu on mobile and a compact toolbar
  group on desktop; eligibility and Raw-mode explanations remain visible.
- Menus and popovers originate from their trigger, close with Escape/outside
  action, return focus, and never contain primary navigation.

## 13. Focus, Status, Keyboard, and Screen Readers

- Focus indicator: at least 2px, offset from the component, visibly distinct in
  light, dark, increased-contrast, and forced-color modes.
- DOM order matches visual order at every breakpoint. CSS reordering must not
  create a different reading order.
- Sticky chrome must never obscure the focused element; use scroll padding and
  focus-aware scrolling.
- All icon-bearing controls keep visible text or an accessible name; ordinary
  controls do not become unexplained icon-only buttons.
- Global operation status, search result status, exact-match status, comparison
  status, copy feedback, offline/update status, and errors retain distinct
  purposes. Avoid duplicate simultaneous announcements.
- Focus moves only for modal entry/exit, explicit error recovery, or a user-
  initiated navigation action where orientation improves. Filtering does not
  move focus from the search field.
- Keyboard paths preserve Tab/Shift+Tab, Enter/Space, Escape for transient
  layers, arrow keys only for native/ARIA patterns that require them, and the
  current non-wrapping Previous/Next behavior.
- Zoom to 200% and text scaling must not clip labels, hide actions, or require
  two-dimensional page scrolling.

## 14. Motion System

Motion exists only for causality, orientation, hierarchy, feedback, directness,
or continuity.

| Token | Value | Use |
| --- | --- | --- |
| `--motion-press` | `80ms ease-out` | Pressed-state feedback |
| `--motion-state` | `160ms ease-out` | Color, opacity, selection indicator |
| `--motion-popover-in` | `180ms cubic-bezier(.2,.8,.2,1)` | Opacity plus small anchored scale |
| `--motion-popover-out` | `140ms ease-in` | Reverse to trigger |
| `--motion-mode` | `200ms ease-out` | Small cross-fade between workspace modes |

Allowed: press feedback, toolbar contextual appearance, search-control state,
selection indicator, anchored menu/popover, loading completion, and concise
success/error state feedback.

Prohibited: decorative parallax, looping animation, bounce without momentum,
motion blur, sound, haptics, custom gestures, draggable panels, custom rubber
banding, and animated report-card entrances.

All motion is interruptible where reversible, does not block input, preserves
focus, and uses compositor-friendly opacity/transform. Reduced motion removes
slides, scale, elastic behavior, and smooth scrolling; state changes become
instant or a short opacity cross-fade. The interface remains understandable
with all animation disabled.

## 15. Responsive Layouts

### 320–389px

- `12px` viewport gutter plus safe-area insets; one report column.
- Compact app bar: report identity, persistent mode label, `Sections` control.
- Search occupies its own row. Exact-match controls use Previous, position,
  Next with labels that wrap without truncation.
- One visible primary action; exports and comparison setup actions move to a
  labeled Actions menu. Sanitized/Raw return remains outside that menu.
- Tables scroll in their own region with an overflow cue. Definition lists
  stack. No page-level horizontal scrolling.
- Minimum target is 44×44 CSS px with at least 8px separation.

### 390–767px

- `16px` gutter plus safe-area insets.
- Same hierarchy as the smallest range, with search and navigation controls
  allowed to share two compact rows.
- Section navigation remains a sheet, not a long horizontal pill strip.
- Comparison report identities stack with actions below, not beside, labels.

### 768–1023px

- `20–24px` gutters.
- Toolbar remains sticky; section navigation is an overlay panel opened from a
  visible Sections control.
- Report fields may use two columns; tables retain contained horizontal scroll.
- Actions may appear as a compact labeled toolbar group when space permits.

### 1024–1439px

- `24px` gutters; two-region inspector with a `15rem` sticky section rail.
- App bar and report toolbar stay available without covering content.
- Search, section-level movement, exact-match movement, mode, and actions have
  distinct groups in one control layer.
- Content uses the remaining width; no marketing max-width wastes table space.

### 1440px and wider

- `32px` gutters and up to `17rem` section rail.
- Keep two regions. Do not invent a third dashboard column.
- Report prose keeps a readable measure while tables/charts can expand.
- Increased width raises information density through alignment, not smaller
  type or additional decoration.

At every range: respect safe areas, browser zoom, landscape, software keyboard,
sticky offsets, and focus visibility. Sticky controls become static if the
available block size cannot show content and controls together.

## 16. Workflow Specifications

### Initial state

1. Compact app identity and one-sentence purpose.
2. Local-only privacy assurance in plain text with no decorative badge row.
3. Primary native file selection.
4. Secondary paste option and examples grouped below; supported formats are
   concise and expandable.
5. Install/offline status is secondary and does not sit between purpose and
   import.

### Parsed report

1. Import region collapses to a compact `Open another report` action.
2. Workspace header identifies report type and current Sanitized/Raw mode.
3. Desktop section rail and toolbar become available.
4. Search remains visible; exact-match and section movement appear only while
   a query is active.
5. Copy stays per section; export and comparison are grouped as report actions.
6. Dense inspection content begins immediately after the toolbar.

### Multi-Report Comparison

1. Setup identifies Report 1–3 and parser type; local labels remain optional.
2. Sanitized-only scope is stated before Compare.
3. Completed comparison replaces the single-report workspace content but keeps
   the same search/navigation/action hierarchy.
4. Exit comparison is explicit and returns to the loaded single report.

### Raw Local View

1. User activates the existing explicit mode control.
2. Workspace header and persistent content banner change together.
3. Structured exports and comparison remain unavailable with a visible reason.
4. `Return to Sanitized View` remains directly available.

### Search, no-result, and error

1. Input settlement filters through the existing visible model.
2. Status announces one concise result/scope update without moving focus.
3. Navigation appears contextually for results.
4. No-result stays in place with a Clear Search action.
5. Parse/file errors remain near the import controls and preserve recovery
   context.

## 17. Candidate Architecture Approaches

| Criterion | A — Visual-system refresh | B — Inspector workspace | C — Progressive workspace |
| --- | --- | --- | --- |
| User value | Better polish with familiar flow | Faster navigation and inspection with clearer tool hierarchy | Simplest initial state and strongest state transformation |
| Information hierarchy | Current stacked page remains | Import, chrome, navigation, tools, and content have distinct roles | Most tools appear contextually after each state change |
| Desktop | Single column | Sticky section rail plus report canvas and toolbar | State-specific layouts may replace large regions |
| Mobile | Improved stacking | App bar, visible search, section sheet, prioritized actions | Highly contextual sheets and changing tool sets |
| Component impact | Tokens and styling | Tokens, shell, navigation, toolbar, content presentation | Broad state-dependent component orchestration |
| Accessibility impact | Lowest regression risk; current verbosity remains | Better landmarks/wayfinding; modal sheet and sticky focus need care | Highest focus/announcement risk from frequent structural change |
| Privacy impact | Neutral | Neutral; mode remains persistent | Risk of hiding mode/scope as context changes |
| Implementation risk | Low | Moderate | High |
| Testing burden | Moderate visual regression | High responsive/workflow/a11y regression | Very high state-transition and focus regression |
| Migration risk | Low | Bounded by shell and CSS rollback | High; many states change together |
| Major-version fit | No; should be v1.x | Yes | Yes, but risk exceeds demonstrated value |

**Recommendation: Approach B.** It solves the measured hierarchy and task-flow
problems, materially changes the interface architecture, and keeps behavior
legible and testable. Approach C adds state-transition complexity without a
proven user benefit for this local utility. Approach A is insufficient for the
proposed major version.

## 18. Accessibility Architecture and Test Plan

Design acceptance requires:

- Sequential headings and stable landmarks for app header, import, workspace
  navigation, tools, report content, and status.
- Correct role/name/state/value for every control, including selected sections,
  expanded groups, disabled boundaries, mode, and menus.
- Persistent form labels, linked help/errors, preserved input, and recovery
  focus for invalid file/paste states.
- Polite result, mode, copy, comparison, export, offline, and success updates;
  assertive alerts only for new blocking errors.
- Table caption/label, column headers, sensible reading order, and no layout
  tables.
- Contrast, non-text contrast, visible focus, no color-only state, 200% zoom,
  text scaling, reduced motion, reduced transparency, increased contrast, and
  forced colors.
- No hidden/raw/capped-out/local-alias/parser-private data in visual or
  accessible output.

Test order for every UI slice:

1. Existing Node/assert regression suite and static contract checks.
2. Focused browser automation on changed surfaces at all five width ranges.
3. Keyboard-only journey for import, search, navigation, copy/export,
   comparison, Raw return, dense tables, menus, Clear Search, and Clear Report.
4. Browser accessibility-tree inventory for names, roles, states, headings,
   landmarks, live regions, and tables.
5. Native screen-reader smoke pass when an environment is available; otherwise
   record the lane as unavailable and do not claim it.
6. 200% zoom/reflow, large text, dark/light, reduced motion, reduced
   transparency where supported, increased contrast, and forced colors.

## 19. Prototype Strategy and Approval Gates

No prototype is created by this planning task.

After approval, use a separate non-production branch and an isolated
browser-based design-system showcase with sanitized or synthetic fixture data.
It may import presentational helpers but must not change or duplicate parser
logic. Validate empty, App Crash, dense CoreAnalytics, Stackshot, search and
exact match, comparison, Raw Local View, copy/export, no-result, error, mobile,
and desktop states.

Approval gates:

1. **Structure gate:** wireframes approve initial state, two-region desktop,
   section sheet, toolbar hierarchy, comparison, and Raw mode.
2. **Visual gate:** light/dark tokens, type, density, geometry, dividers, and
   regular-material scope pass contrast and anti-slop review.
3. **Interaction gate:** keyboard, focus, announcements, exact navigation,
   menus, responsive actions, and preference fallbacks work in the prototype.
4. **Performance gate:** blur/material, sticky chrome, dense tables, and state
   changes stay within existing budgets and do not create page overflow.
5. **Implementation authorization:** only after gates 1–4 are recorded may the
   first production slice begin.

## 20. Design Freeze

The following decisions are resolved and frozen before implementation:

- Approach B inspector workspace and progressive initial-to-workspace change.
- Two-region desktop structure and modal section navigation below 1024px.
- Search remains visible; actions are contextual; Raw return remains direct.
- Opaque content and regular-material control chrome only; no clear glass.
- Full semantic light/dark tokens, system font, technical monospace, spacing,
  radius, divider, depth, and motion scales in this document.
- Desktop density and five responsive ranges.
- Static/cross-fade reduced motion, solid reduced-transparency fallback, and
  bordered high-contrast fallback.
- Accessibility semantics, focus, status, touch, keyboard, zoom, and testing
  requirements.

There are no unresolved major design decisions. Prototype findings may reject
a specified detail, but any replacement requires a documented design-spec
revision and approval before production implementation.

## 21. Explicit Anti-Patterns and Non-Goals

Do not add gradients, glow, rainbow accents, decorative sparkles, AI symbols,
oversized in-app heroes, statistic-tile dashboards, nested cards, glass content
sections, glass on glass, ordinary-label pills, arbitrary shadows, tiny
technical text, icon-only unlabeled controls, decorative motion, bounce,
parallax, custom gestures, sound, haptics, or desktop controls merely stacked
into a long mobile column.

The redesign does not change parser families, parser behavior, report
classification, `SectionModel[]`, sanitization, Raw Local View data handling,
comparison limits or identity, visible-only search, exact-match behavior, copy,
text export, JSON schema/export, capped content, local alias exclusion, file
limits, persistence, networking, backend, analytics, service-worker strategy,
dependencies, or release history.
